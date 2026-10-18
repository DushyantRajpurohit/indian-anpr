"""Score detector + reader on held-out plates: python -m anpr.evaluate --detector D --reader R --out F"""
import json
import sys
from pathlib import Path

from anpr import data, metrics, plate


def iou(a, b):
    w = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    h = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = w * h
    return inter / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter)


def read_lines(results):
    """Join EasyOCR boxes top line first, then left to right, so two-line plates read in order."""
    items = sorted(((sum(p[1] for p in b) / 4, b[0][0], t) for b, t, _ in results))
    lines = []
    for y, x, t in items:
        # ponytail: fixed 15px line gap; scale by box height if crops vary a lot in size
        if lines and abs(lines[-1][0] - y) < 15:
            lines[-1][1].append((x, t))
        else:
            lines.append((y, [(x, t)]))
    return "".join(t for _, ws in lines for _, t in sorted(ws))


def make_reader(name):
    """'easyocr' or a CRNN state_dict path -> function(crop BGR) -> raw text."""
    if name == "easyocr":
        import easyocr
        ocr = easyocr.Reader(["en"], gpu=False, verbose=False)
        return lambda crop: read_lines(ocr.readtext(crop, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"))
    import torch
    from anpr import reader
    model = reader.CRNN()
    model.load_state_dict(torch.load(name, map_location="cpu"))
    model.eval()

    @torch.no_grad()
    def read(crop):
        return reader.decode(model(torch.from_numpy(reader.prep(crop))[None])[0].numpy())
    return read


def main(detector="models/generic_best.pt", ocr="easyocr", split="test"):
    import cv2
    from ultralytics import YOLO

    det, read = YOLO(detector), make_reader(ocr)
    rows = []
    for r in data.load():
        if r["split"] != split or not r["valid"]:
            continue
        img = cv2.imread(str(r["image"]))
        boxes = det(img, verbose=False)[0].boxes.xyxy.tolist()
        best = max(boxes, key=lambda b: iou(b, r["box"]), default=None)
        hit = best is not None and iou(best, r["box"]) >= 0.5
        # OCR the ground-truth crop when the detector misses, so OCR is scored on its own.
        x1, y1, x2, y2 = map(int, best if hit else r["box"])
        raw = read(img[max(0, y1):y2, max(0, x1):x2])
        rows.append(dict(image=str(r["image"]), source=r["source"], truth=r["text"], detected=hit,
                         raw=raw, corrected=plate.correct(raw)))

    truths = [r["truth"] for r in rows]
    report = {
        "images": len(rows),
        "plates": len({data.clean(t) for t in truths}),
        "detection_recall@0.5": sum(r["detected"] for r in rows) / len(rows),
        "ocr_raw": metrics.score([r["raw"] for r in rows], truths),
        # A rejected reading falls back to the raw text rather than counting as blank.
        "ocr_corrected": metrics.score([r["corrected"] or r["raw"] for r in rows], truths),
        "corrector_rejected": sum(r["corrected"] is None for r in rows),
        "rows": rows,
    }
    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, indent=2))
    return report


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--detector", default="models/generic_best.pt")
    ap.add_argument("--reader", default="easyocr", help="'easyocr' or a CRNN .pt")
    ap.add_argument("--split", default="test")
    ap.add_argument("--out", default="reports/baseline.json")
    a = ap.parse_args()
    out = main(a.detector, a.reader, a.split)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(out, indent=2))
