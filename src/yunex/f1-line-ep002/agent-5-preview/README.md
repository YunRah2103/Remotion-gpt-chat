# Agent 5 isolated graphics / motion proof

This independent 7-second Remotion preview uses the actual `formula-modern` world-kit vehicle twice and actual `track` world, including the rightmost corner close to [65,0,18]. Cars animate, 3D racing-line ribbons follow their actual on-road motion, physical world-space apex rings stay anchored, and cinematic camera angles reveal the geometry.

**Staging caveat:** `previewMotion.ts` provides *preview-only* choreography offsets from `sampleRoute('track')`. This is not Agent 1's final racing-path sampler and is not Agent 2's physics. There are intentionally NO speed figures or fabricated winning claims. Replace staging inputs with exported A1 `RacePath` objects and A2 `RaceFrameState` when Agent 6 integrates.

## Integration (no shared source changes)
- Import `RaceLineWorld` from `../graphics`, supplying `{paths, progressM: {shortcut:state.cars.shortcut.pathDistanceM, racing:state.cars.racing.pathDistanceM}, frame}` inside the same ThreeCanvas as cars and track.
- Import `StoryOverlay`, supplying film `beat`, `paths` and optionally a genuine `GateComparison` returned by `measureCommonSector(paths, sampleRaceFrame, fps, start, end)`; without comparable crossings it intentionally withholds a result.
- `compareApexCurvature` only describes which turn is gentler if real signed curvature samples support it.
- A3 can supply the actual camera pose; A4 can supply final lighting and style. The world ribbons need no screen projection and follow camera changes perfectly.
- All speeds are derived solely from A2; no fabricated overtakes. `StoryOverlay` intentionally has no speedometer.

## CI
`f1-line-ep002-agent-5.yml` executes npm install/check/world-kit unit tests/Agent 5 tests and renders actual H264 540x960 30fps/7s motion. FFprobe, full-decode and three temporally distinct PNGs are bundled with MP4 for manager review. Automated frame hashes **do not replace human visual QC**.
