# EP005 Agent 5 — editor staging (not final footage)

**Assigned branch:** `agent/ep005-05-v3-editor`. **Target base:** `production/yunex-ep005-v3-base`. **Master:** issue #247. **Specialist:** issue #252.

This source is a V3-native, editable **silent blockout** and editor overlay. It has NO APPROVED AGENT 1–4 SHOTS, NO EXHAUST FLAME ASSET and NO ORIGINAL EP005 NARRATION. It must not be described as a complete EP005 picture edit or a verified native MP4 until it has been rendered and inspected. The V3 vehicle in this blockout is an illustrative stock-kit vehicle, not an Agent 1 model.

## Provisional edit (30 fps, 1080×1920)

| Beat | Start frame | End frame (inclusive) | Time | Narrative + required approved footage |
| --- | ---: | ---: | --- | --- |
| flame-hook | 0 | 35 | 00:00–00:01.20 | Agent 1 hero genuinely moving, Agent 2 flame anchored to real tailpipe, Agent 3 clean visibility f0–30. No mandatory title over the first 12 frames. |
| moving-reveal | 36 | 164 | 00:01.20–00:05.50 | Agents 3/4 coherent drive/route; no frozen wheels, cuts or teleporting. Explain the occurrence is conditional. |
| engine-reveal | 165 | 320 | 00:05.50–00:10.70 | Agent 1 genuine engine cavity/powertrain, accurate labelled hardware. Some fuel may remain unburnt, not all combustion. |
| fuel-path | 321 | 479 | 00:10.70–00:16.00 | Agent 2 source-revision-locked engine/exhaust mechanics with **real mount data** from Agent 1. Animation is illustrative, not simulation. |
| afterfire-exit | 480 | 629 | 00:16.00–00:21.00 | Agent 2 fuel/hot exhaust/afterfire, anchored to actual exhaust exit, and Agent 3 matching camera. No universal claim or confusion with anti-lag. |
| driving-payoff | 630 | 779 | 00:21.00–00:26.00 | Agents 3/4 true moving race/action, visible supercar and fire where conditions justify, emotionally strong exit. |

**Important:** 26.0s is a *provisional silent target*. Refit shot boundaries to the authentic EP005 audio without time-stretching/recreating the owner-supplied voice. No `words`, `audio`, or word-level captions are present. When the original narration and authoritative word timestamps are available, populate the V3 recipe and use its ONE caption lane. Never write imagined Cedar words or backfill guessed word timings.

## Science & UI policy

- Accurate conditional mechanism: under some operating/tuning conditions unburnt fuel can enter a hot exhaust and ignite there, with flames sometimes visible at the exhaust tip. Do not assert that every supercar behaves like this; distinguish overrun/afterfire from anti-lag and tuning.
- `EditorOverlay.tsx` has only restrained non-spoken **editorial explanation text**, not fake word-synced subtitles. It reserves bottom >5.5% and sides >7%, with the main explanation box at 66–75% of frame. It never competes with a caption lane if verified words later appear; strip/shrink explanatory overlays as needed at review.
- In the blockout, the toolkit's `shot.annotation` uses its live projected mesh anchors for engine and isolated V8, not a 2D arbitrary hard-coded target. After approved source integration, migrate these annotations to exact approved named engine/tailpipe transforms, with camera projection recalculated per frame.
- Suppress off-screen labels, check cropped safe area and collisions with original subtitles. No world-locked label may falsely point to another component. Use close-frame inspection at f0–30 and at every cut.
- **Do not replace Agent 2 flames** with the stock kit or draw 2D flame sprites as a substitute.

## Source gate / integration

Only import source SHA snapshots explicitly marked accepted by Manager Agent 0. A PR existing or a successful test alone is not approval. Preserve original Agent 1–4 interfaces, animation sources and motion transforms. Keep source references, asset URLs, render proofs and hashes in the manager-reviewed handoff; do not invent any. Agent 1's exhaust mounts must match Agent 2's flame emitters; Agent 3's route must match Agent 4's actual roadway.

## Commands after checkout

```bash
git switch --track origin/agent/ep005-05-v3-editor
git merge-base --is-ancestor ce7316b364f96721b39100841eb386724ccf2d52 HEAD
npm ci
npm run check
npm run kit:validate -- ep005-a5-editor
npm run kit:plan -- ep005-a5-editor
npm run kit:inspect -- ep005-a5-editor
npm run kit:review -- ep005-a5-editor --moving
npm run kit:render -- ep005-a5-editor
ffprobe -v error -show_entries stream=width,height,avg_frame_rate,nb_frames -show_entries format=duration -of json out/studio/ep005-a5-editor.mp4
ffmpeg -v error -i out/studio/ep005-a5-editor.mp4 -f null -
sha256sum out/studio/ep005-a5-editor.mp4
```

**Native QA pass** requires actual MP4 artifact with validated dimensions/fps/780 provisional frames, full decode, checked f0–30, every cut, last 30 frames, moving hero/wheels and labels in phone safe space. Static screenshot or V3 source alone is NOT render proof. Final sound/video is Agent 0's approval responsibility. No merge.
