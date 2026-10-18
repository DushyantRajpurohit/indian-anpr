"use client";
import { useEffect, useRef, useState } from "react";
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

export default function Pipeline({ detectionRecall, gain, sample }: { detectionRecall: number; gain: number; sample: Reading }) {
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

  const copy = [
    ["Find the plate", `A YOLO26n detector, fine-tuned on about 5,100 Indian photos once I had regrouped the dataset's augmented copies. The old generic detector already finds ${pct(detectionRecall)} of test plates; the fine-tuned score is held back until training finishes.`],
    ["Flatten it", "The crop becomes 32 × 160 greys, contrast-normalised. Bikes and autos carry two-line plates; those are cut in half and laid side by side, so the reader always sees one line."],
    ["Read it", "A 0.69M-parameter CRNN looks at 40 columns and calls each one a character or a blank; repeats collapse. Small enough to run in a browser tab at camera speed."],
    ["Fix it with the rules", `A state code, a district, a series, a number. Look-alike characters are swapped by position, and an odd shape costs more than a common one. On the old pipeline this alone added ${gain.toFixed(1)} points.`],
    ["One car, one answer", "In video each vehicle is tracked across frames and its readings vote. A plate is confirmed after three agreeing frames, so one blurred frame can't put a wrong number in the ledger."],
  ];

  return (
    <section className="pipeline" id="pipeline" aria-labelledby="h-pipeline">
      <div className="pipeline-track" ref={track}>
        <div className="pipeline-stage">
          <div>
            <h2 className="legend muted" id="h-pipeline" style={{ margin: "0 0 12px", fontWeight: 400 }}>How a plate is read</h2>
            <ol className="stage-index legend" aria-label="Stages">
              {STAGES.map((s, i) => <li key={s} className={i === stage ? "on" : undefined} aria-current={i === stage ? "step" : undefined}>{s}</li>)}
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
            {STAGES.map((s, i) => (
              <div key={s} className="sheet" style={{ zIndex: 10 - i, ["--tilt" as string]: `${[-1.6, 1.2, -0.8, 1.6, -1.1][i]}deg`, ["--out" as string]: i < stage ? 1 : 0 }} aria-hidden={i !== stage}>
                <header><span className="display">{s}</span><span className="legend muted">Stage {i + 1} of 5</span></header>
                {i === 0 && (
                  <div className="figure"><div className="boxed"><img src={asset("/plates/hero-clean.png")} alt="" /><i data-l="PLATE" /></div></div>
                )}
                {i === 1 && (
                  <div className="figure dark" style={{ gap: 18, padding: 18, alignContent: "center" }}>
                    <img src={asset("/plates/reader-input.png")} alt="" style={{ width: "92%", imageRendering: "pixelated" }} />
                    <img src={asset("/plates/two-line.png")} alt="" style={{ width: "34%", filter: "grayscale(1)" }} />
                  </div>
                )}
                {i === 2 && (
                  <div className="figure" style={{ gap: 16, alignContent: "center" }}>
                    <div className="ctc">{CTC.map((c, t) => <span key={t} className={c ? "e" : undefined}>{c}</span>)}</div>
                    <Chars raw={RAW} />
                  </div>
                )}
                {i === 3 && (
                  <div className="figure" style={{ gap: 18, alignContent: "center", fontSize: "1.6rem" }}>
                    <Chars raw={RAW} strike={[3]} />
                    <Chars reading={sample} />
                  </div>
                )}
                {i === 4 && (
                  <div className="figure">
                    <div className="votes legend">
                      {[["RJ 14 CD 1234", 5], ["RJ 14 CD 1284", 1], ["RJ 14 CO 1234", 1]].map(([t, n], k) => (
                        <div key={t} className={k === 0 ? "win" : undefined}><span>{n} frames</span><b style={{ width: `${(Number(n) / 5) * 100}%` }} /><span className="chars" style={{ letterSpacing: "0.06em" }}>{t}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="legend muted">{["Box from the detector", "What the reader is shown", "Illustration of the 40 output columns", "Real output of the corrector", "Illustration: frames voting for one vehicle"][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
