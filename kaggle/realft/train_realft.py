"""DO NOT USE. Kept as a record of a failed attempt (see README, "Honest notes").

The Zenodo dataset below turned out to be a relabelled copy of the CC BY-NC-ND Sirisha set (our test
source): 43 of 48 sampled labels were identical. The model this produced was discarded and never shipped.

Original intent: fine-tune reader v2 on real plates from a CC BY 4.0 dataset (Kaggle GPU).

Real data: "Number Plate Number Identification Dataset", Bhuma et al., Bapatla Engineering College,
Zenodo 10.5281/zenodo.13954136, CC BY 4.0 (1,700 phone photos, plate text in an Excel sheet).
Plates are cropped with our fine-tuned detector. Bapatla is split by plate number into train / val.
The checkpoint is still chosen on the Sirisha *train* split; the Sirisha test split is never touched here.
"""
import json
import random
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

IN, OUT, TMP = Path("/kaggle/input"), Path("/kaggle/working"), Path("/kaggle/tmp")
code = next(IN.rglob("synth.py")).parent.parent
sys.path.insert(0, str(code))
shutil.copytree(code / "fonts", OUT / "data/fonts", dirs_exist_ok=True)
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U", "ultralytics", "openpyxl"], check=True)

import cv2
import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import DataLoader, IterableDataset
from ultralytics import YOLO

from anpr import data, plate, reader, synth

STEPS, BATCH, EVAL_EVERY, REAL_SHARE = 6000, 256, 500, 0.5
stats = {}

# ---- 1. download and unpack ----
TMP.mkdir(exist_ok=True)
zf = TMP / "bapatla.zip"
subprocess.run(["curl", "-sSL", "--retry", "10", "-o", str(zf),
                "https://zenodo.org/api/records/13954136/files/number_plate.zip/content"], check=True)
with zipfile.ZipFile(zf) as z:
    z.extractall(TMP / "bapatla")
root = TMP / "bapatla"
images = {p.stem.lower(): p for p in root.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".heic"}}
sheet = next(root.rglob("*.xls*"))
df = pd.read_excel(sheet)
print("sheet", sheet.name, df.shape, list(df.columns)); print(df.head(8).to_string())
stats.update(images=len(images), sheet_rows=len(df), columns=[str(c) for c in df.columns])

# Columns: the one whose values name image files, and the one whose values look most like plates.
as_str = df.astype(str)
img_col = max(as_str.columns, key=lambda c: as_str[c].str.lower().map(lambda v: Path(v).stem.lower() in images).mean())
plate_col = max((c for c in as_str.columns if c != img_col), key=lambda c: as_str[c].map(lambda v: bool(plate.correct(v))).mean())
print("image column:", img_col, "| plate column:", plate_col)
stats.update(image_column=str(img_col), plate_column=str(plate_col))

# ---- 2. crop plates with our detector ----
det = YOLO(str(next(code.rglob("plate_det.pt"))))
real, miss = [], {"no_image": 0, "no_plate_found": 0, "invalid_label": 0}
for name, text in zip(as_str[img_col], as_str[plate_col]):
    p = images.get(Path(name).stem.lower())
    if p is None:
        miss["no_image"] += 1; continue
    label = data.clean(text)
    if not data.is_valid(label):
        miss["invalid_label"] += 1; continue
    img = cv2.imread(str(p))
    if img is None:
        miss["no_image"] += 1; continue
    s = 1600 / max(img.shape[:2])  # 50-200 MP originals: work at 1600 px on the long side
    if s < 1:
        img = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    b = det(img, verbose=False)[0].boxes
    if not len(b):
        miss["no_plate_found"] += 1; continue
    x1, y1, x2, y2 = b.xyxy[int(b.conf.argmax())].tolist()
    px, py = (x2 - x1) * 0.04, (y2 - y1) * 0.08
    crop = img[max(0, int(y1 - py)):int(y2 + py), max(0, int(x1 - px)):int(x2 + px)]
    real.append((crop, label))
stats.update(cropped=len(real), **miss)
print("cropped", len(real), miss)

# Never train on a plate that is in the Sirisha test split.
sir_root = next(IN.rglob("State-wise_OLX")).parent
sir = list(data.load(sir_root))
test_plates = {data.clean(r["text"]) for r in sir if r["split"] == "test"}
real = [(c, t) for c, t in real if t not in test_plates]
tr = [(c, t) for c, t in real if data.split_of(t) == "train"]
va = [(c, t) for c, t in real if data.split_of(t) == "test"]
stats.update(bapatla_train=len(tr), bapatla_val=len(va))
print("bapatla train/val", len(tr), len(va))

# Contact sheet so the crops and labels can be checked by eye.
rng = random.Random(0)
tiles = []
for c, t in rng.sample(real, min(48, len(real))):
    tile = cv2.copyMakeBorder(cv2.resize(c, (240, 70)), 0, 22, 2, 2, cv2.BORDER_CONSTANT, value=(255, 255, 255))
    cv2.putText(tile, t, (4, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 200), 1)
    tiles.append(tile)
while len(tiles) % 6:
    tiles.append(np.full_like(tiles[0], 255))
cv2.imwrite(str(OUT / "bapatla_crops.jpg"), np.vstack([np.hstack(tiles[i:i + 6]) for i in range(0, len(tiles), 6)]))


# ---- 3. fine-tune: half synthetic, half real (lightly re-degraded) ----
class Mixed(IterableDataset):
    def __iter__(self):
        info = torch.utils.data.get_worker_info()
        r = random.Random(1000 + (info.id if info else 0))
        while True:
            if r.random() < REAL_SHARE:
                c, t = r.choice(tr)
                img = synth.degrade(c, r) if r.random() < 0.5 else c
            else:
                img, t, _ = synth.render(r)
            yield torch.from_numpy(reader.prep(img)), t


def collate(b):
    xs, ts = zip(*b)
    return torch.stack(xs), ts


def crops_of(rows):
    out = []
    for r in rows:
        img = cv2.imread(str(r["image"]))
        x1, y1, x2, y2 = map(int, r["box"])
        if img is not None and x2 > x1 and y2 > y1:
            out.append((reader.prep(img[y1:y2, x1:x2]), data.clean(r["text"])))
    return out


@torch.no_grad()
def exact(model, val):
    model.eval()
    x = torch.from_numpy(np.stack([v[0] for v in val])).cuda()
    logp = torch.cat([model(x[i:i + 512]) for i in range(0, len(x), 512)]).cpu().numpy()
    hits = [data.clean(plate.correct(reader.decode(l)) or reader.decode(l)) == v[1] for l, v in zip(logp, val)]
    model.train()
    return float(np.mean(hits))


sir_val = crops_of([r for r in sir if r["split"] == "train" and r["valid"]])
bap_val = [(reader.prep(c), t) for c, t in va]
model = reader.CRNN().cuda()
model.load_state_dict(torch.load(next(code.rglob("reader_v2.pt")), map_location="cuda"))
start = {"step": 0, "sirisha_train": exact(model, sir_val), "bapatla_val": exact(model, bap_val)}
print("reader v2 before fine-tuning", start, flush=True)
history, best = [start], start["sirisha_train"]
torch.save(model.state_dict(), OUT / "reader.pt")

opt = torch.optim.AdamW(model.parameters(), 5e-4, weight_decay=1e-4)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, 5e-4, total_steps=STEPS, pct_start=0.1)
ctc = nn.CTCLoss(blank=0, zero_infinity=True)
loader = DataLoader(Mixed(), batch_size=BATCH, num_workers=4, collate_fn=collate, persistent_workers=True)
for step, (x, ts) in enumerate(loader, 1):
    tg = torch.tensor([i for t in ts for i in reader.encode(t)])
    ln = torch.tensor([len(t) for t in ts])
    logp = model(x.cuda()).transpose(0, 1)
    loss = ctc(logp, tg, torch.full((len(ts),), logp.shape[0], dtype=torch.long), ln)
    opt.zero_grad(); loss.backward(); nn.utils.clip_grad_norm_(model.parameters(), 5); opt.step(); sched.step()
    if step % EVAL_EVERY == 0 or step == STEPS:
        m = {"step": step, "loss": float(loss.detach()), "sirisha_train": exact(model, sir_val), "bapatla_val": exact(model, bap_val)}
        history.append(m); print(m, flush=True)
        if m["sirisha_train"] > best:
            best = m["sirisha_train"]; torch.save(model.state_dict(), OUT / "reader.pt")
    if step == STEPS:
        break

stats.update(history=history, best_sirisha_train=best)
(OUT / "realft_stats.json").write_text(json.dumps(stats, indent=2))
print("best sirisha-train exact:", best)
