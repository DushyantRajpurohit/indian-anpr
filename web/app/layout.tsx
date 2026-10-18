import type { Metadata, Viewport } from "next";
import { Archivo, League_Gothic, Martian_Mono } from "next/font/google";
import "./globals.css";

const display = League_Gothic({ variable: "--font-display", subsets: ["latin"] });
const mono = Martian_Mono({ variable: "--font-mono", subsets: ["latin"], axes: ["wdth"] });
const body = Archivo({ variable: "--font-body", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Indian ANPR · plates read live in your browser",
  description:
    "An Indian number plate reader measured end to end: fine-tuned detector, a reader trained only on synthetic plates, and a plate-grammar corrector. Runs on your camera; nothing is uploaded.",
};

export const viewport: Viewport = { themeColor: "#ebe8e2" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
