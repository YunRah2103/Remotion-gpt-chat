# YUNEX EP006 Agent 1 — mechanical vehicle handoff

Issue: #287. Isolated 3D source: `src/yunex/ep006/vehicle/index.ts`.

## V4 baseline and scope

`createEp006RallyVehicle()` calls the **existing**
`createCinematicVehicle({variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true})`.
It retains the sculpted studio body, four original axle pivots, wheel-roll meshes,
rally gravel tyre/tread detail, steering, cabin and occupant. The original
low-travel linkage groups are only hidden **on this fresh EP006 instance**,
replaced by connected four-corner suspension. No shared kit files were changed.

The additional scene nodes on each axle include paired forged upper/lower arms,
connected end bearings, twelve-turn springs, sliding chrome piston in a shock
casing, bump stops, and articulated drive axle/CV boots. The body-shell receives
crossmembers, rocker protection, diagonals, fitted armour and mounting fasteners.
Rim/hub geometry stays circular; tyre carcasses use a bounded contact-only
vertex displacement and return to full roundness in flight.

## Coordinates and Agent 2 integration

Metres, +X forward, +Y up, +Z left; original wheel axle pivot positions are
read directly from `mount-front-left`, etc. The supplied pose type
`Ep006MotionPose` mirrors the shared EP006 production contract exactly.
Call `applyEp006RallyPose(car,sampleEp006Motion(absoluteFrame))`; the adapter
does **not** import dynamics, change the ground surface, or fabricate physics.

`ep006RallyHardpoints(car)` returns four corners with hub rest positions, upper
strut and lower attachment positions, paired inboard hardpoints, and travel
bounds. All these are **vehicle-root local**, not world-space; use the body's
rotation/translation for world positions.

| Mechanical limit | Value |
|---|---:|
| Wheelbase | 2.62 m |
| Tyre nominal radius | 0.36 m |
| Compression (hub up from static) | +0.092 m maximum |
| Droop (hub down from static) | −0.155 m minimum |
| Total wheel-hub travel | 0.247 m |
| Contact-only bottom carcass flattening | ≤0.022 m |

**Agent 2:** sample bounded `compressionM` relative to chassis using the
above sign convention, return the full wheel-specific contract, and keep tyre
contact consistent with your agreed terrain height. Don't put tyre forces on
airborne wheels. The vehicle adapter **does not solve contact or infer pose
height** from supplied ground height; the dynamics solver remains authoritative
for `positionM`, including chassis impact/rebound.

`spinRad` is an **absolute** wheel roll angle; forward distance in +X usually
gives negative radians, matching V4 `animateVehicle`. Wheels use their original
radius and are never rescaled to simulate compression. Steering remains limited
to ±0.7 radians. Applying a frame twice or out of order is deterministic.

## Proof versus actual jump

`sampleEp006VehicleFixture(frame)` exists **solely** for six seconds of independent
rig demonstration while Agents 2 and 4 are unfinished. It is NOT calibrated
ballistic/terrain physics. The native `Ep006Agent1VehicleProof` composition
inspects front, side, rear, airborne droop, touchdown compression and rebound.

```sh
npm ci && npm run check
node --experimental-strip-types --test tests/ep006-agent1/vehicle.test.mjs
npx remotion render src/yunex/studio-projects/ep006-a1-vehicle/entry.tsx Ep006Agent1VehicleProof \
  out/ep006/agent-01/vehicle-proof.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=2
```

The agent-1 CI workflow runs the above from a frozen commit and uploads the
silent 1080×1920 / 30fps H.264 MP4 plus metadata, hash and sampled visual
frames. Tests/hash/full decode are **technical checks**, not human aesthetic
sign-off. Agent 0 must inspect moving footage and review integration before merge.

## Known limitations and future review

- This is an illustrative mechanical model, not measured damper forces or a
  homologated rally-car suspension.
- A central skid plate intentionally supplements the original V4 sump guard.
- Grounding depends on Agent 2/4 sharing one collision surface; raw fixture
  movement is not a substitute for a validated contact simulation.
- Tyre rubber receives vertex-level flattening, while highly detailed tread
  instancing remains rigid at the small contact-patch scale.
- Before final integration, inspect front/rear clearance and fast contact shots
  on **the agreed environment surface** at maximum travel.
