# indian-anpr

Reads Indian number plates, measured end to end, and runs live in the browser on your own camera.

- a **YOLO26n plate detector** fine-tuned on Indian photos;
- a **0.69M-parameter CRNN reader trained only on synthetic plates** (it never sees a real plate in training);
- a **plate-rules corrector** that fixes OCR look-alikes by where each character sits on an Indian plate;
- a **static website** (Next.js, GitHub Pages) where the whole pipeline runs in the browser with onnxruntime-web. Nothing is uploaded.

## Results

Exact match = the whole plate right, every character. Test set: 431 held-out photos of 261 plates from the
[Indian vehicle license plate dataset](https://www.kaggle.com/datasets/saisirishan/indian-vehicle-dataset) (Sai Sirisha N et al.),
split **by plate number** so no car appears in both training and test. 95% Wilson intervals.

| Configuration | Exact match | 95% range | Char. error rate |
|---|---|---|---|
| Old generic detector + EasyOCR | 18.8% | 15.4 – 22.8% | 0.36 |
| + plate rules | 30.6% | 26.5 – 35.1% | 0.32 |
| Fine-tuned detector + EasyOCR + rules | 27.6% | 23.6 – 32.0% | 0.32 |
| **Fine-tuned detector + synthetic-trained reader** | **45.5%** | 40.8 – 50.2% | **0.18** |
| + plate rules | 45.9% | 41.3 – 50.7% | 0.18 |

- **Detector:** finds 98.8% of test plates, up from 96.3% for the generic model (IoU ≥ 0.5).
- **Multi-frame voting** on the dataset's video frames (23 cars, 136 frames): 39.7% per frame, 39.1% voted. No gain. Consecutive frames make the same mistake, so they agree on it.
- **The plate rules matter most for a weak reader:** +11.8 points on EasyOCR, +0.5 on my reader. A reader trained on plates that always follow the format seems to learn most of the format itself.

## What I found along the way

1. **More than half the labelled images repeat a plate.** 219 plate numbers cover 932 images, and one car appears 41 times. A random split would score memory, so the split is by plate number (`anpr/data.py`).
2. **The 15k-image detection set is about 5,100 photos, each shown as ~3 Roboflow augmented copies**, spread across its own train, valid and test folders. That leak explains its advertised 99%. I regrouped by original photo before splitting (`kaggle/detector/train_detector.py`).
3. **74 labels are not plates** (`CRETA`, `TERRANO`, `blur`, typos like `RJD1AB1234`). The plate rules flag them, and they are left out of the test set.
4. **Synthetic v1 was too easy.** On real plates it scored 43% exact, against near-zero synthetic loss. Looking at real *training-split* crops showed what was missing: very condensed lettering, dot or dash separators, crops clipped at the first character, bolts, logos and grime. Synthetic v2 adds them, which raised training-split exact match from 43% to 55%.

## Honest notes

- The test photos are mostly close-ups (used-car listings, Google Images, video frames). They are easier than live traffic.
- I looked at test-set failures once, after the baseline. Every decision since (synthetic v2, the state-code look-alike rule, choosing reader v2) was made on the training split, and each configuration above was run on the test set once.
- My near-duplicate filter between the detection set and the test source was too aggressive. It dropped 3,054 photo groups, but a manual check of 29 random photos found none were real copies. It cost training data; it cannot inflate the test score.
- The test dataset is CC BY-NC-ND. It is used for evaluation only: no images or labels are redistributed here, and the shipped reader is trained only on synthetic data.

## Repo

| Path | What |
|---|---|
| `anpr/plate.py` | Plate rules: state codes, Delhi one-digit districts, BH series, look-alike swaps with a cost per edit and per unusual shape |
| `anpr/synth.py` | Synthetic plate renderer (v2) |
| `anpr/reader.py` | CRNN, preprocessing (two-line plates split side by side), CTC decoding |
| `anpr/data.py` | Dataset loader, label check, grouped train/test split |
| `anpr/evaluate.py`, `anpr/metrics.py`, `anpr/vote.py` | Evaluation: exact match with Wilson intervals, character error rate, voting |
| `kaggle/detector`, `kaggle/reader` | GPU training jobs, pushed with `kaggle kernels push -p kaggle/<job>` |
| `tools/site_assets.py` | Writes `web/data/site.json` and the site's synthetic images from `reports/` |
| `web/` | The site; `web/lib/anpr.ts` is the browser port of the pipeline, checked against Python on 4,000 strings |

```bash
python -m pytest -q                                   # pipeline tests
python -m anpr.evaluate --detector models/plate_det.pt --reader models/reader_v2.pt --out reports/final.json
python -m anpr.vote reports/final.json
cd web && node lib/anpr.test.ts && npm run build      # browser parity tests, static site in web/out
```

Built by Dushyant Rajpurohit.
