"""Small CRNN plate reader (CTC). Same prep for training, evaluation and the browser export."""
import cv2
import numpy as np
import torch
from torch import nn

CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"  # CTC blank is index 0
H, W = 32, 160
TWO_LINE_ASPECT = 0.45  # h/w; single-line Indian plates are ~0.2, two-line ~0.6


def prep(bgr):
    """Plate crop -> 1x32x160 float array. Two-line plates are split and laid side by side."""
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY) if bgr.ndim == 3 else bgr
    h, w = g.shape
    if h / w > TWO_LINE_ASPECT:
        top, bottom = g[: h // 2], g[h // 2:]
        g = np.hstack([cv2.resize(top, (w, H)), cv2.resize(bottom, (w, H))])
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    return ((g - g.mean()) / (g.std() + 1e-6))[None]  # per-crop contrast normalisation


class CRNN(nn.Module):
    def __init__(self, n=len(CHARS) + 1):
        super().__init__()
        c = lambda i, o: [nn.Conv2d(i, o, 3, padding=1), nn.BatchNorm2d(o), nn.ReLU(inplace=True)]
        self.cnn = nn.Sequential(
            *c(1, 32), nn.MaxPool2d(2),                 # 16x80
            *c(32, 64), nn.MaxPool2d(2),                # 8x40
            *c(64, 128), *c(128, 128), nn.MaxPool2d((2, 1)),  # 4x40
            *c(128, 192), nn.MaxPool2d((4, 1)),         # 1x40
        )
        self.rnn = nn.LSTM(192, 96, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(192, n)

    def forward(self, x):  # (B,1,32,160) -> (B,40,n) log-probs
        f = self.cnn(x).squeeze(2).transpose(1, 2)
        return self.fc(self.rnn(f)[0]).log_softmax(-1)


def decode(logp):
    """Greedy CTC: collapse repeats, drop blanks. logp: (T, n) array."""
    best = np.asarray(logp).argmax(-1)
    return "".join(CHARS[i - 1] for k, i in enumerate(best) if i and (k == 0 or i != best[k - 1]))


def encode(text):
    return [CHARS.index(c) + 1 for c in text]
