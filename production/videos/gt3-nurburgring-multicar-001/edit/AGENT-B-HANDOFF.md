# Agent B — Multi-car Nürburgring EDIT HANDOFF

Branch: automotive-edits/gt3-nurburgring-multicar-001/b-cinematic

## What is real
- 22 separate editorial shot slots spanning exactly 316 output frames at 1920x1080/30fps; all eight target GT3 marques appear in the *PLAN*, not yet the actual footage.
- Cut anchors are derived from real spectral flux analysis of the user-uploaded exact MP3: strongest impact at 2.592s (frame 78). Planned major accents at frames 78, 158 and 240. Other cuts: 0,10,23,34,45,63,78,90,103,115,132,140,158,170,187,201,212,224,240,254,275,291,316.
- Remotion video editor: src/gt3/Gt3MultiCarMontage.tsx
- Composition IDs: Gt3MultiCar001 (GUARDED actual source release) and Gt3MultiCar001LayoutProof (synthetic planning slate; never final).
- Native landscape no UI on final composition. Each slot has crop anchor, playback multiplier, directional motion, subtle push/grade, short 0–2 frame overlap. Selected strong impacts use restrained 1–2 frame white accents.
- Data model / timeline: edit/shotmap.json. No reference frames were placed in actual footage slots.
- Source and timeline validator: edit/validate-shotmap.mjs, separate tests in edit/validate-shotmap.test.mjs.
- Push-triggered CI: .github/workflows/gt3-agent-b-edit.yml. Actions artifact, if successful: GT3-B-TIMING-PROOF-NOT-FOOTAGE. It contains only a conspicuously labelled sample layout, native frame strip and tests.

## Confirmed source reference
The ChatGPT-uploaded GT3_MULTICAR_REFERENCE_AUDIO_PACK.zip was actually opened:
- Song duration 10.553469 s, SHA256 87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678.
- Reference duration 23.312993 s, 1280x720 HEVC, SHA256 e465faaf298874ace0d877a231ad07fac4df56557504c6648b650f769851dfa9.
- IMPORTANT: No 720p reference clips may appear in the final film. This package does NOT contain Agent A's source library.
- Audio was *analysed* for beat placement, NOT used as replacement music; Agent C owns soundtrack and real engine layers.

## What Agent A / C must supply
1. Agent A provides >=24 genuinely distinct verified full-resolution GT3 shots from >=6 actual GT3 makes, one source ZIP and manifest, correct models and clean watermark-free media. No fake 720p upscale. Source media is NOT in Git. Copy selected originals into public/gt3-multicar-001/; do not commit big media blobs.
2. For every scheduled slot update fields source (e.g. gt3-multicar-001/clip-004.mp4), sourceInFrame (integer time offset measured in 30fps timeline units), verifiedMake, verifiedModel, sourceFilmId (actual original film/feed) and sourceSha256. Ensure selection varies actual camera view, darkness/lighting, car angle, geography and motion direction. Rework planned manufacturers and edits as required to match REAL available clips.
3. Run node production/videos/gt3-nurburgring-multicar-001/edit/validate-shotmap.mjs --strict on mounted local media. Strict checks native 1080p effective 16:9 crop, ffprobe duration, identity fields, SHA256 and 3 separate original films/feeds, unique non-overlapping trims, >=6 verified makes and >=18 shots.
4. Run npm ci && npm run check, then render actual Gt3MultiCar001 (not the LayoutProof) and inspect sampled actual decoded frames for identity, black frames, compression, brightness, camera motion, watermarks and car framing. Only then Agent B may be marked EDIT PASS.
5. Agent C uses the EXACT uploaded original MP3 (SHA above) and authentic engine sources matched to visible engines. Render 316 frames (10.533 s) and mux H.264 yuv420p + AAC 48k. Do not swap in a substitute song or overlay engines indiscriminately.

## Example real master render, AFTER strict gate
npm ci
node production/videos/gt3-nurburgring-multicar-001/edit/validate-shotmap.mjs --strict
npx remotion render src/index.ts Gt3MultiCar001 out/GT3-MULTICAR-VISUAL-316F.mp4 --codec=h264 --pixel-format=yuv420p --crf=16 --concurrency=2
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames -of json out/GT3-MULTICAR-VISUAL-316F.mp4
ffmpeg -v error -i out/GT3-MULTICAR-VISUAL-316F.mp4 -f null -

## Quality gate, current state
**B = BLOCKED / PROVISIONAL.** Writing a valid shotmap, passing CI, rendering synthetic planning slates, or having the correct reference audio DOES NOT satisfy visual gate. No claims about 22 *verified footage shots*, six *verified makes*, watermark absence, smooth actual edits, or delivery MP4 can be made until Agent A gives real media. The issue #26 manager should enforce these facts.
