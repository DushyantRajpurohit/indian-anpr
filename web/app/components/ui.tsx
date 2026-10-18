import { clean, type Reading } from "@/lib/anpr";

export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
export const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function Arrow() {
  return (
    <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M0 6h16M11 1l5 5-5 5" />
    </svg>
  );
}

/** A reading's characters; corrected ones are magenta, raw characters the grammar rejected are struck. */
export function Chars({ raw, strike = [], reading }: { raw?: string; strike?: number[]; reading?: Reading }) {
  if (reading)
    return (
      <span className="chars">
        {reading.parts.map((p, i) => (
          <span key={i}>
            {i > 0 && " "}
            {p.split("").map((c, j) => <span key={j} className={reading.changed[i][j] ? "fix" : undefined}>{c}</span>)}
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
