# Automotive Cinematic FX Toolkit — Remotion 4.0.533

**Status:** Independent opt-in library for `YunRah2103/Remotion-gpt-chat`. It does not modify existing M5 edits or approved Porsche projects. Source versions pinned at **4.0.533** with a GitHub Actions-generated npm lock.

## Installed real code

- `@remotion/transitions@4.0.533`: `TransitionSeries`, `fade`, `slide`, `wipe`, `flip`. Additional presentations supported by upstream may be used after their own native tests, but don't claim every paid/experimental effect has been validated. Do not use paid `cube` or effects that require special HTML-in-canvas capture without explicitly checking.
- `@remotion/motion-blur@4.0.533`: `CameraMotionBlur` (render sampled, can change colours), and `Trail` (stylized echo, **not** realistic blur).
- `src/fx/beat.ts`: beat-frame accurate deterministic zero-gap timeline helpers, 8 looks including cut, whip left/right, punch, flash, RGB-edge accent, film burn, shutter. All effects bounded to only initial frames so they don't hide a new 0.5s source shot.
- `src/fx/FXComponents.tsx`: `BeatFxTransform`, `BeatFxOverlay`, `Grade`, `FilmTexture`, `MotionBlurShot`, `StyledTrail` reusable imports.
- `production/fx/make_luts.py`: generates 5 original `.cube` 3D LUTs for standard SDR/Rec.709-ish input: natural-punch, classic-archive, warm-vintage, titanium-modern, night-circuit. **Not** HDR, raw LOG, calibrated Rec.2020 or manufacturer-specific colour. These are original mathematical LUTs, not unlicensed commercial presets.
- `production/fx/export_hq.py`: efficient **zero-quality-loss stream-copy** by default for already encoded H.264/AAC masters; optional single final x264 CRF16 slow pass with .cube grade (re-encoding only when explicitly needed); full file decode verification.
- `production/fx/speed_ramp.py`: actual source-time remapping via FFmpeg (video only) using explicit high-FPS source segments, trim/setpts/concat; do **not** slow down 24/30fps archival clips and expect smooth new frames.
- `AutomotiveFXShowcase`: real registered original 220-frame 1080×1920 30fps Remotion composition, demonstrations of slide/wipe/fade/flip + sampled motion blur/beat FX. **The showreel is original abstract graphics, not actual Porsche footage**.

## Generator usage

```bash
npm ci --no-audit --no-fund
npm run check
python production/fx/make_luts.py --out out/fx-luts --size 17
python -m unittest discover -s production/tests -p test_fx_toolkit.py -v

# Native visual proof (no 3rd party car content):
npx remotion render src/index.ts AutomotiveFXShowcase out/fx-showcase.mp4 \
  --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.4 --concurrency=1
ffmpeg -v error -xerror -i out/fx-showcase.mp4 -f null -

# One-pass final grade (only after comparison):
python production/fx/export_hq.py --input out/final-ungraded.mp4 \
  --output out/final-grade.mp4 --lut out/fx-luts/titanium-modern.cube --crf 16

# Pure passthrough, zero visual degradation:
python production/fx/export_hq.py --input out/final-ungraded.mp4 \
  --output out/final-copy.mp4

# Optional source-time edit for ORIGINAL high-fps source:
python production/fx/speed_ramp.py --input source60fps.mp4 \
  --output out/ramped.mp4 --plan production/fx/plans/sample-ramp.json
```

## Editorial direction for Porsche 911 Turbo Evolution

Copy this toolkit by cherry-picking/merging the feature into Porsche contract branch. Agent C (VFX specialist) can own these **new** effects for Porsche. Agent B stays responsible for precise 30-slot real-footage chronology/beat-sync. Agent A retains source video identity and quality evidence. Agent D Master uses a source-locked artifact and a real 510-frame final output.

**Important practical constraint:** Your BMW M5 V2 succeeded because it was *clean*. Keep a sharp cut at **most** 103 BPM beat boundaries and use one short, special, tasteful transition every major chapter. Avoid 10-frame motion blur over 17-frame clips, stacked LUTs, artificial HD upscales or smearing archival 930/964 video. Inspect max-size moving output and side-by-side references; automated green tests do NOT establish cinematic excellence.

## Limitations and release

- Official transition package contains more effects than this native proof exercises; the proof verifies only listed imported effects and sample overlays.
- `CameraMotionBlur` can change colours, and high samples make renders expensive. The default in our opt-in wrapper is **disabled**. Use at most 4–5 samples for occasional close-up movements.
- The original song is privately user-supplied, and Porsche media rights must be reviewed. The FX proof is independent and safe to include in public GH Actions artifacts.
- Workflow: `.github/workflows/production-fx-ci.yml`. Produces real video proof, FFmpeg LUT outputs, QA metadata and original compare images.

## Independent reliability audit — 10 October 2026

Improvement branch: `feature/fx-toolkit-audit-reliability-20261010`; base: integrated Porsche contract head `bdd17b2c127a0055bba09b6b46f4bcc442a459db` (NOT outdated `main`).

- `BeatFxTransform` now calculates **viewport-aware, inverse-rotated corner coverage** for directional whip zoom and tilt. This avoids black slivers from a fixed 540-pixel overscan assumption. Same transform code works at native output and scaled Remotion proof resolution.
- Added optional `zoom-through` (short scale-based impact, no optical flow) and `light-leak` (four-frame restrained warm original graphic overlay); these do not mix in any previous clip or assume duplicated source frames.
- `validateCuts` now rejects unknown effect styles; `buildChapterFx` rejects duplicate/unsorted beats; nonfinite grades/effect intensities are refused instead of producing invalid CSS. Geometry corners are checked in `production/fx/test_beat.cjs` at four aspect/resolution combinations.
- Existing AAC audio is now **copied**, including during video/LUT re-encoding; no sound quality loss from gratuitous AAC-to-AAC conversion. Dimensions, nominal frame rates, frame counts (when supplied by probe), and audio presence are checked after export.
- `AutomotiveFXComparison` is an original 120-frame / 30fps native A/B: first two seconds show clean cuts; second two seconds use exactly the same moving graphics with whip, zoom-through and light-leak. The comparison isolates the effect from footage differences.
- Updated CI includes source tests, native 540×960 MP4+decode, sixteen stills, one native-size 1080×1920 still, elapsed render time, FFprobe frame verification, and numerical pixel difference checks between equivalent A/B frames. CI is required to complete before describing the changes as production-ready.

**Usage:** `{frame:30,style:'zoom-through'}` and `{frame:45,style:'light-leak'}` in a normal `BeatCut[]`. Use `strength` around 0.35–0.65 for transitions. Stronger settings may crop important edges despite technically safe borders; choose based on visual intent.

**Conservative rendering rules:** keep `CameraMotionBlur` disabled except for selected shots (typically 4 samples), avoid stacking LUTs, and prefer AAC bitstream copying. CPU render times vary with runner hardware: use the recorded render elapsed time in CI as the empirical benchmark, not a promised fixed runtime.

**Outstanding limits:** No optical-flow interpolation, real lens-distortion calibration, camera matching from footage, or colour-managed HDR/LOG pipeline is implemented. The 17-point SDR LUT generator remains gamma-encoded approximate maths: compare neutral greys, shadow detail, and highlights against *your actual source* before final application. The original showcases are synthetic, so green CI alone cannot establish editorial quality on real moving cars.
