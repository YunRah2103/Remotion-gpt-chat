# Automotive Studio V4: source to moving proof

This guide concerns the modelling studio in this repository, not the Galaxy S25 footage worker. Existing compositions, audio and projects remain independent. New V4 projects are opt-in source recipes; their native output is 1080×1920 at 30 fps.

## Make a new production

```bash
node --experimental-strip-types scripts/modelling-kit/v4-proof.mjs create all
node --experimental-strip-types scripts/modelling-kit/v4-proof.mjs plan supercar
npm run kit:validate -- v4-a-supercar
npm run kit:inspect -- v4-a-supercar
npm run kit:review -- v4-a-supercar --dry-run
npm run kit:scene -- v4-a-supercar
```

Creation refuses to overwrite any target in the requested batch. Choose `supercar`, `rally` or `film` to create one project. Generated recipe.json and storyboard.json are editable; the entry uses the existing StudioEpisode renderer. Existing demos are not templates to overwrite.

| Production | Default duration | Editorial job |
| --- | --- | --- |
| v4-a-supercar | 14 s | Complete front, side, rear and overhead views; driver, connected engine, onboard and acceleration payoff |
| v4-b-rally | 10 s | Establish corner, show purposeful steering, surface contact, driver input and traction exit |
| v4-c-film | 22 s | Original silent mechanical story: moving mechanism hook → vehicle → driver → contact → connected pressure system → road release → departure |

No narration, music, speech timing or sound effects are invented. The two model demonstrations have blank captions. The 22-second film has three concise educational/closing captions and cinematic presentation. Supplied safe public-relative audio paths can be passed deliberately. The stylized procedural models are illustrative engineering geometry; they are not manufacturer CAD or validated vehicle physics.

## Brief API

```ts
import {createV4Production, v4ReviewPlan} from './src/yunex/modelling-kit/v4-production.ts';
const {recipe, storyboard}=createV4Production({
  kind:'film', id:'my-new-pressure-film', duration:24,
  vehicle:{color:'#204951'},
  world:{timeOfDay:'dusk'},
});
const review=v4ReviewPlan(recipe);
```

The helper clones nested geometry, accepts structured vehicle/world overrides, and allocates an exact integer frame budget across the storyboard. Mechanical films must be 20–30 seconds; rally proofs retain the rally world. Advanced authors can edit resulting shots directly and call compileRecipe to validate. Purpose notes stay in storyboard.json rather than appearing as an overlay.

The seven standard cameras remain available. `cameraMove` adds authored vehicle-local start/end position, target and FOV; `easing:'smooth'` gives a restrained move. Use the pure side position for readable silhouette rather than calling a three-quarter tracking shot a side view. `speedScale` changes actual driving distance, speed and acceleration together; it is a cinematic control, not a claim about performance. The studio body detail and cinematic presentation are explicit opt-ins.

## Five specialist agents with clear handoffs

1. **Director / storyboard:** choose a new slug, state the visual hook and each shot's purpose, decide duration and supplied audio, then hand off recipe plus storyboard. Every cut should reveal new information or resolve an earlier action.
2. **Vehicle / materials:** keep procedural geometry editable, use studio body detail deliberately, preserve wheel/driver/engine transforms and inspect front, rear, profile and glass readability. Hand off source paths and geometry limitations.
3. **Mechanical / rig:** inspect connected engine and exhaust, independent wheel contact, steering and driver controls. Record what is illustrative. Hand off deterministic frame samples and model diagnostics.
4. **Environment / camera:** match route curvature, terrain height and wheel contact; compose complete vehicle bounds in portrait; verify start/mid/end of each custom camera move. Hand off framing samples and exact review ranges.
5. **Render / QA:** freeze source, validate recipe and geometry, render small native moving windows, inspect every cut, then render the complete native MP4, FFprobe and fully decode it. Record output hash, dimensions, fps, duration, source identity and unresolved visual issues.

Agents can work in parallel only on assigned files. The director integrates recipe changes; no agent silently changes approved narration or older project recipes. Test ownership and source paths belong in every handoff.

## Spend render time on useful evidence

`v4-proof.mjs plan <kind|project-slug>` returns 12 contiguous native frames around each shot midpoint plus suggested first/middle/last stills. These small motion windows are enough to catch gross rig/camera errors before spending on a master. They are a plan, not media. `kit:review --moving` renders the whole shot rather than these cheaper windows. Use the range values with the existing Remotion entry for targeted renders; use `kit:scene -- <slug> --shot=<id>` for a complete revised shot. A midpoint still alone does not verify movement or a cut.

Render the full portrait master only after those checks. Use `kit:handoff` and the existing shot assembly contracts when reusing individual rendered scenes; preserve frame ranges and matching source identities. Always review the final assembled film as moving footage. A passing TypeScript check, model test or dry-run does not establish visual approval, native output, correct audio or full media decode.


## Render the shipped proofs, without rebuilding a production

```bash
# Generate one source-owned project per kind; do not edit source during a render.
node --experimental-strip-types scripts/modelling-kit/v4-native.mjs --kind=supercar --inspect --render
node --experimental-strip-types scripts/modelling-kit/v4-native.mjs --kind=rally --inspect --render
node --experimental-strip-types scripts/modelling-kit/v4-native.mjs --kind=film --inspect --render
```

Each command writes `out/studio/<project>/proof.mp4`, an editable project, storyboard, geometry report, source contract and complete native decode/movement verification. The masters are silent H264, yuv420p, BT.709, 1080×1920, 30 fps. A is 420 frames, B 300 and C 660. Install Chrome/media dependencies with `bash scripts/modelling-kit/install-native-media.sh` on a fresh Linux runner. `npm ci` and Node 24 are required. The native workflow is `.github/workflows/yunex-v4-studio.yml`.

For independent parallel shot ownership, add `--shot=<shot-id> --render`; preserve each adjacent `.mp4.json` contract. Once all shots from the same frozen source and recipe exist, use `--assemble` instead of `--render`. Stale source, edited recipes, changed entry points or altered MP4 bytes reject assembly. Do not suppress that error: render the changed shot against the approved source, or deliberately regenerate the entire batch. Never mix older source snapshots just because their images look similar.

Run perceptual diagnostics after a complete render:

```bash
SOURCE_FP=$(node --experimental-strip-types --input-type=module -e "import {sourceFingerprint} from './scripts/modelling-kit/assemble.mjs';console.log(sourceFingerprint(process.cwd(),'src/yunex/studio-projects/v4-c-film')); ")
python scripts/modelling-kit/v4-media-qc.py out/studio/v4-c-film/proof.mp4 \
  --out out/studio/v4-c-film/perceptual --source-fingerprint "$SOURCE_FP"
```

The Python media diagnostic needs Pillow (`python -m pip install Pillow==11.3.0`). Its report separates source, native decode, class-aware geometry, moving visual review and final approval. Bright/dark frames and large unexpected differences are review flags, not aesthetic decisions. A SHA-bound moving-review JSON needs a named reviewer, date, findings, explicit pass/fail and frame ranges covering the whole film. Use `--review <file> --require-final` only after an actual complete moving-footage review. Contact sheets, sampled PNGs and automated motion measurements cannot replace that review.

## Choose and inspect a model

```ts
import {createCinematicVehicle} from './src/yunex/modelling-kit/rig.ts';
// Same rig and animation APIs; studio surfaces explicitly replace the exterior.
const car=createCinematicVehicle({variant:'supercar',bodyDetail:'studio',quality:'hero',driver:true,color:'#246d75'});
const rally=createCinematicVehicle({variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true});
const coupe=createCinematicVehicle({variant:'coupe',bodyDetail:'studio',quality:'hero',driver:true});
const leftDoor=car.getObjectByName('studio-door-left');
const flameMouth=car.getObjectByName('exhaust-outlet-right');
```

Studio geometry currently supports these three reference variants at hero quality. Other catalogue IDs retain existing coachbuilt/procedural APIs. Invalid studio requests fail with corrective guidance rather than silently rendering a simpler car. Do not represent this as a 36-model replacement. Doors, glazing, roof, formed pillars, buttress panels, intake recesses, lamps, wheel returns and exhaust mouths have stable scene names for inspection. All dimensions are metres; never scale the exhaust independently to compensate for a camera crop. See [exhaust dimensions and compatibility](YUNEX_V4_EXHAUST_COMPATIBILITY.md).

The day/dusk/night model-orbit compositions in `studio-quality-entry.tsx` use identical camera/lens/trajectory for `bodyDetail:'coachbuilt'` and `'studio'`. Use them for controlled before/after comparison. EP005's rejected video is useful qualitative context, but has different cameras and lighting and is not a matched experiment.

## Current boundary

The V4 additions improve fitted section geometry, three silhouettes, exhaust dimensions, reflection lighting, selected scenery, camera moves, deterministic driving controls and production contracts. They do not supply manufacturer CAD, calibrated tyre physics, a physically validated engine, new V6/V12 families, photoreal environments, natural-language interpretation or automatic beauty certification. Existing mechanical families and vehicle variants remain available. The current authored surfaces still need art direction, especially front/rear fascia design, glass treatment, wheel finish and environments. Record a failed visual review when a technically valid result does not meet the film's standard.


## Mechanical cutaways and connection visibility

Assembly nodes accept `cutaway?: boolean`. The default remains true for compatibility. Set false on a turbo whose hot-side housing forms an active pipe junction; hiding the housing also hides its physical inlet. A custom part resolver receives optional `{cutaway}` as its second argument; existing one-argument resolvers still work and own their returned geometry.

V4 uses its own cloned `v4-twin-turbo-v8` recipe. It retains both turbo housings and shows deterministic warm/cool flow markers on the four authored feed/charge routes. V3's `TWIN_TURBO_V8` remains unchanged. These are illustrative routes: manifold section boundaries, compressor intake filters, downstream exhaust, intercooling and a calibrated combustion model are omitted. Do not call the inspection a complete sealed cylinder-to-tailpipe reconstruction.

The studio windscreen mount uses the actual raised canopy profile. Its optional `lookAhead` argument is a finite world-space target; the production renderer aims along the next ten metres of road. Legacy and Formula mounts keep their existing defaults. Inspect the entire onboard beat: clear rays alone cannot establish that the road reads well in a finished shot.

## Catch foreground camera obstructions before rendering

`auditCameraClearance(vehicle, world, view, aspect)` is an optional offline diagnostic exported by the modelling-kit index. Pass the actual posed vehicle, actual environment and final fitted camera in world coordinates. It casts a small grid through visible opaque vehicle surfaces and returns `state`, `blockedSamples`, `blockedFraction`, named blockers (including instance IDs) and corrective guidance. Sample first/middle/last frames and any native-QA frame-change flags. A centre ray alone is insufficient: the shipped side shot originally passed its centre ray while a catch-fence post covered the bonnet and door.

The supercar side recipe now uses FOV48. The previous FOV40 portrait fit pushed the camera beyond the 13.4m catch fence; the wider lens fits the complete car from inside it. The new regression uses the actual model, world, lens and offending frame rather than assuming that a framing test also proves visibility. This diagnostic samples solid geometry only; transparent obstructions, untested intermediate frames and aesthetic composition still need moving review.

```ts
import {auditCameraClearance} from './src/yunex/modelling-kit/index.ts';
// Run after the vehicle pose and final camera framing have been sampled.
const clearance=auditCameraClearance(car, world, camera, 1080/1920);
if (clearance.state==='fail') {
  throw new Error(`${clearance.guidance} Blockers: ${clearance.blockers.map(b=>b.name).join(', ')}`);
}
```
