# EP004 Agent 5 — moving storytelling bridge

Owned by Agent 5 on `agent/ep004-05-story`; do NOT modify shared contract, car, dynamics, camera or environment folders.

## Main exports
- `StorySequence` renders supplied real-world shots: `requestAt(globalTime,shot,shotLocal,duration)` and `renderShot(StoryRequest)`. It does not animate its own car or generate any particle/trajectory. Transition layers evaluate the SAME global time.
- `StoryOverlay` consumes source `StoryRequest`, keyed word captions and optional actual 3D skid-point screen projection. A leader line is rendered ONLY with the metal-skid semantic anchor, never guessed screen coords. Captions sit 15.5% above the bottom edge.
- `storyLocation`, `storyLayers`, `compareRideHeight`, `SHOT_TO_SCRIPT` are pure source utilities. `getStoryVisualCue` supplies section reveal and aerodynamic compare strength without altering physics or car placement. `AeroContrast` crossfades **two Agent 2-provided** motion states only after validating identical route/time/world pose. The default chapter lengths are guides until original recorded speech is timed.
- `FixturePreview.tsx`: **provisional kit-only fixture**, uses the factory `formula-modern` with the real shared circuit route and NO synthetic contacts/sparks. This is useful to inspect composition, perspective and shot switching before Agents 1–4 merge. It is **not** skid contact proof and is not the integrated episode.

## Retimeable semantic map / edit handles
| Beat | Narration meaning, NOT locked speech times | What must stay visible | Transition match |
| --- | --- | --- | --- |
| spark-hook | mystery question | full moving car, real metal-contact sparks immediately | asphalt vanishing point |
| rear-mystery | where sparks arise | car heading and low underside | rear edge into undercar |
| underfloor-reveal | plank and metal skid | floor **separate** from plank **separate** from discrete flush metal skid | keep actual metal skid world location |
| aero-load | load, bumps, ride-height | same moving wheel, compression and body lowering from Agent 2, no numeric force | exact wheel/road scale |
| contact-macro | road/skid scrape causes sparks | contact born at active SkidContact.pointWorld only | skid point to particle trail |
| racing-payoff | sparks are speed spectacle | moving car and contact-driven particles, no generic glow/outro | continuous heading, no frozen final |

Editor receives `StoryTiming` six durations with min 0.35s; may retime any scene and insert actual `WordCaption[]` with start/end speech times. Camera may supply `metalSkidScreenAnchor` by projecting **Agent 1's real skid coordinates**, not arbitrary positions. The only automatic label for contact-macro requires active signed-gap contact, speed and intensity. The aero label requires supplied body heave; separate comparison utility confirms whether loaded/unloaded state supports a lowering claim.

## Direct fixture render commands (once dependency install/runner available)
```bash
npx tsc -p production/yunex/f1_sparks_ep004/story/tsconfig.json
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/tests/agent-5/*.test.mjs
npx remotion render production/yunex/f1_sparks_ep004/story/preview-entry.tsx EP004Agent5Hook out/ep004/agent-5-hook.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
npx remotion render production/yunex/f1_sparks_ep004/story/preview-entry.tsx EP004Agent5Middle out/ep004/agent-5-middle.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=width,height,avg_frame_rate,nb_read_frames,duration -of json out/ep004/agent-5-hook.mp4
ffmpeg -v error -xerror -i out/ep004/agent-5-hook.mp4 -f null -
```
The two fixture compositions are 1080x1920/30fps and 165/330 frames (5.5/11s). To qualify for Agent 0 approval after integration, **also** run both with true Agent 1 car, Agent 2 active signed-gap contact and particles, Agent 3 cameras, and Agent 4 track road. Include screenshots at beginning/mid/end and full ffmpeg decode. No false claim of being physics verified.

## Agent 6 safe caption settings
Subtitle max 82% of viewport width; y roughly 84.5% of frame (bottom 15.5%, clear of mobile UI and EP003's clipping issue). Use accurate word durations from actual narrator, not the sample chapter times. Avoid putting labels atop skids, and hide labels if anchor projection cannot be trusted. Never include a closing logo.
