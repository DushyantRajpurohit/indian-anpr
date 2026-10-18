"""Render synthetic Indian plates with exact labels, so the reader trains on data we are free to ship."""
import random
import string
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from anpr import plate

FONTS = sorted(Path("data/fonts").glob("*.ttf"))
# RGB (background, text): private, commercial, EV private, EV commercial, self-drive rental
YELLOW, GREEN = (245, 200, 30), (30, 130, 60)
SCHEMES = [((235, 235, 235), (15, 15, 15))] * 6 + [(YELLOW, (15, 15, 15))] * 2 + [
    (GREEN, (240, 240, 240)), (GREEN, YELLOW), ((20, 20, 20), YELLOW)]
STATES = sorted(plate.STATES)
L = string.ascii_uppercase


def random_text(rng):
    """Plate parts that satisfy the grammar, e.g. ['RJ', '14', 'CD', '1234']."""
    if rng.random() < 0.05:
        return [f"{rng.randint(21, 30)}", "BH", f"{rng.randint(0, 9999):04d}", "".join(rng.choices(L, k=rng.choice((1, 2))))]
    state = "DL" if rng.random() < 0.08 else rng.choice(STATES)
    dl = state == "DL"
    district = str(rng.randint(1, 13)) if rng.random() < (0.6 if dl else 0.05) else f"{rng.randint(1, 99):02d}"
    series = "".join(rng.choices(L, k=rng.choices((0, 1, 2, 3), (2, 25, 70, 30 if dl else 0))[0]))
    number = f"{rng.randint(1, 9999):04d}" if rng.random() < 0.9 else str(rng.randint(1, 999))
    return [p for p in (state, district, series, number) if p]


def render(rng):
    """(BGR image, label without spaces, two_line) for one synthetic plate."""
    parts = random_text(rng)
    two = rng.random() < 0.3
    lines = [" ".join(parts[:2]), " ".join(parts[2:])] if two else [" ".join(parts)]
    if two and rng.random() < 0.4 and len(parts) == 4:  # 'RJ 14 CD' over '1234'
        lines = [" ".join(parts[:3]), parts[3]]
    bg, fg = rng.choice(SCHEMES)
    font = ImageFont.truetype(str(rng.choice(FONTS)), 36)

    sizes = [font.getbbox(t) for t in lines]
    tw, lh = max(b[2] - b[0] for b in sizes), max(b[3] - b[1] for b in sizes)
    strip = 17 if rng.random() < 0.6 else 0  # HSRP blue 'IND' strip
    W, H = tw + strip + 22, lh * len(lines) + 10 * len(lines) + 10
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, W - 3, H - 3], outline=fg, width=2)
    if strip:
        d.rectangle([4, 4, 4 + strip - 4, H - 5], fill=(25, 60, 160))
        d.text((5, H - 13), "IND", fill=(240, 240, 240), font=ImageFont.truetype(str(FONTS[0]), 7))
    y = 6
    for t, b in zip(lines, sizes):
        d.text((strip + 11 + (tw - (b[2] - b[0])) // 2 - b[0], y - b[1]), t, fill=fg, font=font)
        y += lh + 10
    return degrade(np.array(im)[:, :, ::-1].copy(), rng), "".join(parts), two


def degrade(img, rng):
    """Camera damage: perspective, crop jitter, blur, low resolution, light, noise, JPEG."""
    h, w = img.shape[:2]
    j = lambda s: rng.uniform(-s, s)
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[j(.06) * w, j(.12) * h], [w + j(.06) * w, j(.12) * h],
                      [w + j(.06) * w, h + j(.12) * h], [j(.06) * w, h + j(.12) * h]])
    pad = rng.randint(0, 22)
    bg = tuple(int(c) for c in rng.choice(((30, 30, 30), (120, 120, 120), (200, 200, 200))))
    img = cv2.warpPerspective(img, cv2.getPerspectiveTransform(src, dst + pad), (w + 2 * pad, h + 2 * pad),
                              borderValue=bg)
    scale = rng.uniform(0.3, 1.0)  # real crops are often 60-150 px wide
    small = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    img = cv2.resize(small, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LINEAR)
    if rng.random() < 0.5:
        k = rng.choice((3, 5))
        img = cv2.GaussianBlur(img, (k, k), 0) if rng.random() < 0.6 else cv2.blur(img, (k, 1))  # motion
    img = img.astype(np.float32) * rng.uniform(0.4, 1.3) + rng.uniform(-40, 40)
    if rng.random() < 0.3:  # shadow or glare band
        x = rng.randint(0, img.shape[1])
        img[:, x:x + rng.randint(6, img.shape[1] // 2)] *= rng.uniform(0.4, 1.6)
    img += np.random.default_rng(rng.randint(0, 2**31)).normal(0, rng.uniform(0, 12), img.shape)
    img = np.clip(img, 0, 255).astype(np.uint8)
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, rng.randint(20, 90)])
    return cv2.imdecode(buf, cv2.IMREAD_COLOR)


if __name__ == "__main__":
    rng = random.Random(0)
    tiles = []
    for _ in range(24):
        img, text, two = render(rng)
        assert plate.correct(text) and plate.correct(text).replace(" ", "") == text, text
        t = cv2.resize(img, (240, 110 if two else 60))
        tiles.append(cv2.copyMakeBorder(t, 0, 110 - t.shape[0] + 18, 4, 4, cv2.BORDER_CONSTANT, value=(255, 255, 255)))
        cv2.putText(tiles[-1], text, (6, 124), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 200), 1)
    rows = [np.hstack(tiles[i:i + 4]) for i in range(0, 24, 4)]
    Path("reports").mkdir(exist_ok=True)
    cv2.imwrite("reports/synth_preview.jpg", np.vstack(rows))
    print("wrote reports/synth_preview.jpg")
