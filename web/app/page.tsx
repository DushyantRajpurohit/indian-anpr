import site from "@/data/site.json";
import { correct } from "@/lib/anpr";
import { STATE_NAMES } from "@/lib/states";
import Booth from "./components/Booth";
import Journey from "./components/Journey";
import Lane from "./components/Lane";
import Scanner from "./components/Scanner";
import { Arrow, asset, pct, Signal } from "./components/ui";

const REPO = "https://github.com/DushyantRajpurohit/indian-anpr";
const [baseline, corrected] = site.baseline.rows;
const gain = (corrected.exact - baseline.exact) * 100;
const sample = correct("RJ1ACD1234")!;
const LANES = [["#pipeline", "How it reads"], ["#traps", "Closed lanes"], ["#rules", "Plate rules"], ["#results", "Receipt"], ["#live", "Your lane"]] as const;
const SYNTH = Array.from({ length: 32 }, (_, i) => asset(`/plates/synth/${String(i).padStart(2, "0")}.jpg`));

export default function Home() {
  const a = site.audit;
  return (
    <main>
      <header className="canopy">
        <div className="canopy-top">
          <a className="plaza-name" href="#top">Indian ANPR <span>toll plaza</span></a>
          <nav className="lane-nav" aria-label="Chapters">
            {LANES.map(([href, label], i) => (
              <a key={href} href={href}><span className="lane-no">{String(i + 1).padStart(2, "0")}</span><Signal go={href !== "#traps"} label="" />{label}</a>
            ))}
          </nav>
          <a className="repo-link" href={REPO}>Repo <Arrow /></a>
        </div>
        <div className="canopy-fascia" id="top">
          <h1 className="fascia-head">Every plate, read at the barrier.</h1>
          <div className="fascia-side">
            <p className="dek">I built a number plate reader for Indian roads, measured every step, and put it in this page. It runs on your camera; nothing is uploaded.</p>
            <a className="btn go big" href="#live"><Signal go label="" /><span>Open your lane</span></a>
          </div>
        </div>
        <div className="hazard" aria-hidden="true" />
      </header>

      <Lane gain={gain} />

      <Journey sample={sample} s={{
        detectionRecall: site.baseline.detection_recall, finetunedRecall: site.baseline.finetuned_recall, detectConf: site.detect.conf,
        baselineExact: baseline.exact, correctedExact: corrected.exact, validLabels: a.labelled_images - a.bad_labels, parityStrings: 4000,
        easyocrExact: site.baseline.rows[2].exact, readerExact: site.baseline.rows[3].exact, vote: site.baseline.vote,
      }} />

      <section className="chapter concrete" id="traps" aria-labelledby="h-traps">
        <h2 className="sign-title" id="h-traps">Three lanes I had to close</h2>
        <p className="lede">Each of these would have handed me a better number than the model deserved.</p>
        <div className="closed-lanes">
          {[
            ["Repeated cars", `${a.repeated_plates} plates appear in ${a.images_with_repeated_plate} images; ${a.most_repeated[0]} appears ${a.most_repeated[1]} times.`,
              "A random split puts the same car in training and test, so the score measures memory, not reading.",
              `Split by plate number: ${a.test_images} test images, ${a.test_plates} plates, none seen in training.`],
            ["Augmented copies", `The ${a.roboflow_images.toLocaleString("en-IN")}-image detection set is about ${a.roboflow_copies_per_photo} augmented copies of each photo, spread across its own train and test folders.`,
              `That is how it can advertise ${a.roboflow_claimed_accuracy} accuracy: its test folder holds copies of training photos.`,
              "Regroup by original photo before splitting."],
            ["Bad labels", `${a.bad_labels} labels are not plates: ${a.bad_label_examples.slice(0, 3).join(", ")} are car names and notes; ${a.bad_label_examples[3]} is a typo.`,
              "Scoring against a wrong label punishes a correct reading.",
              "The plate rules flag them; they are left out of the test set."],
          ].map(([t, found, would, fix], i) => (
            <article className="closed" key={t}>
              <div className="closed-gantry">
                <h3><span className="lane-tag">{String(i + 7).padStart(2, "0")}</span><Signal go={false} label="Lane closed" />{t}</h3>
              </div>
              <div className="closed-road">
                <span className="closed-arm" aria-hidden="true" />
                <dl>
                  <div><dt>Found</dt><dd>{found}</dd></div>
                  <div><dt>Would have</dt><dd>{would}</dd></div>
                  <div><dt>Fix</dt><dd>{fix}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="chapter asphalt" id="rules" aria-labelledby="h-rules">
        <h2 className="sign-title on-dark" id="h-rules">The booth knows the rules</h2>
        <p className="lede">OCR confuses 0 with O and 8 with B. Where a character sits on an Indian plate tells you which it must be. Try it: these are the same rules the live scanner runs, and they give the same answers as my Python on 4,000 test strings.</p>
        <Booth />
        <div className="state-tiles" aria-label="Accepted state and union territory codes">
          {site.states.map((s) => <span key={s} className="tile" title={STATE_NAMES[s]}><b>{s}</b><small>{STATE_NAMES[s]}</small></span>)}
        </div>
      </section>

      <section className="chapter concrete" id="synthetic" aria-labelledby="h-synth">
        <h2 className="sign-title" id="h-synth">Trained on traffic that never existed</h2>
        <p className="lede">The best labelled Indian set is licensed no-derivatives, so I can&apos;t ship a model trained on it. The reader learns from plates I generate instead (real state codes and formats, every colour scheme, one and two lines, bolts, grime, blur, glare) and real plates only ever test it.</p>
        <div className="traffic" aria-label="Synthetic training plates streaming past">
          {[0, 1].map((row) => (
            <div key={row} className={`stream${row ? " rev" : ""}`}>
              {[...SYNTH.slice(row * 16, row * 16 + 16), ...SYNTH.slice(row * 16, row * 16 + 16)].map((src, i) => <img key={i} src={src} alt="" />)}
            </div>
          ))}
        </div>
        <p className="caption">Synthetic plates rendered by anpr/synth.py · 3,072,000 of them per training run (12,000 steps × 256)</p>
      </section>

      <section className="chapter concrete" id="results" aria-labelledby="h-results">
        <div className="results-grid">
          <div>
            <h2 className="sign-title" id="h-results">The receipt</h2>
            <p className="lede">Exact match means the whole plate right, every character. Every line is measured once, on the same {a.test_images} held-out photos. Each choice before that (which reader, which rules) was made on the training split.</p>
            <p className="muted">The test photos are mostly close-ups from used-car listings, Google Images and video frames, easier than live traffic, which is what your lane below is for. I looked at test failures once, after the baseline; every tuning decision since is checked on the training split.</p>
          </div>
          <div className="receipt big" role="table" aria-label="Results">
            <p className="receipt-title">Indian ANPR · results</p>
            <p className="receipt-sub">Test set: {a.test_images} photos · {a.test_plates} plates</p>
            <p className="receipt-head" role="row"><span role="columnheader">Configuration</span><span role="columnheader">Exact</span><span role="columnheader">Char. errors</span></p>
            {site.baseline.rows.map((r, i) => (
              <div key={r.name} className="receipt-row" role="row">
                <p><span role="cell">{r.name}</span><span role="cell">{pct(r.exact)}</span><span role="cell">{r.cer.toFixed(2)}</span></p>
                <p className="sub">95% range {pct(r.ci[0])} – {pct(r.ci[1])}{r.note && <b> · {r.note}</b>}</p>
              </div>
            ))}
            <div className="receipt-row" role="row">
              <p><span role="cell">Video frames, voted per car</span><span role="cell">{pct(site.baseline.vote.voted_exact)}</span><span role="cell">–</span></p>
              <p className="sub">{site.baseline.vote.cars} cars, {site.baseline.vote.frames} frames · {pct(site.baseline.vote.single_frame_exact)} reading frames one by one</p>
            </div>
            <p className="receipt-foot">Detector: {pct(site.baseline.detection_recall)} → {pct(site.baseline.finetuned_recall)} of plates found · numbers from reports/</p>
          </div>
        </div>
      </section>

      <section className="chapter asphalt" id="live" aria-labelledby="h-live">
        <h2 className="sign-title on-dark" id="h-live">Your lane</h2>
        <p className="lede on-dark">Point your camera at a plate, or open a photo. On a phone it uses the back camera. Every frame is read inside this tab and nothing is sent anywhere.</p>
        <Scanner />
      </section>

      <footer className="exit">
        <div className="exit-sign">
          <a href={REPO} className="exit-link">Exit to the repo <Arrow /></a>
          <p>Training scripts, the grouped split, the plate rules and their tests, the synthetic plate generator, and every number on this page.</p>
        </div>
        <div className="credits">
          <p>Test set: Indian vehicle license plate dataset, Sai Sirisha N et al. (Kaggle, CC BY-NC-ND), used only for evaluation; none of its images appear here.</p>
          <p>Detector training: Indian Number Plate Annotation, sunrajbishnolia (Kaggle), regrouped by photo.</p>
          <p>Every plate and vehicle on this page is drawn or synthetic. Built by Dushyant Rajpurohit.</p>
        </div>
      </footer>
    </main>
  );
}
