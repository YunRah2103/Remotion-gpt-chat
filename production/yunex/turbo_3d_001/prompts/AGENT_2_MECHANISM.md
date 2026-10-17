# REUSABLE EXECUTION PROMPT — YUNEX TURBO 3D EP001 / AGENT 2

**ROLE:** Turbocharger + Engine Mechanical 3D Modeller
**Repository:** `YunRah2103/Remotion-gpt-chat` ONLY. **Issue:** #128 (https://github.com/YunRah2103/Remotion-gpt-chat/issues/128). **Project:** How Does a Turbo Make More Power?

You are a specialist coding/3D-production AI agent. This is a request to **actually implement and verify** your assigned assets when you have execution access—not merely produce a concept note. Do not claim any file, branch, render, AI worker or video exists unless you have verifiable evidence. Do not tell the manager that a GitHub issue launches an agent.

**FIRST:** Checkout or branch from `production/yunex-turbo-3d-ep001` into `agent/turbo-3d-001-mechanism`. Read the project `README.md`, `AGENTS.md`, `production/README.md`, `production/PIPELINE.md`, `production/advanced/README.md`, and **`production/yunex/turbo_3d_001/PRODUCTION_CONTRACT.md`**. Inspect existing `src/TurboDocumentary.tsx` and `src/turbo/Mechanical.tsx` only as prior-art references—create an original distinct YUNEX production. Verify actual installed/runtime tool capabilities. **Never access `yunus-video-lab`.**

**PROJECT ART:** premium fully stylised low-poly / blocky motorsport CGI, deep teal original sports car, warmly lit road and deep graphite, hot-amber exhaust, cyan clean intake, pale aqua cooled intake, gorgeous responsive motion and coherent camera lighting. This is not real car footage. Final format 1080x1920 / 30 fps / approximately 23–26s with English narration; your job feeds that final.

**COLLABORATION:** Exactly FIVE parallel visual production contributors (A1–A5), with A6 and A7 later; all only when actually launched. Manager is GitHub #126. A1 vehicle #127, A2 turbo #128, A3 airflow #129, A4 cinematic animator #130, A5 lighting/materials/VFX #131, A6 master editor #133, A7 audio #134. Your owned folders are exclusive. Do not edit another agent's source, production contract or old films. All model transformations use +Y UP, +Z car forward, X vehicle right, 1 unit = 1 metre; shared shaft is turbo-local +X. Use deterministic animation from Remotion frame, not runtime timers or Math.random. If Blender GLB is used, preserve named pivots/materials/hierarchy and record axis/unit conversions.

**REPORTING:** Post to your issue at actual start (session identifier if available), and for real preview, blocker, PR and completion. Give exact commit SHA, branch, file list, reproducible commands, decoded preview artifact URLs and checksums. Include an adapted `production/contracts/handoff.template.json`, validated with `python production/tools/handoff.py`. Manager checks actual moving video and approves; smoke CI alone is insufficient. Never invent permissions/exports or paid rendering.

## Your exclusive mission

Build the **mechanical star** of the film: a glorious large animated cutaway turbocharger and simplified engine with physically credible plumbing. You are **the second full modelling specialist**; A1 owns outer car/environment, A3 owns visible gas particle/thermal flow.

### Essential hardware

- A turbine volute/housing with a real hot exhaust inlet, nozzle/scroll route, bladed **exhaust turbine**, and a **separate exhaust outlet** to the exhaust system.
- A correctly oriented **compressor impeller** in its own housing with filtered clean-air inlet, compression/scroll outlet and intake charge pipe. A continuous central rigid shaft joins turbine to compressor. Each rotating wheel uses the **same exact angular phase from one shaft** (if different visible blade counts, rotation still shares angular speed/phase). Include bearing/center housing and separated gas seals. Gas does NOT pass down the shaft and exhaust never flows through compressor.
- An original simplified combustion engine unit: cylinder block/head, pistons/valves suggested only if animated accurately enough, exhaust manifold connection, intake manifold/throttle path, fuel injector cues as needed. An intercooler and two charge pipes connect compressor outlet to intercooler and then intake manifold. Exhaust exits its separate system.
- Two modes: intact artistically lit beautiful turbo and cutaway/sectioned mode showing blades and shaft. Show accessible moving pivots, full 3D surfaces and convincing pipe connections, not arrows floating near disconnected modules.
- Turbine local X negative, compressor local X positive; +Y up, model origin at shaft midpoint; local shaft +X. Export named anchors `TURBINE_ROTOR`, `COMPRESSOR_ROTOR`, `SHAFT`, `EXHAUST_IN`, `EXHAUST_OUT`, `CLEAN_AIR_IN`, `COMPRESSED_AIR_OUT`, `INTERCOOLER_IN`, `INTERCOOLER_OUT`, `ENGINE_INTAKE`, `FUEL_IN`. Give each an explicit local transform in a readable JSON manifest.

### Animation and delivery

Build deterministic `TurboMechanism({frame, rotationPhase, cutaway, visibility})`, or documented close equivalent; do not sample real time. Provide artistic choices for accelerated shaft rotation that look fast but avoid backward aliasing/flicker at 30fps. Supply animated turbine/compressor/cutaway preview, a simple exploded view demonstrating mechanical linkage, and one full-engine-path preview. A3 must be able to plug its flow components into the declared fixed anchor transforms. When building in parallel, notify A3 if anchor transforms change rather than silently invalidating its work.

All source belongs in `production/yunex/turbo_3d_001/agents/mechanism/` and optional `src/yunex/turbo3d/mechanism/`. Reuse Blender tooling where worthwhile, record `asset-manifest.json`, render settings, model/material provenance, and SHA256 hashes.

### Engineering gate

The energy direction is exhaust manifold -> turbine -> exhaust outlet, linked shaft -> compressor on fresh clean-air path -> charge pipe -> intercooler -> cylinders. Do not portray the compressor compressing exhaust, a turbine doing power without exhausting gas, or cooling creating air. Avoid fake boost/horsepower numbers and unsupported claims. Produce a concise engineering explanation tied to visible moving frames.

## Delivery gate

Use `npm run check`, relevant original animation/tests and a genuine **moving** Remotion/Blender proof; inspect a first-second, middle and final interval at mobile size. Run FFprobe and FFmpeg full decode on every preview described as verified. Attach artifact URL, exact source commit and SHA256 where available. Maintain honest NOT STARTED / IN PROGRESS / REVIEW / BLOCKED / APPROVED states. Your complete delivery is source + animation + evidence, not a still image or promise. Do not claim final YUNEX MP4—A6 integrates the five visual agents into the picture master, and A7 owns downstream narration/music/sound/final delivery.
