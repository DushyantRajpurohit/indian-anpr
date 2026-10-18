---
name: Indian ANPR
description: A number plate reader shown at its real home, a toll plaza lane, where the booth reads, corrects and prints every plate.
colors:
  canopy-yellow: "#ffc20e"
  asphalt: "#202327"
  asphalt-booth: "#2b2f34"
  asphalt-kerb: "#393e45"
  lane-paint: "#f2f1ea"
  lane-paint-dim: "#b9bcc0"
  concrete: "#e4e1d9"
  concrete-shade: "#d3cfc5"
  signage-ink: "#17181a"
  signage-ink-soft: "#4a4d52"
  signal-go: "#2bd46a"
  signal-go-ink: "#11692f"
  signal-stop: "#ff3b30"
  signal-unlit: "#3a3f45"
  correction-amber: "#ffb000"
  correction-amber-ink: "#8a5200"
  led-dot: "#dbe9ff"
  led-glass: "#0d0f12"
  thermal-paper: "#faf7f0"
  thermal-ink: "#34465a"
  exit-green: "#0a6b3b"
  plate-white: "#f5f5f1"
  plate-black: "#121212"
  plate-commercial-yellow: "#ffcd2a"
  plate-ev-green: "#1d7a3c"
  plate-ind-blue: "#1f4ea6"
typography:
  display:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(3.2rem, 6.6vw, 6.4rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(2.6rem, 5.6vw, 5.4rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.005em"
  title:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.8rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.005em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 400
    lineHeight: 1.6
  lede:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
  button:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.08em"
  led:
    fontFamily: "Doto, monospace"
    fontSize: "clamp(1.5rem, 2.4vw, 2.3rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: "\"ROND\" 100"
  receipt:
    fontFamily: "Fragment Mono, monospace"
    fontSize: "0.92rem"
    fontWeight: 400
    lineHeight: 1.5
  plate:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "14.5cqw"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "0.02em"
rounded:
  hardware: "4px"
  signal: "5px"
  panel-sm: "6px"
  control: "8px"
  booth: "10px"
  housing: "12px"
  plate: "7% / 26%"
  plate-two-line: "10% / 14%"
spacing:
  gutter: "clamp(16px, 3vw, 44px)"
  chapter: "clamp(64px, 9vw, 120px)"
  xs: "8px"
  sm: "14px"
  md: "22px"
  lg: "44px"
  hazard-band: "16px"
components:
  button-go:
    backgroundColor: "{colors.signage-ink}"
    textColor: "{colors.lane-paint}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "13px 20px 13px 10px"
  button-go-hover:
    backgroundColor: "#000000"
  button-go-on-asphalt:
    backgroundColor: "{colors.canopy-yellow}"
    textColor: "{colors.signage-ink}"
    rounded: "{rounded.control}"
  button-ghost:
    textColor: "{colors.lane-paint}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "13px 20px"
  lane-nav-item:
    backgroundColor: "{colors.signage-ink}"
    textColor: "{colors.lane-paint}"
    rounded: "{rounded.panel-sm}"
    padding: "6px 12px 6px 6px"
  lane-signal:
    backgroundColor: "{colors.led-glass}"
    rounded: "{rounded.signal}"
    size: "26px"
  led-display:
    backgroundColor: "{colors.led-glass}"
    textColor: "{colors.led-dot}"
    typography: "{typography.led}"
    rounded: "{rounded.panel-sm}"
    padding: "12px 14px"
  booth-input:
    backgroundColor: "{colors.led-glass}"
    textColor: "{colors.led-dot}"
    rounded: "{rounded.control}"
    padding: "16px 18px"
  plate-chip:
    backgroundColor: "{colors.plate-white}"
    textColor: "{colors.plate-black}"
    rounded: "{rounded.panel-sm}"
    padding: "7px 12px"
  booth-panel:
    backgroundColor: "{colors.asphalt-booth}"
    textColor: "{colors.lane-paint}"
    rounded: "{rounded.booth}"
    padding: "18px"
  receipt:
    backgroundColor: "{colors.thermal-paper}"
    textColor: "{colors.thermal-ink}"
    typography: "{typography.receipt}"
    padding: "30px 26px"
  gantry-sign:
    backgroundColor: "{colors.signage-ink}"
    textColor: "{colors.lane-paint}"
    rounded: "{rounded.signal}"
    padding: "6px 12px"
  gantry-sign-on:
    backgroundColor: "{colors.canopy-yellow}"
    textColor: "{colors.signage-ink}"
  exit-sign:
    backgroundColor: "{colors.exit-green}"
    textColor: "{colors.lane-paint}"
    rounded: "{rounded.housing}"
    padding: "24px 26px"
---

# Design System: Indian ANPR

## Overview

**Creative North Star: "The Toll Plaza Lane"**

The site is a working toll lane. Each surface is a piece of plaza hardware: a yellow canopy fascia across the top, an asphalt lane with white paint and amber road studs, a booth with a dot-matrix LED display, a boom barrier, a thermal receipt printer, gantry signs over the lane, and a green exit sign at the end. Reading a plate is something that happens to a vehicle in the lane. It is never shown as a dashboard.

Grounds alternate between concrete (the plaza apron, where you read) and asphalt (the lane, where things happen). The canopy yellow covers whole bands, not small accents. The interface vocabulary is borrowed from the plaza: lane signals carry state, the LED carries the reading, the receipt carries the finding. Type has four voices with fixed jobs, and they never swap. Vehicles, plates and road furniture are drawn in code and SVG. The only photographs are synthetic training plates and the visitor's own camera.

The world rejects the category default: a black HUD with neon bounding boxes and metric cards.

**Key Characteristics:**
- Canopy-yellow fascia bands edged in 2px ink with a hazard stripe beneath.
- Asphalt lanes bounded by 3–4px white lane paint and a dashed yellow centre line.
- Lane signals (green arrow, red cross, unlit dot) are the only state markers.
- Amber marks corrections and nothing else on the information layer.
- Thermal receipts on warm paper print the results. Pending lines say pending.
- Indian plates are drawn in code in their real colour schemes.

## Colors

The palette is a full-strength plaza palette: saturated yellow and signal colours on near-black asphalt and warm concrete, where every hue has one job.

### Primary
- **Canopy Yellow** (canopy-yellow): the toll canopy itself. Covers full-width bands (the header fascia, the scanner's canopy strip), the lit gantry sign, the dashed lane centre line, LED lane numbers, field labels on asphalt, the barrier post, the focus ring and text selection. Ink text on yellow, never white.

### Secondary
- **Signal Go** (signal-go): the green arrow on a lane signal and the solid plate lock once a reading is confirmed. **Signal Go Ink** (signal-go-ink) is the same meaning at text contrast on light grounds.
- **Signal Stop** (signal-stop): the red cross on a lane signal, the red bands of the boom arm, strike-throughs on rejected raw characters, and warning lines in the scanner log.

### Tertiary
- **Correction Amber** (correction-amber): lights the characters the plate rules changed, on the LED, in the scanner overlay and on the receipt slip. It also appears as the road-stud glow, because real studs are amber lane hardware. **Correction Amber Ink** (correction-amber-ink) is the same correction at text contrast on paper and concrete.
- **Exit Green** (exit-green): the exit sign in the footer. It is a road-sign green, not a state colour.

### Neutral
- **Asphalt** (asphalt): lane, journey, dark chapters and the exit footer.
- **Booth Asphalt** (asphalt-booth): booth housing, booth panels, scanner body, closed-lane strip.
- **Kerb Grey** (asphalt-kerb): input borders, gantry posts, scrollbar thumb.
- **Lane Paint** (lane-paint): text on asphalt, lane edges, stop line, the bounding lines of lane strips.
- **Faded Paint** (lane-paint-dim): secondary text on asphalt.
- **Concrete** (concrete): page ground and light chapters. **Concrete Shade** (concrete-shade) is its darker step.
- **Signage Ink** (signage-ink): text on concrete and yellow, nav pills, the go button, the gantry sign at rest. **Soft Ink** (signage-ink-soft) is muted text on light grounds.
- **LED Glass** (led-glass) and **LED Dot** (led-dot): the face and lit dots of every booth display, signal housing and the booth input.
- **Thermal Paper** (thermal-paper) and **Thermal Ink** (thermal-ink): receipts, slips and the ledger, printed in faded blue-black.
- **Plate colours** (plate-white, plate-black, plate-commercial-yellow, plate-ev-green, plate-ind-blue): reserved for drawn Indian plates, state tiles and plate-style chips.

### Named Rules
**The Signal Is The State Rule.** State is shown only by a lane signal: green down-arrow means open, confirmed or accepted. Red cross means closed or rejected. An unlit grey dot (signal-unlit) means not reached yet. Do not use coloured badges, ticks or status pills.

**The Amber Means Corrected Rule.** On the LED, overlays, slips and readouts, amber lights exactly the characters the plate rules changed, and only those. A reading with nothing to fix shows no amber.

**The Real Plate Rule.** Plates use real Indian schemes: white with black text for private, yellow with black for commercial, green with white for EV, white for Bharat series (YY BH #### X). Every plate carries the blue IND strip.

## Typography

**Display Font:** Big Shoulders (variable, opsz axis), fallback sans-serif
**Body Font:** Hanken Grotesk, fallback system-ui
**LED Font:** Doto (ROND axis at 100), fallback monospace
**Receipt Font:** Fragment Mono 400, fallback monospace

**Character:** Heavy condensed signage capitals for anything that would be painted or lit on plaza hardware, a rounded dot-matrix for what the booth displays, and thermal mono for what it prints. A plain grotesque carries the prose.

### Hierarchy
- **Display** (display): the canopy fascia headline only. Uppercase, balanced.
- **Headline** (headline): chapter titles, uppercase.
- **Title** (title): station headings in the journey, the scanner's idle prompt.
- **Body / Lede** (body, lede): prose. Ledes are capped at 62ch, the dek at 46ch.
- **Label** (label): uppercase panel and field labels inside hardware (booth name, field names, readout keys). These sit inside a panel and are never placed above a headline.
- **Button** (button): uppercase signage caps on every control.
- **LED** (led; 1.2–1.7rem small variant): plate readings and booth messages. Characters flip through random glyphs before they settle.
- **Receipt** (receipt; 0.72–0.92rem): slips, receipts, ledger, scanner log, captions and the inline `Chars` reading.
- **Plate** (plate): container-relative; 21cqw on two-line plates.

### Named Rules
**The Four Voices Rule.** Signage caps are what's painted, LED is what the booth shows, thermal mono is what it prints, grotesque is the narrator. A plate reading appears in LED or receipt type, never in body type.

## Layout

The page is a sequence of full-bleed bands with a fluid side gutter (gutter): the canopy header, the hero lane, the scroll-driven journey, then chapters that alternate concrete and asphalt with vertical padding (chapter), and the exit footer. The hero lane uses two columns: the drawn road (fluid) and a booth column (300–380px) on the right. The journey is a 500vh track with a sticky 100vh stage holding a top-down lane strip with five gantries spaced 20% apart, and a two-column panel below it. Content splits are two-column grids (1.5fr/1fr fascia, 1fr/1.1fr rules booth, 1fr/1fr results and exit). Gaps step 8 / 14 / 22 / 44px.

Responsive: at 1000px and below every split collapses to one column, the booth stacks under the lane, and the lane nav wraps to its own scrolling row. At 640px and below a compact LED appears over the top of the lane while the booth's own LED hides. Closed-lane fact rows stack, booth parts go to two columns, and gantry signs shrink to 0.62rem.

## Elevation & Depth

Depth comes from hardware, not floating cards. Displays and housings are recessed: an inset 2px black ring, and on the LED an inner 24px black vignette. Lit elements glow in their own colour (signals, studs, LED text, the confirmed lock). Cast shadows appear only under things that physically stand off the surface: the booth edge over the lane, paper slips and receipts, traffic plate thumbnails, and a lifted button on hover.

### Shadow Vocabulary
- **Housing recess** (`box-shadow: inset 0 0 0 2px #000`): signals, LED, booth panels, scanner.
- **LED vignette** (`inset 0 0 0 2px #000, inset 0 0 24px #000`): the dot-matrix face.
- **Signal glow** (`filter: drop-shadow(0 0 4px #2bd46a99)` / `#ff3b3099`): lit arrow or cross.
- **LED glow** (`text-shadow: 0 0 8px #dbe9ff88`; corrected `0 0 10px #ffb000cc, 0 0 2px #ffb000`).
- **Paper drop** (`0 24px 40px -24px #00000080`; slip `0 10px 20px -10px #000`).
- **Button lift** (`0 8px 18px -8px #00000066` with translateY(-2px)) on hover.

### Named Rules
**The Lit Not Lifted Rule.** Things that emit light glow in their own colour. Paper casts a shadow. Everything else sits flat or recessed.

## Shapes

Corners follow hardware scale: 4px small hardware, 5px signal housings and gantry signs, 6px LEDs, nav pills and chips, 8px controls and inputs, 10px booth panels, 12px scanner and exit housings. Plates use elliptical corners (rounded.plate) at an aspect ratio of 4.4:1, or 1.55:1 for two-line plates. Structure lines are 2px ink. Lane paint is 3–4px white inset lines top and bottom of every lane strip. The plate lock is a 3px dashed paint box that turns solid green once confirmed. Receipt rules are 1px dashed. The big receipt has zig-zag torn edges, top and bottom, and sits rotated 0.8deg.

Materials:
- **Hazard stripe** (`repeating-linear-gradient(-45deg, ink 0 16px, canopy 16px 32px)`, a 16px band): marks plaza structure. It runs under the canopy, across the top of the exit, and fills the traffic island.
- **Boom arm** (red/white 34px bands, 8px radius, 2px ink edge): the barrier. It is down for closed lanes and rises -80deg when a reading is accepted.
- **Lane centre** (canopy dashes 22/26, or 36–40px dashes on strips): lane direction.
- **Thermal paper**: the warm paper ground with blue-black ink. It carries results and findings only.

## Components

### Buttons
- **Shape:** 8px radius, 2px ink border, uppercase signage caps, 12px gap to an inline signal.
- **Go (primary):** an ink button with paint text and a leading green lane signal. On asphalt grounds it inverts to canopy yellow with ink text. Large variant: 1.2rem, `16px 24px 16px 12px`.
- **Ghost:** transparent with a currentColor border, paint text on asphalt.
- **Hover / Active / Focus:** lifts -2px with the button-lift shadow and deepens to pure black over 0.2s ease. Active presses 1px down. Disabled drops to 0.4 opacity. Focus is a 3px canopy outline at 3px offset, system-wide.

### Chips
- **Style:** a plate-white chip with plate-black signage caps, 6px radius and a 2px kerb border.
- **State:** selected gets a canopy border plus a 2px canopy ring. Hover lifts 2px.

### Cards / Containers
- **Booth panel:** booth asphalt, 10px radius, 18px padding, housing recess. Part cells inside use asphalt at 6px radius.
- **Closed lane:** a full-width asphalt strip between lane-paint lines. It has an ink gantry cell (LED lane number, red signal, title) and a road cell with the vertical boom arm down and Found / Would have / Fix facts labelled in canopy.
- **State tile:** a plate-white tile with an ink border, 8px radius, and the state code in signage caps. Hover tilts -1deg and lifts 3px.

### Inputs / Fields
- **Booth input:** an LED-glass field with LED-dot Doto text in uppercase, a 2px kerb border at 8px radius, and an amber caret.
- **Focus:** the border turns canopy yellow.

### Navigation
- **Lane nav:** each chapter is a lane in the canopy. It is an ink pill (6px radius) holding a canopy LED lane number, a 20px lane signal and an uppercase label. The traps chapter shows a red cross; the others show green. On narrow screens it is a horizontally scrolling row.

### Lane Signal (signature)
A 26px LED-glass square at 5px radius, holding an 18px stroked glyph with 3.4 stroke and round caps: down-arrow (go), cross (stop) or 4px dot (unlit). It appears in the nav, buttons, booth heads, closed lanes, journey gantries and the scanner canopy.

### LED Booth Display (signature)
Doto on LED glass. On a text change, each character flips through four random glyphs before it lands, staggered 45ms per character. Corrected characters light amber only once they have settled.

### Drawn Plate (signature)
A container-query plate with the IND strip at 9% width (14% on two-line plates), an emblem ring, and a heavy signage-caps registration. The scheme is set by modifier.

### Thermal Receipt (signature)
Fragment Mono on thermal paper, with dashed rule rows, right-aligned bold figures and a centred signage-caps title. The booth slip prints with a 14-step clip-path reveal. The big receipt prints on scroll (view timeline). The scanner ledger drops new lines in from above.

### Motion
One easing for UI, `cubic-bezier(0.16, 1, 0.3, 1)`, at 0.2s for controls and 0.4–0.6s for stations. Mechanical moves have their own curves: the barrier arm at 0.9s `cubic-bezier(0.3, 1.1, 0.5, 1)` with a slight overshoot, the vehicle exit at 0.9s `cubic-bezier(0.5, 0, 0.75, 0)`, and printers in `steps()`. Loops are linear (centre-line flow 1.6s, traffic streams 38s/46s, paused on hover). Under `prefers-reduced-motion: reduce`: smooth scroll, the centre flow, streams, approach, lock, ledger drop and journey copy animations are removed, and arm, slip and vehicle transitions are cut. The hero lane rests on its final state with the barrier up and the slip printed. LEDs show text without flipping. Scroll-printing of the receipt only runs under no-preference.

## Do's and Don'ts

### Do:
- **Do** show state with a lane signal: green arrow open/confirmed, red cross closed/rejected, unlit dot not reached.
- **Do** light amber on exactly the characters the plate rules changed, using amber ink (#8a5200) on paper and concrete.
- **Do** draw plates in code in their real Indian scheme, with the IND strip.
- **Do** use the hazard stripe only where plaza structure begins or ends: under the canopy, at the exit, on traffic islands.
- **Do** print results on thermal paper, and print unfinished lines as pending, never as an estimate.
- **Do** keep the four type voices on their jobs: signage caps, LED, thermal mono, grotesque.
- **Do** put ink text on canopy yellow, and on asphalt invert the go button to yellow.

### Don't:
- **Don't** build a black HUD with neon bounding boxes and metric cards.
- **Don't** use amber for emphasis, highlights, warnings or gains. It means a character was corrected.
- **Don't** add status badges, tick or cross glyph icons, or coloured pills. Use the signal.
- **Don't** show dataset photographs. Vehicles are drawn, and plates are rendered or synthetic.
- **Don't** set plate readings in body type.
- **Don't** put small uppercase labels above headlines. Labels live inside hardware panels.
