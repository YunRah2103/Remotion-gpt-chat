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
