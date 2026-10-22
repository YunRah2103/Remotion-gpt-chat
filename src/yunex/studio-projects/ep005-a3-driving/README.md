# YUNEX EP005 / Agent 3 cinematic driving source

This editable V3 studio film is an independent SILENT picture candidate at
native 1080x1920 / 30fps. Six shots run 25 seconds (750 frames). There is no
fabricated narration, no invented exhaust mount and no simulated flame in the
standalone A3 render. Flame visuals must come from Agent 2 using Agent 1 mounts.

## Sources and contracts

- entry.tsx is a normal Remotion composition named StudioEpisode.
- recipe.json supplies the V3 editorial shot map and allows kit commands.
- production/yunex/supercar_flames_ep005/cinema/timeline.ts is the
  authoritative continuous distance/route/steering/camera/afterfire timing.
  The standard V3 compileRecipe state is NOT used for driving, because its
  per-shot driving actions reset speed. This film instead integrates speed
  once across the full absolute frame timeline.
- DrivingFilm.tsx uses fresh V3 vehicle and environment factories and the
  original animation rig. Agent 0 may inject CinemaIntegration after
  individual sources and mount names are reviewed. The optional createHero
  factory must preserve V3 rig internals; createWorld and routeSampler must
  describe the identical driveable road; the flame factory must parent actual
  flames to named Agent 1 ports and use afterfireDemand from sampleCinema.
- Units are metres, +X forward, +Y up, +Z left. Default world is the
  canonical closed V3 track. Road centre is y=0; start arc length 55m.
- Agent 5 owns clean graphics/subtitles. Reserve bottom approximately 18%
  for captions; no audio, captions or provisional science text is baked here.
- The final shot length will be re-timed only after approved original audio.

## Editable picture timing, native 30fps

| Beat | Frames | Time window | View |
|---|---|---|---|
| Instant flame hook | 0-44 | 0.0-1.5s | Rear three-quarter, full car/exhaust in frame |
| Real launch | 45-164 | 1.5-5.5s | Road-following side tracking |
| Reveal | 165-284 | 5.5-9.5s | Moving front three-quarter engine context |
| Mechanics | 285-419 | 9.5-14.0s | Moving elevated mechanical cutaway |
| Exhaust explanation | 420-554 | 14.0-18.5s | Rear pipe-dominant view |
| Racing payoff | 555-749 | 18.5-25s | Dramatic rear chase with car readable |

Afterfire COMMAND windows for the actual Agent 2 FX:
f0-29, approximately f430-489 and f674-709. They are commands, not
proof of rendered flame, and are suppressed outside those intervals.

## Local / CI commands

npm ci
npm run check
node --experimental-strip-types --test production/yunex/supercar_flames_ep005/cinema/timeline.test.mjs
npm run kit:validate -- ep005-a3-driving
npm run kit:plan -- ep005-a3-driving
npm run kit:inspect -- ep005-a3-driving
npm run kit:handoff -- ep005-a3-driving
npm run kit:review -- ep005-a3-driving --moving --shot=hook
npm run kit:review -- ep005-a3-driving --moving --shot=payoff
npm run kit:render -- ep005-a3-driving

The native PR workflow tests all timeline invariants and attempts a
full 750-frame render, FFprobe media metadata check, FFmpeg decode,
SHA256 and cut-frame review images. A passing render is not itself
human visual acceptance. No merge without manager approval.
