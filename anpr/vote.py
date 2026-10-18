"""Does voting across frames beat single frames? python -m anpr.vote reports/<eval rows>.json

Uses the video-frame images (several frames of one car) from an evaluate.py run: each car's frames vote
with the browser tracker's rule (most common grammatical reading), against reading frames one by one.
"""
import collections
import json
import sys

from anpr import data, metrics


def vote(readings):
    """Most common grammatical reading; falls back to the most common raw one."""
    valid = [r for r in readings if r["corrected"]]
    pool = [data.clean(r["corrected"]) for r in valid] or [data.clean(r["raw"]) for r in readings]
    return collections.Counter(pool).most_common(1)[0][0]


def main(path):
    rows = [r for r in json.loads(open(path).read())["rows"] if r["source"] == "video_images"]
    cars = collections.defaultdict(list)
    for r in rows:
        cars[data.clean(r["truth"])].append(r)
    multi = {t: rs for t, rs in cars.items() if len(rs) >= 2}  # voting needs at least two frames
    single = [data.clean(r["corrected"] or r["raw"]) == t for t, rs in multi.items() for r in rs]
    voted = [vote(rs) == t for t, rs in multi.items()]
    out = {
        "cars": len(multi), "frames": len(single),
        "single_frame_exact": sum(single) / len(single), "single_frame_ci": metrics.wilson(sum(single), len(single)),
        "voted_exact": sum(voted) / len(voted), "voted_ci": metrics.wilson(sum(voted), len(voted)),
    }
    print(json.dumps(out, indent=2))
    return out


if __name__ == "__main__":
    main(sys.argv[1])
