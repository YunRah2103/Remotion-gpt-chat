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

### Project component registry

`new ComponentRegistry()` exposes all 55 shared parts through `search(query)`, `describe(id)` (actual bounds and ports) and `create(id, family)`. Add independent factories with `register({id,version,families,source,factory})`; duplicate IDs are rejected. A factory must return a fresh Group. Use `createAssembly(spec, id => registry.create(id,'sports'))` to combine new agent-built geometry with existing parts and port plumbing. This resolver is a TypeScript extension; recipe JSON resolves the built-in catalogue. Retain animation callbacks in your source when creating nonstandard rigs.

## Recovered V3: animated editing and complete films

`jointTracks` extends each shot's fixed `joints` with ordered `{time,value}` keys in **shot-local seconds**. Values are 0..1, interpolated linearly, and sampled from absolute frames without accumulated state. Example: `"jointTracks":{"v3-rear-wing":[{"time":0,"value":0},{"time":1,"value":1}]}`. Works on custom vehicle or assembly components. Unkeyed joints retain the fixed pose.

Mechanical shots accept `orbit:{azimuth:0.8,elevation:0.3,sweep:0.4}` in radians. The camera fits the actual component bounds throughout its move; this does not bypass safe-area framing. Assembly connections optionally accept `flow:{speed:0.32,count:7}` for illustrative moving markers along the **same actual tube curve**, orange for exhaust connections and teal for compressor connections. These markers show direction and are not a fluid or combustion simulation.

`fitDiagnostics(parent,part,{min,max})` measures visible mesh vertices in the parent installation space, including rotated parents. It returns per-axis clearance and named overflowing faces, without silently resizing the part. `kit:inspect` now includes `installationFit` for custom powertrains against the existing generic installation envelope. Treat broad-phase fit as a review aid, not physical compatibility certification.

### Complete silent twin-turbo demonstration

```sh
node --experimental-strip-types scripts/modelling-kit/complete-demo.mjs
npm run kit:plan -- twin-turbo-complete
npm run kit:inspect -- twin-turbo-complete
npm run kit:review -- twin-turbo-complete --moving --shot=exhaust
npm run kit:scene -- twin-turbo-complete --shot=hook
# Repeat kit:scene for exhaust, shaft, charge, combustion, installed, payoff.
npm run kit:assemble -- twin-turbo-complete
npm run kit:handoff -- twin-turbo-complete
```

The complete recipe is editable source in `twin-turbo-demo.ts`, installed through the ordinary atomic project creator. Seven original shots total **25 seconds / 750 frames**, native portrait 1080x1920/30fps. No narration has been invented. Use a different slug for independent variants, or edit the existing generated project rather than running creation again.

`kit:scene --shot` writes an MP4 plus a SHA256/source/shot contract. `kit:assemble -- <slug> [downloaded-shot-folder]` verifies those contracts, native dimensions, frame counts and full decode for **every shot**, then concatenates without interpolation or re-encoding. It rejects modified files, changed shot recipes and changed renderer source. Render only invalid shots again; unchanged artifacts can be reused while their source and shot contracts match. Script and shared renderer edits invalidate cached clips conservatively. Keep sidecar `.mp4.json` files with their MP4s.

Assembly currently accepts silent portrait clips only; use the full `kit:scene` render for supplied narration/music so original audio spans the complete timeline. An assembled file and technical report still require actual moving-footage review. The V3 native workflow retains all eight short modelling proofs and separately renders/assembles the seven demo shots, with an editable project, timeline sheet and complete decode report.

## Recovery additions: precise edits and independent films

`npm run kit:catalog -- electric` searches all vehicle/part labels and metadata. Omit the query to retain the complete catalogue.

`kit:inspect` includes a `path` for each named node. Copy that exact path into a model edit's `target` to select one repeated rim or intake. Paths contain sibling indices and belong to the source revision inspected. Plain-name edits preserve legacy first-match behaviour, with ambiguity diagnostics; set `match:'unique'` for strict selection. `selectModelObject(root,target)` is strict. Private variants retain canonical JSON/TS source; shared originals are never rewritten.

Custom mounts may declare `kind:'engine'` or `accepts:['engine']`. `attachAt` rejects incompatible typed plugs before changing parentage; legacy untyped mounts have no compatibility certification. `fitDiagnostics` now returns a proposed parent-space uniform scale and translation. These are suggestions only: review actual geometry, update mount alignment and rerun diagnostics before applying them.

Structured briefs also accept full `vehicle` and `environment` objects, plus original `audio`, `words` and `captions`. This preserves private geometry variants, supplied exact timestamps, music and night/wet settings through the same compiler. Nothing estimates speech timings.

For isolated part or assembly shots set `context:'inspection'` to use a clean grounded studio view. Keep ordinary driving shots in default world context. For EV cutaways `energyFlow:'regenerate'` shows illustrative energy travelling from the actual motor centre towards the battery; `'drive'` reverses it. Markers respect depth and do not represent a calibrated power simulation.

Independent reusable example: `node --experimental-strip-types scripts/modelling-kit/regeneration-demo.mjs`, then the same `kit:plan`, `kit:inspect`, `kit:review`, `kit:scene` and `kit:assemble` commands with `ev-regeneration-proof`. This creates a new editable 12-second, 360-frame silent proof using the existing EV/mountain assets. Creation is non-destructive and refuses duplicate slugs. See YUNEX_V3_RECOVERY_HANDOFF.md for verification status; source existence is not MP4 acceptance.
