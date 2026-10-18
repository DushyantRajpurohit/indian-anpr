// Parity with anpr/plate.py on 4,000 OCR-like strings, plus CTC decode and voting. Run: node lib/anpr.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { correct, decode, Tracker, vote } from "./anpr.ts";

const vectors: [string, string | null][] = JSON.parse(readFileSync(new URL("./plate-vectors.json", import.meta.url), "utf8"));
const bad = vectors.filter(([raw, want]) => (correct(raw)?.text ?? null) !== want);
assert.equal(bad.length, 0, `mismatches: ${JSON.stringify(bad.slice(0, 5))}`);

const r = correct("RJ1ACD1234")!;
assert.equal(r.text, "RJ 14 CD 1234");
assert.deepEqual(r.changed[1], [false, true]); // the A in the district was the fix

// blank=0; "RR", blank, "J", "1", blank, "1" -> "RJ11"
const ids = [0, 28, 28, 0, 20, 2, 0, 2], C = 37;
const logp = new Float32Array(ids.length * C).fill(-20);
ids.forEach((id, t) => (logp[t * C + id] = 0));
assert.equal(decode(logp, ids.length, C).text, "RJ11");

const read = (s: string, conf = 0.9) => ({ reading: correct(s)!, conf });
assert.equal(vote([read("RJ14CD1234"), read("RJ14CD1284"), read("RJ14CD1234")])!.reading.text, "RJ 14 CD 1234");
const tr = new Tracker(3);
const box = [10, 10, 110, 40];
let got = 0;
for (let f = 0; f < 4; f++) got += tr.update([{ box: box.map((v) => v + f), read: read("MH12AB1234") }], f * 100).length;
assert.equal(got, 1); // confirmed once, after three agreeing frames
console.log(`ok: ${vectors.length} parity vectors, decode, vote, tracker`);
