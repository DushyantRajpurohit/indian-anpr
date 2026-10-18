// Browser-side pipeline: plate grammar (a port of anpr/plate.py, checked against it by anpr.test.ts),
// CTC decoding, reader prep (anpr/reader.py), detector post-processing, and per-vehicle voting.

export const STATES = new Set(
  "AN AP AR AS BR CG CH CT DD DL DN GA GJ HP HR JH JK KA KL LA LD MH ML MN MP MZ NL OD OR PB PY RJ SK TG TN TR TS UA UK UP WB".split(" "),
);
const TO_LETTER: Record<string, string> = { 0: "O", 1: "I", 2: "Z", 4: "A", 5: "S", 6: "G", 7: "T", 8: "B" };
const TO_DIGIT: Record<string, string> = { O: "0", D: "0", Q: "0", I: "1", J: "1", L: "1", Z: "2", S: "5", B: "8", G: "6", T: "7", A: "4" };
const EDIT_COST = 1.5;
// Letter look-alikes, used only in the state slot (the one letter slot with a closed list of values).
const STATE_LOOKALIKES: Record<string, string> = { M: "WHNRK", W: "MN", H: "MRN", R: "MH", N: "MHW", K: "M" };
const STATE_SWAP_COST = 2;

function fixState(code: string): { code: string; at: number } | null {
  for (const i of [0, 1])
    for (const c of STATE_LOOKALIKES[code[i]] ?? "") {
      const fixed = code.slice(0, i) + c + code.slice(i + 1);
      if (STATES.has(fixed)) return { code: fixed, at: i };
    }
  return null;
}

/** A grammatical reading: parts like ["RJ","14","CD","1234"], with which characters the grammar changed. */
export type Reading = { parts: string[]; changed: boolean[][]; text: string };

const isLetter = (c: string) => c >= "A" && c <= "Z";
const isDigit = (c: string) => c >= "0" && c <= "9";

function fit(chunk: string, kind: "A" | "9") {
  let out = "";
  const changed: boolean[] = [];
  for (const c of chunk) {
    const ok = kind === "A" ? isLetter(c) : isDigit(c);
    const sub = ok ? c : (kind === "A" ? TO_LETTER : TO_DIGIT)[c];
    if (sub === undefined) return null;
    out += sub;
    changed.push(!ok);
  }
  return { out, changed };
}

function* templates(n: number): Generator<[string, number[]]> {
  for (const d of [2, 1])
    for (const s of [2, 1, 3, 0]) {
      const num = n - 2 - d - s;
      if (num >= 1 && num <= 4) yield ["A9A9", [2, d, s, num]];
    }
  for (const s of [2, 1]) if (n === 8 + s) yield ["9A9A", [2, 2, 4, s]];
}

function shapeCost(parts: string[]) {
  if (parts[1] === "BH") return 0;
  const [state, district, series, number] = parts;
  const dl = state === "DL";
  const seriesCost = ({ 2: 0, 1: 0.5, 0: 1.5 } as Record<number, number>)[series.length] ?? (dl ? 0.5 : 2);
  return (district.length === 1 ? (dl ? 0.5 : 1.5) : 0) + seriesCost + (number.length !== 4 ? 1 : 0);
}

export const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Best grammatical reading of an OCR string, or null. Same scoring as anpr/plate.py. */
export function correct(raw: string): Reading | null {
  const text = clean(raw);
  const variants = text.startsWith("IND") ? [text, text.slice(3)] : [text];
  let best: { score: [number, number]; r: Reading } | null = null;
  for (const t of variants)
    for (const [kinds, lens] of templates(t.length)) {
      const parts: string[] = [];
      const changed: boolean[][] = [];
      let edits = 0;
      let i = 0;
      let ok = true;
      for (let k = 0; k < 4; k++) {
        const f = fit(t.slice(i, i + lens[k]), kinds[k] as "A" | "9");
        if (!f) { ok = false; break; }
        parts.push(f.out);
        changed.push(f.changed);
        edits += f.changed.filter(Boolean).length;
        i += lens[k];
      }
      if (!ok) continue;
      const bh = kinds === "9A9A";
      let extra = 0;
      if (!bh && !STATES.has(parts[0])) {
        const f = fixState(parts[0]);
        if (!f) continue;
        parts[0] = f.code;
        changed[0] = changed[0].map((c, j) => c || j === f.at);
        extra = STATE_SWAP_COST;
      }
      if (bh && parts[1] !== "BH") continue;
      const score: [number, number] = [edits * EDIT_COST + extra + shapeCost(parts), edits];
      if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && score[1] < best.score[1])) {
        const keep = parts.map((p, j) => [p, changed[j]] as const).filter(([p]) => p);
        best = { score, r: { parts: keep.map(([p]) => p), changed: keep.map(([, c]) => c), text: keep.map(([p]) => p).join(" ") } };
      }
    }
  return best ? best.r : null;
}

// ---- Reader (CRNN, CTC) ----
export const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // blank is index 0
export const READER_H = 32;
export const READER_W = 160;
const TWO_LINE_ASPECT = 0.45;

/** Greedy CTC decode; conf is each emitted character's probability. logp is (T, C) row-major. */
export function decode(logp: Float32Array, T: number, C: number) {
  let text = "";
  const conf: number[] = [];
  let prev = -1;
  for (let t = 0; t < T; t++) {
    let arg = 0;
    for (let c = 1; c < C; c++) if (logp[t * C + c] > logp[t * C + arg]) arg = c;
    if (arg && arg !== prev) {
      text += CHARS[arg - 1];
      conf.push(Math.exp(logp[t * C + arg]));
    } else if (arg && arg === prev) conf[conf.length - 1] = Math.max(conf[conf.length - 1], Math.exp(logp[t * C + arg]));
    prev = arg;
  }
  return { text, conf };
}

/** Plate crop -> normalised 1x32x160 greys, two-line plates split and laid side by side (as reader.prep). */
export function prepCrop(src: CanvasImageSource, box: number[], work: HTMLCanvasElement) {
  const [x1, y1, x2, y2] = box;
  const w = Math.max(1, x2 - x1), h = Math.max(1, y2 - y1);
  work.width = READER_W;
  work.height = READER_H;
  const ctx = work.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  // ponytail: canvas bilinear stands in for cv2 INTER_AREA; retrain with this resize if accuracy drops in browser
  if (h / w > TWO_LINE_ASPECT) {
    const half = Math.floor(h / 2);
    ctx.drawImage(src, x1, y1, w, half, 0, 0, READER_W / 2, READER_H);
    ctx.drawImage(src, x1, y1 + half, w, h - half, READER_W / 2, 0, READER_W / 2, READER_H);
  } else ctx.drawImage(src, x1, y1, w, h, 0, 0, READER_W, READER_H);
  const px = ctx.getImageData(0, 0, READER_W, READER_H).data;
  const g = new Float32Array(READER_W * READER_H);
  let mean = 0;
  for (let i = 0; i < g.length; i++) {
    g[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
    mean += g[i];
  }
  mean /= g.length;
  let v = 0;
  for (let i = 0; i < g.length; i++) v += (g[i] - mean) ** 2;
  const std = Math.sqrt(v / g.length) + 1e-6;
  for (let i = 0; i < g.length; i++) g[i] = (g[i] - mean) / std;
  return g;
}

// ---- Detector (YOLO26n, end-to-end: rows of x1,y1,x2,y2,score,class in 640px letterbox space) ----
export const DET_SIZE = 640;

export function letterbox(src: CanvasImageSource, sw: number, sh: number, work: HTMLCanvasElement) {
  const scale = Math.min(DET_SIZE / sw, DET_SIZE / sh);
  const nw = Math.round(sw * scale), nh = Math.round(sh * scale);
  const px = (DET_SIZE - nw) / 2, py = (DET_SIZE - nh) / 2;
  work.width = work.height = DET_SIZE;
  const ctx = work.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "rgb(114,114,114)";
  ctx.fillRect(0, 0, DET_SIZE, DET_SIZE);
  ctx.drawImage(src, 0, 0, sw, sh, px, py, nw, nh);
  const d = ctx.getImageData(0, 0, DET_SIZE, DET_SIZE).data;
  const n = DET_SIZE * DET_SIZE;
  const t = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    t[i] = d[i * 4] / 255;
    t[n + i] = d[i * 4 + 1] / 255;
    t[2 * n + i] = d[i * 4 + 2] / 255;
  }
  return { tensor: t, scale, px, py };
}

export function parseDetections(out: Float32Array, rows: number, lb: { scale: number; px: number; py: number }, minScore = 0.35) {
  const boxes: { box: number[]; score: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const o = r * 6;
    if (out[o + 4] < minScore) continue;
    const m = (v: number, p: number) => (v - p) / lb.scale;
    boxes.push({ box: [m(out[o], lb.px), m(out[o + 1], lb.py), m(out[o + 2], lb.px), m(out[o + 3], lb.py)], score: out[o + 4] });
  }
  return boxes;
}

export function iou(a: number[], b: number[]) {
  const w = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
  const h = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const inter = w * h;
  return inter / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter || 1);
}

// ---- Tracking and voting: one confirmed reading per vehicle ----
export type Read = { reading: Reading; conf: number };
export type Confirmed = { id: number; reading: Reading; conf: number; votes: number; frames: number; at: Date };
type Track = { id: number; box: number[]; reads: Read[]; frames: number; seen: number; done: boolean };

export function vote(reads: Read[]) {
  const tally = new Map<string, { read: Read; votes: number; conf: number }>();
  for (const r of reads) {
    const t = tally.get(r.reading.text) ?? { read: r, votes: 0, conf: 0 };
    t.votes += 1;
    t.conf += r.conf;
    if (r.conf > t.read.conf) t.read = r;
    tally.set(r.reading.text, t);
  }
  let best: { read: Read; votes: number; conf: number } | null = null;
  for (const t of tally.values()) if (!best || t.votes > best.votes || (t.votes === best.votes && t.conf > best.conf)) best = t;
  return best && { reading: best.read.reading, votes: best.votes, share: best.votes / reads.length, conf: best.conf / best.votes };
}

export class Tracker {
  private tracks: Track[] = [];
  private next = 1;
  private needVotes: number;
  private ttlMs: number;
  constructor(needVotes = 3, ttlMs = 1500) {
    this.needVotes = needVotes;
    this.ttlMs = ttlMs;
  }

  /** Feed one frame's plates; returns readings confirmed by this frame. */
  update(dets: { box: number[]; read: Read | null }[], now: number) {
    const confirmed: Confirmed[] = [];
    for (const d of dets) {
      let t = this.tracks.find((k) => iou(k.box, d.box) > 0.3);
      if (!t) this.tracks.push((t = { id: this.next++, box: d.box, reads: [], frames: 0, seen: now, done: false }));
      t.box = d.box;
      t.seen = now;
      t.frames += 1;
      if (d.read && !t.done) t.reads.push(d.read);
      const v = !t.done && vote(t.reads);
      if (v && v.votes >= this.needVotes && v.share >= 0.6) {
        t.done = true;
        confirmed.push({ id: t.id, reading: v.reading, conf: v.conf, votes: v.votes, frames: t.frames, at: new Date() });
      }
    }
    this.tracks = this.tracks.filter((t) => now - t.seen < this.ttlMs);
    return confirmed;
  }

  get active() {
    return this.tracks.map((t) => ({ id: t.id, box: t.box, done: t.done, reads: t.reads.length }));
  }
}
