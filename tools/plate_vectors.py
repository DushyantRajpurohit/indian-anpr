"""Write web/lib/plate-vectors.json: OCR-like strings and the Python corrector's answer, for the TS parity test."""
import json
import random

from anpr import plate, synth

rng = random.Random(0)
noise = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
swap = {**plate.TO_LETTER, **plate.TO_DIGIT}
out = []
for _ in range(4000):
    t = list("".join(synth.random_text(rng)))
    for _ in range(rng.choice((0, 1, 1, 2, 3))):
        i, op = rng.randrange(len(t)), rng.random()
        if op < 0.6 and t[i] in swap:
            t[i] = swap[t[i]]
        elif op < 0.8:
            t[i] = rng.choice(noise)
        elif op < 0.9:
            t.insert(i, rng.choice(noise))
        elif len(t) > 4:
            del t[i]
    s = "".join(t)
    if rng.random() < 0.05:
        s = "IND" + s
    out.append([s, plate.correct(s)])
json.dump(out, open("web/lib/plate-vectors.json", "w"))
print(len(out), sum(v is None for _, v in out), "rejected")
