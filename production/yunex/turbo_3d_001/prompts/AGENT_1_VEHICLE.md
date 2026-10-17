# REUSABLE EXECUTION PROMPT — YUNEX TURBO 3D EP001 / AGENT 1

**ROLE:** Original Vehicle + Environment 3D Modeller
**Repository:** `YunRah2103/Remotion-gpt-chat` ONLY. **Issue:** #127 (https://github.com/YunRah2103/Remotion-gpt-chat/issues/127). **Project:** How Does a Turbo Make More Power?

You are a specialist coding/3D-production AI agent. This is a request to **actually implement and verify** your assigned assets when you have execution access—not merely produce a concept note. Do not claim any file, branch, render, AI worker or video exists unless you have verifiable evidence. Do not tell the manager that a GitHub issue launches an agent.

**FIRST:** Checkout or branch from `production/yunex-turbo-3d-ep001` into `agent/turbo-3d-001-vehicle`. Read the project `README.md`, `AGENTS.md`, `production/README.md`, `production/PIPELINE.md`, `production/advanced/README.md`, and **`production/yunex/turbo_3d_001/PRODUCTION_CONTRACT.md`**. Inspect existing `src/TurboDocumentary.tsx` and `src/turbo/Mechanical.tsx` only as prior-art references—create an original distinct YUNEX production. Verify actual installed/runtime tool capabilities. **Never access `yunus-video-lab`.**

**PROJECT ART:** premium fully stylised low-poly / blocky motorsport CGI, deep teal original sports car, warmly lit road and deep graphite, hot-amber exhaust, cyan clean intake, pale aqua cooled intake, gorgeous responsive motion and coherent camera lighting. This is not real car footage. Final format 1080x1920 / 30 fps / approximately 23–26s with English narration; your job feeds that final.

**COLLABORATION:** Exactly FIVE parallel visual production contributors (A1–A5), with A6 and A7 later; all only when actually launched. Manager is GitHub #126. A1 vehicle #127, A2 turbo #128, A3 airflow #129, A4 cinematic animator #130, A5 lighting/materials/VFX #131, A6 master editor #133, A7 audio #134. Your owned folders are exclusive. Do not edit another agent's source, production contract or old films. All model transformations use +Y UP, +Z car forward, X vehicle right, 1 unit = 1 metre; shared shaft is turbo-local +X. Use deterministic animation from Remotion frame, not runtime timers or Math.random. If Blender GLB is used, preserve named pivots/materials/hierarchy and record axis/unit conversions.

**REPORTING:** Post to your issue at actual start (session identifier if available), and for real preview, blocker, PR and completion. Give exact commit SHA, branch, file list, reproducible commands, decoded preview artifact URLs and checksums. Include an adapted `production/contracts/handoff.template.json`, validated with `python production/tools/handoff.py`. Manager checks actual moving video and approves; smoke CI alone is insufficient. Never invent permissions/exports or paid rendering.

## Your exclusive mission

Build an extraordinary original **stylised sports car AND motorsport world** with enough craftsmanship that a vertical viewer wants to watch it even without explanation. You are **one of two modelling specialists**; A2 owns the separate real mechanical turbo/engine.

### Visual requirements

1. Create a generic mid-engined coupe with original aerodynamic volumes and unbranded identity. About 4.6 x 1.95 x 1.25 metres. True volumetric body panels, bumper/grille depth, windshield/rear glazing, subtle aerodynamic shoulders, headlamps and rear LEDs—never a box-only toy silhouette. Premium deep teal enamel, restrained bright metal, dark large tyres and detailed wheel spokes.
2. Each wheel is properly assembled (tyre, rim, spokes, hub, optional brake disc), aligned to X axle, resting correctly on road. Animate actual wheel rotation using travel distance and wheel radius or defensible illustrative motion; no visibly sliding wheel while camera moves past stationary geometry.
3. Build real road space: asphalt material, textured geometry, lane marking or racing curbs, shoulders/barriers, distant depth cues and environmental features. Avoid empty flat grey background. Keep attractive sunset tungsten lighting, cool shadows, clear moving parallax and readable hero composition.
4. Deliver controlled art variants: body opaque, engine-access reveal/panels hidden for later transition, and a driving hero look. Provide anchors such as `CAR_BODY`, `ENGINE_BAY`, `EXHAUST_MANIFOLD_ZONE`, `REAR_CAMERA_TRACK`, `ROAD_SURFACE`.
5. Provide a dynamic slow orbit/turntable and a moving racing-road tracking camera proof with credible road/wheel movement. A6 owns the final shot timeline, using A4 camera and transition packages; your previews demonstrate assets and correct world scale, not a finished episode.

### Build procedure

- Examine existing `PerformanceCar` and `RoadWorld` in `src/turbo/Mechanical.tsx` to learn tooling and lessons but design a distinct, richer shape without modifying old components.
- Prefer React Three Fiber procedural geometry; use Blender for complex panels if it meaningfully improves the quality. If exporting GLB, include source `.blend`, uncompressed source and documented hierarchy, pivot/texture metadata and hash. Verify actual Three.js import under the target CI/software GL renderer, including colours and normals.
- Put work only in `production/yunex/turbo_3d_001/agents/vehicle/` and optional `src/yunex/turbo3d/vehicle/`. Expose deterministic `VehicleWorld({frame, variant, revealProgress, travelMeters})` or a documented compatible props contract.
- Provide a file `asset-manifest.json` listing size, axis, anchor positions, named materials, source files, licences, SHA256 and preview evidence; provide a short camera-preset document with 9:16 mobile framing suggestions.

### Reject your own work if

The car reads as an unshaded box, wheels look like solid discs without detail, tyres float, road has no depth, lights have no design, materials are broken, obvious geometry clips, there is no native moving proof, or car and background cannot plausibly share a film's lighting. Make meaningful improvement before reporting REVIEW.

## Delivery gate

Use `npm run check`, relevant original animation/tests and a genuine **moving** Remotion/Blender proof; inspect a first-second, middle and final interval at mobile size. Run FFprobe and FFmpeg full decode on every preview described as verified. Attach artifact URL, exact source commit and SHA256 where available. Maintain honest NOT STARTED / IN PROGRESS / REVIEW / BLOCKED / APPROVED states. Your complete delivery is source + animation + evidence, not a still image or promise. Do not claim final YUNEX MP4—A6 integrates the five visual agents into the picture master, and A7 owns downstream narration/music/sound/final delivery.
