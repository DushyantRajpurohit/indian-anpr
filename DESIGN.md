---
name: Indian ANPR
description: A plate read as a darkroom exposure record, on translucent ruled sheets over a backlit table.
colors:
  zone-0: "#121212"
  zone-1: "#1d1c1b"
  zone-2: "#2b2a28"
  zone-3: "#3b3a37"
  zone-4: "#4f4d49"
  zone-5: "#67655f"
  zone-6: "#817e78"
  zone-7: "#9d9a93"
  zone-8: "#bab7b0"
  zone-9: "#d6d3cc"
  zone-10: "#f4f2ee"
  backlit-paper: "#ebe8e2"
  record-sheet: "#f4f2eef2"
  stage-sheet: "#f4f2eed9"
  filtration-magenta: "#e0218a"
  filtration-magenta-ink: "#ad0f68"
typography:
  display:
    fontFamily: "League Gothic, sans-serif"
    fontSize: "clamp(4.4rem, 9.6vw, 9.4rem)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "0.005em"
  headline:
    fontFamily: "League Gothic, sans-serif"
    fontSize: "clamp(3rem, 6.4vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "0.005em"
  title:
    fontFamily: "League Gothic, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "0.005em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    fontVariation: "'wdth' 92"
  label:
    fontFamily: "Martian Mono, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 78"
  quantity:
    fontFamily: "Martian Mono, monospace"
    fontSize: "0.86rem"
    fontWeight: 400
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 82"
  plate-chars:
    fontFamily: "Martian Mono, monospace"
    fontSize: "1rem"
    fontWeight: 400
    letterSpacing: "0.2em"
    fontVariation: "'wdth' 82"
  table-head:
    fontFamily: "Martian Mono, monospace"
    fontSize: "0.66rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.14em"
    fontVariation: "'wdth' 78"
  button:
    fontFamily: "Martian Mono, monospace"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.18em"
    fontVariation: "'wdth' 80"
rounded:
  none: "0px"
spacing:
  hairline: "1px"
  correction-stroke: "2px"
  plate-frame: "10px"
  cell-y: "12px"
  cell-x: "16px"
  sheet-pad: "22px 24px"
  gutter: "clamp(16px, 2.4vw, 36px)"
  chapter-y: "clamp(56px, 8vw, 112px)"
  rail: "288px"
components:
  button-primary:
    backgroundColor: "{colors.zone-0}"
    textColor: "{colors.zone-10}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  button-primary-hover:
    backgroundColor: "{colors.zone-2}"
    textColor: "{colors.zone-10}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.zone-0}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.zone-2}"
    textColor: "{colors.zone-10}"
  strip-cell:
    backgroundColor: "{colors.backlit-paper}"
    textColor: "{colors.zone-0}"
    typography: "{typography.label}"
    padding: "12px 16px"
  stage-sheet:
    backgroundColor: "{colors.stage-sheet}"
    textColor: "{colors.zone-0}"
    rounded: "{rounded.none}"
    padding: "{spacing.sheet-pad}"
  chapter-nav-active:
    backgroundColor: "{colors.zone-0}"
    textColor: "{colors.zone-10}"
    typography: "{typography.label}"
    padding: "5px 4px"
  held-back-tag:
    backgroundColor: "transparent"
    textColor: "{colors.zone-4}"
    typography: "{typography.label}"
    padding: "2px 8px"
---

# Design System: Indian ANPR

## Overview

**Creative North Star: "The Plate Exposure Record"**

Every surface is a darkroom record laid on a backlit table: a greyscale plate print in a black frame, with translucent ruled sheets laid askew over it, one per pipeline stage, each carrying its numbers. The paper is light; the only darkness is photographic (the plate frame, the scanner window, the contact sheet) or ink (the primary action, the active chapter, the selected stage).

Tone is evidential, not dramatic. Tonal value is information: the eleven-step zone ramp is the only grey scale and doubles as the confidence legend, so a cell's grey says how sure the system is. One colour exists outside the ramp, and it is reserved for a single meaning: what the plate grammar changed. Hatching is a material with meaning, not texture. The world rejects the category default of a black HUD with neon boxes and metric-card rows.

Density is high and ruled: hairline grids, step numbers, Δ columns, tabular quantities. Large condensed display caps carry headlines; everything that is a label or a number speaks in condensed mono.

**Key Characteristics:**
- Backlit paper ground; greys snapped to the eleven-step zone ramp (Zone 0 to Zone X).
- Magenta is filtration: only grammar-changed characters, the grammar delta, and the filtration swatch.
- Hatch materials carry meaning: single 45° hatch is a stage sheet, 90° cross-hatch is conflict, dashed outline is held back.
- Square corners everywhere; hairline rules form every container.
- Translucent sheets with soft ambient shadow, slightly rotated, settling with mass.

## Colors

A greyscale exposure ramp on warm backlit paper, with one filtration accent.

### Primary
- **Filtration Magenta** (filtration-magenta): underlines and strikes on plate characters the grammar changed, the hatched filtration swatch in the rail, the drawn label of a corrected character on the scanner canvas.
- **Filtration Magenta Ink** (filtration-magenta-ink): the same meaning at text contrast; colour of corrected characters, struck raw characters, and the grammar row's Δ value.

### Neutral
- **Zone 0, Developer Black** (zone-0): ink, text, primary buttons, active nav and stage index, the 10px plate frame, contact-sheet ground.
- **Zone 1** (zone-1): scanner window and dark figure grounds; photographic dark only.
- **Zone 2** (zone-2): hover state for ink fills; emitted CTC columns; densest hatch stroke.
- **Zone 3** (zone-3): strong rules (`rule-strong`) and the hatch stroke colour.
- **Zone 4** (zone-4): secondary text (`ink-2`), legends marked muted.
- **Zones 5 to 9** (zone-5 to zone-9): held-back dashes (5), held-row marker (6), hairline rules (8), light fills and loser bars (9). Zone 7 appears only in the ramp legend.
- **Zone X, Cleared Light** (zone-10): cleared panels (primer, scanner, parts grid, held rows), text on ink.
- **Backlit Paper** (backlit-paper): page ground and theme colour.
- **Record Sheet** (record-sheet) and **Stage Sheet** (stage-sheet): translucent Zone X for the hero record (95%) and the pipeline stage sheets (85%), always with backdrop blur so the plate frame shows through.

### Named Rules
**The Filtration Rule.** Magenta marks exactly what the plate grammar changed and nothing else: changed characters, raw characters the grammar rejected (struck), the grammar row's Δ, and the filtration swatch. Never use it for emphasis, links, focus, status or decoration.

**The Zone Ramp Rule.** Every grey is a zone step. When grey encodes confidence, Zone 0 is least certain and Zone X most certain; a result's zone is `round(score × 10)`.

**The Photographic Dark Rule.** Dark fields (Zone 0 to 1) are reserved for photographic objects: the plate frame, the scanner window, the contact sheet. Body text never sits on them; only legends and display caps do.

## Typography

**Display Font:** League Gothic (with sans-serif)
**Body Font:** Archivo, width axis at 92% (with system-ui)
**Label/Mono Font:** Martian Mono, width axis 70 to 82%

**Character:** Ultra-condensed caps for the headline voice against tracked, condensed mono for every legend and number; Archivo carries reading prose on cleared light zones.

### Hierarchy
- **Display** (400, clamp(4.4rem, 9.6vw, 9.4rem), 0.86, uppercase, balanced wrap): the hero headline only; clamp(3.6rem, 19vw, 5.4rem) under 640px.
- **Headline** (400, clamp(3rem, 6.4vw, 6rem), 0.86, uppercase): chapter heads; pipeline stage titles at clamp(3rem, 5.6vw, 5.4rem); close at clamp(3.2rem, 6vw, 5.6rem).
- **Title** (400, 2.6rem, 0.86, uppercase): stage sheet headers, plate part values (clamp(2.2rem, 4vw, 3.4rem)), trap figures, state codes (1.9rem), wordmark (3rem).
- **Body** (400, 1rem, 1.6): prose at max 66ch; dek at 1.12rem, max 60ch; table cells 0.9rem; fact notes 0.86rem/1.45.
- **Label** (400, 0.72rem, 0.16em, uppercase, wdth 78): field legends, captions, provenance lines, chapter nav, stage index.
- **Quantity** (tabular, wdth 82): every number in a table or record.
- **Plate characters** (0.2em tracking, wdth 82): readings, raw OCR, plate examples; tracking drops to 0.06 to 0.1em in narrow ledgers.

### Named Rules
**The Two Voices Rule.** Words that name or measure (labels, headers, quantities, plate strings, buttons) are condensed mono; sentences are Archivo. Display caps are for headings and plate parts only.

**The Tabular Rule.** Numerals are tabular everywhere (`font-variant-numeric: tabular-nums` on body).

## Layout

A fixed 288px rail on the left (sticky, full height, hairline right rule) holds the wordmark, the zone ramp legend, the filtration swatch, the material legend, chapter nav and a privacy primer. The main column opens with a ruled top strip of five cells plus an ink repo cell, then chapters separated by strong hairlines with vertical padding clamp(56px, 8vw, 112px) and the gutter clamp(16px, 2.4vw, 36px) at the sides.

Chapter heads are a two-column grid (1fr / 0.9fr, gap 24px 48px, aligned to the baseline end) with the heading left and a 58ch paragraph right. Records are grids of hairline-divided cells; no gaps between cells, only rules.

The pipeline chapter is a 520vh scroll track with a sticky 100vh stage: copy and a five-cell stage index on the left (0.8fr), the sheet stack on the right (1.2fr).

Responsive: under 1100px the rail collapses to a wordmark bar (legends hidden), the strip goes to three columns, all two-column grids stack. Under 640px record tables turn into labelled two-column cards (each cell carries its label in the label voice), facts stack, and the stage index shrinks to 0.56rem.

## Elevation & Depth

Depth is physical paper stacking, not UI elevation. Only translucent sheets and photographic prints lift off the table; ruled records, cells and buttons are flat. Sheets are rotated a degree or two and blur what lies beneath (1.5px on the record, 3px on stage sheets).

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 1px #12121214, 0 18px 40px -12px #12121238`): stage sheets, the hero record, the plate negative, the contact sheet. Nothing else.

### Named Rules
**The Paper Mass Rule.** Sheets move with mass: they settle on `cubic-bezier(0.3, 1.12, 0.5, 1)` with a slight overshoot; everything else eases on `cubic-bezier(0.16, 1, 0.3, 1)`. Under reduced motion, sheets and ledger rows are already laid out.

**The One Sheet In Play Rule.** In a stack, only the sheet in play shows content; spent sheets pile up behind it as blank edges, offset and tilted, so the black-framed plate shows through.

## Shapes

Square corners throughout (0px). Containers are drawn with 1px hairlines: Zone 8 for interior divisions, Zone 3 for outer edges and section breaks, ink for the scanner and buttons. Photographic prints get a hard black frame (10px; 8px in the stack; 6px on mobile) and a small rotation (2.2 to 3 degrees). Detection boxes are 2px ink outlines with an ink label tab. Materials: single 45° hatch (1px stroke at 8px pitch) for a stage sheet; a 45°/−45° cross-hatch at 6px for conflict; a dashed 1px outline for held back.

## Components

### Buttons
Ruled and mechanical, a word cell and an arrow cell.
- **Shape:** square (0px), 1px ink border, the arrow in its own cell divided by a hairline in currentColor.
- **Primary:** ink fill, Zone X text, arrow in its own ruled cell.
- **Secondary:** transparent, ink text, arrow in its own ruled cell.
- **Not canonized:** the shipped build hatches the arrow cell (Zone X at 5px on primary, Zone 3 on secondary). That is hatch used as texture, which contradicts the material rule; do not extend it to new controls.
- **Hover / Focus:** fill shifts to Zone 2 with Zone X text over 0.25s on the standard ease; focus is a 2px ink outline offset 3px.
- **Disabled:** 45% opacity over the sparse hatch.

### Top Strip
Five ruled label-and-value cells (label voice over 0.8rem mono value, ellipsised) and a final ink cell linking the repo with an arrow.

### Ruled Record Table
- Headers in the table-head voice, Zone 4, over a strong rule; cells over hairlines, 9px 8px.
- **Held row:** Zone X fill, Zone 4 text, a 1px Zone 6 left marker, result shown as a dashed "held back" tag; never an estimate.
- **Zone cell:** a 38 × 22 swatch filled with the result's zone step; dashed when held back.

### Stage Sheet (signature)
Translucent Zone X at 85% with 3px backdrop blur, strong hairline, sheet shadow, 22px 24px padding. Header: title-size display caps left, "Stage n of 5" legend right, over a strong rule. Then a figure panel, a three-column rows table (label, bold quantity, muted note), and a provenance legend. Sheets stack offset 10px/9px per step, tilted by a per-stage angle, and slide aside as the chapter scrolls.

### Plate Characters
Corrected characters: magenta ink, bold, 2px magenta underline offset 4px. Rejected raw characters: magenta ink with a 2px magenta strike. Everything else ink.

### Navigation
Chapter list in the label voice, hairline-separated rows with a 9px square mark (solid when current; the shipped at-rest hatch is the same texture drift as the button arrow cell); the current chapter inverts to ink. The stage index is the same idea: five ruled cells, the active one in ink.

### Scanner
A ledger instrument: 1px ink border on Zone X, a four-cell ruled head, a Zone 1 viewing window (4:3) with a faint 9px hatch idle state, controls under an ink rule, a ledger table where confirmed plates drop in (translate −14px, −1.5° to rest on the settle curve), and a mono log.

## Do's and Don'ts

### Do:
- **Do** take every grey from the zone ramp, and map confidence to it as `round(score × 10)`.
- **Do** keep magenta to grammar-changed characters, the grammar Δ, and the filtration swatch.
- **Do** use hatching only as a legended material: single 45° hatch for a sheet, cross-hatch for conflict, dashed outline for held back.
- **Do** draw containers with hairlines (1px Zone 8 inside, Zone 3 outside) and keep corners square.
- **Do** set every label, number and plate string in condensed mono, numerals tabular.
- **Do** frame photographic plates in Zone 0 and label every raster's provenance in the label voice.
- **Do** show pending results as held back, never estimated.

### Don't:
- **Don't** use magenta for emphasis, links, focus, status or hover.
- **Don't** introduce colours outside the zone ramp, paper, sheet and filtration tokens.
- **Don't** put body prose on Zone 0 to 2 fields.
- **Don't** add rounded corners, or shadows on anything that is not a sheet or a print.
- **Don't** fall back to a black HUD with neon boxes or a row of metric cards.
