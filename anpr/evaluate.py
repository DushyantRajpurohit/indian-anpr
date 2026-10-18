"""Score detector + OCR on the held-out plates: python -m anpr.evaluate [weights]"""
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


def main(weights="models/generic_best.pt"):
    import cv2
    import easyocr
    from ultralytics import YOLO

    det, reader = YOLO(weights), easyocr.Reader(["en"], gpu=False, verbose=False)
    rows = []
    for r in data.load():
        if r["split"] != "test" or not r["valid"]:
            continue
        img = cv2.imread(str(r["image"]))
        boxes = det(img, verbose=False)[0].boxes.xyxy.tolist()
        best = max(boxes, key=lambda b: iou(b, r["box"]), default=None)
        hit = best is not None and iou(best, r["box"]) >= 0.5
        # OCR the ground-truth crop when the detector misses, so OCR is scored on its own.
        x1, y1, x2, y2 = map(int, best if hit else r["box"])
        raw = read_lines(reader.readtext(img[y1:y2, x1:x2], allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"))
        rows.append(dict(image=str(r["image"]), source=r["source"], truth=r["text"], detected=hit,
                         raw=raw, corrected=plate.correct(raw)))

    truths = [r["truth"] for r in rows]
    report = {
        "images": len(rows),
        "plates": len({data.clean(t) for t in truths}),
        "detection_recall@0.5": sum(r["detected"] for r in rows) / len(rows),
        "ocr_raw": metrics.score([r["raw"] for r in rows], truths),
        "ocr_corrected": metrics.score([r["corrected"] for r in rows], truths),
        "rows": rows,
    }
    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, indent=2))
    return report


if __name__ == "__main__":
    out = main(*sys.argv[1:])
    Path("reports").mkdir(exist_ok=True)
    Path("reports/baseline.json").write_text(json.dumps(out, indent=2))
