# EP003 / Agent 2 — Deterministic vehicle dynamics

Authority: `model.ts` exports `sampleDynamics(tSec, params)`, `DYNAMICS_DEFAULTS`, `DYNAMICS_ASSUMPTIONS`, `failureProgressAt` and `previewRebasedPosition`.

## Assumptions and limits

This is an **illustrative dry-road four-contact, planar force/yaw model**, not a validated real-car simulator or road safety advice. Coordinate frame: +X forward, +Y up, +Z left. Positive yaw around +Y points the nose RIGHT. Initial speed 27.78m/s and onset 0.75s are storyboard assumptions, not measurements. Fixed integration timestep 1/240s; look-up table computed deterministically from the initial condition and interpolated at absolute seconds. Up to 32 seconds of source-time; physical position is unbounded, so downstream editors must use a longer world or visible shot cuts rather than wrap the 180m highway.

Mass 1780kg, yaw inertia 3250kg m², CG height 0.53m, wheelbase 2.92m, track 1.76m, static 52% front load, nominal tyre radius 0.36m, nominal dry grip mu=0.94, nominal rolling resistance 0.013, aerodynamic drag 0.414N/(m/s)^2. Contact lateral forces use a saturated linear cornering-stiffness approximation and a combined contact-force envelope. The failed wheel progressively loses up to 0.060m effective rolling radius, retains 88% nominal vertical support proxy, has 37% healthy lateral grip proxy, loses 45% cornering stiffness and gains 390N drag. These constants are **creative-model assumptions, not empirically measured values**. Change only with review, and do not display derived force captions without checking force units and interpolation.

The driver is a delayed, capped proportional stabiliser, steering at most ±0.055rad. Throttle remains initially steady (stabilise), begins easing after 1.2s event-relative time, then approaches zero; gentle braking begins only after 4.9s event-relative. No late-stage safe-stop state is fabricated: safe refuge geometry is owned by Agent 4 and requires approval. Roll/pitch are bounded, lagged illustrative suspension cues, not full sprung/unsprung multibody dynamics. Wheel forces are constrained, but rupture rolling drag is a separate rolling-loss term; no guarantee is made about reaction direction in real blowouts.

`hubWorldM` is an absolute world-space hub position. `spinRad` has the same NEGATIVE forward-spin sign as kit `animateVehicle`. `verticalCompressionM`, `contactFraction` and `normalLoadN` supply Agent 1 with tyre/suspension deformation drivers. The Agent 1 PR #202 sample defines a loaded radius of 0.300m from 0.360m nominal, now matched in Agent 2 as a 0.060m loss. The wheel hub's supplied Y already accounts for that loss. The consuming Agent 1 geometry must deform at the shared wheel's `rollingRadiusM` without adding a second hub drop. Do not apply `animateVehicle` again after applying per-wheel `spinRad`.

## Native Remotion source previews

Independent entry: `production/yunex/tyre_blowout_ep003/dynamics/entry.tsx`. Source compositions are 1080 × 1920 / 30fps and may be reviewed at half-scale.

```sh
npm ci
npm run check
npm run worldkit:test
npm run partskit:test
node --experimental-strip-types --test tests/agent-2/*.test.mjs
npx remotion render production/yunex/tyre_blowout_ep003/dynamics/entry.tsx EP003Agent2Incident previews/agent-2/incident.mp4 --gl=swangle --scale=.5 --codec=h264 --pixel-format=yuv420p --concurrency=1
npx remotion render production/yunex/tyre_blowout_ep003/dynamics/entry.tsx EP003Agent2Recovery previews/agent-2/recovery.mp4 --gl=swangle --scale=.5 --codec=h264 --pixel-format=yuv420p --concurrency=1
ffprobe -v error -show_streams -of json previews/agent-2/incident.mp4
ffmpeg -hide_banner -v error -xerror -i previews/agent-2/incident.mp4 -f null -
ffmpeg -hide_banner -v error -xerror -i previews/agent-2/recovery.mp4 -f null -
```

Incident: 150 frames / 5s. Recovery: 240 frames / 8s, three editorial cuts, each within an uninterrupted physical portion of the highway. The incident camera uses a front-right tyre-height view; the context preview changes to overhead and rear-three-quarter while keeping source-time monotone within each clip. Car materials and wheel assemblies are from the pinned reusable kit; a **temporary visual flattening proxy** on the front-right tyre in previews is NOT the final Agent 1 deformation. A proper Agent 1 mesh will replace it. These are development components, **not claims that MP4s were rendered or visually approved**. No static presentation or fabricated telemetry caption.

## Integration ownership

Agent 6 will register final compositions. Cinema, mechanics and story should consume the absolute-time frame from `sampleDynamics` and not step vehicles inside `useFrame` or infer yaw from arbitrary screen-space steering. Check visual clip endpoints before emitting a full-speed car into an unsafe missing shoulder. High-speed event response is context-dependent; see NHTSA tyres: https://www.nhtsa.gov/vehicle-safety/tires .

## Integration corrections and handoff (19 October 2026)

- **World-space authority:** `sampleDynamics(tSec)` is the only physics source. The car body must use `positionM`, `yawRad`, `pitchRad` (Euler X) and `rollRad` (Euler Z). For Three `rotation.set`, the correct arguments are `rotation.set(d.pitchRad,d.yawRad,d.rollRad,'YXZ')`, not roll-as-X / pitch-as-Z.
- **Absolute wheel hubs:** each `wheels[id].hubWorldM` is world-space and must be converted using the parent vehicle's `worldToLocal` after setting root position/rotation. Apply that to all four wheel-steering pivots, then set `steeringRad` on each pivot and `spinRad` on its `wheel-roll` group. Never add a second independently sampled wheel spin.
- **Shot-local rebasing:** for a declared hard cut only, body X changes via `previewRebasedPosition(d,anchorDistanceM,sceneX)`. Because wheel hubs are also absolute, shift each with `previewRebasedHubWorld(d,id,anchorDistanceM,sceneX)` BEFORE calling `root.worldToLocal`. Without this identical shift, all four wheels detach from the hero car. Physical `distanceTravelledM`, wheel rotation, yaw and speed remain unmodified across an edit. There is NO physical teleport.
- **Tyre deformation:** the current department preview still uses a clearly marked temporary scale proxy; Agent 1 supplies true ground-contact rubber geometry. Pass its `sampleTyreFailure` the same incident start/fall time and `angularPhaseRad = d.wheels['front-right'].spinRad`; align its effective loaded radius with `rollingRadiusM=0.300m` after rupture. Do not add unsupported tread debris or relabel visual compression as measured pressure.
- **Safe refuge:** Agent 4 PR #200 has static, physically sized geometry but the *present* Agent 2 path does not actually enter it or stop there. `assessRefugeFrame` / `auditRefugeTimeline` reject a fictional safe-stop shot by comparing body footprint, heading and speed to Agent 4's exported `REFUGE` values. The correct final Phase-1 shot is MOVING recovery, not `safe-exit`; a later physically reachable stop needs an approved continuous much longer world/timeline and a fresh driving scenario. **Safe-stop integration is blocked.**
- **Partners:** Agent 1 PR #202 owns authentic pressure-loss mesh, Agent 3 PR #201 owns shots, Agent 4 PR #200 owns environment/refuge, Agent 5 PR #203 owns anchored force/story graphics, QA PR #204 owns aggregate renders. All must read authoritative frames instead of their own temporary fixtures.

### Dedicated GitHub Actions

`.github/workflows/yunex-ep003-agent2-native.yml` runs **all** `tests/agent-2/*.test.mjs` (including source model, refuge geometry and four-hub rebasing), independent TS compilation, world-kit and parts-kit tests, both EP003 Remotion MP4 renders at source 1080×1920/30fps (`--scale=.4` review output), full FFmpeg decodes, FFprobe, per-frame motion hash checks, actual timed frame stills and contact sheets, then publishes native-video artifacts with SHA256. Remotion software output may be full-range `yuvj420p`; the workflow explicitly normalizes it to limited-range H264/yuv420p before final QA. A successful legacy `GpuDriveFilm` smoke test is NOT evidence for these two videos.

Native render evidence is specific to its commit SHA and run ID. A queued run, prior-commit clip or static contact sheet must NOT be mistaken for verified current-commit playback. Keep draft PR #199 pending manager/director moving-video visual approval.
