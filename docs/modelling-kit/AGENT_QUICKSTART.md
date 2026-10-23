# Production-agent quick start

Start with the [one-file recipe studio](../YUNEX_AGENT_STUDIO.md) to create complete videos with `kit:create`, `kit:validate` and `kit:render`. Four editable 18-second starters cover braking, powertrains, F1 and rainy night driving.

For the new world/driving/camera APIs and verified native previews, read the
[Premium Studio guide](PREMIUM-STUDIO-UPGRADE.md) and
[22 October QA handoff](STUDIO-QA-2026-10-22.md).

Use the existing V2 branch/PR while it remains draft. Do not copy these files into
an episode-specific replacement kit. Preserve the legacy world/parts factories.
Metres, +X forward, +Y up, +Z left; local road plane Y=0.

## Pick a vehicle and an animation

```tsx
import {CinematicVehicle} from '../../src/yunex/modelling-kit/components';
import {animationPreset} from '../../src/yunex/modelling-kit/presets';
const frame = useCurrentFrame();
const {fps} = useVideoConfig();
// Inside a ThreeCanvas, with lighting and camera:
<CinematicVehicle
  options={{variant:'hot-hatch',quality:'hero',driver:true,steeringSide:'right'}}
  state={animationPreset('driver-reaction',frame,fps)}
/>
```

Use the rig directly outside React with `createCinematicVehicle(options)` and
`animateCinematicVehicle(model,state)`. Build once; update the same object from
absolute frame/state inputs; dispose it with `disposeObject(model)` when finished.
Omitted state controls return to rest, so reverse seeks do not accumulate drift.

## Select the shot's controls

| Need | Options/state |
| --- | --- |
| Intact exterior | `quality:'hero'`; leave `driver` omitted |
| Cabin with occupant | `driver:true`, leave `interior` enabled |
| Mechanical reveal | `cutaway:0.95`, optional `highlight:'engine'` |
| Parts separation | `exploded:0..1` (illustrative presentation mode) |
| Steering | `steer` in radians |
| Driver motion | `braking:0..1`, `impact:0..1` |
| Failed tyre | `tyreDamage:0..1`, `damagedWheel:'front-left'`, absolute `failureFrame` |
| Formula skid/sparks | Formula vehicle plus `compression:0.05..0.12` |
| Fast fleet/background | `quality:'lightweight'` legacy geometry/motion |

Available presets: `tyre-failure`, `emergency-braking`, `collision-rewind`,
`floor-sparks`, `engine-cutaway`, `suspension`, `driver-reaction`.
Presets return state only; they do not move a vehicle along an environment route.
Use the existing route API or camera tracking to show genuine forward travel.

## Inspect, export, render

`KitA` = exterior heroes, `KitB` = tyre failure, `KitC` = Formula floor,
`KitD` = seated driver reactions, `KitE` = three fitted mechanical layouts.
Each has a `Portrait` composition. Source compositions use native 30fps.

```bash
npx remotion studio src/yunex/modelling-kit/entry.tsx --no-open
node scripts/modelling-kit/review.mjs --id=KitDPortrait
node --experimental-strip-types scripts/modelling-kit/export.mjs
```

Inspect the actual moving MP4 before using a shot: wheel/hand/pedal contact,
car and barrier framing, belt routing, cabin clearance, tyre road clearance and
subtitle safety. Test coverage establishes repeatability and gross bounds, not
individual approval of every vehicle or all internal collisions.

The driver is a generic adaptable mannequin. Human reaction poses, damage,
fragments, suspension and contact sparks are scripted illustrative mechanics.
Do not describe them as validated injury, crash or engineering predictions.
GLBs export baked poses; recreate the TS rig for runtime damage/driver controls.
