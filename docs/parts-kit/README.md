# YUNEX automotive parts baseline

55 original generic 3D assemblies for other agents to refine and reuse. Modest detail, shared materials and consistent metre scale; no specific manufacturer. The existing 35 vehicles, interiors, 20 environments and 14 scene props are unchanged.

| Family | Variant IDs |
|---|---|
| Engines | `inline-3`, `inline-4`, `inline-6`, `v6`, `v8`, `flat-4` |
| Turbos | `turbo-small`, `turbo-large`, `turbo-twin-scroll`, `turbo-twin` |
| Brakes | `brake-solid`, `brake-vented`, `brake-drilled`, `brake-drum` |
| Suspension | `strut`, `double-wishbone`, `multi-link`, `leaf-spring` |
| Aero | `front-splitter`, `rear-wing`, `ducktail`, `diffuser`, `canards`, `undertray` |
| Gearboxes | `gearbox-manual`, `gearbox-auto`, `gearbox-dct` |
| Drivetrain | `propshaft`, `differential-open`, `differential-lsd`, `cv-halfshaft` |
| Cooling | `radiator`, `intercooler`, `oil-cooler`, `cooling-fan` |
| Intake | `airbox`, `cone-filter`, `throttle-body` |
| Exhaust | `exhaust-header`, `muffler`, `catalyst` |
| Electrical | `starter`, `alternator`, `battery-12v`, `ev-drive` |
| Fuel | `fuel-tank`, `fuel-pump`, `injector-rail` |
| Wheels | `wheel-road`, `wheel-sport`, `wheel-offroad` |
| Chassis | `subframe`, `ladder-frame` |
| Steering | `steering-rack`, `steering-column` |

## Start and inspect

Node 24 recommended. No new dependencies beyond the vehicle kit.

```bash
npm ci
npm run partskit:studio
npm run check
npm run partskit:test
npm run partskit:export
npm run partskit:review
```

The isolated entry is `src/yunex/parts-kit/entry.tsx`. Compositions: `PartPreview`, `PartPreviewPortrait`, `PartsFamilyReel` (30s), `PartsCatalogue` (55s). Landscape source is 1920x1080 and portrait 1080x1920, both 30fps. The included review MP4 is a silent 960x540/12fps inspection, not a finished film. `review -- --stills-only` and `--reel-only` allow independent checks. Every catalogue variant has a still; representative cutaways, exploded and portrait stills are additional.

## React use

```tsx
import {AutomotivePart} from './yunex/parts-kit';
// Inside your existing ThreeCanvas. Compute seconds from frame/fps.
<AutomotivePart variant="turbo-twin-scroll" cutaway={false}
  color="#82939c" accent="#ca8c45" position={[0,1,0]} scale={1}
  state={{shaftAngle:seconds*4,explode:0}} />
<AutomotivePart variant="double-wishbone" state={{compression:0.5}} />
<AutomotivePart variant="rear-wing" state={{deployment:0.3}} />
```

`AutomotivePart` accepts `variant`, six-digit hex `color`/`accent`, `cutaway`, `state`, `position`, `rotation` (Euler radians), `scale`. It owns and disposes the factory-created group. It must be inside ThreeCanvas; keep typography outside. Do not use clocks, `useFrame` or random state for Remotion motion.

## Three.js use and mounting

```ts
import {createPart,animatePart,partMount,partCamera,disposeObject} from './yunex/parts-kit';
const turbo=createPart({variant:'turbo-small',cutaway:true});
scene.add(turbo);
animatePart(turbo,{shaftAngle:1.2,explode:0.3});
const output=partMount(turbo,'outlet'); // world position + normalised direction
const view=partCamera(turbo,false);   // fits current bounds, including exploded state
// Dispose exactly once after removing it from the scene:
disposeObject(turbo);
```

Units are metres, +X forward, +Y up, +Z left, matching the vehicle kit. Origin is an assembly datum, not ground contact. All parts expose `mount`; each catalogue item lists its other named ports. Engine/gearbox shaft axes are +X; turbo, brake and wheel rotation axes are +Z. Connection directions are explicit, so do not assume one universal rotation axis.

`partMount` uses stable `userData.mountName` metadata rather than GLB-sensitive object names. It returns world coordinates and a unit direction after placement/scaling. Suspension `hub` and rack `left`/`right` connections follow their moving attachment. Other ports are mounting/connection references, not automatic hose/bolt solvers. For the twin-turbo pair, unprefixed ports refer to the left turbo; additional `right-intake`, `right-outlet`, `right-exhaust-in`, `right-exhaust-out` ports address the right unit.

Mount these as separate assemblies under a vehicle or shot group and adjust placement for the chosen body. There is no automatic engine-bay replacement or universal bolt-pattern guarantee. The catalogue specifies reusable geometry; other agents own the shot-specific fitting and refinements. Existing car wheels/brakes are preserved and are not silently replaced by these standalone units.

## Animation controls

`animatePart(group,state)` evaluates absolute state: repeat or reverse frames without accumulation. Missing or explicitly undefined controls reset to zero. All inputs must be finite numbers; invalid inputs throw before transforms change.

| State | Unit/range | Use |
|---|---|---|
| `shaftAngle` | radians, wraps at 2π | Crankshafts, turbo rotors, shafts, gears, fans, wheels |
| `compression` | 0..1, clamped | Suspension hub travel and coil compression |
| `steer` | radians, clamped ±0.65 | Rack and column |
| `deployment` | 0..1, clamped | Wing incidence or throttle butterfly |
| `explode` | 0..1, clamped | Separates tagged subassemblies from rest |
| `heat` | 0..1, clamped | Illustrative brake-disc tint/glow; not a temperature |

Engines include moving pistons, connecting rods, crankpins and counterweights. Turbo compressor/turbine wheels share a rotor shaft. Vented brake discs have a real gap and vanes; drilled discs have geometry holes. Drum shoes and transmission internals are visible in cutaway. Automatic units include a generic planetary layout; DCT includes a second input sleeve and clutch pack. Gear ratios/meshing and differential behaviour are illustrative animation ratios, not a working transmission simulation. Suspension travel is a presentation rig, not a rigid-body solver. Valve timing, combustion, fluid flow, aero forces, heat physics and ABS controllers are not implemented here.

For Node scripts executing TypeScript directly, import `createPart` from `models.ts` and `animatePart`/`partMount` from `motion.ts`; the convenience index also exports a React TSX component and is intended for a bundler.

## Portable GLBs and agent handoff

`out/parts-kit/glb` contains 55 GLBs plus a catalogue with byte counts, SHA256 checksums, ports and motion-node counts. Exports contain full assemblies, including hidden-capable covers and internals. Names, `userData.motion`, `userData.rest`, `userData.explode`, `userData.cover` and mounting metadata are preserved. `animatePart` and `partMount` work after GLTFLoader loading; object names may be sanitised by the loader, so prefer metadata for programmatic selection.

To inspect a loaded model in cutaway, traverse it and hide objects with `userData.cover === true`. Do not remove those objects or overwrite rest metadata when refining a mesh. Keep meaningful node hierarchies and connection axes. The model factory and wrappers own their materials/geometries; use `disposeObject` on owned loaded or factory-created scenes.

Suggested workflow for another agent: choose catalogue ID; inspect full/cutaway still; import factory or GLB; preserve mounts and motion metadata; add detail only to the chosen subassemblies; integrate into the film; render and inspect actual moving frames. This is a baseline asset library, not an approved engineering explanation or a finished episode.

## Provenance and reference boundaries

All geometry is original procedural source; no downloaded manufacturer meshes, logos or textures. Existing `src/mechanics/parts.tsx` and its catalogue were inspected before creating these world-scale variants; their existing exports and films are preserved. This kit uses the same basic illustrative disc/caliper/spring/gear approach and the world kit's shared geometry/lighting/disposal helpers.

General structural references: [Garrett turbo basics](https://www.garrettmotion.com/de/turbocharger-technology/how-a-turbo-works/basic/), [Brembo disc catalogue](https://www.bremboparts.com/america/en/catalogue/disc/09-9848-11/pdf), [Monroe suspension products](https://www.monroe.com/en-eu/products.html). These informed generic relationships only. Models do not reproduce those companies' products, dimensions or performance.
