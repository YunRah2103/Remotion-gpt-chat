# YUNEX V3: editable automotive production

Continue PR233 / feat/yunex-modelling-kit-v2. Never modify EP003/EP004. Assets are stylised illustrative models, not CAD or calibrated simulations.

## Fresh agent: brief to editable video

Start with `npm ci`, `npm run kit:catalog`. Existing `kit:create`, `kit:validate`, `kit:preview`, `kit:render` remain compatible. A project has its own entry and recipe; give each of five agents a different slug. Creation refuses existing projects.

For a structured creative brief, save JSON with explicit scene decisions:

```json
{"id":"twin-turbo-mountain","subject":"How twin turbos work","duration":12,"vehicle":"supercar","environment":"mountain","scenes":[{"id":"hook","camera":"chase","action":"acceleration","caption":"Two turbos. One engine."},{"id":"internals","camera":"reveal","action":"cruise","part":"v8","caption":"Pistons turn the crankshaft."},{"id":"payoff","camera":"tracking","action":"cornering","caption":"Build your original final scene here."}]}
```

```sh
npm run kit:brief -- brief.json
npm run kit:plan -- twin-turbo-mountain
npm run kit:inspect -- twin-turbo-mountain
npm run kit:review -- twin-turbo-mountain --moving
npm run kit:scene -- twin-turbo-mountain
npm run kit:scene -- twin-turbo-mountain --landscape
npm run kit:handoff -- twin-turbo-mountain
```

The brief compiler distributes unassigned scene durations. It does not generate creative content, speech, alignment or scientific facts. Agents write the scenes and refine the normal recipe JSON. See `src/yunex/modelling-kit/v3-proofs.ts` for complete geometry-edit examples, including the reusable `TWIN_TURBO_V8`. Copy a proof recipe into a uniquely created project to edit or extend it.

## Actual model editing

`kit:inspect` saves named object catalogue, local/world bounds and diagnostics in `out/studio/<slug>/model-report.json`. Use a unique named surface where possible: object edits resolve the first matching name. Duplicated legacy names need a custom TS selector for individual instances.

`vehicle.model` / `world.model` are `{id, version:1, edits:[...]}`. Each edit targets an existing object and sets position/rotation/scale/visibility or `deform:{axis,along,amount}`. Units are metres, angles radians. Deformation changes vertices using a sinusoidal profile along the selected local axis; use a suitably tessellated panel. Fresh factories are edited before animation, retaining their private rig registrations. The original shared source is unchanged; deleting the override restores it.

`vehicle.components` / `world.components` create real new meshes:

```json
[{"id":"episode-wing","parent":"body-shell","replace":"rear-spoiler","shape":{"kind":"loft","sections":[{"x":-1.85,"y":0.95,"halfWidth":0.82,"height":0.04},{"x":-1.6,"y":1.01,"halfWidth":0.83,"height":0.045}]},"color":"#215e67","joint":{"axis":"z","min":0,"max":0.12}}]
```

Shapes include subdivided boxes, routed tubes and open-ended elliptical lofts. Loft end caps/complex topology require an agent-authored factory. `parent` is optional; `replace` hides the original named object. Add supports and validate clearance. Components may define named mounts with position and direction. Per-shot `joints:{"episode-wing":0.7}` controls the bounded absolute rotation. This is a per-shot pose, not an interpolated animation curve.

For arbitrary geometry or detailed imported meshes use the exported TypeScript factories. `buildComponents`, `applyEdits`, `editModel`, `attachAt`, `createAssembly`, `animateAssembly`, `animateComponents`, `modelCatalogue` and `validateModel` are public. `editModel` clones mutable mesh data but does not recreate private vehicle WeakMap rigs; use a fresh `createCinematicVehicle` plus `applyEdits` for driving/damage animation.

`importGLB(buffer,{id,units:'metres',source})` returns the scene and original animation clips. Place/replace a named procedural part in custom TypeScript; async imports are not exposed through recipe JSON. Textured files need valid resource URLs. `exportGLB` bakes the current pose; keep JSON/TS source canonical. In Node, use the existing FileReader polyfill pattern in `scripts/modelling-kit/export.mjs`. Runtime vehicle rigs are recreated from source rather than claimed portable through GLB.

## Shared mechanical systems

Assembly specs are `{id,version:1,nodes,connections}`. Nodes choose existing catalogue parts with independent transforms. Connections use `node:mount` addresses, radius and optional via points; tubes terminate at the real transformed ports. The V8/turbo proof connects exhaust and compressor output to actual mounts and animates the existing piston/crankshaft/turbo rigs. Tubes are static fitted plumbing, not a gas-flow solver; arbitrary joint movement needs rerouting.

A shot may use `assembly` instead of isolated `part`. A vehicle may use `powertrain` to install an assembly into the existing engine mount. Generic bounding fit preserves the vehicle rig; inspect specific clearances and plumbing rather than assuming every part is automatically physically compatible. `attachAt(parent,socket,child,plug)` aligns position and opposing port direction. Family-specific automatic constraints/clearance solvers are not implemented.

## Environment and cabin extensions

The same components and named edits work on worlds, dashboard surfaces and interior groups. For repeated scenery generate component arrays in TS; author new props freely. `attachAt` and transforms provide alignment; there is no interactive snapping editor. Existing route samplers remain canonical. Changing road surface geometry does not automatically regenerate route dynamics; author both together in custom TS. Interior dimensions can invalidate driver contact targets: existing grips/pedals remain working for the unchanged cabin, but arbitrary seat/wheel movement requires updating the rig targets and checking actual poses.

## Editing, audio and targeted previews

`kit:review -- <slug> --moving --shot=<id>` produces a moving scene preview at absolute timeline frames. `kit:scene -- <slug> --shot=<id>` renders only that scene. Add `--landscape` for native 1920x1080. `--dry-run` prints exact ranges. Standard full render remains available. Changed-scene hints: `kit:plan -- <slug> --previous=out/studio/<prior>/plan.json`; retain the previous plan before overwriting it. Scene fingerprints are change hints, not cryptographic artifact identity; source handoffs use SHA256. A source-code change requires regenerating previews even if JSON is unchanged. Partial scene output does not replace or automatically reassemble a final film.

Supply original public-relative narration/music files in `audio`. Optional `words:[{text,start,end}]` accepts **supplied** ordered timestamps in seconds; they are never estimated. Without words the supplied phrase captions or authored shot captions remain. Audio metadata duration/loudness and audiovisual synchronisation still require FFprobe and listening. No automatic ASR, beat alignment, transitions or sound-effect mixing is claimed.

## Five-agent source contract

1. Coordinator assigns unique project/variant IDs and source revision. Specialists edit their own folders; shared changes belong in a separate reviewed commit.
2. Each specialist supplies JSON/TS source, referenced media, `handoff.json`, frame ranges, actual MP4 SHA256 and review limitations.
3. Editor imports approved recipes/absolute shots, preserving their source and animation. Handoff generation alone is not approval.
4. Promote an improvement by committing its source as a named shared factory/config, adding regression coverage and reviewing matching-angle comparisons. Promotion is a Git review process; no command silently modifies the shared catalogue.
5. Fetch remote head before push, use normal fast-forward updates and resolve concurrent work without force. Atomic project creation safeguards remain in force.

## Proof and QA boundaries

`yunex-studio-v3.yml` renders four demonstrations in both native orientations, six sample stills per film, matching-camera baseline images and per-project source plans. `v3-verify.py` verifies dimensions/30fps/180frames/6seconds, silence, full decode, frame uniqueness and SHA256; it builds contact sheets and comparisons. Portrait videos are 1080x1920; landscape 1920x1080. These are six-second silent workflow proofs, not narrated finished episodes.

`validateModel` checks finite visible geometry/transforms, positive visible scales, static pipe endpoints and a bounded broad-phase AABB sample. AABB overlaps are warnings because intended assemblies overlap. It does not certify triangle intersections, shading quality, driver contact, portrait framing, blur, darkness or cinematic quality. Inspect actual moving MP4s before declaring visual approval. Existing catalogue and render checks continue separately.
