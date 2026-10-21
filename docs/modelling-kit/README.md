# YUNEX modelling kit V2 — first working slice

An opt-in Three.js rig on top of the current 35 vehicles and 55 parts. Existing
`createVehicle`, `animateVehicle`, `createPart`, `animatePart`, environments,
episode compositions and exporters are unchanged. No external assets or GPU service.

## Use

```ts
import {createCinematicVehicle, animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
const car = createCinematicVehicle({variant:'hot-hatch', quality:'hero',
  color:'#2368b6', paintPreset:'lacquer', tyreType:'road'});
animateCinematicVehicle(car, {frame:90, fps:30, distance:18, steer:0.08,
  compression:0.02, tyreDamage:0.8, damagedWheel:'front-left',
  cutaway:0, exploded:0, bodyDamage:0, heat:0.4});
// Seek backwards with absolute values. Omitted controls reset to their defaults.
animateCinematicVehicle(car, {frame:0, fps:30});
```

In Remotion/R3F, use `CinematicVehicle` inside the existing `ThreeCanvas`:

```tsx
const frame = useCurrentFrame(), {fps} = useVideoConfig();
<CinematicVehicle options={{variant:'formula-modern',quality:'hero'}}
  state={{frame,fps,distance:frame/fps*10,compression:0.065,
    cutaway:0.85,highlight:'underfloor'}} />
```

All positions use metres; +X forward, +Y up, +Z left. Steering is radians, positive
rotation about +Y. `compression` is 0..0.12 metres of requested body travel; the Formula
skid limits actual travel to 0.05 m at ground contact. Other progress/heat controls
are 0..1. Damage selects `front-left`, `front-right`, `rear-left` or `rear-right`.
`highlight` supports `engine`, `underfloor` and `wheels`. The engine mount is forward
on normal cars, behind the cockpit on sports/Formula cars. These are generic mounts,
not manufacturer CAD. Do not describe these animations as validated simulations.

## Catalogue and quality levels

| Tier | Coverage | Added work |
| --- | --- | --- |
| lightweight | All 35 legacy variants | Original vehicle; rolling/steering only |
| standard | All 35 variants, regression exercised | Smooth welded body normals, mounted engine where applicable, suspension, tyre/body deformation, cutaway/explosion |
| hero | Initial showcased presets: hot-hatch, supercar, formula-modern | Standard features, instanced rolling tread, sidewall moulding, lacquer/satin tuning |

Hero is an inspection/detail tier, **not a claim of finished premium exterior modelling**.
The existing silhouettes, lights, glazing, interiors and wings are retained. The
Formula preset adds a distinct carbon floor, tan composite plank and metallic skids.
Cutaway progressively sections the carbon panel so plank and skid remain visible.
Other variants accept hero detail but have not all received individual visual review.

Named groups: `body-shell`, `engine`, `underfloor`, `carbon-floor`, `composite-plank`,
`metal-skid`, `mount-front-left` etc., `wheel-roll`, `wishbone`, `damper`, `coil-spring`,
`rubber-fragments`, `contact-sparks`. Legacy factory pivot names remain unchanged.
Calipers remain outside the rolling node. Dispose a model with existing `disposeObject`.

## Damage, cuts and export

Tyre carcass vertices deform from rest vertices, with a flat road contact region;
rigid tread/bead detail hides progressively after failure. Small rubber fragments
follow repeatable prescribed trajectories. Body damage is a small local dent near
the front fender. Both restore exactly when seeking back. `createImpactBarrier()`
and `animateImpactBarrier(barrier, impact)` provide a reversible corrugated rail bend.
There is no collision detection: the production agent drives impact progress.

Exploded view is a presentation mode: wheels separate laterally, the shell and mounted
engine lift; suspension links stay connected to their assigned endpoints. It is not
a physical disassembly solver. Formula sparks appear only when the named metal skid
reaches the flat local ground plane; vehicle speed is not an energy/contact simulation.
The car should remain at groundY=0. Banked/uneven roads need a ground-relative adapter.

GLB export produces intact and mechanical **baked poses**, roundtripped through
GLTFLoader with wheel and geometry checks. The WeakMap runtime rig is not serialized;
recreate the TypeScript rig for damage/cutaway animation. Existing legacy GLB motion
metadata remains available, but V2 damage is not a portable GLB animation clip.

## Reproduce

```
npm ci
npm run check
node --experimental-strip-types --test tests/modelling-kit/*.test.mjs tests/world-kit/*.test.mjs tests/parts-kit/*.test.mjs
node --experimental-strip-types scripts/modelling-kit/export.mjs
node scripts/modelling-kit/review.mjs --compare
node scripts/modelling-kit/review.mjs --portrait
python scripts/modelling-kit/verify.py
```

Native compositions are 1920×1080 / 1080×1920, 24 fps. CPU inspection exports are
960×540 / 540×960, 12 fps (explicitly not full-resolution final films). Demo A is 9 s;
B/C are 6 s. No narration or audio is added. Use the composition directly for full
resolution. The workflow saves six MP4s, stills, GLBs, timings and decode evidence.

## Scope still outstanding

Bespoke higher fidelity body shells, a redesigned Formula aero package, wheel-rim
fracture, a shredded/open tyre mesh, connected turbo airflow, full vehicle drivetrain,
impact impulses and a per-environment V2 refresh remain future work. Existing 20
worlds are preserved; the demos add their own shared procedural track/studio stage.
The demonstrations do not replace EP003/EP004. A nominal three-vehicle showcase is
not evidence that all 35 vehicles are visually approved. See QA.md for actual evidence.

For three-axle tractor units, the additional axle uses `rear-aux-left` /
`rear-aux-right`; the two rear axles never share a damage selector.
