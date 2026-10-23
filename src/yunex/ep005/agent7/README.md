# EP005 — Agent 7 independent afterfire / mechanical science source

**Status: appearance-approved V4 hero identified; science/fixture native proofs exist, but V4 CAR-INTEGRATED afterfire is still pending Agent 6's NEW moving port ABI and visual QA.** No reuse of rejected Agent 2 flame shots, no changes to Agent 6 or 8 files.

## Sources
- `ports.ts`: strict versioned Agent 6 named-mouth ABI; read true mouth origin and outward normal each absolute frame with `Object3D.localToWorld` / `transformDirection`. No fallback world positions. Units = metres, Three +Y up, local vehicle rig from Agent 6; validate outer outlet diameter 0.075–0.16 m (visual acceptance target 0.105–0.120 m).
- `afterfire.ts`: original GPU turbulent multi-sheet moving flame, rapid blue/white ignition core to yellow/orange tongues, finite duration pulses, two world-anchored jets, localized point-light spill. This is cinematic illustrative afterfire, **not** CFD/calibrated chemistry.
- `science.ts`: original illustrative 3D V8 scene with actual cylinders, movable pistons/rods and crank, intake manifold, eight individual connected headers, two collectors, flow along true connected exhaust tubes. No hovering block flowchart.
- `Proofs.tsx` and `entry.tsx`: 1080x1920 30fps, independent `Agent7FlameFixture` (3s) and `Agent7Science` (5s). **Fixture plate is NOT the Agent 6 car.** Final hero shot is blocked by the missing Agent 6 manifest and explicit owner hero-car approval.


## OWNER-APPROVED V4 HERO ONLY — Candidate A/B invalid

On 23 Oct 2026 the owner approved the **EXTERIOR APPEARANCE** of the teal V4-A supercar from the actual 14s video:
- Kit preview commit `9052a539e10a7cb97487c1435455bb9962ad58e1`, project `v4-a-supercar`, vehicle `supercar`, `bodyDetail:'studio'`, paint `#18636b`.
- Reference: [V4-A actual 14s preview artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39866437063/artifacts/12465297894), original video SHA256 `1654a5efd3a3403871b0a52a3140a9e7aeb1222a2e4bd4242e6edaa8d879cd88`.
- [Owner/manager appearance approval](https://github.com/YunRah2103/Remotion-gpt-chat/issues/247#issuecomment-6355059494).

**Important:** Agent 6 previous Spectral CC0 car (Candidate A), Khronos CarConcept B, and ALL their coordinates/manifests are invalid for this V4 car. Do not reuse `exhaust-ports.v1.json` or the old `sampleExhaustWorld` from Candidate A. Agent 6 issue #265 / draft PR #270 must publish the **NEW V4-native physical nozzles** and world-space moving samples.

`adaptApprovedV4WorldPorts(raw,frame,lock,fps)` on `ports.ts` enforces identity, required latest V4 source/provenance metadata, frame equality, two coherent ports with plausible dimensions and moving world-space axis. Lock must be assembled from Agent 6's **genuine new** source commit, port-manifest SHA256 and exact approval ref, NOT made-up values. It is an admission check, not an assertion that any input video was rendered or approved. The editor additionally verifies real native media SHA256 and human sign-off.

The existing `adaptAgent6WorldPorts` is a low-level converter retained for unit-test compatibility; by itself it does **NOT** prove that samples come from the accepted V4. It must never be called directly to admit a production hero shot. Only `adaptApprovedV4WorldPorts` may admit Agent 6's new V4 port data.

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
The PR workflow produces contact sheets, decode logs and native MP4 artifacts. The science-only cutaway now fits more of the V8 on a portrait frame and uses the SAME multi-layer turbulent afterfire shader at the **science model's illustrative outlet** instead of schematic cone flames. Those positions are local to the illustrative assembly, never claimed as the V4 car's ports. Source presence/green TypeScript is **not** a visual-quality pass. Agent 7 must inspect all video frames at 0s/peaks/tail and conduct final live-port integration after receiving the manifest.

## Acceptance blockers
1. Agent 6 must reproduce the **approved V4 exterior**, publish measured NEW V4 named exhaust-mouth transforms / moving world samples and actual 1080x1920 moving driving MP4(s); get action/flame pixel acceptance. Approval of the CAR LOOK alone does not approve the shots.
2. Agent 8 must confirm shot durations and approved narration/word-timings.
3. Latest code's own CI MP4 artifact must be FFprobed, fully decoded and actual moving-picture frames inspected; post SHA256, render head and run/artifact IDs. Previous revisions do not transfer approval.
4. No merge or picture lock before all three gates.
