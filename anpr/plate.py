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


def _templates(n):
    """Yield (kinds, lengths, penalty) splits of an n-char string. Penalty prefers common shapes."""
    for d in (2, 1):
        for s in (2, 1, 3, 0):
            num = n - 2 - d - s
            if 1 <= num <= 4:
                # ponytail: hand-picked priors; fit from label frequencies once the test set exists
                yield "A9A9", (2, d, s, num), (d != 2) + (s != 2) * 0.5 + (num != 4)
    for s in (2, 1):
        if n == 8 + s:
            yield "9A9A", (2, 2, 4, s), 0


def correct(raw):
    """Best grammatical reading of an OCR string, spaced like 'RJ 14 CD 1234', or None."""
    text = re.sub(r"[^A-Z0-9]", "", raw.upper())
    best = None
    for t in {text, text.removeprefix("IND")}:
        for kinds, lens, penalty in _templates(len(t)):
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
                if (parts[1] != "BH") if bh else (parts[0] not in STATES):
                    continue
                score = (edits + penalty, edits)
                if best is None or score < best[0]:
                    best = (score, " ".join(p for p in parts if p))
    return best and best[1]
