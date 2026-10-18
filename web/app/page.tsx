import site from "@/data/site.json";
import { correct } from "@/lib/anpr";
import { partName, STATE_NAMES } from "@/lib/states";
import Pipeline from "./components/Pipeline";
import Rail from "./components/Rail";
import Scanner from "./components/Scanner";
import { Arrow, asset, Chars, pct } from "./components/ui";

const REPO = "https://github.com/DushyantRajpurohit/indian-anpr";
const [baseline, corrected] = site.baseline.rows;
const gain = (corrected.exact - baseline.exact) * 100;
const sample = correct("RJ1ACD1234")!;

const WHY: Record<string, string> = {
  RJ1ACD1234: "An A in a digit slot is a 4.",
  "8R0IAB1Z34": "Three look-alikes in one plate.",
  "IND MH12AB1234": "The HSRP strip's IND is dropped.",
  "22 8H 1234 A": "Bharat series: an 8 where B belongs.",
  GJ1KF1111: "Older Gujarat plate, kept as printed.",
};

export default function Home() {
  const a = site.audit;
  return (
    <div className="frame">
      <Rail />
      <main className="main">
        <div className="strip">
          <div><div className="legend muted">System</div><div className="v">indian-anpr</div></div>
          <div><div className="legend muted">Detector</div><div className="v">YOLO26n · fine-tuned</div></div>
          <div><div className="legend muted">Reader</div><div className="v">CRNN · 0.69M params</div></div>
          <div><div className="legend muted">Test set</div><div className="v">{a.test_images} images · {a.test_plates} plates</div></div>
          <div><div className="legend muted">Status</div><div className="v">models training</div></div>
          <a href={REPO} className="legend">Repo <Arrow /></a>
        </div>

        <section className="hero" id="record" aria-labelledby="h-hero">
          <div className="hero-copy">
            <h1 className="display" id="h-hero">Read the plate.<br />Prove it.</h1>
            <p className="dek">
              I built a number plate reader for Indian roads and measured every step: the traps in the data, the
              rules of the plate, a reader trained only on synthetic plates. It runs on your camera, inside this page.
              Nothing is uploaded.
            </p>
            <div className="hero-actions">
              <a className="btn primary" href="#live"><span>Open the live scanner</span><span className="tag"><Arrow /></span></a>
              <a className="link-legend" href="#pipeline">Read how it was built</a>
            </div>
            <div className="hero-facts">
              <div><div className="legend muted">Held out</div><p>{a.test_images} real test images of {a.test_plates} plates, split by plate number.</p></div>
              <div><div className="legend muted">Grammar alone</div><p>+{gain.toFixed(1)} points exact match on the old pipeline ({pct(baseline.exact)} to {pct(corrected.exact)}).</p></div>
              <div><div className="legend muted">Uploaded</div><p>Nothing. Detection and reading run on your device.</p></div>
            </div>
          </div>

          <div className="bench">
            <figure className="negative" style={{ margin: 0 }}>
              <img src={asset("/plates/hero-degraded.png")} alt="A synthetic Indian number plate, RJ 14 CD 1234, blurred and noisy like a camera crop" />
              <figcaption className="legend muted">Synthetic plate · rendered by anpr/synth.py</figcaption>
            </figure>
            <article className="record" aria-label="Read record for the sample plate">
              <h2>Read record · sample misread</h2>
              <table className="table">
                <thead><tr><th>Step</th><th>Stage</th><th>Output</th><th>Note</th></tr></thead>
                <tbody>
                  <tr><td className="qty">1</td><td>Detect</td><td className="legend">plate found</td><td className="muted">old detector: {pct(site.baseline.detection_recall)} of test plates</td></tr>
                  <tr><td className="qty">2</td><td>Crop</td><td><img className="thumb" src={asset("/plates/reader-input.png")} alt="The 32 by 160 grey strip the reader sees" /></td><td className="muted">32 × 160 greys</td></tr>
                  <tr><td className="qty">3</td><td>Read</td><td><Chars raw="RJ1ACD1234" strike={[3]} /></td><td className="muted">raw OCR</td></tr>
                  <tr className="key"><td className="qty">4</td><td>Correct</td><td className="fix-in"><Chars reading={sample} /></td><td className="mag">+{gain.toFixed(1)} pts on the test set</td></tr>
                  <tr className="held"><td className="qty">5</td><td>Vote</td><td><span className="held-back legend">held back</span></td><td>training</td></tr>
                </tbody>
              </table>
              <div className="parts">
                {sample.parts.map((p, i) => (
                  <div key={i}>
                    <div className="legend muted">{["State", "District", "Series", "Number"][i]}</div>
                    <div className="display">{p.split("").map((c, j) => <span key={j} className={sample.changed[i][j] ? "mag fix-in" : undefined}>{c}</span>)}</div>
                    <small>{partName(sample.parts, i) || "—"}</small>
                  </div>
                ))}
              </div>
              <p className="legend muted" style={{ margin: 0 }}>Magenta marks what the plate grammar changed. Nothing else is magenta.</p>
            </article>
          </div>
        </section>

        <Pipeline detectionRecall={site.baseline.detection_recall} gain={gain} sample={sample} />

        <section className="chapter" id="traps" aria-labelledby="h-traps">
          <div className="chapter-head">
            <h2 className="display" id="h-traps">Three traps in the data</h2>
            <p>Each of these would have handed me a better number than the model deserved. Crossed hatching marks a conflict: data that disagrees with itself.</p>
          </div>
          <div className="traps">
            <div className="trap">
              <div className="hatch"><span className="display">Leak</span></div>
              <div><div className="legend muted">Found</div><div className="big">{a.repeated_plates} plates, {a.images_with_repeated_plate} images</div><p>More than half the labelled images repeat a plate. {a.most_repeated[0]} appears {a.most_repeated[1]} times.</p></div>
              <div><div className="legend muted">Would have</div><p>A random split puts the same car in training and test, so the score measures memory, not reading.</p></div>
              <div><div className="legend muted">Fix</div><p>Split by plate number. {a.test_images} test images, {a.test_plates} plates, none seen in training.</p></div>
            </div>
            <div className="trap">
              <div className="hatch"><span className="display">Leak</span></div>
              <div><div className="legend muted">Found</div><div className="big">{a.roboflow_images.toLocaleString("en-IN")} ≈ {a.roboflow_copies_per_photo} × each photo</div><p>The 15k-image detection set is a Roboflow export: every photo appears about three times, augmented, across its own train, valid and test folders.</p></div>
              <div><div className="legend muted">Would have</div><p>That is how it advertises {a.roboflow_claimed_accuracy} detection accuracy: the test folder holds copies of training photos.</p></div>
              <div><div className="legend muted">Fix</div><p>Regroup by original photo before splitting, and drop any photo that near-duplicates an image in my test source.</p></div>
            </div>
            <div className="trap">
              <div className="hatch"><span className="display">Noise</span></div>
              <div><div className="legend muted">Found</div><div className="big">{a.bad_labels} bad labels</div><p>{a.bad_label_examples.slice(0, 3).join(", ")} are car names and notes, not plates. {a.bad_label_examples[3]} is a typo for RJ01AB1234.</p></div>
              <div><div className="legend muted">Would have</div><p>Scoring against a wrong label punishes a correct reading.</p></div>
              <div><div className="legend muted">Fix</div><p>The plate grammar flags them. They are left out of the test set and listed in the repo.</p></div>
            </div>
          </div>
        </section>

        <section className="chapter" id="grammar" aria-labelledby="h-grammar">
          <div className="chapter-head">
            <h2 className="display" id="h-grammar">The rules of an Indian plate</h2>
            <p>OCR confuses 0 with O and 8 with B. A plate's position tells you which one it must be. These rules run on every reading, in Python for evaluation and in this page for the live scanner, and give the same answer on 4,000 test strings.</p>
          </div>
          <div className="grammar-grid">
            <div>
              <ol className="rules">
                <li><strong>State or UT code</strong><span>One of {site.states.length} accepted codes, older ones included (OR, UA, TS).</span><span className="chars">RJ · MH · DL</span></li>
                <li><strong>District</strong><span>Two digits. One digit is normal in Delhi and on older plates printed without the leading zero; those cost a little more.</span><span className="chars">14 · 3</span></li>
                <li><strong>Series</strong><span>Zero to three letters. Three letters is mostly Delhi.</span><span className="chars">CD · CAB</span></li>
                <li><strong>Number</strong><span>One to four digits; four is normal.</span><span className="chars">1234</span></li>
                <li><strong>Bharat series</strong><span>Year, BH, four digits, one or two letters.</span><span className="chars">22 BH 1234 AA</span></li>
                <li><strong>Look-alikes</strong><span>A swap costs 1.5, an unusual shape up to 2. The cheapest valid reading wins, so a real plate is never rewritten into a likelier one.</span><span className="chars">0↔O 8↔B 4↔A</span></li>
              </ol>
              <div className="table-wrap" style={{ marginTop: 36 }}>
                <table className="table">
                  <thead><tr><th>Raw OCR</th><th>Read as</th><th>Why</th></tr></thead>
                  <tbody>
                    {site.corrector.map((c) => (
                      <tr key={c.raw}>
                        <td><Chars raw={c.raw} strike={c.changed} /></td>
                        <td><Chars reading={correct(c.raw)!} /></td>
                        <td className="muted">{WHY[c.raw]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="codes" aria-label="Accepted state and union territory codes">
              {site.states.map((s) => <span key={s} title={STATE_NAMES[s]}>{s}<small>{STATE_NAMES[s]}</small></span>)}
            </div>
          </div>
        </section>

        <section className="chapter" id="synthetic" aria-labelledby="h-synth">
          <div className="chapter-head">
            <h2 className="display" id="h-synth">Trained on plates that never existed</h2>
            <div className="prose">
              <p>The best labelled Indian set is licensed no-derivatives, so I can&apos;t ship a model trained on it. The reader trains on plates I generate instead: real state codes and formats; white, yellow, green and black schemes; one and two lines; the IND strip. Then I damage them: tilt, blur, glare bands, low resolution, JPEG.</p>
              <p>Real plates only ever test it. If it reads them, it learned what a plate is, not what one dataset looks like.</p>
            </div>
          </div>
          <figure className="contact" style={{ margin: 0 }}>
            <img src={asset("/plates/synthetic-grid.png")} alt="Twelve synthetic training plates in different colours, fonts, layouts and levels of damage" />
            <figcaption className="legend"><span>Contact sheet · 12 of the 3,072,000 training plates (12,000 steps × 256)</span><span>anpr/synth.py</span></figcaption>
          </figure>
        </section>

        <section className="chapter" id="results" aria-labelledby="h-results">
          <div className="chapter-head">
            <h2 className="display" id="h-results">Results</h2>
            <p>Exact match: the whole plate right, every character. Each row is one change, measured on the same {a.test_images} held-out images. Rows still training are held back, not estimated.</p>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Step</th><th>Configuration</th><th>Exact match</th><th>95% range</th><th>Character errors</th><th>Δ vs step 1</th><th>Zone</th></tr></thead>
              <tbody>
                {site.baseline.rows.map((r, i) => (
                  <tr key={r.name} className={i === 1 ? "key" : undefined}>
                    <td className="qty">{i + 1}</td>
                    <td>{r.name}</td>
                    <td className="qty">{pct(r.exact)}</td>
                    <td className="qty">{pct(r.ci[0])} – {pct(r.ci[1])}</td>
                    <td className="qty">{r.cer.toFixed(2)}</td>
                    <td className={`qty${i ? " mag" : ""}`}>{i ? `+${((r.exact - baseline.exact) * 100).toFixed(1)} pts` : "—"}</td>
                    <td><span className="zone-cell" style={{ background: `var(--z${Math.round(r.exact * 10)})` }} /></td>
                  </tr>
                ))}
                {site.pending.map((p, i) => (
                  <tr key={p} className="held">
                    <td className="qty">{site.baseline.rows.length + i + 1}</td>
                    <td>{p}</td>
                    <td colSpan={4}><span className="held-back legend">held back · training on Kaggle</span></td>
                    <td><span className="zone-cell" style={{ borderStyle: "dashed" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="prose" style={{ marginTop: 32 }}>
            <p className="muted">The test photos come from used-car listings, Google Images and video frames: mostly close-up and easier than live traffic, which is what the scanner below is for. I looked at test failures once, after the baseline; every tuning decision since then is checked on the training split. The old detector already finds {pct(site.baseline.detection_recall)} of test plates, so reading, not finding, is the problem to solve.</p>
          </div>
        </section>

        <section className="chapter" id="live" aria-labelledby="h-live">
          <div className="chapter-head">
            <h2 className="display" id="h-live">Live scanner</h2>
            <p>Point your camera at a plate, or open a photo. On a phone it uses the back camera. Every frame is read inside this tab; nothing is sent anywhere, and closing the tab forgets everything.</p>
          </div>
          <Scanner />
        </section>

        <section className="close" aria-label="Repository and credits">
          <div>
            <h2 className="display">All of it is in the repo</h2>
            <p className="prose">Training scripts, the grouped split, the corrector and its tests, the synthetic plate generator, and every number on this page in <span className="qty">reports/</span>.</p>
            <a className="btn primary" href={REPO}><span>Open the repo</span><span className="tag"><Arrow /></span></a>
          </div>
          <div className="prose">
            <div className="legend muted" style={{ marginBottom: 12 }}>Data and credits</div>
            <p>Test set: Indian vehicle license plate dataset, Sai Sirisha N et al. (Kaggle, CC BY-NC-ND). Used only for evaluation; none of its images appear here.</p>
            <p>Detector training: Indian Number Plate Annotation, sunrajbishnolia (Kaggle), regrouped by photo.</p>
            <p>Every plate image on this page is synthetic. Built by Dushyant Rajpurohit.</p>
          </div>
        </section>
        <footer className="credits legend muted">
          <span>indian-anpr · plate exposure record</span>
          <a href="https://github.com/DushyantRajpurohit">github.com/DushyantRajpurohit</a>
        </footer>
      </main>
    </div>
  );
}
