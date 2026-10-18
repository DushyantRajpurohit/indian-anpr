---
version: 1
slug: "web-app-page-tsx"
primary_target: "web/app/page.tsx"
related_targets: []
---

## Scope

`web/app/page.tsx` and its components: the one-page story site for indian-anpr ending in the live camera scanner, Next.js static export on GitHub Pages. Mode: Persuade. Story first, then live (user decision). Redesign of the earlier darkroom-record world (retired; user found it static and hard to understand, wants it fun to explore).

## Audience, job, action

Recruiters first: within one viewport they see a car roll into a toll lane, its plate read and corrected, and the barrier lift. ML engineers in depth: data traps, plate rules, results receipt. Actions: "Open your lane" (live scanner, primary), "Send the next vehicle" (hero toy), repo link.

## Constraints

Numbers only from `web/data/site.json` (mirrored from `reports/`); pending results print as PENDING, never estimated. No dataset photos on the site (CC BY-NC-ND); plates are rendered in code, vehicles are drawn. Camera video never leaves the device. Works with no camera, no plates in view, and before models load. First person, Dushyant Rajpurohit.

## Direction contract

THESIS: ANPR at its real home: a toll lane. A vehicle rolls in, the booth reads and corrects its plate on an LED display, the barrier lifts, a receipt prints the finding. Refuses the category default: a black HUD with neon boxes and metric cards.

OWN-WORLD: Asphalt #202327 lane with white lane paint and road studs; canopy yellow #FFC20E carrying whole fascia bands with black hazard stripes on the islands; lane signals are the state system (green arrow = go/confirmed, red cross = rejected/closed); amber LED #FFB000 is the correction colour only: it lights exactly the characters the plate grammar changed. Booth displays in dot-matrix (Doto), canopy and headlines in heavy condensed signage caps (Big Shoulders Display), receipts in thermal mono (Fragment Mono) on warm paper #FAF7F0 with faded blue-black ink, body in Hanken Grotesk on concrete #E4E1D9. Plates are drawn in code in real Indian schemes (white private, yellow commercial, green EV, BH series).

STORY: The visitor watches and plays with the lane (sends a car, an auto with a yellow plate, a bike with a two-line plate, an EV), understands detect, read, correct, vote as stations a vehicle passes, sees the traps as closed lanes and the results as a printed receipt, then opens their own lane on their camera.

FIRST VIEWPORT: Top: the canopy fascia, a full-width yellow band with lane numbers and lane signals that double as navigation, the headline in black signage caps "Every plate, read at the barrier." and a one-line first-person dek. Below it the lane in perspective on asphalt: a drawn vehicle rolls up to the boom barrier, a dashed box locks onto its plate, the booth's LED display flips RJ1ACD1234 into RJ 14 CD 1234 with the 4 in amber, the barrier lifts, a receipt slip prints "+9.3 pts from plate rules". Controls on the booth: "Send the next vehicle" and the primary green-signal action "Open your lane".

FORM: Toll plaza lane, the grounded pick (IMPECCABLE'S PICK card), chosen by the user over the roll's assigned candidate 5 (Highway Signage). Seed key e0ae1dfd. Signature interaction: the hero lane is a toy: each "Send the next vehicle" brings a different vehicle and plate rule through detect, read, correct, barrier, receipt; in "How a plate is read" the scroll drives one vehicle through five stations whose booth display shows that station's output and numbers; in the rules chapter the visitor types any misread into the booth and watches the correction live. Reduced motion: every station shown at rest, the barrier up.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Final reader numbers (reader v2 training) and the voting gain on video frames.
