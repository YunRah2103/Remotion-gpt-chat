# V5 opt-in road-led studio

Existing V4 APIs, 36 vehicle variants, 20 locations, mechanical assemblies and episode projects are unchanged. V5 is a separate authoring interface. It does not call PR #275's optional flat-road contact-shadow system. Never merge divergent PR #233 over main.

## Create and render

```sh
npm ci
node --experimental-strip-types scripts/studio-v5/studio.mjs presets
node --experimental-strip-types scripts/studio-v5/studio.mjs create mountain out/v5/my-pass.json
node --experimental-strip-types scripts/studio-v5/studio.mjs validate my-pass out/v5/my-pass.json
node --experimental-strip-types scripts/studio-v5/studio.mjs render my-pass out/v5/my-pass.json
```

The native proof is eight seconds, 240 frames, 1080×1920 at 30 fps, silent H264 / yuv420p / BT.709. Presets: `mountain`, `circuit`, `city`, `rally`. Use an actual native moving render to assess quality; a configuration validation is not an aesthetic approval.

Example props JSON:

```json
{"config":{"preset":"mountain","road":{"points":[[-140,0,-25],[-65,5,0],[0,9,22],[65,15,0],[115,22,-45],[170,24,-10],[240,28,25]],"width":7.5,"bank":0.025},"timeOfDay":"dusk","weather":"clear","surface":"asphalt","vegetation":0.35,"quality":"hero","seed":37,"cameraSafeWidth":12,"scenery":true}}
```

All distances are metres. Bank is radians, limited to ±0.15; road width 3–30. Optional `road.roughness` is 0–0.08m and defaults to 0.018m for rally: the same analytic undulation changes visible ribbon geometry, vehicle pitch and individual wheel samples. Vegetation 0–1; quality `preview` or `hero`; time `day`, `dusk`, `night`; weather `clear` or `wet`; surface `asphalt` or `gravel`. Wet changes surface treatment; it does not claim volumetric rainfall. Disable scenery to inspect the road in isolation. Typos reject with corrective diagnostics.

The proof fits its travel to custom road length, retaining 3m endpoint clearance and reducing speed on short routes. Routes below 12m reject with an actionable error. Long default roads retain the authored speed and starting position. No natural-language generation is claimed. GPT agents populate this schema directly.

## Road, vehicle and shot APIs

```ts
import {createStudioEnvironment} from '../studio-v5/environment.ts';
import {sampleRoad,roadGeometry} from '../studio-v5/road.ts';
import {createStudioVehicle,poseStudioVehicle} from '../studio-v5/vehicle.ts';
const {group,road}=createStudioEnvironment({preset:'rally',vegetation:.8});
const car=createStudioVehicle('rally-hatch');
const pose=poseStudioVehicle(car,road,110,90,30,12);
// Move a camera in the same local road frame:
const camera=pose.position.clone().addScaledVector(pose.left,-8).addScaledVector(pose.forward,10).addScaledVector(pose.normal,2.5);
```

`createStudioVehicle` retains the V4 hero body and materials. The circuit and mountain keep the approved teal supercar intact. An experimental new fascia was visually rejected because it exposed bumper seams; it is not shipped. This stage does not claim a complete vehicle geometry overhaul.

Wheel centres are sampled from the same spline as the visible road, including elevation and banking. Their residual height is transformed into the local vehicle frame and passed into the existing deterministic suspension rig. No frame integration is used. This remains illustrative kinematics, not a calibrated tyre or suspension simulation.

The preset uses a declared camera corridor for scenery setback. The existing V4 `auditCameraClearance` can inspect a posed car, environment and final camera. A setback is not a universal obstruction guarantee for arbitrary hairpins or wide custom camera moves. Check intermediate frames too.

## Real assets and imports

`public/yunex-v5/sources.json` records original URLs, sizes, licences and source hashes for vendored CC0 Poly Haven texture bytes. `pine-branch.png` is a cropped RGBA derivative of the source twig/alpha atlas. Powered by Poly Haven: https://polyhaven.com. Licence: https://polyhaven.com/license. Source textures are bundled, so rendering requires no external asset server. `assets.ts` loads them behind an explicit Remotion render barrier and fails the render on loading errors.

`applyScannedMaterials(group, staticFile, preset)` is the browser-side opt-in material loader for the new environment. Dispose its returned texture cleanup callback at lifecycle end. The Node environment factory uses source-authored fallback maps for offline geometry testing.

`adaptImportedVehicle(loadedGltf.scene, {sourceUrl,license,author,radius,wheels:{frontLeft,frontRight,rearLeft,rearRight}})` clones an already-loaded scene, retaining materials and named components, and installs steering/rolling pivots around named wheel origins. Models must already use metres, +X forward, +Y up, +Z wheel axes. Each wheel must be an independent node with its pivot at its actual axle centre. Never supply whole car groups as wheel nodes. Material resources are shared with the original: dispose once at the asset-owner lifecycle boundary. `animateImportedVehicle(rig,distance,steering)` samples absolute values. No assets or rights are acquired automatically, and a static mesh is never substituted for a working rig.

## Quality gate

Run `npm run check`, the complete Node kit suites plus `tests/studio-v5/*.test.mjs`, and the Python modelling tests. Render all four native films; fully decode, check 240 frames and record SHA256. Record source identity and review the whole moving image for clipping, contact, vegetation, lighting and subject visibility. Keep V5 opt-in and reject visibly worse outputs. The guide does not certify photorealism, all-frame visual approval, a complete Formula overhaul or production readiness.

The native workflow also renders a 60-frame controlled surface comparison: left uses source-authored road/terrain fallback materials and right uses their bundled scanned maps. Tree alpha textures remain identical on both sides so the comparison does not turn foliage into opaque rectangles. Route, car geometry, camera and lights are identical. This isolates surface treatment; it is not a matched whole-V4-versus-V5 comparison.

Foliage uses instanced scanned twig cards. The proof's hero corridor (road distance 55–230m) receives full branch tiers, with reduced tiers elsewhere. Leaf/verge cards receive scene light but do not cast expensive alpha shadow passes; trunks and solid architecture still cast shadows. This is an explicit performance tradeoff, not photoreal canopy lighting. The regression budget caps the default hero rally foliage below 50,000 instances (previous experimental layout was 83,160).

`docs/yunex-v5-preserved-baseline.json` stores SHA256 values taken from the actual main starting commit for every original world-kit, modelling-kit and parts-kit file. Its test reads current bytes, so even uncommitted accidental edits fail. New files may be added separately; the approved source must not be silently rewritten. A separate rough-road regression raycasts the rendered triangle mesh beneath each wheel over the proof timeline, requiring tyre-radius contact within 2mm at tested frames. This is a geometric check, not physical validation or all-frame aesthetic approval.

## Structured driving cameras and preflight

The preview accepts a separate `camera` object beside `config`. All values below are optional. Defaults preserve the original V5 tracking view. `side` uses the car's road frame, so bends and route rotation do not flip it.

```json
{
  "config": {"preset":"city", "quality":"hero", "weather":"wet"},
  "camera": {"side":"right", "distance":14, "height":2.8, "angle":0.78, "orbit":0.08, "lookHeight":1}
}
```

`distance` is 8–40 metres, `height` 1–12m, `angle` 0.2–1.4 radians from the vehicle front, `orbit` 0–0.3 radians, and `lookHeight` 0.3–2.5m. Unknown camera keys fail with a specific diagnostic. This is structured configuration, not natural-language generation.

```sh
node --experimental-strip-types scripts/studio-v5/studio.mjs create city out/v5/my-city.json
# Edit config and camera in that JSON, then:
node --experimental-strip-types scripts/studio-v5/studio.mjs validate my-city out/v5/my-city.json
node --experimental-strip-types scripts/studio-v5/studio.mjs audit my-city out/v5/my-city.json
node --experimental-strip-types scripts/studio-v5/studio.mjs render my-city out/v5/my-city.json
```

`audit` reuses the existing V4 camera-clearance diagnostic on the actual posed V5 vehicle/world at five times across the proof. It returns JSON with blocking object/instance names, sample counts and corrective guidance, and exits nonzero for failed views. Adjust the camera distance, angle, height, side or environment `cameraSafeWidth`, then repeat the audit and inspect an actual moving preview. This diagnostic does not automatically move cameras. Five samples cannot certify every frame; foliage planes are conservatively treated as solid because the CLI does not sample texture alpha. It is not a substitute for visual review.

The create command writes a minimal, round-trip-valid input configuration and refuses to overwrite existing files. Defaults are resolved by the renderer; they are not copied into unknown top-level configuration keys.
