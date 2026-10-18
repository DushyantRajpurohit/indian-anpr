"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as OrtNS from "onnxruntime-web";
import {
  correct, decode, letterbox, parseDetections, prepCrop, READER_H, READER_W, Tracker,
  type Confirmed, type Read, type Reading,
} from "@/lib/anpr";
import { partName } from "@/lib/states";
import { Arrow, asset, Chars, pct } from "./ui";

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
    setLog((l) => [{ at: new Date(), tag, text, warn }, ...l].slice(0, 40)), []);

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
      g.strokeStyle = "#f4f2ee";
      g.setLineDash(b.done ? [] : [6 * s, 4 * s]);
      g.strokeRect(x1, y1, x2 - x1, y2 - y1);
      // Label in ink; only characters the plate grammar changed are magenta.
      const chars = b.reading ? b.reading.parts.flatMap((p, i) => [...(i ? [{ c: " ", fix: false }] : []), ...p.split("").map((c, j) => ({ c, fix: b.reading!.changed[i][j] }))]) : b.label.split("").map((c) => ({ c, fix: false }));
      const tw = g.measureText(chars.map((x) => x.c).join("")).width + 12 * s;
      g.fillStyle = "#121212";
      g.fillRect(x1, y1 - 22 * s, tw, 20 * s);
      let x = x1 + 6 * s;
      for (const ch of chars) {
        g.fillStyle = ch.fix ? "#e0218a" : "#f4f2ee";
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

  return (
    <div className="scanner">
      <div className="scanner-head">
        <div><div className="legend muted">Input</div><div className="qty">{mode === "camera" ? "camera" : mode === "photo" ? "photo" : "none"}</div></div>
        <div><div className="legend muted">Models</div><div className="qty">{available === null ? "checking" : available ? "published" : "held back"}</div></div>
        <div><div className="legend muted">Frames / s</div><div className="qty">{fps ? fps.toFixed(1) : "—"}</div></div>
        <div><div className="legend muted">Uploaded</div><div className="qty">0 bytes</div></div>
      </div>
      <div className="scanner-body">
        <div>
          <div className="window">
            <video ref={video} playsInline muted hidden={mode !== "camera"} />
            {mode === "photo" && photo && <img className="still" src={photo} alt="The photo you opened" />}
            <canvas ref={overlay} className="overlay" aria-hidden="true" />
            {mode === "idle" && (
              <div className="idle">
                <div>
                  <div className="display">No input</div>
                  <p className="legend" style={{ marginTop: 12 }}>Open the camera or a photo to begin</p>
                </div>
              </div>
            )}
          </div>
          <div className="controls">
            <button className="btn primary" onClick={startCamera}><span>Open camera</span><span className="tag"><Arrow /></span></button>
            <label className="btn">
              <span>Open a photo</span>
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && openPhoto(e.target.files[0])} />
            </label>
            <button className="btn" onClick={stop} disabled={mode === "idle"}><span>Stop</span></button>
          </div>
        </div>
        <div className="ledger">
          <div className="ledger-scroll">
            <table className="table" aria-label="Plates read">
              <thead><tr><th>Plate</th><th>Confidence</th><th>Frames</th><th>Time</th></tr></thead>
              <tbody aria-live="polite">
                {ledger.length === 0 && (
                  <tr className="held"><td colSpan={4}><span className="held-back legend">empty · confirmed plates land here</span></td></tr>
                )}
                {ledger.map((e) => (
                  <tr key={e.id} className="drop">
                    <td><Chars reading={e.reading} /><span className="muted state-name">{partName(e.reading.parts, 0)}</span></td>
                    <td className="qty"><span className="zone-cell" style={{ width: 16, height: 12, marginRight: 8, background: `var(--z${Math.round(e.conf * 10)})` }} />{pct(e.conf)}</td>
                    <td className="qty">{e.frames}</td>
                    <td className="qty">{clock(e.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="log" role="log" aria-label="Scanner log">
            {log.map((l, i) => (
              <p key={i} className={l.warn ? "warn" : undefined}><span className="muted">{clock(l.at)}</span><b>{l.tag.toUpperCase()}</b><span>{l.text}</span></p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
