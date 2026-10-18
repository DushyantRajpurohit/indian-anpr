"use client";
import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

/** Dot-matrix booth display. Characters flip through random glyphs before landing; `amber` marks corrected ones. */
export function Led({ text, amber = [], label, small = false }: { text: string; amber?: boolean[]; label?: string; small?: boolean }) {
  const [shown, setShown] = useState(text);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    const chars = text.split("");
    chars.forEach((c, i) => {
      for (let k = 0; k < 5; k++)
        timers.current.push(window.setTimeout(() => setShown((s) => {
          const a = s.padEnd(text.length).slice(0, text.length).split("");
          a[i] = c === " " ? " " : k < 4 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : c;
          return a.join("");
        }), i * 45 + k * 55));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [text]);

  return (
    <span className={`led${small ? " small" : ""}`} role="status" aria-label={label ?? text}>
      {shown.split("").map((c, i) => (
        <span key={i} className={amber[i] && shown[i] === text[i] ? "amb" : undefined} aria-hidden="true">{c === " " ? " " : c}</span>
      ))}
    </span>
  );
}

/** Amber mask for a spaced reading, from a Reading's per-part `changed` flags. */
export const amberMask = (parts: string[], changed: boolean[][]) =>
  parts.flatMap((p, i) => [...(i ? [false] : []), ...p.split("").map((_, j) => !!changed[i]?.[j])]);
