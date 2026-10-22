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

No narration, music, speech timing or sound effects are invented. The films have blank captions and cinematic presentation by default. Supplied safe public-relative audio paths can be passed deliberately. The stylized procedural models are illustrative engineering geometry; they are not manufacturer CAD or validated vehicle physics.

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
