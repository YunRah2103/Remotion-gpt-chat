# YUNEX EP001 — SHARED 3D PRODUCTION CONTRACT v1

All five specialists MUST follow this contract before modifying files. The manager owns it. No uncoordinated contract edits.

## Output and tools

- Final: full-bleed **1080 x 1920**, 9:16 portrait, **30 fps**, target **23–26 seconds**, H.264 yuv420p + AAC 48kHz stereo. Full actual speech duration sets final timing; no fabricated timecodes.
- Three.js + React Three Fiber + Remotion 4, using the repo's installed versions and `@remotion/three`; deterministic `useCurrentFrame()`-derived state. No wall-clock time, nonseeded randomness or CSS animation for production-critical motion.
- In GitHub Actions, `--gl=swangle` provides CPU-backed WebGL; do not assume GPU, Blender, premium TTS or remote workers are available. Preview tiny frame ranges first. Verify which binaries execute in the actual runtime.
- Blender source, `.glb`, glTF and Three.js parts may be supplied, but material appearance and animation must survive actual Remotion imports. GLB source must retain named moving pivots. Run applicable `production/advanced/blender_export.py` validations when used.

## Axes, scale and rig

- World coordinates: **right-handed, +Y UP, +Z vehicle forward, +X vehicle right**; **1 scene unit = 1 meter**. All materials/GLBs Y-up on export; transforms are explicitly documented. The existing `TurboDocumentary` need not conform: it is read-only reference material.
- Vehicle example bounds: about 4.6 m long x 1.95 m wide x 1.25 m tall, tyres radius about 0.36m; terrain top y=0. Car front points +Z. Wheel axle local X, wheel rotation X axis; ground contact must not visibly float.
- Turbo rig authored local shaft +X. Exhaust turbine centre at local X negative, compressor centre X positive. Both wheels turn from ONE shared shaft and shared rotation value; do NOT connect the air pathways. Parent can be rotated/translated by editor; named pivot locations must remain inspectable.
- Export units, Y-up conversion, bounding box, rig-pivot hierarchy and forward axis in each model manifest. Do not bake transforms that destroy needed pivots. Use adapters for mismatched imported files instead of quietly reversing shaft/air direction.
- A2 publishes documented interface points: `EXHAUST_IN`, `EXHAUST_OUT`, `CLEAN_AIR_IN`, `COMPRESSED_AIR_OUT`, `INTERCOOLER_IN`, `INTERCOOLER_OUT`, `ENGINE_INTAKE`, `FUEL_IN`. A3 consumes these ports, never guesses paths when geometry changes.

## Visual style

**Film look: ENERGY IN MOTION** — premium stylized blocky racing-game CGI, tasteful contrast, strong sculpted silhouettes, rich physical materials, sunset tungsten edge highlights, dark petrol blue/graphite asphalt. Vehicle deep glossy teal `#0D817F` with silver accents; rims deep graphite `#171D27`. Mechanism brushed graphite `#4B606D` with slightly warm metal highlights `#C5D0D1`. Scene background `#08121D`. Cohesive key light from camera-left/high and warm rim light camera-right; adjust only for plausible local environment match.

- Exhaust gas/thermal energy = hot amber `#FF8A36` / red `#F15C3A`; clean intake air = cyan `#53CFFF`; downstream compressed/cooled charge = aqua `#8CEBE3` as a visual identity only, not a physical claim of mass being created by cooling.
- Avoid empty grey voids, black bars, stock photos, generic HUD frames, permanent header, oversized badges or watermark/outro. Models occupy a meaningful proportion of the mobile frame.
- Keep essential hardware/text roughly within x=110..970 and y=220..1580 pixels when possible; mobile social UI may occlude edges/top/bottom. Small text never carries the only vital explanation.
- Design first ~2 seconds around moving mechanical hardware, clear exhaust-to-turbine interaction and fast cinematic camera movement. At payoff return to original car, dramatic driving composition, no lengthy logo.

## Modules, source ownership and branches

Working branch per session: `agent/turbo-3d-001-vehicle`, `agent/turbo-3d-001-mechanism`, `agent/turbo-3d-001-airflow`, `agent/turbo-3d-001-editor`, `agent/turbo-3d-001-audio`. Base each on this production branch (not historical branches).

- A1: `production/yunex/turbo_3d_001/agents/vehicle/`, optional components in `src/yunex/turbo3d/vehicle/`.
- A2: `.../agents/mechanism/`, optional components in `src/yunex/turbo3d/mechanism/`.
- A3: `.../agents/airflow/`, optional components in `src/yunex/turbo3d/airflow/`.
- A4: `.../agents/editor/`, integrated composition/shot runtime in `src/yunex/turbo3d/editor/`. **Only A4** edits `src/Root.tsx` to register the new composition and `src/yunex/turbo3d/Turbo3DEpisode001.tsx`. Do not modify existing composition IDs.
- A5: `.../agents/audio/`; mix outputs, timings, credit/license manifest, audio pipeline. A5 does not alter geometry/scene files.
- Do not overwrite teammates' folders, change `package.json` globally or merge unapproved work; request cross-owner changes with an issue comment and a focused PR.

## Component and timing interfaces

Every R3F visual module should export a named component with deterministic props `frame: number` and optional `durationInFrames`, `intensity`, `visibility`, `variant`. Describe prop ranges. Render-time animation MUST respond to the supplied `frame`. Provide a simple preview harness.

Provide named model anchors; R3F group transform scale 1 = real-world contract. Provide relevant metadata in JSON including:
`assetId`, `kind`, `owner`, `unitMetersPerUnit`, `upAxis`, `forwardAxis`, `boundingBox`, `entrypoints`, `ports`, `rigPivots`, `sourceFiles`, `licenses`, `evidence`, `sha256`.

Any worker that has a preview should post a **real** preview link with exact branch commit and frame/time range. A screenshot alone is not an animation pass.

## Story and audio contract

Approved initial voiceover (do not change science):
> How can exhaust make your car faster?
>
> Hot exhaust spins a turbine.
>
> That turbine shares a shaft with a compressor, which squeezes more fresh air into the engine.
>
> More air means the engine can burn more fuel and make more power.
>
> An intercooler cools that compressed air on the way in.
>
> That's how a turbocharger works.

Shot pacing plan **provisional only**: 0–3s immediate spinning turbo; 3–7s exhaust routes turbine; 7–12s shaft to clean compressor; 12–17s compressed air via intercooler/cylinders; 17–22s richer combustion/power; 22–26s car-on-road payoff. Align cuts and on-screen visuals to **actual narration audio**, not guessed word timings. If audio changes shot timing, A5 requests a precise A4 correction before final mux.

## Mechanical/scientific truth conditions

1. Exhaust manifold gas moves through turbine housing, does work, then leaves through exhaust.
2. Turbine and compressor wheels share mechanical shaft / synchronized rotation.
3. Compressor acts on *fresh air*, not exhaust. Paths never mix inside housing.
4. Under suitable conditions, compression enables a higher intake-air mass flow; fuel system adds appropriate fuel to yield more engine output. Turbo power is not free; backpressure/thermal costs exist.
5. Intercooler reduces compressed-air temperature and can increase charge density; do not show cooling alone creating air molecules.
6. Animation is stylized explanatory CGI, not measured manufacturer CAD/CFD. Do not invent horsepower/boost/acceleration values.

## Review and evidence gates

A1/A2/A3 must each deliver source, asset manifest, a **moving rendered preview**, reproduction command, verified source SHA, actual artifact hash, and a filled handoff copy from `production/contracts/handoff.template.json` checked via `python production/tools/handoff.py`. Manager explicitly approves each; no automatic approval based on CI.

A4 produces genuine native 1080x1920 moving picture lock, accurate shot list + real-frame visual QC, TypeScript check, actual `ffprobe` metadata, fully decoded video. A5 adds licensed/authorised narration/music/SFX with time-aligned voice, stereo audio, EBU R128 loudness, clipping/silence checks, actual final full MP4 decode. Use `production/toolkits/yunex_edit_audit.py` when relevant.

Statuses only: NOT STARTED / IN PROGRESS / REVIEW / APPROVED / BLOCKED / COMPLETE. Post truthfully to related agent issue and #126, and maintain `STATUS.md` with real evidence. **Creating these files does not launch agents.**
