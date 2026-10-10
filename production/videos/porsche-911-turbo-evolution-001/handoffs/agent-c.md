# Porsche 911 Turbo Evolution 001 — Agent C handoff

**Role:** Agent C, transitions, grade and independent QA.
**Branch:** `automotive-edits/porsche-911-turbo-evolution-001/c-transitions`
**Final implementation source commit:** `a53eeeb4e77a3280ae06b4c94804bc7a33eb982b` — exact source SHA before handoff files; final branch HEAD after handoff is newer.
**Status:** REVIEW. Implementation is integration-ready, but the private Porsche film has **NOT** been visually approved.

## Implementation (actual committed code)

- `src/porsche-turbo-evolution/polish/presets.ts`: fully typed, deterministic 510-frame timeline validator, six chapter presets, 30-shot chronology protection, exact incoming frame effects, safe crop guidance.
- `src/porsche-turbo-evolution/polish/PolishLayer.tsx`: optional React/Remotion video-layer wrapper; integration of existing `src/fx/FXComponents.tsx` `Grade` and `BeatFxOverlay`, shared `src/fx/beat.ts`; default neutral and opt-in; no package changes.
- `qa/test_polish.mjs`: native frame-mapping, no-overlap, crop and effect-safety tests against authoritative `beat-map.json`.
- `qa/check_footage.py`: actual FFmpeg decoded native luma thumbnail, freeze/motion and repeated-camera candidates for all 30 real staged shots, refuses to pass missing footage.
- `qa/render_optical_proof.py`: reproducible native FFmpeg 112-frame H.264 CRF15 A/B motion comparison using clearly labelled original **synthetic** content; excludes copyrighted source footage.
- `qa/REPORT.md`: independent 30-shot QA matrix, visual crop and conservative colour guidance.
- `qa/PROOF_QA.json`: signed-off technical synthetic-proof metadata and exclusions.

## Exact default chapter presets (change only after visually checking actual cars)

| Frame | Source change | Preset | Active incoming frames |
|---:|---|---|---:|
| 67 | 930 → 964 | micro-punch | 3 |
| 136 | 964 → 993 | cut | 0 |
| 205 | 993 → 996 | match-shift | 3 |
| 274 | 996 → 997 | cut | 0 |
| 343 | 997 → 991 | cut | 0 |
| 429 | 991 → 992 | micro-punch | 2 |

29/29 beat changes remain true replacements of the source shot. 8/510 frames receive any opt-in effect and all are on the incoming media at full opacity. Final recommendation: choose **hard cut** over transition on any shot pair lacking a real camera/perspective match. Never blur or hide a car to make it look flashy. All overlays and grade are disabled unless D explicitly opts in.

## Tests and actual proof

- **PASS**: `tsc presets.ts --strict --target ES2022 --module esnext --noEmit --skipLibCheck` (native local TypeScript CLI).
- **PASS**: `node --experimental-strip-types .../qa/test_polish.mjs` — 510 exact frames, 30 slots, 6 era boundaries, 8 effect-active frames, 502 neutral frames; invalid source/timing inputs rejected.
- **PASS TECHNICAL SYNTHETIC**: native Python/OpenCV generated moving sources, FFmpeg libx264 CRF15 encoded 112 frames / 720×1280 / 30fps, FFprobe frame dimensions and count, COMPLETE FFmpeg decode; visually opened exact comparison frame 205.
- **PASS**: GitHub production contract Actions run `38055547634` at source `442175a39b93ee5e1299f9e3de49ce35060703f0`, success. This workflow is planning/schema validation, NOT a true Porsche render.
- **NOT RUN**: `npm run check` against full repository node_modules in local container (offline, no repository installed); D/CI must run it with the pinned npm lock.
- **NOT DONE**: a native Remotion composition video with authentic Porsche footage, because real footage/combined composition was not provided to this specialist. The synthetic FFmpeg proof must NEVER be presented as one.
- **PENDING**: independent examination of all 30 correct Porsche Turbo actual moving camera shots and 510-frame 17-second master with original song.

**Local private proof for sharing with D** (not in public GitHub): `porsche_agent_c_ab_proof.mp4`, `porsche_agent_c_comparison.png`, `porsche_agent_c_qa_bundle.zip`; user must explicitly attach if a separate Agent D session requires them. Alternatively D can run the committed QA generator. MP4 SHA256: `68c896812543f01357c05893745fa2c228657431ca0204f4f97e580ec6237b65`.

## Integration recipe for Agent D

1. Cherry-pick Agent C source commit `a53eeeb4e77a3280ae06b4c94804bc7a33eb982b` or merge this isolated branch, resolving only source branch conflicts. Do not overwrite A/B work.
2. Import `{PolishLayer}` from `src/porsche-turbo-evolution/polish/PolishLayer`. Wrap the master **video layer** (not the upper-left white model-code label), supplying `cuts={beatMap.cuts}`. Use `enabled={true}` only after the real source A/B review. If uncertain, `enabled={false}` wins.
3. D is allowed to override `CHAPTER_PRESETS` using `overrides={{67:{style:'cut',frames:0,strength:0},...}}` after review. If D re-times beat-map ±1 frame, change C boundary constants and rerun test; the module currently fails closed when chapter frames move.
4. Leave `gradeStrength={0}` as default unless real source frames justify a tiny match. Generate five LUTs with existing `production/fx/make_luts.py` only for reviewed final comparison, apply at most one in final export, no iterative lossy encodes.
5. Use Agent A's actual staged source files with `qa/check_footage.py`; visually compare the true pairs 67, 205, 343, 429 and inspect all 30 moving sources. Complete D's 510-frame MP4 + audio delivery, review footage, verify 30 unique cameras, record technical ffprobe/decoding and publish private-only review artifact.

**Blockers:** Agent A's actual 30 decoded Porsche frames & real photographic quality not available in C branch; Agent D finished combined 510-frame native film and audio not supplied; provenance/rights not independently verified. The real final MP4 remains PENDING.
