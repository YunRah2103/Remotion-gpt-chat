# EP003 Agent 3 — 3D cinematic camera system

These cameras use the real reusable **grand-tourer**, **highway** and modelled right-hand-drive interior. The two isolated Remotion compositions use a **TEMPORARY CAMERA-BLOCKING FIXTURE** until Agent 2's sampleDynamics and Agent 1's pressure-loss geometry are merged. The fixture is NOT authoritative physics or a validated tyre test.

## Native portrait source compositions (1080x1920, 30fps)

A. EP003CameraOpening: 5.0 seconds / 150 frames. Failed right tyre macro 0–1.52, travelling front-three-quarter 1.52–2.26, moving rear chase 2.26–5.0.

B. EP003CameraMontage: 8.8 seconds / 264 frames; seven cuts, six distinct views: macro, low tracking, underbody, overhead, driver's interior, chase, final moving hero.

## Reproducible render and QC commands

Run at repo root after npm ci:

~~~sh
npm run check
node --experimental-strip-types --test tests/agent-3/*.test.mjs
npx remotion render previews/agent-3/entry.tsx EP003CameraOpening previews/agent-3/opening.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
npx remotion render previews/agent-3/entry.tsx EP003CameraMontage previews/agent-3/montage.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -of json previews/agent-3/opening.mp4
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -of json previews/agent-3/montage.mp4
ffmpeg -v error -xerror -i previews/agent-3/opening.mp4 -f null -
ffmpeg -v error -xerror -i previews/agent-3/montage.mp4 -f null -
~~~

Shot-boundary review frames: A 0,23,29,45,68,149; B 0,23,36,67,100,135,171,221,263. Inspect actual images, continuity, visible failure, car framing, axle/ground clearance and video motion. Review-only --scale=0.5 produces lower-resolution output from the same source-native composition.

## Shot FOV/local position (metres, negative Z = right)

| Shot | FOV | Camera anchor / trajectory |
|---|---:|---|
| tyre-hook | 37–43° | [1.58,.54,-2.05] -> [4.65,2.02,-5.05] |
| front-three-quarter | 40–43° | [4.2,1.42,-4.15] -> [5.05,1.84,-4.75] |
| low-tracking | 44° | [2.45,.32,-4.5] -> [.60,.43,-4.1] |
| underbody | 61° | [2.30,.15,-1.38] -> [1.92,.19,-1.55] |
| overhead-dynamics | 40° | [1,10.75,-2.55] -> [-1.2,10.3,-2.45] |
| driver-cockpit | 73° | [-.06,1.09,-.456] |
| chase-recovery | 44–40° | [-5.8,1.84,-2.12] -> [-6.55,2.08,-2.20] |
| recovery hero | 42–38° | [4.95,1.84,-5.65] -> [4.2,1.46,-4.65] |

### Integration and limitations

Pass Agent 2's real VehicleDynamicsFrame and Agent 1's TyreFrame to CinematicScene. Vehicle body pose, four wheel hubs, spin phases and steering follow those frames directly; camera sampling itself never integrates motion. Disable previewCosmeticOnly after replacing the demo rubber squash with the Agent 1 mesh.

The existing highway has **no full-width refuge**. The final camera depicts a car STILL MOVING; do not label it a safe stop or park it on the live motorway. Agent 4/manager must approve final refuge geometry before a stationary ending. This branch does not change the shared API, old models, package, prior films, integration root, narration or sound.
