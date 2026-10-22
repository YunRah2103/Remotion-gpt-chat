# Premium automotive studio upgrade

Continues PR #233 on `feat/yunex-modelling-kit-v2`. Baseline is recovered
`b2b2afeb35f081717658bf77f61b66845b52e4ce`. No episode source or legacy factory
is changed. Units and axes remain metres, +X forward, +Y up, +Z left.

## Implemented geometry and worlds

- Road hero exteriors: bevelled open intake rims, recessed hexagonal grille cells,
  separate backing and diffuser channels, fitted to the existing sculpt field.
  Closed EV faces remain closed. Front-engine hatchbacks lose inappropriate side intakes.
- Supercar: additional intake lips and engine-deck louvres.
- Modern Formula: lofted sidepod shoulders/undercuts, inlet lips and connected
  rear-wing supports. Replaced coarse pods are hidden, not overlaid.
- Preserved authored normals through the shell deformation Jacobian and restored
  them exactly after body damage. This avoids clearcoat ripples from clipped
  triangle T-junctions.
- Motorway: overpass with clear-lane piers, acoustic panels, uprights and fasteners.
- City: street-level glazing, awnings, mullions and traffic signals.
- Circuit: tyre stacks, pit-shutter seams and canopies.
- Mountain/scenic families: retaining stonework and coping.
- Garage/showroom: drawer banks, service cans, architectural baffles and softboxes.
- The original 20 environments and route functions remain available. Added detail
  uses instanced batches; `quality:'lightweight'` skips this new dressing,
  `standard` reduces selected small features, and `hero` includes them.

## Reusable deterministic controls

```ts
import {createCinematicVehicle, animateCinematicVehicle,
  createCinematicEnvironment, drivingState, drivingCamera} from
  '../../src/yunex/modelling-kit/index';
import {sampleRoute} from '../../src/yunex/world-kit/environments';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog';

const vehicle = createCinematicVehicle({variant:'hot-hatch', driver:true,
  quality:'hero', steeringSide:'right'});
const world = createCinematicEnvironment({kind:'highway', seed:12,
  quality:'hero', wetness:0.2, timeOfDay:'day'});
const state = drivingState('acceleration', frame, fps);
const pose = sampleRoute('highway', state.distance! - 30);
animateCinematicVehicle(vehicle, state);
vehicle.position.set(...pose.position);
vehicle.rotation.y = pose.yaw;
const camera = drivingCamera('tracking', pose,
  vehicleSpec('hot-hatch'), 9/16, frame/fps);
// Use camera.position/target/fov with CameraAim or a Three.js camera.
```

Actions: `cruise`, `acceleration`, `braking`, `cornering`. Distances use analytic
speed integrals; braking reaches a stop and stays stopped. Route placement is
separate from wheel animation. `cornering` returns an illustrative steering
oscillation; when following a route, derive steering from its tangent curvature,
as the driving review does. These are kinematics, not a vehicle dynamics solver.

Cameras: `tracking`, `chase`, `wheel`, `interior`, `onboard`, `overhead`, `reveal`.
Overview cameras fit padded vehicle bounds for the supplied aspect ratio. Detail
cameras intentionally crop. Tracking views default to the negative-Z carriageway
side; callers still need to inspect scenery occlusion for their chosen route.

`gearChange:0..1` blends the inboard hand from its wheel grip to the existing
console knob. Use a smooth rise/hold/fall envelope. It is supported for seated
road cabins; Formula retains both wheel grips. Omission restores the grip exactly.
Existing steering, braking, reactions, restraint routing and shared internals are
preserved. A single occupant remains opt-in.

## Native review compositions

| ID | Subject | Duration |
| --- | --- | --- |
| KitA / KitAPortrait | Three exterior heroes | 9 s |
| KitB / KitBPortrait | Preserved tyre failure | 6 s |
| KitC / KitCPortrait | Formula contact and floor reveal | 6 s |
| KitD / KitDPortrait | Seated driver, gear reach and reactions | 6 s |
| KitE / KitEPortrait | Shared fitted mechanical layouts | 6 s |
| KitF / KitFPortrait | Motorway acceleration | 6 s |
| KitG / KitGPortrait | Rainy night city driving | 6 s |
| KitH / KitHPortrait | Winding mountain road | 6 s |
| KitI / KitIPortrait | Formula circuit chase | 6 s |
| KitBefore | Legacy vehicle comparison | 2 s |
| KitWorldBefore | Motorway without new cinematic dressing | 6 s |

All native source compositions are 30fps, 1920×1080 or 1080×1920. Review exports
are silent H.264 inspection videos. Use the existing workflow or:

```bash
node scripts/modelling-kit/review.mjs --id=KitFPortrait
node --experimental-strip-types --test tests/modelling-kit/*.test.mjs tests/world-kit/*.test.mjs tests/parts-kit/*.test.mjs
npm run check
```

## Scope still requiring work

This is an additive studio upgrade, not completed premium approval of every
catalogue item. All 35 variants retain compatible existing factories; hero detail
is strongest on the hatchback, supercar and modern Formula. Individual truck/SUV
body sculpting, full vehicle-specific plumbing, more advanced cabin upholstery,
passengers, motorcycle riders, realistic collision deformation and comprehensive
internal clearance remain unfinished. Rain is deterministic streak geometry;
there is no fluid simulation, tyre spray solver or scene-accurate planar reflection.
Scenic roads remain at their original elevation. Camera presets do not solve
arbitrary obstacle avoidance. GLBs remain baked-pose exports, not animation rigs.

Verification and video handoff belong in PR #233 with exact implementation SHA,
workflow and artifact IDs. A successful render is not itself visual approval.
