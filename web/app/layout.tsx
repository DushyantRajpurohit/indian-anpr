import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Doto, Fragment_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const sign = Big_Shoulders({ variable: "--font-sign", subsets: ["latin"], axes: ["opsz"] });
const led = Doto({ variable: "--font-led", subsets: ["latin"], axes: ["ROND"] });
const receipt = Fragment_Mono({ variable: "--font-receipt", subsets: ["latin"], weight: "400" });
const body = Hanken_Grotesk({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Indian ANPR · every plate, read at the barrier",
  description:
    "An Indian number plate reader measured end to end: fine-tuned detector, a reader trained only on synthetic plates, and a plate-rules corrector. Runs on your camera; nothing is uploaded.",
};

export const viewport: Viewport = { themeColor: "#ffc20e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sign.variable} ${led.variable} ${receipt.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
