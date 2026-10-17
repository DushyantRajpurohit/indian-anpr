"""Score detector + OCR on Pascal VOC folders: python -m anpr.evaluate data/datacluster"""
import json
import re
import sys
from pathlib import Path

from anpr import metrics, plate


def load_voc(root):
    """Yield (image_path, [(box, text or None)]) from Annotations/*.xml."""
    for xml in sorted(Path(root, "Annotations").glob("*.xml")):
        s = xml.read_text()
        objs = []
        for o in re.findall(r"<object>(.*?)</object>", s, re.S):
            box = [float(re.search(f"<{k}>(.*?)</{k}>", o).group(1)) for k in ("xmin", "ymin", "xmax", "ymax")]
            t = re.search(r"number_plate_text</name>\s*<value>(.*?)</value>", o)
            objs.append((box, t and t.group(1)))
        yield Path(root, "images", xml.stem + ".jpg"), objs


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


def main(root, weights="models/generic_best.pt"):
    import cv2
    import easyocr
    from ultralytics import YOLO

    det, reader = YOLO(weights), easyocr.Reader(["en"], gpu=False, verbose=False)
    found = total = 0
    rows = []
    for img_path, objs in load_voc(root):
        img = cv2.imread(str(img_path))
        boxes = det(img, verbose=False)[0].boxes.xyxy.tolist()
        for gt, text in objs:
            total += 1
            best = max(boxes, key=lambda b: iou(b, gt), default=None)
            hit = best is not None and iou(best, gt) >= 0.5
            found += hit
            if text and plate.correct(text):  # skip partial labels like 'KL34F'
                x1, y1, x2, y2 = map(int, best if hit else gt)
                raw = read_lines(reader.readtext(img[y1:y2, x1:x2], allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"))
                rows.append(dict(image=img_path.name, truth=text, detected=hit, raw=raw, corrected=plate.correct(raw)))

    truths = [r["truth"] for r in rows]
    report = {
        "detection_recall@0.5": found / total,
        "plates": total,
        # OCR runs on the ground-truth crop when the detector misses, so OCR is scored on its own.
        "ocr_raw": metrics.score([r["raw"] for r in rows], truths),
        "ocr_corrected": metrics.score([r["corrected"] for r in rows], truths),
        "rows": rows,
    }
    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, indent=2))
    return report


if __name__ == "__main__":
    out = main(*sys.argv[1:])
    Path("reports").mkdir(exist_ok=True)
    Path("reports/datacluster_baseline.json").write_text(json.dumps(out, indent=2))
