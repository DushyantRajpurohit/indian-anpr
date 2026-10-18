"""Train the CRNN plate reader on synthetic plates only (Kaggle GPU). Pushed with: kaggle kernels push -p kaggle/reader

Real Sirisha *train* crops are used only to pick the checkpoint; the test split is never touched here.
"""
import json
import random
import shutil
import sys
from pathlib import Path

IN, OUT = Path("/kaggle/input"), Path("/kaggle/working")
code = next(IN.rglob("synth.py")).parent.parent
sys.path.insert(0, str(code))
shutil.copytree(code / "fonts", OUT / "data/fonts", dirs_exist_ok=True)  # synth looks in ./data/fonts

import cv2
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, IterableDataset

from anpr import data, plate, reader, synth

STEPS, BATCH, EVAL_EVERY = 16000, 256, 1000


class Synthetic(IterableDataset):
    def __iter__(self):
        info = torch.utils.data.get_worker_info()
        rng = random.Random(info.id if info else 0)
        while True:
            img, text, _ = synth.render(rng)
            yield torch.from_numpy(reader.prep(img)), text


def collate(batch):
    xs, texts = zip(*batch)
    return torch.stack(xs), texts


def real_val():
    root = next(IN.rglob("State-wise_OLX")).parent
    out = []
    for r in data.load(root):
        if r["split"] == "train" and r["valid"]:
            img = cv2.imread(str(r["image"]))
            x1, y1, x2, y2 = map(int, r["box"])
            if img is not None and x2 > x1 and y2 > y1:
                out.append((reader.prep(img[y1:y2, x1:x2]), data.clean(r["text"])))
    return out


@torch.no_grad()
def evaluate(model, val):
    model.eval()
    x = torch.from_numpy(np.stack([v[0] for v in val])).cuda()
    logp = torch.cat([model(x[i:i + 512]) for i in range(0, len(x), 512)]).cpu().numpy()
    raw = [reader.decode(l) for l in logp]
    fixed = [data.clean(plate.correct(r) or "") for r in raw]
    truth = [v[1] for v in val]
    model.train()
    return {"raw": float(np.mean([a == b for a, b in zip(raw, truth)])),
            "corrected": float(np.mean([a == b for a, b in zip(fixed, truth)]))}


val = real_val()
print("real val crops", len(val))
model = reader.CRNN().cuda()
opt = torch.optim.AdamW(model.parameters(), 2e-3, weight_decay=1e-4)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, 2e-3, total_steps=STEPS, pct_start=0.05)
ctc = nn.CTCLoss(blank=0, zero_infinity=True)
loader = DataLoader(Synthetic(), batch_size=BATCH, num_workers=4, collate_fn=collate, persistent_workers=True)

history, best = [], -1.0
for step, (x, texts) in enumerate(loader, 1):
    targets = torch.tensor([i for t in texts for i in reader.encode(t)])
    lengths = torch.tensor([len(t) for t in texts])
    logp = model(x.cuda()).transpose(0, 1)  # (T,B,C) for CTCLoss
    loss = ctc(logp, targets, torch.full((len(texts),), logp.shape[0], dtype=torch.long), lengths)
    opt.zero_grad()
    loss.backward()
    nn.utils.clip_grad_norm_(model.parameters(), 5)
    opt.step()
    sched.step()
    if step % EVAL_EVERY == 0 or step == STEPS:
        m = {"step": step, "loss": float(loss), **evaluate(model, val)}
        history.append(m)
        print(m, flush=True)
        if m["corrected"] > best:
            best = m["corrected"]
            torch.save(model.state_dict(), OUT / "reader.pt")
    if step == STEPS:
        break

(OUT / "reader_history.json").write_text(json.dumps(history, indent=2))
print("best real-val exact (corrected):", best)
