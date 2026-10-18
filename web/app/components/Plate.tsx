import type { Scheme } from "@/lib/vehicles";

/** An Indian number plate drawn in code: white private, yellow commercial, green EV, white Bharat series. */
export function Plate({ parts, scheme = "private", two = false, className = "" }: { parts: string[]; scheme?: Scheme; two?: boolean; className?: string }) {
  const lines = two ? [parts.slice(0, 2).join(" "), parts.slice(2).join(" ")] : [parts.join(" ")];
  return (
    <span className={`plate plate-${scheme}${two ? " two" : ""} ${className}`} role="img" aria-label={`Number plate ${parts.join(" ")}`}>
      <span className="ind" aria-hidden="true"><i />IND</span>
      <span className="txt" aria-hidden="true">{lines.map((l) => <span key={l}>{l}</span>)}</span>
    </span>
  );
}
