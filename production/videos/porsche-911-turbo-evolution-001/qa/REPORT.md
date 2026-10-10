# Agent C — source-realism, shot QA and colour review (2026-10-10)

**Disposition: transition-code technical tests PASS; FINAL PORSCHE VISUAL QA PENDING.**

Reviewed authoritative PRODUCTION_CONTRACT.md, beat-map.json, Agent B, original FX Toolkit and approved M5 V2 clean visual baseline. No Agent A source footage, real Turbo frames, or Agent D 510-frame master was accessible in Agent C's c-transitions branch at review time. A shot manifest of nulls is NOT proof of 30 clips. Do not convert PENDING to PASS from metadata, synthetic proof, or this report.

## Exact cut-by-cut check and human-facing decision

| Exact beat boundary | Chapter | Effect default | Frames touched | Approval logic |
|---|---|---|---:|---|
| 67 | 930 → 964 | Micro punch, max 2.31% zoom | 3 | Keep only if wing/headlight sizes are camera-matched |
| 136 | 964 → 993 | Hard cut | 0 | Let actual 993 outline read completely |
| 205 | 993 → 996 | Match-shift, max 9 px horizontal | 3 | Reject if direction jumps or label/crop shakes |
| 274 | 996 → 997 | Hard cut | 0 | Avoid masking change of front fascia |
| 343 | 997 → 991 | Hard cut | 0 | Crisp generational reset; clean is stronger |
| 429 | 991 → 992 | Micro punch, max 1.76% zoom | 2 | Check real 992 micro-details, rear lights and road texture |

All OTHER beat boundaries remain hard cuts. These four named comparisons receive representative proof frames **-1, 0, +1, +3**, except two chapter boundaries are deliberately kept clean. The opt-in PolishLayer defaults to disabled. New incoming video opacity is always 1. Effects start at the actual new chapter frame, never overlap the previous source. No extra text/HUD/audio/logo is added.

## 30-slot independent source QA matrix

| Shot | Turbo era | Exact master frames | Turbo coupe identity | Native pixels / bitrate | Distinct moving camera | Exposure/colour match |
|---|---|---|---|---|---|---|
| 01 | 930 | 0–14 | PENDING A media | PENDING | PENDING | PENDING |
| 02 | 930 | 15–31 | PENDING A media | PENDING | PENDING | PENDING |
| 03 | 930 | 32–48 | PENDING A media | PENDING | PENDING | PENDING |
| 04 | 930 | 49–66 | PENDING A media | PENDING | PENDING | PENDING |
| 05 | 964 | 67–83 | PENDING A media | PENDING | PENDING | PENDING |
| 06 | 964 | 84–100 | PENDING A media | PENDING | PENDING | PENDING |
| 07 | 964 | 101–117 | PENDING A media | PENDING | PENDING | PENDING |
| 08 | 964 | 118–135 | PENDING A media | PENDING | PENDING | PENDING |
| 09 | 993 | 136–152 | PENDING A media | PENDING | PENDING | PENDING |
| 10 | 993 | 153–169 | PENDING A media | PENDING | PENDING | PENDING |
| 11 | 993 | 170–186 | PENDING A media | PENDING | PENDING | PENDING |
| 12 | 993 | 187–204 | PENDING A media | PENDING | PENDING | PENDING |
| 13 | 996 | 205–221 | PENDING A media | PENDING | PENDING | PENDING |
| 14 | 996 | 222–238 | PENDING A media | PENDING | PENDING | PENDING |
| 15 | 996 | 239–256 | PENDING A media | PENDING | PENDING | PENDING |
| 16 | 996 | 257–273 | PENDING A media | PENDING | PENDING | PENDING |
| 17 | 997 | 274–290 | PENDING A media | PENDING | PENDING | PENDING |
| 18 | 997 | 291–307 | PENDING A media | PENDING | PENDING | PENDING |
| 19 | 997 | 308–325 | PENDING A media | PENDING | PENDING | PENDING |
| 20 | 997 | 326–342 | PENDING A media | PENDING | PENDING | PENDING |
| 21 | 991 | 343–359 | PENDING A media | PENDING | PENDING | PENDING |
| 22 | 991 | 360–377 | PENDING A media | PENDING | PENDING | PENDING |
| 23 | 991 | 378–394 | PENDING A media | PENDING | PENDING | PENDING |
| 24 | 991 | 395–411 | PENDING A media | PENDING | PENDING | PENDING |
| 25 | 991 | 412–428 | PENDING A media | PENDING | PENDING | PENDING |
| 26 | 992 | 429–446 | PENDING A media | PENDING | PENDING | PENDING |
| 27 | 992 | 447–463 | PENDING A media | PENDING | PENDING | PENDING |
| 28 | 992 | 464–480 | PENDING A media | PENDING | PENDING | PENDING |
| 29 | 992 | 481–495 | PENDING A media | PENDING | PENDING | PENDING |
| 30 | 992 | 496–509 | PENDING A media | PENDING | PENDING | PENDING |

This matrix is deliberately **not** marked PASS for authentic Porsche footage. Once Agent A provides a real staged 30-shot manifest and files, run:

```sh
node --experimental-strip-types production/videos/porsche-911-turbo-evolution-001/qa/test_polish.mjs
python production/videos/porsche-911-turbo-evolution-001/qa/check_footage.py \
  production/videos/porsche-911-turbo-evolution-001/footage/shot-manifest.json \
  --media-dir /path/to/private/30-moving-clips --output /tmp/porsche-source-check.json
```

Native checks decode three points of each video, assess actual frame motion, flag extremely low resolution and near-identical 48px grayscale signatures. Similarity is **review evidence, not reliable automated proof** of equal camera or identity. Check real footage visually at native size for Porsche Turbo variant (no Carrera/GT3/CGI), unique camera scene/setup rather than same take split, correct in/out, watermarks, ringing, black frames and source rights.

## Crop / colour technical policy

- Master 1080×1920/30 fps, little white codes top-left at ~70px left / 145px top. Place code OUTSIDE PolishLayer.
- Vintage landscape 720×576 / 640×480 / 1080p should retain central source picture with dark, softly blurred **same-source** extension; no fake-upscale claim.
- 4K landscape still must have actual car readable in 9:16 centre crop. Record normalized focal x/y; inspect road, mirrors, spoiler, tyres for clipping.
- 992: preserve source high-frequency detail; do not apply redundant sharpening or long motion blur.
- Shared Grade option defaults to neutral and strength zero. Only a source-reviewed conservative preset may be enabled.
- Original FX Toolkit five generated LUTs are **candidate** LUTs; do not apply automatically. If chosen after native frame comparison, apply one 17-point LUT ONLY ONCE in the final master (CRF 15–17 or zero-loss copy if no grade). Do not accumulate repeated re-encodes, flash > 3 frames, harsh LUT or artificial grain.
- Original private song and final sound mux belong to Agent D, not C.

## Actual local visual proof performed

A **real, playable 112-frame, 720×1280, 30fps H.264 CRF15 MP4** was encoded from generated **synthetic moving graphics** and verified with FFprobe and complete FFmpeg decode. Captured real PNG comparisons at 67/205/343/429 (-1,0,+1,+3). This validates technical rendering and relative transition subtlety only; it does NOT verify Porsche footage, native Remotion composition, rights or final video quality.

- Local proof SHA-256: `68c896812543f01357c05893745fa2c228657431ca0204f4f97e580ec6237b65`
- Proof name: `C_AB_SYNTHETIC_TRANSITION_PROOF.mp4` (private ChatGPT handoff artifact; no public binary pushed).
- Reproducer: `qa/render_optical_proof.py` (cv2/numpy/FFmpeg).
- Visual review: synthetic comparison remained readable; camera-matched real Porsche candidate remains **PENDING**.
- Native Remotion proof: **NOT RUN** in this session because repository npm packages and private footage are not present in container runtime; GH code/type and render validation await CI / Agent D actual integration.

## Final film signoff remains gated

Agent D must separately watch all 510 native frames and actual 17s MP4, check no duplicate shot/camera, no frozen/black frames, Turbo generation, 30 real moving sources, beat-to-music confirmation, no compression/colour degradation, safe upper-left code, 48kHz AAC if private WAV available and no rights-unapproved publication.

Status: **REVIEW / needs actual footage and master** — not a false final PASS.
