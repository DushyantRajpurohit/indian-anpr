import { clean, type Reading } from "@/lib/anpr";

export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
export const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function Arrow() {
  return (
    <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M0 6h16M11 1l5 5-5 5" />
    </svg>
  );
}

/** Lane signal: green down-arrow = open / confirmed, red cross = closed / rejected, unlit = not reached yet. */
export function Signal({ go, off = false, label }: { go: boolean; off?: boolean; label?: string }) {
  const state = off ? "off" : go ? "go" : "stop";
  return (
    <span className={`signal ${state}`} role="img" aria-label={label ?? (off ? "Not reached" : go ? "Lane open" : "Lane closed")}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {off ? <circle cx="12" cy="12" r="4" /> : go ? <path d="M12 3v15M5 11l7 8 7-8" /> : <path d="M5 5l14 14M19 5L5 19" />}
      </svg>
    </span>
  );
}

/** A reading's characters; corrected ones glow amber, raw characters the rules rejected are struck. */
export function Chars({ raw, strike = [], reading }: { raw?: string; strike?: number[]; reading?: Reading }) {
  if (reading)
    return (
      <span className="chars">
        {reading.parts.map((p, i) => (
          <span key={i}>
            {i > 0 && " "}
            {p.split("").map((c, j) => <span key={j} className={reading.changed[i][j] ? "amb" : undefined}>{c}</span>)}
          </span>
        ))}
      </span>
    );
  return (
    <span className="chars">
      {clean(raw ?? "").split("").map((c, i) => <span key={i} className={strike.includes(i) ? "strike" : undefined}>{c}</span>)}
    </span>
  );
}
