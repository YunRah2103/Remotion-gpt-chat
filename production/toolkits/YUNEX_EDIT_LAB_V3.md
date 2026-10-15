# YUNEX EDIT LAB V3 — better edits with actual source media

**Status:** opt-in reusable tools integrated in repository; verified by `.github/workflows/yunex-editor-lab.yml` when its CI run succeeds. For **YunRah2103/Remotion-gpt-chat** only. Preserve existing films, licensed original footage, source music and the S25 V4 worker.

This is an upgrade to [V2 editor preflight](YUNEX_EDITOR_UPGRADE.md), not a replacement. The original optional PySceneDetect/Beat This!/auto-editor/RIFE tools remain available, but a downloaded AI model is not evidence of a functioning GPU editor.

## 1. Shot scouting and angle variety (real video input)

```sh
python -m pip install "Pillow>=10,<13"
python production/toolkits/yunex_edit_lab.py scout \
  --video input/Aston_Martin_DB12.mp4 --output out/scouted-db12
```

Produces:
- `out/scouted-db12/shots.json`: actual cut ranges and accurate thumbnail sampling positions.
- `out/scouted-db12/contact-sheet.jpg`: quick visual source overview.
- `out/scouted-db12/thumbnails/*.jpg`: original sampled shots at reduced size.
- `nearestFingerprintDistance`: rough grayscale fingerprint similarity so editors can investigate repeated compositions and stop reusing identical shots.

**Important:** This is not a full computer-vision understanding of the car. Similar hashes may flag different legitimate clips; cuts inside long tracking shots are not guaranteed. The editor must still watch the source MP4 and select genuine moving angles with credible identity, useful framing and continuity. Don't assume a blue car is the correct green DB12.

## 2. Genuine speed ramps (source-derived, silent source clips)

FFmpeg source segment timing changes are real. No rendered engine sounds, fake wheel rotation, frame hallucination or music edits.

```sh
python production/toolkits/yunex_edit_lab.py ramp \
  --video input/verified-car-source.mp4 \
  --plan production/toolkits/plans/rolling-shot-example.json \
  --output out/ramped-silent.mp4 --fps 30
```

The plan must be checked against the **actual** footage; the sample plan is just a template. Each segment is `{"start":0.0,"end":1.0,"speed":1.0}`. Segment source in/out points may have deliberate gaps, but may not overlap or reverse. The durations are calculated from the **source** clock; never pretend a 4x faster timeline clip keeps the original length. The output MP4 is silent by design, 30fps H.264 and has an independent SHA256 and full video decode check. **Preserve and add the user's existing original music at the editing stage**, not inside this preprocessing tool.

Limits: 0.25x–4x; no invented 60fps interpolation or deceptive 4K enhancement. Source-native 60/120fps footage is preferable for slow motion. This exporter has stepped-rate boundaries; for smoother ramps, use more closely spaced segments and verify the visible joins. HDR transfers are rejected rather than silently washed into SDR. Source video is never overwritten.

## 3. Audio loudness and headroom diagnostics

```sh
python production/toolkits/yunex_edit_lab.py meter \
  --file out/YUNEX_FINAL_MASTER.mp4 --output out/audio-meter.json
```

Reads the **real source/final audio** with FFmpeg EBU R128 loudnorm's measurement phase, reports integrated loudness in LUFS, true peak in dBTP and dynamic range. This is a report only: no hardcoded loudness target, no mastering preset, no music replacement, no clipping/limiting. If true peak is above -1 dBTP, it flags a manual mix review, but that is an editorial threshold rather than a platform requirement. Compare before/after final mixes with ears and waveform. Avoid overdriven bass and keep plausible engine SFX below musical or spoken content where appropriate.

## 4. Premium animated text overlays in Remotion

Use `src/yunex/KineticTitle.tsx` for one technical idea per text beat. It is frame-synchronised, uses no CSS animation, places a transparent overlay over actual car footage, and exits cleanly.

```tsx
import {Sequence} from 'remotion';
import {KineticTitle} from './yunex/KineticTitle';

// Inside your film composition, with footage visible behind text:
<Sequence from={60} durationInFrames={80}>
  <KineticTitle
    text="The rear wing changes angle"
    treatment="technical"
    accentWords={['wing']}
    durationInFrames={80}
    anchorY={0.56}
  />
</Sequence>
```

Treatments: `editorial` (luxury), `technical` (restrained green accent/line), `impact` (bold, performance). Default text region stays away from bottom app controls, but inspect final mobile safe zones. Avoid text on every shot; text must clarify the story, not hide the moving car.

## 5. GitHub Actions without phone uploads

Run **YUNEX editorial lab — scenes, speed ramps and audio metering** from the Actions tab once the workflow is on the default branch. Supply the original **Actions run ID** and **exact artifact name**, then choose `scout`, `ramp` or `meter`. `ramp` additionally requires a reviewed and committed `production/toolkits/plans/<name>.json`.

- `scout` produces a temporary shot manifest, preview contact sheet and images.
- `ramp` produces an actual playable **silent** MP4 and SHA/timing/full-decode report.
- `meter` produces a loudness measurement report.

Work with existing verified artifact inputs; do not redownload footage unnecessarily. Phone-worker draft Releases still use the existing verified S25 V4 import action inside a separate editing job; this workflow directly consumes only **Actions artifacts**.

## What matters artistically

These tools are only worthwhile if they elevate the footage. The optimal process is: **identify varied high-quality shots** → pick a visual story and music phrases → hand-author useful timing/speed changes → add restrained animated explanation text → render the actual MP4 → visually inspect full-speed footage and listen through the final soundtrack → use automated preflight and loudness analysis as supporting QA.

Creative quality is not established by a green CI run. Avoid recycled aerial angles, motion-warped wheels, harsh over-sharpening, synthetic generic engine noise and excessive transitions.

### Reference sources

- FFmpeg filters and setpts / concat: https://ffmpeg.org/ffmpeg-filters.html
- EBU R128 audio measurement: https://ffmpeg.org/ffmpeg-filters.html#loudnorm
- Remotion timing and dynamic text: https://www.remotion.dev/docs/animating-properties

## New colour filter system

Use the [YUNEX Premium Colour Grades](YUNEX_PREMIUM_COLOR_GRADES.md) guide after source shot scouting. Choose one of eight original cinematic .cube LUT looks, make a source-matched before/after comparison, select a restrained intensity and render an isolated MP4 with original encoded audio intact. Do not apply SDR looks to HDR/Log sources; use explicit colour management first.
