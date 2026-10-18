"""Sai Sirisha N et al. 'Indian vehicle license plate dataset' (Kaggle, CC BY-NC-ND): plate text is the VOC object name."""
import hashlib
import re
from pathlib import Path

from anpr import plate

ROOT = Path("data/sirisha")


def clean(text):
    return re.sub(r"[^A-Z0-9]", "", text.upper())


def is_valid(text):
    """Label already fits the plate grammar; the rest are typos, car names, trade/temporary plates."""
    fixed = plate.correct(text)
    return fixed is not None and clean(fixed) == clean(text)


def split_of(text):
    """'test' for ~25% of plate numbers, chosen by hash, so a repeated car never straddles the split."""
    return "test" if int(hashlib.md5(clean(text).encode()).hexdigest(), 16) % 4 == 0 else "train"


def load(root=ROOT):
    """Yield dicts: image, source, box (xyxy), text, valid, split."""
    for xml in sorted(Path(root).rglob("*.xml")):
        s = xml.read_text(encoding="utf-8", errors="replace")
        image = next((p for p in xml.parent.glob(xml.stem + ".*") if p.suffix.lower() != ".xml"), None)
        o = re.search(r"<object>\s*<name>(.*?)</name>.*?<bndbox>(.*?)</bndbox>", s, re.S)
        if image is None or o is None:
            continue
        box = [float(re.search(f"<{k}>(.*?)</{k}>", o.group(2)).group(1)) for k in ("xmin", "ymin", "xmax", "ymax")]
        text = o.group(1).strip()
        yield dict(image=image, source=xml.relative_to(root).parts[0], box=box, text=text,
                   valid=is_valid(text), split=split_of(text))
