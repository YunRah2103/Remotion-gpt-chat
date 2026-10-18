# YUNEX EP002 — Agent 3 racing cinematography

## Editor handoff
Import `RaceCameraRig` and `getRaceCamera` from `cinema/index.ts`. For every global film frame, sample **Agent 2's authoritative** `sampleRaceFrame(frame,fps)`, then pass the same frame state to both `RaceCameraRig` and the two `Vehicle` instances; use Agent 1's vehicle paths inside that sampler. This rig never alters car positions, speed, yaw, distance or steering. There is no hidden easing state, randomness or `useFrame`: all motion and orbit are deterministic. Agent 6 may use any shot ID at any time. The `RaceCameraPose` objects contain metre-space position/target and vertical FOV in degrees, tuned for 9:16.

## Shot grammar (narrative purpose)
| Shot | Subject | Motivated use |
|---|---|---|
| opening | both | Fast low oncoming 3/4 hero; BOTH colours clearly visible in second one |
| shortcut | teal A | Pursuit on entry to the tempting shortest-path choice |
| wide-entry | amber B | Telephoto front 3/4 changing the visual line |
| apex | both | Panning around kerbs to show the turn itself |
| onboard | amber B | Forward halo-like low POV; briefly feel the corner |
| duel | both | Long-lens shoulder-to-shoulder world-based comparison |
| overhead | both | One short high-oblique reveal; no more than ~2s |
| force | both | Three-dimensional oblique with negative space for A5 overlay |
| exit | amber B | Low rear chase emphasizing road streaming toward camera |
| final | both | Slower rear pullback; real actual result, never a fabricated pass |

A reel: 0–2 opening, 2–4 shortcut, 4–6 onboard, 6–8 exit. B reel: 0–2 duel, 2–4 wide-entry, 4–6 overhead, 6–8 final. Both 240 frames at 30fps, 540x960, native Three/WebGL and two existing `formula-modern` cars in the unchanged `track` world.

## Temporary fixture caveat
`agent-3-preview/fixture.ts` is strictly for the early standalone camera preview while A1 and A2 are in development. It samples the APPROVED existing circuit with two lateral lane offsets, a physical centre stagger, 14.5m/s **constant speed for both cars**, and moving/rolling wheels. **It is NOT authoritative corner physics and does not establish a winner.** Do not show fixture footage as proof B exits faster. Replace with genuine A1/A2 state and re-render for final director approval. True speed, comparative position and timing come exclusively from A2.

## Safe integration
Uses no changes to `src/Root.tsx`, `package.json`, shared kit, prior braking/turbo films, nor other four agents' directories. A4 can independently replace lighting/environment on the shared scene. A5 can overlay graphics after A6 selection. Avoid moving the two models again in the film editor. No artificial camera shake that implies tyre loss.

## First rendered-frame QC and corrective shot direction
Initial native H.264 proof (run [39170534062](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39170534062), artifact 12152856258) was **actually rendered and visually inspected**, not marked approved: source browser colour tagged `yuvj420p`/full-range despite the Remotion flag, and frame grids revealed a small first-second opening, fence crossing in the lateral duel, and a distracting partial foreground nose in chase views. V2 positions now lower/closer for a larger opener, move the lateral duel inside/above circuit barriers and reverse tracking perspectives to reduce occlusion. The native MP4 workflow now explicitly converts browser full-range output to colour-safe limited-range `yuv420p` before the strict probe and full-decode gate. V2 remains subject to its own fresh visual review.

## V3 crop-elimination refinements
Real inspection of second native MP4 pair from run [39171626732](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39171626732) demonstrated that H.264 limited-range colour conversion and full decode now pass, but close portrait views still clipped a car at selected moments. V3 realigns the first-second camera nearer the racing direction, makes the duel a purposeful elevated oblique with sufficient room for both full vehicles, switches exit tracking to the true two-car midpoint, and adjusts B's rear-quarter view to avoid an unwanted opponent sliver. Agent-3 tests now project the actual approximate 5.4 × 1.98 m car corner footprint, not just centre points, for critical paired-camera shots. Do not approve V3 until genuine moving renders are inspected again.
