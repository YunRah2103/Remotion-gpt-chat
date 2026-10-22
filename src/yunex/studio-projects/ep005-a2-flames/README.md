# YUNEX EP005 Agent 2 — real-mounted turbulent exhaust afterfire

**Branch:** `agent/ep005-02-v3-flames`. Native render: `ep005-a2-flames`.
**Source origin:** verified V3 `ce7316b364f96721b39100841eb386724ccf2d52`.
**Agent 1 reviewed geometry snapshot SHA:** `8ba7a9624fc56973fa52658ef8d2600368dfc17a`, copied **without altering the Agent 1-owned branch** into `production/yunex/supercar_flames_ep005/flames/hero-reference/**` for the **isolated A2 film only**. The manager should use the live Agent 1-owned factory on eventual integration, not carry this snapshot as a new canonical hero.

## Real exhaust binding and flame API

- `createEp005Hero()` builds the un-cloned V3 rig including actual hollow nozzle shrouds and physical outlet mounts under `ep005-left/right-exhaust-tube`.
- `mount:exhaust-tip-left` at `[-2.465,0.420,+0.570]`, `mount:exhaust-tip-right` at `[-2.465,0.420,-0.570]` (metres; car +X forward). Exit directions `[-1,0,0]`, bore radius `.085`, outer barrel radius `.105`.
- `createAfterfireRig(vehicle)` now works **without provisional sockets or radii overrides** against that A1 factory by reading `mount.userData.nozzleInnerRadius`. It verifies both ports are children of physically named exhaust-tube components. Invalid/missing ports fail closed.
- `readExhaustMounts(vehicle)` samples local tip transforms after the actual rig pose and route placement. Fire geometries are attached under the named nodes, so do not have static world coordinates.
- The new geometry uses **four tapered turbulent outer surfaces plus two narrow warm cores per tip**, 26 axial rings × 15 angular vertices, vertex-colour and alpha transitions, animated curls, shear and end taper. It contains **no spheres/glowing discs** and uses restrained orange bounce lights.
- Absolute-frame sampling has no random state. `sampleAfterfire(frame,fps,state,ports)` accepts `afterfireDemand` 0..1. For Agent 3 integration, feed `stateFromCinemaDemand(sampleCinema(frame,30).afterfireDemand,sampleCinema(frame,30).throttle)`; no afterfire during normal throttle. Never claim this is CFD or a calibrated ignition model.

## Mechanical explanation

The `createAfterfireCutaway()` V3 `ComponentRegistry` and `createAssembly` creates connected V8, headers/collector, internal catalyst channels, muffler baffles and actual pipe exit. The isolated **mechanism** shot hides road geometry and frames the entire assembly from a fixed legible portrait side view. Model-attached moving flow markers are schematic, not simulated gas particles. Caption explains that unburnt fuel can ignite downstream in hot exhaust **under some operating and tune conditions**; no universal performance-gain claim.

## QA

```sh
npm ci
npm run check
node --experimental-strip-types --test tests/ep005/*.test.mjs
npm run kit:validate -- ep005-a2-flames
npm run kit:plan -- ep005-a2-flames
npm run kit:inspect -- ep005-a2-flames
npm run kit:render -- ep005-a2-flames
npm run kit:handoff -- ep005-a2-flames
```

The workflow `.github/workflows/ep005-agent2-afterfire.yml` runs these with independent native 1080×1920 / 30fps FFprobe, full FFmpeg decode, distinct frame hashes, nine-frame contact sheet, SHA256. It outputs a **silent eight-second development film**, not finished EP005. Human moving-film review of f0–30, tailpipe close-up, cutaway framing and payoff is still mandatory; technical checks alone are not visual approval. Agent 3 picture timeline is **750f** with afterfire windows f0–29, f430–489 and f674–709. No unauthorized original narration is generated.

**NO MERGE.** Agent 0 approves source and exact video SHA only after viewing the native artifact; Agent 5 may then integrate into the 25s picture baseline.
