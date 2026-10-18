# YUNEX Braking 200 — Agent 3 camera deliverable

## Source ownership

Only this `cameras/**` directory is owned by Agent 3. Does not edit the world kit, Agent 2 physics, Agent 1 brakes, manager contracts or final editor film.

- `cameraRig.ts`: deterministic six-shot smartphone-first camera director; exposes `sampleCameraPose(filmFrame,routePose,spec,options?)`, `cameraShotAtFrame`, `CAMERA_SHOTS`, `vehicleToWorld`.
- `BrakingCameraStage.tsx`: native Three/Remotion track stage using the **real grand-tourer**; reads `state.traveledM` for route and all four `state.wheel[id].rotationRad` for wheel spin, with calipers fixed to pivots. Supports A1/A4 extra 3D content via children. Exposes `sampleBrakingCameraFrame` for QA.
- `Preview.tsx`: two inspectable original-3D 1080×1920 / 30fps proofs against actual kit car and track, using a **labelled constant-speed rolling fixture only**.
- `entry.tsx`: isolated Remotion root for previews, leaving main compositions untouched.
- `cameraRig.test.mjs`: coordinate/frame/ownership/focus/continuity tests.

## Shot plan (approximate; editor retimes after actual VO)

| Shot | Master frames | Visual |
|---|---:|---|
| Hook | 0–119 | Moving front three-quarter hero at 200 km/h *only when real Agent 2 sim is injected* |
| Mechanism | 120–254 | Smooth dive to the **real** left-front wheel |
| Heat | 255–384 | Rotor/caliper macro designed to frame Agent 1 overlay hardware |
| Grip | 385–504 | Ground-hugging tyre contact-patch move |
| ABS | 505–649 | Controlled wheel close-up reserved for Agent 2's explicit lock-tendency insert |
| Finale | 650–749 | Widen out to full vehicle with physics-synchronised stopping motion |

Camera pose follows the actual `sampleRoute('track', startDistanceM+state.traveledM)`; no made-up distance, wheel slip, wheel spin, ABS pressure, or speed in the production API. Agent 2 supplies real `sampleBrakingSimulation` plus editor's monotonic `simulationTimeAtFilmFrame(frame,fps)`. Ensure the physics module is included through a later integrated editor branch before final editorial/master footage. A3 does not invent physics slow-motion mapping.

## Local native preview commands

```bash
npm ci
npm run check
node --experimental-strip-types --test src/yunex/braking200/cameras/cameraRig.test.mjs
npx remotion render src/yunex/braking200/cameras/entry.tsx BrakingA3Macro out/braking-a3-macro.mp4 --gl=swangle --scale=0.5 --codec=h264 --pixel-format=yuv420p --concurrency=2
npx remotion render src/yunex/braking200/cameras/entry.tsx BrakingA3Track out/braking-a3-track.mp4 --gl=swangle --scale=0.5 --codec=h264 --pixel-format=yuv420p --concurrency=2
ffprobe -v error -show_streams -show_format out/braking-a3-macro.mp4
ffprobe -v error -show_streams -show_format out/braking-a3-track.mp4
ffmpeg -v error -xerror -i out/braking-a3-macro.mp4 -f null -
ffmpeg -v error -xerror -i out/braking-a3-track.mp4 -f null -
```

Proofs are 540×960 at scale .5 but have the exact 9:16 framing of final 1080×1920; render at full scale for final macro inspection. Sample actual frames at e.g. `-ss 0.5`, `-ss 2.5`, `-ss 5` with FFmpeg; visually inspect before approval.

**Proof limitations / pending dependency:** The kit caliper is a simple placeholder; Agent 1's real brake rig is not on this branch. The motion preview fixture intentionally does not simulate 200 km/h or apply any braking/ABS forces. It tests actual kit appearance, tracking/camera/framing/wheel rotation only. The independent manager must re-review after A1/A2 integration.

**Presentation constraints:** real unbranded generic blue GT #35546e, generic actual kit track, no new lighting/look override (A4), no unapproved film edits/audio (A6/A7), no full-frame HUD or parked intro.

## Real A1 / A2 / A4 integration (after specialist PR approval)

Agent 1 PR #155 exports `BrakingVehicle` with `simulation` and `pose` inputs; Agent 2 PR #156 exports `sampleBrakingSimulation` and `mapFilmFrameToSimulationSec`. Once their modules are integrated, the editor can use:

```tsx
<BrakingCameraStage
  sampleBrakingSimulation={sampleBrakingSimulation}
  simulationTimeAtFilmFrame={(frame) => mapFilmFrameToSimulationSec(frame)}
  renderVehicle={({state,route}) =>
    <EngineeringBrakingVehicle
      simulation={state}
      pose={route}
      cutawayWheel="front-left"
      cutaway01={mechanismCutawayAtCurrentCue}
    />
  }
  renderLighting={({route}) => <Agent4Lighting focus={route.position} />}
/>
```

This is **illustrative integration pseudocode**, not an assertion that names such as
`Agent4Lighting` or `mechanismCutawayAtCurrentCue` already exist. Actual editor
imports must use the approved A1/A2/A4 exports. The default internal vehicle
is purposely the unmodified kit GT; the optional `renderVehicle` hook replaces
it instead of rendering a second overlapping car. `children` are world-space
objects, not automatically mounted to the moving GT.
