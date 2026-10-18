import type { Kind } from "@/lib/vehicles";

// Flat vehicle fronts in a 400x300 box, drawn in the lane's ink. PLATE_SLOT is where each plate sits, in %.
export const PLATE_SLOT: Record<Kind, { left: number; top: number; width: number }> = {
  car: { left: 37, top: 61, width: 26 },
  suv: { left: 37, top: 62, width: 26 },
  auto: { left: 39, top: 66, width: 22 },
  bike: { left: 42.5, top: 49, width: 15 },
};

const INK = "#1a1c1f";
const GLASS = "#8fa6b6";
const LAMP = "#f7f3e3";

export function VehicleFront({ kind, color }: { kind: Kind; color: string }) {
  return (
    <svg viewBox="0 0 400 300" className="vehicle-svg" aria-hidden="true">
      <ellipse cx="200" cy="288" rx={kind === "bike" ? 60 : 165} ry="10" fill="#0d0e10" opacity="0.5" />
      {kind === "car" && (
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <rect x="68" y="225" width="44" height="58" rx="8" fill={INK} />
          <rect x="288" y="225" width="44" height="58" rx="8" fill={INK} />
          <path d="M58 232 L58 168 Q58 146 80 136 L112 84 Q122 66 142 64 L258 64 Q278 66 288 84 L320 136 Q342 146 342 168 L342 232 Q342 248 326 248 L74 248 Q58 248 58 232 Z" fill={color} />
          <path d="M120 88 Q126 76 142 76 L258 76 Q274 76 280 88 L302 130 L98 130 Z" fill={GLASS} />
          <rect x="44" y="128" width="20" height="14" rx="4" fill={color} />
          <rect x="336" y="128" width="20" height="14" rx="4" fill={color} />
          <path d="M72 158 L122 154 L118 172 L74 174 Z" fill={LAMP} />
          <path d="M328 158 L278 154 L282 172 L326 174 Z" fill={LAMP} />
          <rect x="150" y="156" width="100" height="16" rx="6" fill={INK} />
          <rect x="66" y="212" width="268" height="20" rx="9" fill={INK} opacity="0.85" />
        </g>
      )}
      {kind === "suv" && (
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <rect x="62" y="226" width="48" height="60" rx="8" fill={INK} />
          <rect x="290" y="226" width="48" height="60" rx="8" fill={INK} />
          <path d="M52 236 L52 150 Q52 132 70 124 L96 60 Q102 46 120 44 L280 44 Q298 46 304 60 L330 124 Q348 132 348 150 L348 236 Q348 250 332 250 L68 250 Q52 250 52 236 Z" fill={color} />
          <path d="M106 62 Q110 54 122 54 L278 54 Q290 54 294 62 L316 120 L84 120 Z" fill={GLASS} />
          <rect x="70" y="146" width="62" height="12" rx="6" fill={LAMP} />
          <rect x="268" y="146" width="62" height="12" rx="6" fill={LAMP} />
          <rect x="140" y="146" width="120" height="30" rx="8" fill={INK} />
          <path d="M150 161 h100" stroke="#2bd46a" strokeWidth="3" />
          <rect x="60" y="214" width="280" height="20" rx="9" fill={INK} opacity="0.85" />
        </g>
      )}
      {kind === "auto" && (
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <rect x="178" y="236" width="44" height="50" rx="10" fill={INK} />
          <path d="M84 150 Q78 50 200 30 Q322 50 316 150 Z" fill="#ffc20e" />
          <path d="M112 72 Q200 44 288 72 L296 146 L104 146 Z" fill={GLASS} />
          <path d="M92 150 L308 150 L290 244 Q200 256 110 244 Z" fill={color} />
          <circle cx="200" cy="176" r="15" fill={LAMP} />
          <path d="M120 160 L160 160 M240 160 L280 160" stroke={INK} strokeWidth="4" />
        </g>
      )}
      {kind === "bike" && (
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <rect x="184" y="196" width="32" height="92" rx="15" fill={INK} />
          <path d="M176 120 L168 214 M224 120 L232 214" stroke="#9aa0a6" strokeWidth="6" />
          <path d="M96 84 Q150 96 200 96 Q250 96 304 84" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
          <circle cx="92" cy="62" r="13" fill={GLASS} />
          <circle cx="308" cy="62" r="13" fill={GLASS} />
          <path d="M92 74 L100 86 M308 74 L300 86" stroke={INK} strokeWidth="4" />
          <path d="M152 98 Q200 70 248 98 L240 146 Q200 160 160 146 Z" fill={color} />
          <circle cx="200" cy="118" r="22" fill={LAMP} />
          <path d="M170 200 Q200 186 230 200" fill="none" stroke={color} strokeWidth="10" />
        </g>
      )}
    </svg>
  );
}
