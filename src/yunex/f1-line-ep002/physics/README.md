# YUNEX F1 Racing Line EP002 — Agent 2 dynamics handoff

**Scope:** representative, deterministic engineering illustration; this is **not** a validated current Formula 1 car, tyre, aerodynamic map, vehicle dynamics lap simulator or measured F1 telemetry.

## Authoritative API
```ts
import {makeRaceSimulator} from '../physics/index.ts';
import {makeRacingLinePath} from '../track/racingPaths.ts'; // Agent 1 (once integrated)
const race=makeRaceSimulator({
  shortcut:makeRacingLinePath('shortcut'),
  racing:makeRacingLinePath('racing'),
});
const state=race.sample(frame,fps); // identical car handling, independent of render order
const report=race.comparison; // signed measured timing, never a forced winner
```

The `sampleRaceFrame(frame,fps,paths?)` convenience API also accepts A1's two immutable `RacePath` objects (cached by object identity, with no mutable motion integrator). `CarFrameState.travelDistanceM` is the actual arc travelled and must be passed to the world-kit `Vehicle.distance` for wheel rotation. `worldPose.yaw` and `steerRad` come from the same path. The `+X`-forward single-seater rotates towards `-Z` as *positive* yaw/curvature/steer increases on this right-hand turn. Both cars use identical `formula-modern` meshes.

## Physical assumptions (SI units, declared in simulation.ts)

- Identical mass **800 kg**; gravitational acceleration **9.81 m/s²**.
- Illustrative effective slick-tyre friction coefficient **1.5**; an idealized *combined-force circle*, not a slip/temperature-dependent Pacejka tyre.
- Vertical downforce **2.4 N/(m/s)² × speed²**; aerodynamic drag **0.55 N/(m/s)² × speed²**. This is a synthetic plausible-envelope model, not a claim about actual F1 aerodynamic coefficients.
- Drive acceleration cap **6 m/s²**, brakes **9 m/s²**, power cap **340 kW** and modelling speed ceiling **47 m/s**. The requested equal entry speed **23 m/s** is a maximum; if either route requires earlier braking, *both* enter at the same lower **feasible** speed.
- The local required lateral tyre acceleration is **speed² × |path curvature|**. Normal load is **mass × gravity + downforce**; available tyre force is **mu × normal load**. Available longitudinal force is the remaining radius of the friction circle after lateral tyre demand.
- Each arc sample has a curvature-based upper speed limit. Iterated **backward** passes solve how much speed can be lost safely before a tight segment, and **forward** passes limit throttle by engine power, combined grip and drag. Local time is integrated as **2 × Δs/(v_start + v_end)** for constant-acceleration segments; querying any Remotion frame interpolates within that integral without numerical drift.
- No fake acceleration, speed, overtakes or advantageous starting offset is inserted into the model.

## Fair timing gate
Both `RacePath` objects must have **identical physical start and finish** checkpoints (within 0.5m centre-to-centre). Mismatched endpoints fail before a winner is calculated. Signed finish margin is *A finish time minus B finish time*. The result may favour A, B or tie and is always recalculated when the geometry changes. It is **not** a prediction of who wins every corner.

**Integration blocker observed on A1's initial branch:** A1's `-2.8m` inside path and `+2.8m` outside path had different physical entry and finish centres. Agent 2 has requested smoothing them into shared start/end gates via Issues #159 and #158. Never bypass these guards or copy fixture metrics onto A1 paths.

## Demonstration and QC
The temporary fixture starts and finishes at exactly the same world point on the original 12m-wide `track` scene. It is arc-length sampled from the world's existing Catmull–Rom route around `[65,0,18]`. The more severe `-4m` inside approach geometrically shortens A's path but forces A to reduce speed under the identical grip envelope. B's `+3m` wide approach moves towards the centre for a late apex and returns wide on exit. Full width of formula-modern is 1.98m, leaving more than 1m asphalt margin with the max centre offset. This is a deliberately illustrative controlled scenario, not A1's final authoritative curve.

The automated agent-owned workflow runs `npm ci`, `npm run check`, `npm run worldkit:test`, and nine Agent-2 physical tests, writes `out/f1-agent2-physics-report.json`, renders two separate native Remotion H.264 MP4s with software WebGL, executes FFprobe/full FFmpeg decode, counts unique frame hashes and creates multi-frame contact sheets. **Existence of the workflow or a successful test step is not by itself proof that the movies exist or look good.** Use the resulting run/artifact ID and visual inspection before final manager signoff.
