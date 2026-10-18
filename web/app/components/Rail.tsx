"use client";
import { useEffect, useState } from "react";

const CHAPTERS = [
  ["record", "The record"],
  ["pipeline", "How a plate is read"],
  ["traps", "Traps in the data"],
  ["grammar", "Plate rules"],
  ["synthetic", "Synthetic training"],
  ["results", "Results"],
  ["live", "Live scanner"],
] as const;

const ZONES = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export default function Rail() {
  const [active, setActive] = useState("record");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    CHAPTERS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  return (
    <aside className="rail" aria-label="Legend and chapters">
      <a href="#record" className="wordmark">
        <div className="display">Indian ANPR</div>
        <div className="legend">Plate exposure record</div>
      </a>

      <div className="ramp-block">
        <div className="legend muted" style={{ marginBottom: 8 }}>Confidence · zone ramp</div>
        <table className="ramp" aria-label="Zone ramp: darker means less certain">
          <tbody>
            {ZONES.map((z, i) => (
              <tr key={z}>
                <td className="legend">{i} · Zone {z}</td>
                <td><span className="sw" style={{ background: `var(--z${i})` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="legend muted" style={{ margin: "8px 0 0" }}>0 unsure · X certain</p>
      </div>

      <div>
        <div className="legend muted" style={{ marginBottom: 8 }}>Filtration · grammar correction only</div>
        <div className="swatch-mag" />
      </div>

      <div className="materials-block">
        <div className="legend muted" style={{ marginBottom: 8 }}>Material</div>
        <div className="materials legend">
          <div><span className="m-sheet" />Stage sheet</div>
          <div><span className="m-conflict" />Conflict</div>
          <div><span className="m-held" />Held back</div>
        </div>
      </div>

      <nav className="chapters-block" aria-label="Chapters">
        <ul className="chapters legend">
          {CHAPTERS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} aria-current={active === id}>
                <span className="mark" aria-hidden="true" />{label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="primer">
        <div className="legend">Private by construction</div>
        <p>Your camera is read inside this tab. No frame, crop or plate leaves your device.</p>
      </div>
    </aside>
  );
}
