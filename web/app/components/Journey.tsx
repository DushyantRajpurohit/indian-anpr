"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Reading } from "@/lib/anpr";
import { amberMask, Led } from "./Led";
import { asset, pct, Signal } from "./ui";

export type JourneyStats = {
  detectionRecall: number; finetunedRecall: number; detectConf: number;
  baselineExact: number; correctedExact: number; validLabels: number; parityStrings: number;
};

const STATIONS = ["Camera", "Crop", "Read", "Rules", "Vote"];

export default function Journey({ s, sample }: { s: JourneyStats; sample: Reading }) {
  const track = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStill(true); return; }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = track.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setP(Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight))));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const at = Math.min(STATIONS.length - 1, Math.floor(p * STATIONS.length));
  const gain = (s.correctedExact - s.baselineExact) * 100;
  const pts = (a: number, b: number) => `+${((Math.round(b * 1000) - Math.round(a * 1000)) / 10).toFixed(1)} pts`;

  const stops: { h: string; copy: string; led: string; amber?: boolean[]; rows: [string, ReactNode][]; fig?: ReactNode }[] = [
    { h: "The camera finds the plate", led: `PLATE ${s.detectConf.toFixed(2)}`,
      copy: "A YOLO26n detector, fine-tuned on Indian photos after regrouping the dataset's augmented copies by original photo.",
      rows: [["Generic detector", pct(s.detectionRecall)], ["Fine-tuned YOLO26n", pct(s.finetunedRecall)], ["Gain", pts(s.detectionRecall, s.finetunedRecall)]] },
    { h: "The crop is flattened", led: "32 X 160",
      copy: "The plate becomes 32 × 160 greys. Bikes and autos carry two-line plates; those are cut in half and laid side by side, so the reader always sees one line.",
      rows: [["Reader input", "32 × 160 greys"], ["Two-line plate", "split when height ÷ width > 0.45"]],
      fig: <img className="fig-strip" src={asset("/plates/reader-input.png")} alt="The 32 by 160 grey strip the reader is shown" /> },
    { h: "The reader reads it", led: "RJ1ACD1234",
      copy: "A small CRNN calls each of 40 columns a character or a blank, and repeats collapse. It never saw a real plate in training, only synthetic ones.",
      rows: [["Parameters", "0.69M (2.8 MB in the browser)"], ["Output columns", "40"], ["Real plates seen in training", "0"]] },
    { h: "The rules fix it", led: sample.text, amber: amberMask(sample.parts, sample.changed),
      copy: "A state code, a district, a series, a number. Look-alike characters are swapped by position, and an odd shape costs more than a common one.",
      rows: [["EasyOCR alone", pct(s.baselineExact)], ["+ plate rules", pct(s.correctedExact)], ["Gain", `+${gain.toFixed(1)} pts`], ["Valid labels rewritten", `0 of ${s.validLabels.toLocaleString("en-IN")}`]] },
    { h: "Frames vote, once per car", led: "3 OF 3 AGREE",
      copy: "On video, each vehicle is tracked across frames and its readings vote. A plate is confirmed after three agreeing frames, so one blurred frame can't put a wrong number in the ledger.",
      rows: [["Confirm after", "3 agreeing frames"], ["Forget a car after", "1.5 s out of view"], ["Gain on video", <span key="v" className="pending">pending</span>]] },
  ];
  const stop = stops[at];

  if (still)  // reduced motion: every station laid out at rest, no scroll-driven drive
    return (
      <section className="journey chapter" id="pipeline" aria-labelledby="h-journey">
        <h2 className="sign-title" id="h-journey">How a plate is read</h2>
        <div className="journey-still">
          {stops.map((st, i) => (
            <div key={st.h} className="journey-panel">
              <div className="journey-copy"><h3 className="sign-head">{st.h}</h3><p>{st.copy}</p></div>
              <div className="booth-panel"><Led text={st.led} amber={st.amber} />{st.fig}<dl className="readout">{st.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div>
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <section className="journey" id="pipeline" aria-labelledby="h-journey">
      <div className="journey-track" ref={track}>
        <div className="journey-stage">
          <h2 className="sign-title" id="h-journey">How a plate is read</h2>
          <div className="strip-lane" aria-hidden="true">
            {STATIONS.map((st, i) => (
              <div key={st} className={`gantry${i === at ? " on" : ""}`} style={{ left: `${10 + i * 20}%` }}>
                <span className="gantry-sign">{st}</span>
                <Signal go off={p * STATIONS.length <= i + 0.5} />
              </div>
            ))}
            <svg className="topcar" viewBox="0 0 140 70" style={{ left: `${2 + p * 92}%` }}>
              {/* the hero car from above: bonnet to the right, roof, glass, mirrors, lamps */}
              <rect x="14" y="4" width="22" height="10" rx="4" fill="#1a1c1f" /><rect x="14" y="56" width="22" height="10" rx="4" fill="#1a1c1f" />
              <rect x="96" y="4" width="22" height="10" rx="4" fill="#1a1c1f" /><rect x="96" y="56" width="22" height="10" rx="4" fill="#1a1c1f" />
              <path d="M8 18 Q8 9 18 9 L112 9 Q132 11 134 24 L134 46 Q132 59 112 61 L18 61 Q8 61 8 52 Z" fill="#d5d9de" stroke="#1a1c1f" strokeWidth="3" />
              <path d="M84 15 L100 18 Q106 35 100 52 L84 55 Q88 35 84 15 Z" fill="#8fa6b6" stroke="#1a1c1f" strokeWidth="2" />
              <rect x="40" y="16" width="42" height="38" rx="8" fill="#c3c8ce" stroke="#1a1c1f" strokeWidth="2" />
              <path d="M24 17 L38 19 L38 51 L24 53 Q20 35 24 17 Z" fill="#8fa6b6" stroke="#1a1c1f" strokeWidth="2" />
              <rect x="86" y="3" width="10" height="7" rx="2" fill="#1a1c1f" /><rect x="86" y="60" width="10" height="7" rx="2" fill="#1a1c1f" />
              <rect x="126" y="14" width="7" height="12" rx="3" fill="#f7f3e3" /><rect x="126" y="44" width="7" height="12" rx="3" fill="#f7f3e3" />
            </svg>
          </div>
          <div className="journey-panel">
            <div className="journey-copy" key={at}>
              <h3 className="sign-head">{stop.h}</h3>
              <p>{stop.copy}</p>
            </div>
            <div className="booth-panel">
              <Led text={stop.led} amber={stop.amber} />
              {stop.fig}
              <dl className="readout">{stop.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
