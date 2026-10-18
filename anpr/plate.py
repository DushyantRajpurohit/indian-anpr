"""Indian plate grammar: fix OCR confusions by where each character sits.

Standard: RJ 14 CD 1234 (state, district, 0-3 series letters, 1-4 digits).
Bharat series: 22 BH 1234 AA (year, BH, 4 digits, 1-2 letters).
"""
import re

STATES = set(
    "AN AP AR AS BR CG CH CT DD DL DN GA GJ HP HR JH JK KA KL LA LD MH ML MN MP MZ "
    "NL OD OR PB PY RJ SK TG TN TR TS UA UK UP WB".split()
)
TO_LETTER = dict(zip("01245678", "OIZASGTB"))
TO_DIGIT = dict(zip("ODQIJLZSBGTA", "000111258674"))
# Letters OCR confuses with each other. Only the state slot can use these: it is the one letter
# slot with a closed list of valid values, so a swap there can be checked.
STATE_LOOKALIKES = {"M": "WHNRK", "W": "MN", "H": "MRN", "R": "MH", "N": "MHW", "K": "M"}
STATE_SWAP_COST = 2.0


def _fit(chunk, kind):
    """Coerce chunk to all-letters ('A') or all-digits ('9'); return (text, edits) or None."""
    out, edits = [], 0
    for c in chunk:
        ok = c.isalpha() if kind == "A" else c.isdigit()
        if not ok:
            c = (TO_LETTER if kind == "A" else TO_DIGIT).get(c)
            if c is None:
                return None
            edits += 1
        out.append(c)
    return "".join(out), edits


EDIT_COST = 1.5


def _templates(n):
    """Yield (kinds, lengths) splits of an n-char string."""
    for d in (2, 1):
        for s in (2, 1, 3, 0):
            if 1 <= n - 2 - d - s <= 4:
                yield "A9A9", (2, d, s, n - 2 - d - s)
    for s in (2, 1):
        if n == 8 + s:
            yield "9A9A", (2, 2, 4, s)


def _shape_cost(parts):
    """How unusual a grammatical plate is. Delhi alone routinely has 1-digit districts and 3-letter series."""
    if parts[1] == "BH":
        return 0
    state, district, series, number = parts
    dl = state == "DL"
    # ponytail: hand-set from known plate styles; fit to label frequencies if the training labels grow
    return ((len(district) == 1) * (0.5 if dl else 1.5)
            + {2: 0, 1: 0.5, 0: 1.5}.get(len(series), 0.5 if dl else 2)
            + (len(number) != 4))


def _fix_state(code):
    """Nearest real state code by one look-alike letter swap: (code, cost) or (None, 0)."""
    for i in (0, 1):
        for c in STATE_LOOKALIKES.get(code[i], ""):
            fixed = code[:i] + c + code[i + 1:]
            if fixed in STATES:
                return fixed, STATE_SWAP_COST
    return None, 0


def correct(raw):
    """Best grammatical reading of an OCR string, spaced like 'RJ 14 CD 1234', or None."""
    text = re.sub(r"[^A-Z0-9]", "", raw.upper())
    best = None
    for t in {text, text.removeprefix("IND")}:
        for kinds, lens in _templates(len(t)):
            parts, edits, i = [], 0, 0
            for kind, n in zip(kinds, lens):
                fit = _fit(t[i:i + n], kind)
                if fit is None:
                    break
                parts.append(fit[0])
                edits += fit[1]
                i += n
            else:
                bh = kinds == "9A9A"
                extra = 0
                if not bh and parts[0] not in STATES:
                    parts[0], extra = _fix_state(parts[0])
                if (parts[1] != "BH") if bh else parts[0] is None:
                    continue
                score = (edits * EDIT_COST + extra + _shape_cost(parts), edits)
                if best is None or score < best[0]:
                    best = (score, " ".join(p for p in parts if p))
    return best and best[1]
