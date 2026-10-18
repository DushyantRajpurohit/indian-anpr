"use client";
import { useEffect, useRef, useState } from "react";
import { correct } from "@/lib/anpr";
import { VEHICLES } from "@/lib/vehicles";
import { amberMask, Led } from "./Led";
import { Plate } from "./Plate";
import { Signal } from "./ui";
import { PLATE_SLOT, VehicleFront } from "./Vehicles";

// approach -> plate locked -> raw read -> corrected -> barrier up + receipt -> drive through
const STEPS = [1500, 700, 1100, 1300, 3200, 900];
const KIND: Record<string, string> = { car: "Car", suv: "Electric SUV", auto: "Auto-rickshaw", bike: "Motorbike" };

export default function Lane({ gain }: { gain: number }) {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const v = VEHICLES[n % VEHICLES.length];
  const reading = correct(v.raw)!;
  const fixed = reading.changed.flat().filter(Boolean).length;

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (still) { setPhase(4); return; }
    if (!visible) return;
    setPhase(0);
    const ids: number[] = [];
    let t = 60;
    STEPS.forEach((d, i) => {
      t += d;
      ids.push(window.setTimeout(() => (i < STEPS.length - 1 ? setPhase(i + 1) : setN((k) => k + 1)), t));
    });
    return () => ids.forEach(clearTimeout);
  }, [n, visible, still]);

  const led = phase === 0 ? "LANE 01 OPEN" : phase === 1 ? "PLATE FOUND" : phase === 2 ? v.raw : reading.text;
  const slot = PLATE_SLOT[v.kind];

  return (
    <div className="lane" ref={root}>
      <svg className="road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M40 0 L-6 100 M60 0 L106 100" className="edge" />
        <path d="M50 0 L50 100" className="centre" />
        <path d="M14 78 L86 78" className="stopline" />
      </svg>
      <div className="studs" aria-hidden="true">
        {[12, 24, 38, 54, 72, 92].map((y) => [
          <i key={`l${y}`} style={{ top: `${y}%`, left: `${40 - 0.46 * y}%` }} />,
          <i key={`r${y}`} style={{ top: `${y}%`, left: `${60 + 0.46 * y}%` }} />,
        ])}
      </div>
      <div className="lane-stage">
        <div className={`vehicle p${phase}${still ? " still" : ""}`} key={n}>
          <VehicleFront kind={v.kind} color={v.color ?? "#ccc"} />
          <span className="slot" style={{ left: `${slot.left}%`, top: `${slot.top}%`, width: `${slot.width}%` }}>
            <Plate parts={v.plate} scheme={v.scheme} two={v.two} />
            {phase >= 1 && <i className={`lock${phase >= 3 ? " done" : ""}`} aria-hidden="true" />}
          </span>
        </div>
        <div className={`barrier${phase >= 4 ? " up" : ""}`} aria-hidden="true"><span className="arm" /><span className="post" /></div>
        <span className="island" aria-hidden="true" />
        <div className="lane-led">
          <Led text={led} amber={phase >= 3 ? amberMask(reading.parts, reading.changed) : []} small label={`Booth display: ${led}`} />
        </div>
      </div>

      <aside className="booth" aria-label="Toll booth">
        <div className="booth-head">
          <span className="sign-legend">Booth 01</span>
          <Signal go={phase >= 4} />
        </div>
        <Led text={led} amber={phase >= 3 ? amberMask(reading.parts, reading.changed) : []} label={`Booth display: ${led}`} />
        <p className="booth-note">{phase < 2 ? `${KIND[v.kind]} approaching` : phase === 2 ? "Raw reading from the camera" : fixed ? `Plate rules fixed ${fixed} character${fixed > 1 ? "s" : ""}` : "Valid as read: nothing to fix"}</p>
        <div className="slot-printer" aria-live="polite">
          <div className={`slip${phase >= 4 ? " printed" : ""}`}>
            <p><span>Lane</span><span>01</span></p>
            <p><span>Vehicle</span><span>{KIND[v.kind]}</span></p>
            <p><span>Read</span><span>{v.raw}</span></p>
            <p><span>Plate</span><span>{reading.parts.map((p, i) => <span key={i}>{i > 0 && " "}{p.split("").map((c, j) => <b key={j} className={reading.changed[i][j] ? "amb" : undefined}>{c}</b>)}</span>)}</span></p>
            <p className="rule">{v.rule}</p>
            <p className="foot">Plate rules on the test set: +{gain.toFixed(1)} pts exact match</p>
          </div>
        </div>
        <button className="btn ghost" onClick={() => setN((k) => k + 1)}>Send the next vehicle</button>
        <div className="queue">
          <span className="sign-legend">Next in lane</span>
          {[1, 2, 3].map((k) => {
            const q = VEHICLES[(n + k) % VEHICLES.length];
            return (
              <div key={k} className="queue-row">
                <span>{KIND[q.kind]}</span>
                <span className="queue-plate"><Plate parts={q.plate} scheme={q.scheme} two={q.two} /></span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
