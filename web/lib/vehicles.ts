// Vehicles for the hero lane. Each carries its true plate, an OCR-style misread, and the rule that fixes it.
// anpr.test.ts checks that correct(raw) gives back exactly `plate` for every one.
export type Scheme = "private" | "commercial" | "ev" | "bh";
export type Kind = "car" | "auto" | "bike" | "suv";
export type Vehicle = { kind: Kind; scheme: Scheme; plate: string[]; raw: string; rule: string; two?: boolean; color?: string };

export const VEHICLES: Vehicle[] = [
  { kind: "car", scheme: "private", plate: ["RJ", "14", "CD", "1234"], raw: "RJ1ACD1234", rule: "An A in a digit slot is a 4.", color: "#d5d9de" },
  { kind: "auto", scheme: "commercial", plate: ["WB", "12", "AU", "4821"], raw: "MB12AU4821", rule: "No state is MB: an M misread for a W.", color: "#2f7d3a" },
  { kind: "bike", scheme: "private", plate: ["KA", "05", "H", "8027"], raw: "KA05H8O27", rule: "Two-line plate, laid side by side; an O in a digit slot is a 0.", two: true, color: "#b3261e" },
  { kind: "suv", scheme: "ev", plate: ["DL", "3", "CAB", "1234"], raw: "DL3CAB1Z34", rule: "Delhi uses one-digit districts; a Z in a digit slot is a 2.", color: "#35607d" },
  { kind: "car", scheme: "bh", plate: ["22", "BH", "1234", "A"], raw: "228H1234A", rule: "Bharat series: an 8 where the B belongs.", color: "#7a2430" },
  { kind: "car", scheme: "private", plate: ["GJ", "1", "KF", "1111"], raw: "GJ1KF1111", rule: "Older plate without the leading zero: kept as printed.", color: "#ece6d2" },
];
