"""Build the site's data and plate images from pipeline outputs: python tools/site_assets.py

Every number on the site comes from web/data/site.json, written here from reports/ and the code.
Plate images are our own synthetic renders (the test set's licence forbids redistributing its photos).
"""
import collections
import json
import random
from pathlib import Path

import cv2
import numpy as np

from anpr import data, metrics, plate, reader, synth

WEB = Path("web")
(WEB / "data").mkdir(parents=True, exist_ok=True)
(WEB / "public/plates").mkdir(parents=True, exist_ok=True)


def baseline():
    b = json.loads(Path("reports/baseline.json").read_text())
    row = lambda name, s, status="measured": {
        "name": name, "status": status, "exact": s["exact"], "ci": s["exact_ci"], "cer": s["cer"]}
    # Re-score from the per-image rows with the current metric (rejected readings fall back to raw).
    truths = [r["truth"] for r in b["rows"]]
    corrected = metrics.score([r["corrected"] or r["raw"] for r in b["rows"]], truths)
    f = json.loads(Path("reports/finetuned_easyocr.json").read_text())
    ft = [r["truth"] for r in f["rows"]]
    return {
        "images": b["images"], "plates": b["plates"], "detection_recall": b["detection_recall@0.5"],
        "finetuned_recall": f["detection_recall@0.5"],
        "rows": [row("Old detector + EasyOCR", metrics.score([r["raw"] for r in b["rows"]], truths)),
                 row("+ plate grammar corrector", corrected),
                 row("Fine-tuned detector + EasyOCR + corrector",
                     metrics.score([r["corrected"] or r["raw"] for r in f["rows"]], ft))],
    }


def audit():
    rows = list(data.load())
    counts = collections.Counter(data.clean(r["text"]) for r in rows)
    repeated = {t: c for t, c in counts.items() if c > 1}
    bad = [r["text"] for r in rows if not r["valid"]]
    return {
        "labelled_images": len(rows),
        "repeated_plates": len(repeated),
        "images_with_repeated_plate": sum(repeated.values()),
        "most_repeated": max(repeated.items(), key=lambda kv: kv[1]),
        "bad_labels": len(bad),
        "bad_label_examples": ["CRETA", "TERRANO", "blur", "RJD1AB1234", "plate-withheld"],
        "test_images": sum(r["split"] == "test" and r["valid"] for r in rows),
        "test_plates": len({data.clean(r["text"]) for r in rows if r["split"] == "test" and r["valid"]}),
        # From the Kaggle listing of sunrajbishnolia/license-plate-detection (Roboflow export).
        "roboflow_images": 15338, "roboflow_copies_per_photo": 3, "roboflow_claimed_accuracy": "99%",
    }


def corrector_examples():
    out = []
    for raw in ["RJ1ACD1234", "8R0IAB1Z34", "IND MH12AB1234", "22 8H 1234 A", "GJ1KF1111"]:
        fixed = plate.correct(raw)
        clean = data.clean(raw).removeprefix("IND") if "IND" in raw else data.clean(raw)
        out.append({"raw": raw, "corrected": fixed,
                    "changed": [i for i, (a, b) in enumerate(zip(clean, data.clean(fixed))) if a != b]
                    if len(clean) == len(data.clean(fixed)) else []})
    return out


def clean_plate(parts, two=False, scale=6):
    """High-resolution clean render in the synth's HSRP style (white, blue IND strip)."""
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype(str(synth.FONTS[[f.name for f in synth.FONTS].index("BarlowCondensed-SemiBold.ttf")]), 36 * scale)
    lines = [" ".join(parts[:2]), " ".join(parts[2:])] if two else [" ".join(parts)]
    boxes = [font.getbbox(t) for t in lines]
    tw, lh = max(b[2] - b[0] for b in boxes), max(b[3] - b[1] for b in boxes)
    strip, pad = 17 * scale, 11 * scale
    W, H = tw + strip + 2 * pad, lh * len(lines) + 10 * scale * len(lines) + 10 * scale
    im = Image.new("RGB", (W, H), (240, 240, 236))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([scale, scale, W - scale, H - scale], radius=4 * scale, outline=(20, 20, 20), width=2 * scale)
    d.rectangle([4 * scale, 4 * scale, strip, H - 5 * scale], fill=(25, 60, 160))
    small = ImageFont.truetype(str(synth.FONTS[0]), 7 * scale)
    d.text((5 * scale, H - 14 * scale), "IND", fill=(240, 240, 240), font=small)
    y = 6 * scale
    for t, b in zip(lines, boxes):
        d.text((strip + pad + (tw - (b[2] - b[0])) // 2 - b[0], y - b[1]), t, fill=(18, 18, 18), font=font)
        y += lh + 10 * scale
    return np.array(im)[:, :, ::-1].copy()


def write(name, img):
    cv2.imwrite(str(WEB / "public/plates" / name), img)


if __name__ == "__main__":
    hero = clean_plate(["RJ", "14", "CD", "1234"])
    write("hero-clean.png", hero)
    rng = random.Random(7)
    write("hero-degraded.png", synth.degrade(hero, rng))
    write("two-line.png", clean_plate(["MH", "12", "AB", "4821"], two=True))
    # What the reader actually sees: prep() output, upscaled with nearest-neighbour so pixels stay visible.
    strip = reader.prep(synth.degrade(hero, random.Random(3)))[0]
    strip = ((strip - strip.min()) / (strip.max() - strip.min()) * 255).astype(np.uint8)
    write("reader-input.png", cv2.resize(strip, None, fx=6, fy=6, interpolation=cv2.INTER_NEAREST))
    # Synthetic plates for the traffic stream: real renders from the generator, one file each.
    (WEB / "public/plates/synth").mkdir(parents=True, exist_ok=True)
    for i in range(32):
        img = synth.render(random.Random(200 + i))[0]
        cv2.imwrite(str(WEB / f"public/plates/synth/{i:02d}.jpg"), cv2.resize(img, (int(img.shape[1] * 90 / img.shape[0]), 90)), [cv2.IMWRITE_JPEG_QUALITY, 82])
    # Synthetic training grid: 4x3 real renders from the generator.
    tiles = [cv2.resize(synth.render(random.Random(100 + i))[0], (320, 110)) for i in range(12)]
    write("synthetic-grid.png", np.vstack([np.hstack(tiles[i:i + 4]) for i in range(0, 12, 4)]))

    # The Detect sheet shows a real detector run: the plate on a grey field and the box it returned.
    from ultralytics import YOLO
    frame = cv2.copyMakeBorder(hero, 300, 300, 300, 300, cv2.BORDER_CONSTANT, value=(120, 120, 120))
    write("detect-frame.png", frame)
    b = YOLO("models/plate_det.pt")(frame, verbose=False)[0].boxes
    H, W = frame.shape[:2]
    x1, y1, x2, y2 = b.xyxy[0].tolist()
    detect = {"box": [x1 / W, y1 / H, (x2 - x1) / W, (y2 - y1) / H], "conf": float(b.conf[0])}

    site = {"baseline": baseline(), "audit": audit(), "corrector": corrector_examples(), "detect": detect,
            "pending": ["Synthetic-trained reader (replaces EasyOCR)", "+ multi-frame voting (video frames)"],
            "states": sorted(plate.STATES)}
    (WEB / "data/site.json").write_text(json.dumps(site, indent=2))
    print(json.dumps({k: v for k, v in site.items() if k != "states"}, indent=1)[:2500])
