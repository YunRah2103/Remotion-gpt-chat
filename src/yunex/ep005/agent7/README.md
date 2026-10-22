# EP005 — Agent 7 independent afterfire / mechanical science source

**Status: UNAPPROVED R&D SOURCE / NATIVE RENDER PENDING.** Owner and Agent 0 must review actual moving footage. No reuse of rejected Agent 2 flame shots, no changes to Agent 6 or 8 files.

## Sources
- `ports.ts`: strict versioned Agent 6 named-mouth ABI; read true mouth origin and outward normal each absolute frame with `Object3D.localToWorld` / `transformDirection`. No fallback world positions. Units = metres, Three +Y up, local vehicle rig from Agent 6; validate outer outlet diameter 0.075–0.16 m (visual acceptance target 0.105–0.120 m).
- `afterfire.ts`: original GPU turbulent multi-sheet moving flame, rapid blue/white ignition core to yellow/orange tongues, finite duration pulses, two world-anchored jets, localized point-light spill. This is cinematic illustrative afterfire, **not** CFD/calibrated chemistry.
- `science.ts`: original illustrative 3D V8 scene with actual cylinders, movable pistons/rods and crank, intake manifold, eight individual connected headers, two collectors, flow along true connected exhaust tubes. No hovering block flowchart.
- `Proofs.tsx` and `entry.tsx`: 1080x1920 30fps, independent `Agent7FlameFixture` (3s) and `Agent7Science` (5s). **Fixture plate is NOT the Agent 6 car.** Final hero shot is blocked by the missing Agent 6 manifest and explicit owner hero-car approval.


## Agent 6 real interface now found (PR #270 — STILL UNAPPROVED)
Agent 6 branch `agent/ep005-06-hero-car-proof-cc0` introduced `src/yunex/ep005/agent6/exhaust-ports.v1.json`, which specifies 0.114m metal outlet OD and 0.041m bore radius on each side, and an exported `sampleExhaustWorld(car, frame)` in their proof source. The manifest's **corrected vehicle-local** axes and the helper's **pre-correction GLTF-local** sample call are not interchangeable. To prevent double-applying the correction, consume exactly the *already-transformed* live world samples:
```ts
// Inside a future approval-gated Agent 6 integration scene:
const measuredWorld = sampleExhaustWorld(actualAgent6Car, frame);
const ports = adaptAgent6WorldPorts(measuredWorld, frame, 30);
animateAfterfire(afterfireRig, ports, frame/30, pulses, currentVelocity);
```
Both `sampleExhaustWorld` and the actual car instance MUST be provided by Agent 6's published approved shot integration, not imported from its Remotion `entry.tsx` registration module. This adapter is in `ports.ts` and deliberately copies world transforms WITHOUT applying a second model transform. Its 105–120mm OD safeguard matches the agreed aesthetic gate. The local named-node adapter remains available for a future verified v1 named-mount carrier.

## Mandatory integration — Agent 6
Publish an exact `ExhaustMountManifest` (`ports.ts`):
```ts
{
 version:1,owner:'agent6',coordinateConvention:'three-y-up-metres',
 mounts:[
  {id:'left',nodeName:'THE_REAL_NAMED_NODE_FROM_AGENT_6',mouthOffset:[/* x,y,z */],
   outward:[/* x,y,z */],innerRadiusM:/* measured */,outerDiameterM:/* measured */},
  {id:'right',nodeName:'THE_REAL_NAMED_NODE_FROM_AGENT_6',mouthOffset:[/* x,y,z */],
   outward:[/* x,y,z */],innerRadiusM:/* measured */,outerDiameterM:/* measured */}
 ]
}
```
There are **no valid guessed example numbers**. Get actual transforms from Agent 6. Each rendering frame:
```ts
const ports = sampleActualPorts(movingCar, agent6Manifest, frame, fps);
animateAfterfire(afterfireRig, ports, frame / fps, pulses, vehicleWorldVelocity);
```
Add `afterfireRig.root` to the same **world scene** as the moving car, not under bumper/body transforms again; ports are already world-space. Flame local +X is rotated onto the live outward normal, including yaw/pitch/suspension. Sync pulses to actual throttle-lift/overrun, including a visible first-frame burst. Reject absent/duplicate mounts or invalid dimensions. Do not expand metal openings to fit wide plumes.

## Agent 8 editor timing request
Provisional until real approved narration / exact 25s picture cut:
- 0.0–1.8s: verified Agent 6 **moving rear 3/4 hero**, flame on at f0 and off/on as short pulses, never fixture as final.
- 7.0–10.0s: cylinder combustion and pistons.
- 10.0–13.0s: some unburned fuel, hot exhaust and connected flow.
- 13.0–16.0s: condition-specific short outlet ignition; catalyst caveat.
- 21.0–25.0s: dynamic car driving + new afterfire bursts.
Phone-safe captions within middle/bottom zones, no overlapping editor subtitles. Scientific phrasing: *some tuned performance cars may emit unburned fuel on overrun; it can briefly ignite in hot exhaust if oxygen is present*. This is NOT inherent to every supercar; stock catalysts can prevent visible flames.

## Run on an actual repo checkout
```sh
npm ci
npm run check
node --experimental-strip-types --test tests/ep005-agent7.test.mjs
npx remotion render src/yunex/ep005/agent7/entry.tsx Agent7FlameFixture out/ep005/agent7/flame-fixture.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
npx remotion render src/yunex/ep005/agent7/entry.tsx Agent7Science out/ep005/agent7/science.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
ffprobe -v error -show_streams out/ep005/agent7/science.mp4
ffmpeg -v error -xerror -i out/ep005/agent7/science.mp4 -f null -
sha256sum out/ep005/agent7/*.mp4
```
The PR workflow produces contact sheets, decode logs and native MP4 artifacts. Source presence/green TypeScript is **not** a visual-quality pass. Agent 7 must inspect all video frames at 0s/peaks/tail and conduct final live-port integration after receiving the manifest.

## Acceptance blockers
1. Agent 6 must publish true named exhaust-mouth transforms + moving hero car proof, and gain explicit owner acceptance.
2. Agent 8 must confirm shot durations and approved narration/word-timings.
3. CI MP4 artifact must be decoded and watched; quality review and native SHA256 must be reported.
4. No merge or picture lock before all three gates.
