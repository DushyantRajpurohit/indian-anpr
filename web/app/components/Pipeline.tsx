"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Reading } from "@/lib/anpr";
import { asset, Chars, pct } from "./ui";

const STAGES = ["Detect", "Crop", "Read", "Correct", "Vote"];
const RAW = "RJ1ACD1234";
// Illustration of greedy CTC: 40 columns, each a character or a blank; repeats collapse.
const CTC = Array.from({ length: 40 }, (_, t) => {
  const k = Math.round((t - 3) / 3.6);
  const at = 3 + Math.round(k * 3.6);
  return k >= 0 && k < RAW.length && (t === at || (t === at + 1 && k % 3 === 0)) ? RAW[k] : "";
});

export type PipelineStats = {
  detectionRecall: number; finetunedRecall: number; detect: { box: number[]; conf: number };
  baselineExact: number; correctedExact: number; validLabels: number; parityStrings: number;
};

type Row = [string, ReactNode, ReactNode?];

export default function Pipeline({ s, sample }: { s: PipelineStats; sample: Reading }) {
  const track = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = track.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
        setStage(Math.min(STAGES.length - 1, Math.floor(p * STAGES.length)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const gain = (s.correctedExact - s.baselineExact) * 100;
  const copy = [
    ["Find the plate", "A YOLO26n detector, fine-tuned on Indian photos after regrouping the dataset's augmented copies by original photo."],
    ["Flatten it", "The crop becomes 32 × 160 greys. Bikes and autos carry two-line plates; those are cut in half and laid side by side, so the reader always sees one line."],
    ["Read it", "A small CRNN calls each of 40 columns a character or a blank, and repeats collapse. It never saw a real plate in training."],
    ["Fix it with the rules", "A state code, a district, a series, a number. Look-alike characters are swapped by position; an odd shape costs more than a common one."],
    ["One car, one answer", "In video each vehicle is tracked across frames and its readings vote, so one blurred frame can't put a wrong number in the ledger."],
  ];
  const rows: Row[][] = [
    [["Generic detector", pct(s.detectionRecall), "start"], ["Fine-tuned YOLO26n", pct(s.finetunedRecall), `+${((Math.round(s.finetunedRecall * 1000) - Math.round(s.detectionRecall * 1000)) / 10).toFixed(1)} pts`], ["Box on this frame", s.detect.conf.toFixed(2), "confidence"]],
    [["Reader input", "32 × 160", "greys, normalised"], ["Two-line plate", "split", "height / width > 0.45"]],
    [["Parameters", "0.69M", "2.8 MB in the browser"], ["Output columns", "40", "char or blank"], ["Real plates seen", "0", "synthetic only"]],
    [["EasyOCR alone", pct(s.baselineExact), "exact match"], ["+ plate grammar", pct(s.correctedExact), <span key="g" className="mag">+{gain.toFixed(1)} pts</span>], ["Valid labels rewritten", `0 of ${s.validLabels.toLocaleString("en-IN")}`, `same answer as Python on ${s.parityStrings.toLocaleString("en-IN")} strings`]],
    [["Confirm after", "3 frames", "agreeing, ≥ 60% share"], ["Forget a car after", "1.5 s", "out of view"], ["Gain on video", <span key="v" className="held-back legend">held back</span>, "measuring"]],
  ];
  const [bx, by, bw, bh] = s.detect.box;

  return (
    <section className="pipeline" id="pipeline" aria-labelledby="h-pipeline">
      <div className="pipeline-track" ref={track}>
        <div className="pipeline-stage">
          <div>
            <h2 className="sr-only" id="h-pipeline">How a plate is read</h2>
            <ol className="stage-index legend" aria-label="Stages">
              {STAGES.map((st, i) => <li key={st} className={i === stage ? "on" : undefined} aria-current={i === stage ? "step" : undefined}>{st}</li>)}
            </ol>
            <div className="stage-copy">
              {copy.map(([h, p], i) => (
                <article key={h} className={i === stage ? "on" : undefined} aria-hidden={i !== stage}>
                  <h3 className="display">{h}</h3>
                  <p className="prose">{p}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="stack">
            <img className="stack-frame" src={asset("/plates/hero-degraded.png")} alt="" />
            {STAGES.map((st, i) => {
              const out = i < stage;
              return (
                <div key={st} className={i === stage ? "sheet" : "sheet rest"} aria-hidden={i !== stage}
                  style={{ zIndex: out ? i + 1 : 20 - (i - stage), ["--i" as string]: Math.max(0, i - stage), ["--k" as string]: out ? stage - i : 0, ["--tilt" as string]: `${[-1.6, 1.2, -0.8, 1.6, -1.1][i]}deg` }}>
                  <header><span className="display">{st}</span><span className="legend muted">Stage {i + 1} of 5</span></header>
                  <div className="figure">
                    {i === 0 && (
                      <div className="boxed">
                        <img src={asset("/plates/detect-frame.png")} alt="" />
                        <i data-l={`PLATE ${s.detect.conf.toFixed(2)}`} style={{ left: `${bx * 100}%`, top: `${by * 100}%`, width: `${bw * 100}%`, height: `${bh * 100}%` }} />
                      </div>
                    )}
                    {i === 1 && (
                      <div className="pair">
                        <img src={asset("/plates/reader-input.png")} alt="" style={{ imageRendering: "pixelated" }} />
                        <img src={asset("/plates/two-line.png")} alt="" className="two" />
                      </div>
                    )}
                    {i === 2 && (
                      <div className="pair">
                        <div className="ctc">{CTC.map((c, t) => <span key={t} className={c ? "e" : undefined}>{c}</span>)}</div>
                        <Chars raw={RAW} />
                      </div>
                    )}
                    {i === 3 && (
                      <div className="pair big-chars">
                        <Chars raw={RAW} strike={[3]} />
                        <Chars reading={sample} />
                      </div>
                    )}
                    {i === 4 && (
                      <div className="votes legend">
                        {[["RJ 14 CD 1234", 5], ["RJ 14 CD 1284", 1], ["RJ 14 CO 1234", 1]].map(([t, n], k) => (
                          <div key={t} className={k === 0 ? "win" : undefined}><span>{n} frames</span><b style={{ width: `${(Number(n) / 5) * 100}%` }} /><span className="chars">{t}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                  <table className="table sheet-rows">
                    <tbody>{rows[i].map(([k, v, d]) => <tr key={k}><td>{k}</td><td className="qty">{v}</td><td className="muted">{d}</td></tr>)}</tbody>
                  </table>
                  <div className="legend muted">{["Real detector output on a synthetic plate", "What the reader is shown", "Illustration of the 40 output columns", "Real output of the corrector", "Illustration: frames voting for one vehicle"][i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
