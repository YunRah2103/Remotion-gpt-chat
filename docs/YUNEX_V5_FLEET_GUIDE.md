# YUNEX V5 fleet authoring

The current `createFleetVehicle` default rebuilds the main body shapes of all 36 procedural catalogue vehicles, including the supercar, Formula cars, motorcycles and commercials. This replaces the previous shared body volumes. Existing legacy factory defaults remain available. Request `reference:'v4-approved'` explicitly for the earlier approved supercar. See [the complete rebuild guide](YUNEX_FLEET_REBUILD.md) for scope and review limits.

```ts
import {createFleetVehicle,animateCinematicVehicle,createFleetRecipe,compileRecipe,auditFleetVehicle} from './src/yunex/modelling-kit/index.ts';
const car=createFleetVehicle({family:'rally',quality:'hero',color:'#dedfd8',driver:true});
const audit=auditFleetVehicle(car); // intact rest pose, before placement/animation
animateCinematicVehicle(car,{frame:90,fps:30,distance:36,speed:12,curvature:.025,roughness:.35});
// All existing engine, wheel, driver, suspension, cutaway and damage interfaces remain.
const recipe=compileRecipe(createFleetRecipe({id:'new-v5-rally',variant:'rally-hatch',world:'rally'}));
```

Select `variant` for any of the 36 existing catalogue IDs, or `family` for a strong default. Family and explicit variant must agree. Family names: `mid-engine`, `gt`, `muscle`, `classic`, `sedan`, `fastback`, `hatch`, `rally`, `estate`, `suv`, `pickup`, `van`, `formula`, `motorcycle`, `commercial`. `fleetCatalogue()` returns every ID, dimensions and assigned architecture. `trim:'track'` selects slicks; body styles are selected by the existing variant, not a fictitious manufacturer trim. Paint, interior colour, steering side, lights and powertrain accept existing options. A motorcycle driver remains unsupported.

`quality:'hero'` adds tyre detail and V5 road carcass finishing. Standard/lightweight keep the new silhouette and rig, omitting those extra wheel details. They are **not** aggressively decimated meshes or guaranteed low-end GPU LODs. `reference:'v4-approved'` with `variant:'supercar'`, hero quality and `color:'#18636b'` selects the protected V4 path.

For an existing StudioEpisode recipe, set `vehicle.bodyDetail:'fleet'`. Mechanical components, named wheel mounts, source-owned assemblies, environment placement, drivingState, camera helpers, deterministic seek animation and all existing shot fields remain available. `powertrain` attaches an editable AssemblySpec via the existing engine envelope; it is not a fit guarantee for arbitrary oversized custom parts. Never resize wheel mounts or change catalogue dimensions to conceal bad body geometry.

## Authored GLBs now on main

During V5 development, main independently added the 12-entry [imported-car fleet](YUNEX_IMPORTED_CAR_FLEET.md). It is preserved alongside V5, including original attribution, review gates and download verification. Use `ImportedCar` for high-detail authored real-car geometry. Use `createFleetVehicle` for these source-owned procedural class rigs and their existing wheel/mechanical/damage animation. Imported GLBs are not automatically converted into driving rigs, and none of the four V5 proof films is claimed to show those authored models. Do not resculpt procedural approximations to claim branded 1:1 accuracy.

## Architecture and provenance

All surfaces are original editable TypeScript geometry, under the repository's existing terms; no external model/textures were downloaded. `fleet-profiles.ts` assigns class proportions. `fleet-road.ts` replaces exterior surfaces for 28 road vehicles, with connected section shells, real wheel/cabin apertures, crowned closed glazing, formed pillars, fitted seams, rockers, arch returns, inset lamps and rounded fascia returns. Supercar preserves V4. Two Formula cars use separate rounded monocoques, engine covers and cambered wings; modern gets undercut sidepods. Three motorcycles get rounded tanks, tails, fenders and sport fairings. Two heavy trucks retain their perforated cab architecture, with coherent cab/window taper and new arches/swages; cargo boxes remain rectangular because they are cargo boxes. Truck uplift is narrower than the road-body rebuild.

No manufacturer CAD, licensed 1:1 reproduction, calibrated physics or photoreal certification is supplied. Surfaces remain procedural, and styling/fascia realism must be judged from the actual videos. Glass has a 5 mm closed shell; transparent rendering can still produce internal layering. Non-flat contact belongs to the existing dynamics/terrain system, not projected contact shadows. PR #275's ground-contact source is untouched.

## Native proof renders

```sh
npm ci
npm run check
node --experimental-strip-types --test --test-concurrency=2 tests/modelling-kit/*.test.mjs tests/world-kit/*.test.mjs tests/parts-kit/*.test.mjs
node --experimental-strip-types scripts/modelling-kit/fleet-audit.mjs
node scripts/modelling-kit/fleet-render.mjs
```

Four silent native H.264/yuv420p 1080x1920 30fps films: A protected supercar (6s); B GT road car (6s); C rally (6s); D matched V4/V5 split-screen of 12 catalogue representatives (12s). Each driving proof has front, side, rear, wheel detail and tracking beats. The comparison uses the same camera/lens/paint/lighting on both models. It is development evidence, not an approved published episode. The floor is deliberately neutral to expose geometry; rally uses moving loose gravel context, not a finished natural environment. Full-frame native motion and per-file hashes must accompany a visual handoff.

`auditFleetVehicle` is a rest-pose structural diagnostic: finite attributes, named surfaces, axle count/height, roof envelope and sample wheel aperture rays. It does not certify glazing/pillar continuity, complete mesh intersections, all normals, realism or visual approval. Review every class and complete moving proof; keep visual status pending until the owner approves. Legacy paths remain available while refinement continues.

## Road-model geometry refinement — 24 October

`createFleetVehicle` and recipes with `bodyDetail:'fleet'` now select the refined road models automatically. The 28 rebuilt road bodies gain curved roof ends and taper, fitted greenhouse edges, a structural side-window divider, painted quarter sails, front-face-only glazing and surface-following bonnet seams where applicable. These are editable geometry changes, not a lighting preset. Open/targa behavior, the roof liner and existing wheel/driver/cutaway controls remain.

The 26 non-classic road variants additionally gain shaped recessed headlamp housings with twin three-dimensional projector optics per side, optical tail-light ribs, tapered intake surrounds, open hexagonal grille cells and class-sized fascia proportions. Non-van models have body-cut side intakes with recessed louvres; sports/rally models have modelled rear diffuser fins. Classics keep their round reflectors, bezels and lenses; the protected V4 supercar, Formula vehicles, motorcycles and heavy commercial vehicles retain their prior geometry. EVs still have no fake exhaust.

Moving GT and rally films use the existing proof composition and its unchanged camera/lighting to expose the model changes. The neutral floor remains a development environment. Models remain generic original designs, not manufacturer-matched CAD. Full-fleet structural tests do not substitute for visual inspection of every variant.

Cutaway intentionally retains the painted quarter sails as C-pillar structure, consistent with the A/B/C pillars; roof, glazing and liner remain removable.
