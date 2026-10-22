# EP004 Agent 11 · Quality night circuit / modelling kit V2

**Integration API:** `QualityNightCircuit`, `QualityLighting`, `applyQualityNightCarFinish` from `quality/look/index.ts`.

## Single-authority scene contract

Mount **QualityNightCircuit instead of** the old A4 `NightCircuitWorld`, not alongside it. Internally it mounts that exact A4 component once, so **the only road** remains `ep004-canonical-bump-asphalt` constructed by `look/road.ts` from `shared/sampleTrackSurface`. The accepted EP004 physics and height profile are unchanged.

The real V2 `createCinematicEnvironment({kind:'track',timeOfDay:'night',seed:12,quality:'hero',wetness:0.08})` is used as an **authoring source**, never placed wholesale: only kit-authored `pit-box-canopies` and relocated off-road `circuit-tyre-stacks` survive, with restrained warm pit fascia. The kit's **flat `circuit-asphalt`**, default curbs, original overlapping barriers, generic rig sparks, and unrelated world geometry **are never mounted**. The real A4 world owns barriers, road stripes, kerbs and actual floodlight fixtures.

`QualityLighting` adds the V2 `CinematicLighting` night reflections, car-following area key and cool/amber rim. For A2 `SparkParticle[]` only, A4's existing `deriveContactSparkLights` creates restrained short-lived warm bounce. `sparkLightGain=0` suppresses it completely. No particles ever originate from Agent 11 lookdev.

Apply `applyQualityNightCarFinish(car)` to a separately created V2 vehicle, never a global shared factory object. It changes only cloned PBR paint/carbon/rubber/metal materials; does not reposition the skid or wheel mesh. Agent 8 owns the actual future hero/skid replacement.

## Look choices / QA rationale

- Ground: original A4 graphite `#242f39`, roughness 0.79; **not overwritten** with V2's flat asphalt map.
- Darkness: ink `#14232d`, exposed V2 hero clearcoat and dim steel/carbon; maintain readable car silhouette.
- Warm pit: `#ffe0a9` low-energy signage-free accents; no flood of neon.
- Kit world wetness: 0.08, maximum 0.16; **only V2 detached off-road prop source**, not physical road.
- Particles: fixed actual A2 numerical physics output; no kit floor-sparks preset.
- Tone: no grain, fake blur, large noisy bloom, copyrighted sponsor logos, or random emitters.

## Validation / two moving native MP4s

From repo root after `npm ci` and FFmpeg installation:

```bash
npx tsc -p production/yunex/f1_sparks_ep004/quality/tsconfig.agent11.json
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/quality/tests/agent-11/*.test.mjs
node production/yunex/f1_sparks_ep004/quality/previews/agent-11/render-native.mjs
```

* `EP004Agent11DayNight` — 180f / 6 sec / identical 3-second route replay under reference daylight-vs-night **lighting**; A4 terrain and road remain unchanged across halves.
* `EP004Agent11NightCinema` — 240f / 8 sec / genuine moving chase and trackside-reverse three-quarter views (2 × 120f).
* Both expected **1080×1920, 30fps, H.264/yuv420p**, decoded end-to-end, 5fps sampled hash motion verification and actual 0/mid/end stills for **each shot**. Output under `out/ep004-agent11-native`.

To compare the previous approved editor V4 *appearance* if its Action artifact is available, supply `--baseline=/path/to/original-V4.mp4`. This is an appearance comparison, not a synchronised geometry A/B — the old editor's source paths and timeline differ. The native proof script reports `approved:false` deliberately: creative approval belongs to the owner/Agent 0.

### Handoff limitations

The fixture uses kit V2 **visual hero** and original A2 numerical spark/contact data, but hides the kit's generic metal skids and false spark instance emitter. Agent 8 will supply the physically aligned hero. The 25.248-second voice-locked final film is **not** claimed. No EP003, shared A4, A2, original editor, modelling-kit source, or `main` edits.

**Artifacts remain unverified until the two native jobs are executed and playable MP4s are inspected.** Source commit/PR alone is not evidence of a completed render.
