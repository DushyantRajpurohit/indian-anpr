"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as OrtNS from "onnxruntime-web";
import {
  correct, decode, letterbox, parseDetections, prepCrop, READER_H, READER_W, Tracker,
  type Confirmed, type Read, type Reading,
} from "@/lib/anpr";
import { partName } from "@/lib/states";
import { amberMask, Led } from "./Led";
import { asset, Chars, pct, Signal } from "./ui";

const ORT_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs";
const MAX_PLATES = 4;

type Entry = { at: Date; tag: string; text: string; warn?: boolean };
type Models = { ort: typeof OrtNS; det: OrtNS.InferenceSession; rdr: OrtNS.InferenceSession };
type Box = { box: number[]; label: string; done: boolean; reading?: Reading | null };

const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour12: false });

export default function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const work = useRef<{ det: HTMLCanvasElement; rdr: HTMLCanvasElement } | null>(null);
  const models = useRef<Models | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const tracker = useRef(new Tracker(3));
  const running = useRef(false);

  const [available, setAvailable] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"idle" | "camera" | "photo">("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [ledger, setLedger] = useState<Confirmed[]>([]);
  const [log, setLog] = useState<Entry[]>([]);
  const print = useCallback((tag: string, text: string, warn = false) =>
    setLog((l) => [{ at: new Date(), tag, text, warn }, ...l].slice(0, 8)), []);

  useEffect(() => {
    work.current = { det: document.createElement("canvas"), rdr: document.createElement("canvas") };
    Promise.all(["detector", "reader"].map((m) => fetch(asset(`/models/${m}.onnx`), { method: "HEAD" }).then((r) => r.ok).catch(() => false)))
      .then((ok) => {
        const yes = ok.every(Boolean);
        setAvailable(yes);
        print("Models", yes
          ? "Detector and reader published. They load on first use (about 13 MB)."
          : "Held back: still training on Kaggle. The camera opens, but plates are read once the weights are published.", !yes);
      });
    print("Privacy", "Frames are read inside this tab. Nothing is uploaded or stored.");
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    if (models.current) return models.current;
    print("Models", "Loading the runtime and both models into this tab…");
    const ort: typeof OrtNS = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ ORT_URL);
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    const opts = { executionProviders: ["wasm"] };
    const [det, rdr] = await Promise.all([
      ort.InferenceSession.create(asset("/models/detector.onnx"), opts),
      ort.InferenceSession.create(asset("/models/reader.onnx"), opts),
    ]);
    print("Models", "Ready. Detector YOLO26n, reader CRNN.");
    return (models.current = { ort, det, rdr });
  }

  /** One pass over a frame: detect, crop, read, correct. */
  async function readFrame(src: CanvasImageSource, w: number, h: number, m: Models) {
    const { ort, det, rdr } = m;
    const lb = letterbox(src, w, h, work.current!.det);
    const out = await det.run({ [det.inputNames[0]]: new ort.Tensor("float32", lb.tensor, [1, 3, 640, 640]) });
    const o = out[det.outputNames[0]];
    const found = parseDetections(o.data as Float32Array, o.dims, lb).sort((a, b) => b.score - a.score).slice(0, MAX_PLATES);
    const plates: { box: number[]; read: Read | null; raw: string }[] = [];
    for (const f of found) {
      const box = [Math.max(0, f.box[0]), Math.max(0, f.box[1]), Math.min(w, f.box[2]), Math.min(h, f.box[3])];
      const x = prepCrop(src, box, work.current!.rdr);
      const r = await rdr.run({ [rdr.inputNames[0]]: new ort.Tensor("float32", x, [1, 1, READER_H, READER_W]) });
      const lp = r[rdr.outputNames[0]];
      const { text, conf } = decode(lp.data as Float32Array, lp.dims[1], lp.dims[2]);
      const reading = correct(text);
      const c = conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : 0;
      plates.push({ box, raw: text, read: reading && { reading, conf: c } });
    }
    return plates;
  }

  function draw(boxes: Box[], w: number, h: number) {
    const c = overlay.current;
    if (!c) return;
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    const s = Math.max(1, w / 640);
    g.font = `600 ${13 * s}px ui-monospace, monospace`;
    for (const b of boxes) {
      const [x1, y1, x2, y2] = b.box;
      g.lineWidth = 2 * s;
      g.strokeStyle = b.done ? "#2bd46a" : "#f4f2ee";
      g.setLineDash(b.done ? [] : [6 * s, 4 * s]);
      g.strokeRect(x1, y1, x2 - x1, y2 - y1);
      // Label in ink; only characters the plate rules changed are amber.
      const chars = b.reading ? b.reading.parts.flatMap((p, i) => [...(i ? [{ c: " ", fix: false }] : []), ...p.split("").map((c, j) => ({ c, fix: b.reading!.changed[i][j] }))]) : b.label.split("").map((c) => ({ c, fix: false }));
      const tw = g.measureText(chars.map((x) => x.c).join("")).width + 12 * s;
      g.fillStyle = "#121212";
      g.fillRect(x1, y1 - 22 * s, tw, 20 * s);
      let x = x1 + 6 * s;
      for (const ch of chars) {
        g.fillStyle = ch.fix ? "#ffb000" : "#f4f2ee";
        g.fillText(ch.c, x, y1 - 7 * s);
        x += g.measureText(ch.c).width;
      }
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return print("Camera", "This browser has no camera access here. Open a photo instead.", true);
    try {
      stop();
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      stream.current = s;
      const v = video.current!;
      v.srcObject = s;
      await v.play();
      setMode("camera");
      print("Camera", `Open, ${v.videoWidth} × ${v.videoHeight}. Point it at a plate a few metres away.`);
      if (!available) return;
      const m = await load();
      tracker.current = new Tracker(3);
      running.current = true;
      let frames = 0, t0 = performance.now();
      const loop = async () => {
        if (!running.current) return;
        const w = v.videoWidth, h = v.videoHeight;
        const plates = await readFrame(v, w, h, m);
        const now = performance.now();
        const done = tracker.current.update(plates, now);
        if (done.length) {
          setLedger((l) => [...done, ...l].slice(0, 50));
          done.forEach((d) => print("Read", `${d.reading.text} confirmed by ${d.votes} frames.`));
        }
        const active = tracker.current.active;
        draw(plates.map((p) => ({ box: p.box, label: "reading…", reading: p.read?.reading, done: active.some((a) => a.done && a.box === p.box) })), w, h);
        frames += 1;
        if (now - t0 > 1000) { setFps((frames * 1000) / (now - t0)); frames = 0; t0 = now; }
        requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      const name = (e as Error).name;
      print("Camera", name === "NotAllowedError"
        ? "Permission denied. Allow the camera from the address bar, or open a photo instead."
        : name === "NotFoundError" ? "No camera found. Open a photo instead." : `Could not start: ${(e as Error).message}`, true);
    }
  }

  async function openPhoto(file: File) {
    stop();
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    setPhoto((old) => { if (old) URL.revokeObjectURL(old); return url; });
    setMode("photo");
    print("Photo", `${file.name}, ${img.naturalWidth} × ${img.naturalHeight}. Read locally; not uploaded.`);
    if (!available) return;
    try {
      const m = await load();
      const plates = await readFrame(img, img.naturalWidth, img.naturalHeight, m);
      const found = plates.filter((p) => p.read);
      const at = new Date();
      setLedger((l) => [...found.map((p, i) => ({ id: Date.now() + i, reading: p.read!.reading, conf: p.read!.conf, votes: 1, frames: 1, at })), ...l].slice(0, 50));
      draw(plates.map((p) => ({ box: p.box, label: p.raw || "unreadable", reading: p.read?.reading, done: !!p.read })), img.naturalWidth, img.naturalHeight);
      print("Read", plates.length ? `${plates.length} plate${plates.length > 1 ? "s" : ""} found, ${found.length} read.` : "No plate found in this photo.", !found.length);
    } catch (e) {
      print("Error", `Reading failed: ${(e as Error).message}`, true);
    }
  }

  function stop() {
    running.current = false;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    const c = overlay.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setFps(null);
    setMode("idle");
  }

  const latest = ledger[0];
  const signalGo = mode !== "idle" && !!available;
  return (
    <div className="scanner">
      <div className="scanner-canopy">
        <Signal go={signalGo} label={signalGo ? "Your lane is open" : "Your lane is closed"} />
        <div><span className="sign-legend">Input</span><b>{mode === "camera" ? "Camera" : mode === "photo" ? "Photo" : "None"}</b></div>
        <div><span className="sign-legend">Models</span><b>{available === null ? "Checking" : available ? "Published" : "Held back"}</b></div>
        <div><span className="sign-legend">Frames / s</span><b>{fps ? fps.toFixed(1) : "–"}</b></div>
        <div><span className="sign-legend">Uploaded</span><b>0 bytes</b></div>
      </div>
      <div className="scanner-body">
        <div className="scanner-lane">
          <div className="window">
            <video ref={video} playsInline muted hidden={mode !== "camera"} />
            {mode === "photo" && photo && <img className="still" src={photo} alt="The photo you opened" />}
            <canvas ref={overlay} className="overlay" aria-hidden="true" />
            {mode === "idle" && (
              <div className="idle">
                <p className="sign-head">Lane closed</p>
                <p>Open your camera or a photo. Nothing leaves this tab.</p>
              </div>
            )}
          </div>
          <div className="controls">
            <button className="btn go" onClick={startCamera}><Signal go label="" /><span>Open camera</span></button>
            <label className="btn ghost">
              <span>Open a photo</span>
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && openPhoto(e.target.files[0])} />
            </label>
            <button className="btn ghost" onClick={stop} disabled={mode === "idle"}>Stop</button>
          </div>
        </div>
        <div className="scanner-booth">
          <Led text={latest ? latest.reading.text : "NO PLATE YET"} amber={latest ? amberMask(latest.reading.parts, latest.reading.changed) : []} small />
          <div className="receipt ledger" aria-label="Plates read">
            <p className="receipt-head"><span>Plate</span><span>Conf.</span><span>Frames</span><span>Time</span></p>
            <div className="ledger-scroll" aria-live="polite">
              {ledger.length === 0 && <p className="pending-line">Empty. Confirmed plates print here.</p>}
              {ledger.map((e) => (
                <p key={e.id} className="drop">
                  <span><Chars reading={e.reading} /><small>{partName(e.reading.parts, 0)}</small></span>
                  <span>{pct(e.conf)}</span><span>{e.frames}</span><span>{clock(e.at)}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="log" role="log" aria-label="Scanner log">
            {log.map((l, i) => (
              <p key={i} className={l.warn ? "warn" : undefined}><span>{clock(l.at)}</span><b>{l.tag}</b><span>{l.text}</span></p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
