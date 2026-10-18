"""Fine-tune YOLO26n on Indian plates (Kaggle GPU). Pushed with: kaggle kernels push -p kaggle/detector

The Roboflow export ships ~3 augmented copies of each photo, spread across its own train/valid/test,
so we regroup by original photo before splitting. Any photo that near-duplicates an image in the
Sirisha dataset (our held-out test source) is dropped, so the local evaluation stays unseen.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U", "ultralytics"], check=True)
import cv2
import numpy as np
from ultralytics import YOLO

IN, OUT = Path("/kaggle/input"), Path("/kaggle/working")
IMG = {".jpg", ".jpeg", ".png"}


def dhash(path):
    g = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if g is None:
        return None
    g = cv2.resize(g, (9, 8), interpolation=cv2.INTER_AREA)
    return np.packbits((g[:, 1:] > g[:, :-1]).ravel())  # 8 bytes


yaml = next(IN.rglob("data.yaml"))
rob_root = yaml.parent
rob = [p for p in rob_root.rglob("*") if p.suffix.lower() in IMG]
sir = [p for p in IN.rglob("*") if p.suffix.lower() in IMG and rob_root not in p.parents]
print(f"roboflow images {len(rob)}, sirisha images {len(sir)}")

# Near-duplicates of any Sirisha image (hamming <= 5 of 64 bits) are removed with their whole group.
sir_h = np.stack([h for h in map(dhash, sir) if h is not None])
group = lambda p: re.sub(r"_(jpe?g|png)\.rf\.[0-9a-f]+$", "", p.stem, flags=re.I)
leaky = set()
for p in rob:
    h = dhash(p)
    if h is not None and np.unpackbits(sir_h ^ h, axis=1).sum(1).min() <= 5:
        leaky.add(group(p))
# ponytail: dhash misses rotated/cropped copies; add an embedding (CLIP) search if leakage shows up

groups = {group(p) for p in rob}
stats = {"images": len(rob), "photos": len(groups), "dropped_near_sirisha": len(leaky)}
ds = OUT / "ds"
shutil.rmtree(ds, ignore_errors=True)
for p in rob:
    g = group(p)
    if g in leaky:
        continue
    lab = p.parent.parent / "labels" / (p.stem + ".txt")
    if not lab.exists():
        continue
    split = "val" if int(hashlib.md5(g.encode()).hexdigest(), 16) % 10 == 0 else "train"
    for sub, src in (("images", p), ("labels", lab)):
        d = ds / split / sub
        d.mkdir(parents=True, exist_ok=True)
        os.symlink(src, d / src.name)
stats.update({s: len(list((ds / s / "images").iterdir())) for s in ("train", "val")})
print(stats)
(ds / "data.yaml").write_text(f"path: {ds}\ntrain: train/images\nval: val/images\nnames: ['license_plate']\n")

model = YOLO("yolo26n.pt")
model.train(data=str(ds / "data.yaml"), epochs=60, patience=15, imgsz=640, batch=32,
            device=0, workers=4, project=str(OUT / "runs"), name="det", seed=0, plots=True)
best = OUT / "runs/det/weights/best.pt"
shutil.copy(best, OUT / "plate_det.pt")
m = YOLO(best).val(data=str(ds / "data.yaml"), split="val", device=0)
stats.update(map50=float(m.box.map50), map50_95=float(m.box.map))
(OUT / "train_stats.json").write_text(json.dumps(stats, indent=2))
print(stats)
