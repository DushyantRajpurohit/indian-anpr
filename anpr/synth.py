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


def _line(text, font, stroke, squeeze):
    """Text as an 8-bit mask, squeezed horizontally (real plate lettering is often very condensed)."""
    b = font.getbbox(text, stroke_width=stroke)
    m = Image.new("L", (b[2] - b[0] + 2, b[3] - b[1] + 2), 0)
    ImageDraw.Draw(m).text((1 - b[0], 1 - b[1]), text, fill=255, font=font, stroke_width=stroke, stroke_fill=255)
    return m.resize((max(1, int(m.width * squeeze)), m.height), Image.BILINEAR)


def render(rng):
    """(BGR image, label without spaces, two_line) for one synthetic plate.

    v2, from looking at real training-split crops: text fills most of the plate height, lettering is
    often very condensed, groups are split by dots or dashes, crops clip at the first character, and
    plates carry bolts, brand logos and grime.
    """
    parts = random_text(rng)
    two = rng.random() < 0.3
    sep = rng.choice(("  ", " ", " ", "", ".", "-", " - "))
    lines = [sep.join(parts[:2]), sep.join(parts[2:])] if two else [sep.join(parts)]
    if two and rng.random() < 0.4 and len(parts) == 4:  # 'RJ 14 CD' over '1234'
        lines = [sep.join(parts[:3]), parts[3]]
    bg, fg = rng.choice(SCHEMES)
    fade = rng.uniform(0, 0.35)  # weathered paint drifts toward grey
    bg = tuple(int(c * (1 - fade) + 150 * fade) for c in bg)
    font = ImageFont.truetype(str(rng.choice(FONTS)), 48)
    masks = [_line(t, font, rng.choice((0, 0, 0, 1, 2)), rng.uniform(0.7, 1.15)) for t in lines]
    tw, lh = max(m.width for m in masks), max(m.height for m in masks)
    gap = int(lh * rng.uniform(0.1, 0.3))
    block = lh * len(masks) + gap * (len(masks) - 1)
    H = int(block / rng.uniform(0.5, 0.85))
    decor = rng.random()
    left = int(H * 0.28) if decor < 0.5 else int(H * 0.7) if decor < 0.62 else 0  # IND strip / brand logo
    margin = int(H * rng.uniform(0.04, 0.25))
    W = left + tw + 2 * margin
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    if rng.random() < 0.7:
        d.rectangle([1, 1, W - 2, H - 2], outline=fg, width=rng.randint(1, 3))
    if decor < 0.5:
        d.rectangle([3, 3, left - 2, H - 4], fill=(25, 60, 160))
        d.text((4, H - H // 4), "IND", fill=(240, 240, 240), font=ImageFont.truetype(str(FONTS[0]), max(6, H // 8)))
    elif decor < 0.62:
        c = tuple(rng.randint(0, 120) for _ in range(3))
        d.ellipse([int(H * 0.1), int(H * 0.15), int(H * 0.6), int(H * 0.85)], fill=c)
    if rng.random() < 0.5:  # bolts
        r = max(2, H // 14)
        for x in (W * rng.uniform(0.2, 0.35), W * rng.uniform(0.65, 0.8)):
            for y in ((H * 0.1,) if rng.random() < 0.5 else (H * 0.1, H * 0.9)):
                d.ellipse([x - r, y - r, x + r, y + r], fill=(90, 90, 90))
    y = (H - block) // 2
    for m in masks:
        im.paste(Image.new("RGB", m.size, fg), (left + margin + (tw - m.width) // 2, y), m)
        y += lh + gap
    if rng.random() < 0.3:  # grime
        g = Image.new("L", (W, H), 0)
        gd = ImageDraw.Draw(g)
        for _ in range(rng.randint(2, 8)):
            x, y0, r = rng.randint(0, W), rng.randint(0, H), rng.randint(H // 10, H // 2)
            gd.ellipse([x - r, y0 - r, x + r, y0 + r], fill=rng.randint(20, 90))
        im.paste(Image.new("RGB", (W, H), (60, 50, 40)), (0, 0), g)
    return degrade(np.array(im)[:, :, ::-1].copy(), rng), "".join(parts), two


def degrade(img, rng):
    """Camera damage: perspective, loose or clipped crop, blur, low resolution, light, noise, JPEG."""
    h, w = img.shape[:2]
    j = lambda s: rng.uniform(-s, s)
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[j(.06) * w, j(.12) * h], [w + j(.06) * w, j(.12) * h],
                      [w + j(.06) * w, h + j(.12) * h], [j(.06) * w, h + j(.12) * h]])
    # Negative padding clips the plate edge, as tight detector boxes do on real crops.
    px, py = int(rng.uniform(-0.03, 0.10) * w), int(rng.uniform(-0.06, 0.25) * h)
    bg = tuple(int(c) for c in rng.choice(((30, 30, 30), (120, 120, 120), (200, 200, 200))))
    img = cv2.warpPerspective(img, cv2.getPerspectiveTransform(src, dst + np.float32([px, py])),
                              (max(8, w + 2 * px), max(8, h + 2 * py)), borderValue=bg)
    scale = rng.uniform(0.25, 1.0)  # real crops are often 60-150 px wide
    small = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    img = cv2.resize(small, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LINEAR)
    if rng.random() < 0.5:
        k = rng.choice((3, 5))
        img = cv2.GaussianBlur(img, (k, k), 0) if rng.random() < 0.6 else cv2.blur(img, (k, 1))  # motion
    img = img.astype(np.float32) * rng.uniform(0.4, 1.3) + rng.uniform(-40, 40)
    if rng.random() < 0.3:  # shadow or glare band
        x = rng.randint(0, img.shape[1])
        img[:, x:x + rng.randint(6, max(7, img.shape[1] // 2))] *= rng.uniform(0.4, 1.6)
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
