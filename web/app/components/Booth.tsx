"use client";
import { useState } from "react";
import { clean, correct } from "@/lib/anpr";
import { partName } from "@/lib/states";
import { amberMask, Led } from "./Led";
import { Signal } from "./ui";

const EXAMPLES = ["RJ1ACD1234", "8R0IAB1Z34", "MB36G6682", "IND MH12AB1234", "22 8H 1234 A", "GJ1KF1111", "HELLO"];

/** Plain-words account of what the rules changed: each swap and the slot that forced it. */
function explain(raw: string, parts: string[], changed: boolean[][]) {
  const fixed = parts.join("");
  const src = clean(raw).startsWith("IND") && clean(raw).length > fixed.length ? clean(raw).slice(3) : clean(raw);
  const notes: string[] = [];
  if (src !== clean(raw)) notes.push("The IND strip on a high-security plate is dropped.");
  let k = 0;
  parts.forEach((p, i) => p.split("").forEach((c, j) => {
    if (changed[i][j] && src[k] !== undefined)
      notes.push(`${src[k]} → ${c}: ${i === 0 && parts[1] !== "BH" ? "the first two letters must be a real state code" : /\d/.test(c) ? "this slot only takes digits" : "this slot only takes letters"}.`);
    k++;
  }));
  return notes.length ? notes : ["Valid as read. A real plate is never rewritten into a likelier one."];
}

export default function Booth() {
  const [raw, setRaw] = useState("RJ1ACD1234");
  const r = correct(raw);
  return (
    <div className="rule-booth">
      <label className="booth-input">
        <span className="sign-legend">Type a misread plate</span>
        <input value={raw} onChange={(e) => setRaw(e.target.value.toUpperCase().slice(0, 16))} spellCheck={false} autoComplete="off" aria-describedby="booth-out" />
      </label>
      <div className="chips" role="group" aria-label="Examples">
        {EXAMPLES.map((x) => <button key={x} className={`chip${x === raw ? " on" : ""}`} onClick={() => setRaw(x)}>{x}</button>)}
      </div>
      <div className="booth-out" id="booth-out" aria-live="polite">
        <div className="booth-head"><span className="sign-legend">Booth reads</span><Signal go={!!r} label={r ? "Plate accepted" : "Not a plate"} /></div>
        <Led text={r ? r.text : "NOT A PLATE"} amber={r ? amberMask(r.parts, r.changed) : []} />
        {r && (
          <div className="parts">
            {r.parts.map((p, i) => (
              <div key={i}><span className="sign-legend">{r.parts[1] === "BH" ? ["Year", "Series", "Number", "Category"][i] : ["State", "District", "Series", "Number"][i]}</span><b>{p}</b><small>{partName(r.parts, i) || " "}</small></div>
            ))}
          </div>
        )}
        <ul className="why">{(r ? explain(raw, r.parts, r.changed) : ["No state code, district, series and number can be made from this. Rejected, not guessed."]).map((n) => <li key={n}>{n}</li>)}</ul>
      </div>
    </div>
  );
}
