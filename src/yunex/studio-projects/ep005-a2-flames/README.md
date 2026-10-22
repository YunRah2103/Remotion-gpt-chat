# YUNEX EP005 A2 — afterfire science and flame preview
Source branch: agent/ep005-02-v3-flames. Built from V3 verified commit ce7316b364f96721b39100841eb386724ccf2d52.
This project is an *isolated eight-second silent demonstration*, not the EP005 final film.
No original narration has been provided or reproduced.

## Critical mount contract with Agent 1
- Exactly two unique named Object3D instances under V3 vehicle:
  `mount:exhaust-tip-left`, `mount:exhaust-tip-right`.
- Each has `userData.direction: [x,y,z]` as a *unit vector in the mount's own local axes*, pointing **out of the tailpipe**, and `userData.radius` in metres. The mount's physical position is the true tip lip; transform inherited from body-shell.
- `readExhaustMounts(vehicle)` converts to vehicle-local port pose after the full absolute-frame vehicle update; `createAfterfireRig(vehicle)` attaches real 3D flame under each named mount. It throws on missing/provisional ports.
- Agent 1 must publish exact tip origin, orientation, radius, transforms, and clearance verification. No guess accepted as a final interface.
- Only this test preview calls `addProvisionalPreviewExhaust`; production integrations must not.

## API
`sampleAfterfire(frame,fps,engineState,exhaustMounts)` is pure and returns per-port amplitude/length/phase/mode. `animateAfterfireRig(rig,sample)` animates attached 3D geometry and light by absolute frame. `createAfterfireCutaway()` returns editable V3 Registry+Assembly manifold/catalyst/muffler/tailpipe components and illustrative gas-flow markers. The V8 is an existing V3 asset. Parts and plumbing are not fitted OEM parts.

Modes are condition gated: `overrun` additionally requires low throttle, `antiLag` and `ignitionCut` are distinct optional inputs. The sampler does **not** infer combustion from RPM or all acceleration. Exhaust temperature is a *visual threshold proxy*, not a physical ignition predictor. No universal horsepower gain claimed.

## Commands
```sh
npm ci
npm run check
node --experimental-strip-types --test tests/ep005/*.test.mjs
npm run kit:validate -- ep005-a2-flames
npm run kit:plan -- ep005-a2-flames
npm run kit:inspect -- ep005-a2-flames
npm run kit:preview -- ep005-a2-flames
npm run kit:review -- ep005-a2-flames --moving
npm run kit:render -- ep005-a2-flames
npm run kit:handoff -- ep005-a2-flames
```
Inspect native 1080x1920 30fps MP4 in addition to tests. A passing source validation is not rendered evidence.
