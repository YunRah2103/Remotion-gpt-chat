# YUNEX modelling kit V2 — continuing upgrade

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
Existing family identities and cabin hardpoints are retained. Hero road variants
get coordinated nose/shoulder surface changes, LED signatures and mounted sport seats;
the modern Formula hero gets shaped multi-element wings, venturi tubes, floor
fences, inboard spring/pushrod detail and rolling aero wheel covers. The
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

Native compositions and default exports are 1920×1080 / 1080×1920, 30 fps.
`--quick` explicitly requests 960×540 / 540×960 at 12 fps. Demo A is 9 s;
B/C are 6 s. No narration or audio is added. Use the composition directly for full
resolution. The workflow requires eleven native MP4s, plus stills, GLBs, timings and decode evidence.

## Scope still outstanding

Complete bespoke exterior retopology, separated wheel-rim fracture pieces, connected
turbo airflow, a full vehicle drivetrain and validated impact impulses remain future work. Existing 20
worlds are preserved. `createCinematicEnvironment({...options, wetness:0.7})` adds
optional road-material tuning; `CinematicStage` adds aggregate, wet sheen, kerbs,
barriers, light poles and a procedural contact-shadow approximation.
The demonstrations do not replace EP003/EP004. A nominal three-vehicle showcase is
not evidence that all 35 vehicles are visually approved. See QA.md for actual evidence.

For three-axle tractor units, the additional axle uses `rear-aux-left` /
`rear-aux-right`; the two rear axles never share a damage selector.

## Continued geometry and damage pass

`failureFrame` optionally sets fragment ejection onset in Remotion frames. Torn
sector topology, rim denting and hanging cords are reversible on seek. Ejected
rubber strips follow a prescribed gravity/bounce path rather than respawning in a
loop. These are visual demonstrations, not a tyre failure prediction model.

`optimize:false` disables static-detail batching for debugging/comparisons. Default
batching combines spokes, bolts, sidewall marks and grille details within their
own parent/pivot and material; tyres, rims and articulated parts stay separate.
Healthy tyre/body geometry updates are cached until damage changes. All existing
35 variants still accept the standard/lightweight tiers; the strongest exterior
changes are in the road families, and the Formula aero pass targets formula-modern.

Full HD review outputs are in `out/modelling-kit-v2-hd`. Render the matched moving
legacy baseline with `node scripts/modelling-kit/review.mjs --id=KitBefore` and
verify with `python scripts/modelling-kit/verify.py out/modelling-kit-v2-hd`.
The baseline shares camera, lighting, paint and environment with the first two
seconds of the updated showcase. These are native 30 fps renders, without optical
flow or repeated-frame interpolation.

Use `CinematicLighting` inside the canvas for new kit scenes. It prepares its
reflection map in a layout effect before Remotion advances the first frame; the
legacy episode lighting is left untouched. This prevents stills/first frames from
using different reflection state than subsequent video frames. The review script
uses Remotion's supported `puppeteerInstance` option to reuse one browser, and
captures lossless PNG frames before H.264 encoding. `verify-colour.mjs` compares a
fresh still against a later decoded frame and rejects a mean RGB error of 4 or more.

The previous `docs/modelling-kit/previews` files are archived **12 fps first-pass
media**. Current native 1080p/30 fps outputs and diagnostics are in the latest
YUNEX-MODELLING-KIT-V2-REVIEW workflow artifact; do not label the old files as 30 fps.

## Recovery continuation (21 October 2026)

See [recovery and verification boundary](RESUME-2026-10-21.md). Rubber strips now
bounce twice, slow with friction and settle deterministically; their rotated
geometry stays above the local road. `interior:false` skips hero seats/console as
well as the original interior, retaining exterior lights. `--compare` captures
matched stills for all three showcased vehicle presets.

## Fitted systems and articulated occupant (continuation)

Standard/hero four-wheel vehicles now share fitted chassis rails, crossmembers,
transmission, differential, steering rack, radiator/coolant connection and driven
half shafts. Family configuration is in `mechanicalLayout()`. Half shafts retain
wheel endpoints through compression/exploded views. The compact EV uses a battery
and motor rather than a combustion engine. Heavy trucks now receive an engine, rear-drive prop shaft and tandem-axle connections where appropriate. The EV battery clears the existing cabin floor.
These are generic assemblies, not exact manufacturer powertrains. The existing
motorcycles retain their original frame, casing and fork assemblies in this stage.

```ts
import {animationPreset} from './presets.ts';
const car = createCinematicVehicle({variant:'hot-hatch',driver:true});
animateCinematicVehicle(car, animationPreset('driver-reaction',frame,30));
// Explicit controls can be combined with any compatible vehicle:
animateCinematicVehicle(car,{frame,fps:30,steer:.08,braking:.7,impact:.2});
```

`driver:true` opts into a gold segmented mannequin with volumetric torso/pelvis,
head/neck, articulated arms/legs, hands/fingers, feet, vehicle-anchored belt and
pedal/wheel targets. It uses actual existing steering/pedal hardpoints; Formula
gets a lowered shared seat and pedal box. Steering grip targets rotate with the
wheel. Reactions are prescribed poses with two-link limb solving, not human injury
or restraint dynamics. Limb reach adapts to the generic cabin: this is not a fixed
anthropometric skeleton. A rider rig is not yet provided for motorcycles.
`interior:false` cannot provide the hardpoints required by the driver.

Seven six-second frame-controlled presets: `tyre-failure`, `emergency-braking`,
`collision-rewind`, `floor-sparks`, `engine-cutaway`, `suspension`, `driver-reaction`.
A preset returns a `CinematicState`; floor sparks require a Formula vehicle.
Collision/rewind controls existing visual damage and pose, not collision detection.
Engine-cutaway exposes the existing engine; connected turbo airflow is still absent.

`KitD` / `KitDPortrait` show braking, impact reaction and restored seating;
`KitE` / `KitEPortrait` show the three hero internal assemblies. Existing A/B/C
remain the exterior, tyre and Formula demonstrations. All native exports are 30fps.
Driver GLB exports contain a baked articulated pose; runtime solvers are TS-only.

Outstanding: individual premium exterior modelling/approval of all 35 variants,
manufacturer-specific cabin/powertrain fit, motorcycle rider, richer heavy-truck
engine families, turbo airflow, validated rigid/soft body physics and fully modelled
restraint dynamics. Catalogue bounds tests are not proof of clearance between every
internal part. Inspect cutaways and moving footage for the intended production shot.

The CI workflow validates once, renders each native composition in a separate job,
and then combines all eleven videos for full decoding and colour verification.
Per-composition artifacts allow early visual review without waiting for every clip.
