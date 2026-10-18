# F1 EP002 — Agent 2 / Real Geometry Authoritative Physics

**Source of truth:** PR #166's corrected and on-track `track/racingPaths.ts`, copied *verbatim* into PR #168 and imported by `physics/index.ts`. The temporary test fixture is retired. No proxy corner geometry, no assigned winning car and no fake overtakes.

## Integration API for Agents 3, 5 and 6
```ts
import {
  raceSimulator, sampleRaceFrame, getRaceComparison,
  AUTHORITATIVE_RACE_PATHS, REPRESENTATIVE_F1_CONFIG,
  makeRaceSimulator
} from './physics/index.ts';

const state = sampleRaceFrame(frame, fps);
const a = state.cars.shortcut; // car A: teal, real A1 inside-line pose
const b = state.cars.racing;   // car B: amber, real A1 wide-apex-wide pose
const report = getRaceComparison(); // signed measured result at identical finish
// Alternate: const state = raceSimulator.sample(frame,fps)
```

Each `CarFrameState` contains `worldPose.position`, `worldPose.yaw`, `worldPose.curvatureInvM`, `speedMps`, `pathDistanceM`, `travelDistanceM`, `steerRad`, `longitudinalAccelMps2`, `lateralAccelMps2`, `gripUtilization01`, `brake01`, `throttle01`. The `Vehicle` kit consumes `worldPose` as pose, `travelDistanceM` as rolling distance and `steerRad` as tyre steer. **Never apply a second yaw rotation or advance wheels with frame counts.**

The simulation caches immutable paths and integrates a bounded, forward/backward arc-length speed profile before playback. Any Remotion frame is a pure lookup at `frame/fps`; render-order/parallelism/frame seeking do not change vehicle positions or timing. Agent 3 must sample the same race state and follow its positions instead of animating cars independently. Agent 5 must read these calculated values, not type speed labels or a B advantage manually.

## Fairness rules and gates
Both `RacePath` objects must start and finish at **identical physical world coordinates** (within a 0.5m defensive runtime limit and 1e-6m test accuracy). Both cars receive exactly the same geometry, mass, grip, aero, wheelbase, power, brake cap, drive cap, initial feasible entry speed and conditions. Strong early path curvature may force a shared entry speed lower than the declared maximum; the slower *feasible* value is imposed on **both** cars rather than allowing a head start. The simulation throws if start/end checkpoints differ.

The signed `racingFinishAdvantageSeconds` = *time A arrives at the common finish minus time B arrives*. Positive values favour B, negative values favour A, zero is a tie. `fasterAtCommonFinish` is derived **only** from this numerical difference. A positive B lead is not hardcoded anywhere. If PR #166 geometry is revised, use that exact geometry, regenerate the report and rerun preview QC. Never claim telemetry from the old temporary fixture.

## Declared illustrative physics assumptions (not real F1 telemetry)
- 800kg, gravity 9.81m/s²; both identical `formula-modern` cars.
- Synthetic effective tyre friction coefficient 1.5; combined circle of longitudinal and lateral contact-patch forces, independent of temperature/slip/individual wheels.
- Downforce `2.4*v²` newtons, drag `0.55*v²` newtons. Normal load = `mass*g + downforce`; lateral demand = `mass*v²*abs(curvature)`.
- Longitudinal force bounded by residual combined grip, nominal 9m/s² braking, 6m/s² acceleration, a 340kW motor and aero drag.
- Representative speed ceiling 47m/s and requested entry speed cap 23m/s; this is an illustrative corner demonstration rather than real motorsport setup optimization.
- Numerically constrained backward braking and forward drive through the exact A1 arc-distance curvature and time integral; no scripted pass, winner, time delta or speed advantage.

## Two native movie demonstrations
`src/yunex/f1-line-ep002/agent-2-preview/entry.tsx` includes `F1Agent2PhysicsDuel` and `F1Agent2GripVectors`. Both use A1 circuit/trajectory, original `Environment kind="track"` and **two identical** `Vehicle variant="formula-modern"` models. The comparison is explicitly a **ghost replay**, not an unsafe simultaneous side-by-side overtake. To avoid showing colliding physical vehicles when the two alternate paths touch at common gates, the duplicate ghost is hidden for centres less than 2.7m apart; it returns once separated. Braking/throttle/lateral tyre forces are drawn in real 3D, not an animated static dashboard.

Agent-specific CI renders genuine H.264 via `--gl=swangle`, converts to limited-range 4:2:0, FFprobes pixel format/dimensions/fps/frames, fully decodes each movie, checks distinct frame hashes and emits contact sheets and a machine-readable report. Passing unit tests does **not** prove visuals are attractive: inspect actual multi-time frames before approval.

## Required machine report
`node --experimental-strip-types tests/f1-line-ep002/agent-2-report.mjs` writes `out/f1-agent2-physics-report.json`, showing **the real A1 path lengths**, exact shared checkpoint error, entry speeds, corner minimum speed, apex/exit speeds, elapsed times and signed finish advantage. Do not quote numbers until that report passes CI for the current PR SHA.

## Final handoff for Agent 6
Preserve baseline `formula-modern` mesh, original 12m circuit and existing episodes. Pull PR #166 and #168, recompute the shared signed metric if geometry changes, and keep the conclusion truthful even when a wider line loses or the finish gap is visually small. Agent 7 owns music/VO; this physics layer owns no narration or fake sound.
