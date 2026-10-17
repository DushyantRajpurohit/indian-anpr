import math


def _norm(s):
    return "".join(c for c in (s or "").upper() if c.isalnum())


def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def wilson(k, n, z=1.96):
    """95% interval for a rate k/n; honest error bars on a ~200-plate test set."""
    if n == 0:
        return 0.0, 0.0
    p = k / n
    mid = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return mid - half, mid + half


def score(preds, truths):
    """Exact-match rate (with CI) and character error rate, ignoring spaces and case."""
    pairs = [(_norm(p), _norm(t)) for p, t in zip(preds, truths, strict=True)]
    exact = sum(p == t for p, t in pairs)
    chars = sum(len(t) for _, t in pairs)
    return {
        "n": len(pairs),
        "exact": exact / len(pairs),
        "exact_ci": wilson(exact, len(pairs)),
        "cer": sum(edit_distance(p, t) for p, t in pairs) / chars,
    }
