# EP003 / Agent 2 — Deterministic vehicle dynamics

Authority: `model.ts` exports `sampleDynamics(tSec, params)`, `DYNAMICS_DEFAULTS`, `DYNAMICS_ASSUMPTIONS`, `failureProgressAt` and `previewRebasedPosition`.

## Assumptions and limits

This is an **illustrative dry-road four-contact, planar force/yaw model**, not a validated real-car simulator or road safety advice. Coordinate frame: +X forward, +Y up, +Z left. Positive yaw around +Y points the nose RIGHT. Initial speed 27.78m/s and onset 0.75s are storyboard assumptions, not measurements. Fixed integration timestep 1/240s; look-up table computed deterministically from the initial condition and interpolated at absolute seconds. Up to 32 seconds of source-time; physical position is unbounded, so downstream editors must use a longer world or visible shot cuts rather than wrap the 180m highway.

Mass 1780kg, yaw inertia 3250kg m², CG height 0.53m, wheelbase 2.92m, track 1.76m, static 52% front load, nominal tyre radius 0.36m, nominal dry grip mu=0.94, nominal rolling resistance 0.013, aerodynamic drag 0.414N/(m/s)^2. Contact lateral forces use a saturated linear cornering-stiffness approximation and a combined contact-force envelope. The failed wheel progressively loses up to 0.073m effective rolling radius, retains 88% nominal vertical support proxy, has 37% healthy lateral grip proxy, loses 45% cornering stiffness and gains 390N drag. These constants are **creative-model assumptions, not empirically measured values**. Change only with review, and do not display derived force captions without checking force units and interpolation.

The driver is a delayed, capped proportional stabiliser, steering at most ±0.055rad. Throttle remains initially steady (stabilise), begins easing after 1.2s event-relative time, then approaches zero; gentle braking begins only after 4.9s event-relative. No late-stage safe-stop state is fabricated: safe refuge geometry is owned by Agent 4 and requires approval. Roll/pitch are bounded, lagged illustrative suspension cues, not full sprung/unsprung multibody dynamics. Wheel forces are constrained, but rupture rolling drag is a separate rolling-loss term; no guarantee is made about reaction direction in real blowouts.

`hubWorldM` is an absolute world-space hub position. `spinRad` has the same NEGATIVE forward-spin sign as kit `animateVehicle`. `verticalCompressionM`, `contactFraction` and `normalLoadN` supply Agent 1 with tyre/suspension deformation drivers. Before integration, compare Agent 1's actual tyre radius-loss curve with `failedRadiusLossM`; do not add two independent tyre-radius animations.

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
