---
version: 1
slug: "web-app-page-tsx"
primary_target: "web/app/page.tsx"
related_targets: []
---

## Scope

`web/app/page.tsx` and its components: the one-page story site for indian-anpr with the live camera scanner as its last chapter, Next.js static export on GitHub Pages. Mode: Persuade (the visitor should believe the work is rigorous and act: open the scanner, open the repo). Story first, then live (user decision).

## Audience, job, action

Recruiters first: in one viewport, what this is (Indian plates read live in the browser) and that it is measured. ML engineers in depth: the data traps, the grammar, the results table. Actions: "Open the live scanner" (primary, works in place), "Read how it was built", repo link.

## Constraints

Numbers only from `web/public/data/*.json` mirrored from `reports/`; pending results render as held-back rows, never invented. No Sirisha/Kaggle images on the site (CC BY-NC-ND): every plate image is our own synthetic render, labelled synthetic. Camera video never leaves the device; the page says so. Works with no camera, no plates in view, models not yet published. First person, Dushyant Rajpurohit.

## Direction contract

THESIS: A plate read as a darkroom exposure record: the frame under translucent sheets, one per pipeline stage, each carrying its numbers. Refuses the category default: a black HUD with neon boxes and a metric-card row.

OWN-WORLD: Backlit paper ground snapped to an eleven-step zone ramp (Zone 0 #121212 to Zone X #F4F2EE); magenta #E0218A is filtration only: it marks exactly what the plate grammar changed, nothing else. Hatch density is confidence; a 90° cross-hatch is conflict (leakage, raw vs corrected disagreeing); dotted outline is held back (pending). Ultra-condensed display caps (League Gothic), tracked condensed legends and tabular mono quantities (Martian Mono, condensed), body in Archivo on cleared light zones only. Every surface is a ruled record: hairline grids, step numbers, Δ columns.

STORY: The visitor sees a plate read and corrected in front of them, learns the data traps (repeated plates, augmented copies, bad labels) and the plate grammar, trusts the results table because baseline and pending rows are both shown honestly, then opens the scanner on their own camera.

FIRST VIEWPORT: Left rail: wordmark INDIAN ANPR / PLATE EXPOSURE RECORD, the zone ramp doubling as the confidence legend, the magenta filtration swatch labelled "grammar correction only", material legend (sheet, conflict hatch, held back). Centre: display headline "READ THE PLATE. PROVE IT." at ~9rem, a two-line first-person dek, primary action "OPEN THE LIVE SCANNER →" and "READ HOW IT WAS BUILT". Right: a session sheet laid askew over a synthetic plate negative: the read RJ14CD1234 in ruled State | District | Series | Number columns, raw "RJ1ACD1234" above it with the A struck in magenta, Δ +9.3 pts note, stage rows detect/crop/read/correct. Top strip: system / dataset / test set 431 images / status cells.

FORM: Darkroom exposure record on translucent sheets (catalog challenger operate-b-exposure-record-zone-sheets, chosen by the user over the roll's assigned candidate 7, The Registration Schedule). Seed key 044912ba. Signature interaction: as the pipeline chapter scrolls, the stacked stage sheets slide aside one by one with slight overshoot (detect → crop → read → correct → vote), each revealing the next with its numbers; in the scanner, each confirmed plate's sheet drops into the ledger. Reduced motion: sheets already laid out.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Final detector, reader and voting numbers (Kaggle runs in progress); measured in-browser frame rate.
