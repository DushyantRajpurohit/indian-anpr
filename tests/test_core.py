import pytest

from anpr import metrics, plate


@pytest.mark.parametrize("raw, want", [
    ("RJ14CD1234", "RJ 14 CD 1234"),      # already clean
    ("rj 14 cd 1234", "RJ 14 CD 1234"),   # spacing / case
    ("RJ1ACD1234", "RJ 14 CD 1234"),      # A in a digit slot -> 4
    ("RJ14C01234", "RJ 14 CO 1234"),      # 0 in a letter slot -> O
    ("8R0IAB1Z34", "BR 01 AB 1234"),      # several confusions at once
    ("DL3CAB1234", "DL 3 CAB 1234"),      # Delhi: one-digit district, 3-letter series
    ("MH12A5", "MH 12 A 5"),              # short number
    ("IND RJ14CD1234", "RJ 14 CD 1234"),  # HSRP 'IND' strip read as text
    ("22BH1234AA", "22 BH 1234 AA"),      # Bharat series
    ("22 8H 1234 A", "22 BH 1234 A"),
])
def test_correct_fixes_by_position(raw, want):
    assert plate.correct(raw) == want


@pytest.mark.parametrize("raw", ["XX14CD1234", "HELLO", "", "RJ14CD12345678"])
def test_correct_rejects_non_plates(raw):
    assert plate.correct(raw) is None


def test_score():
    s = metrics.score(["RJ 14 CD 1234", "RJ14CD1235", None], ["RJ14CD1234"] * 3)
    assert s["n"] == 3 and s["exact"] == pytest.approx(1 / 3)
    assert s["cer"] == pytest.approx((0 + 1 + 10) / 30)
    lo, hi = s["exact_ci"]
    assert lo < 1 / 3 < hi


def test_wilson_matches_textbook():
    # 140/200 = 70% -> about +/-6 points, the bound quoted in the README
    lo, hi = metrics.wilson(140, 200)
    assert round(lo, 3) == 0.633 and round(hi, 3) == 0.759


def test_read_lines_orders_two_line_plates():
    from anpr.evaluate import read_lines
    box = lambda x, y: [[x, y], [x + 40, y], [x + 40, y + 20], [x, y + 20]]
    # EasyOCR returns boxes in arbitrary order; bottom line first here.
    results = [(box(50, 40), "1234", 0.9), (box(60, 2), "14", 0.9), (box(0, 0), "RJ", 0.9), (box(0, 42), "CD", 0.9)]
    assert read_lines(results) == "RJ14CD1234"


def test_split_keeps_each_plate_on_one_side():
    from anpr import data
    # Same plate with different spacing/case must land together; ~25% go to test.
    assert data.split_of("RJ27TC0530") == data.split_of("rj 27 tc 0530")
    texts = [f"RJ14CD{i:04d}" for i in range(2000)]
    share = sum(data.split_of(t) == "test" for t in texts) / len(texts)
    assert 0.22 < share < 0.28


def test_is_valid_flags_bad_labels():
    from anpr import data
    assert data.is_valid("RJ01AB1234")
    assert not data.is_valid("RJD1AB1234")  # typo the corrector would have to change
    assert not data.is_valid("CRETA")
