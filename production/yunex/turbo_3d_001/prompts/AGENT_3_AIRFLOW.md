# REUSABLE EXECUTION PROMPT — YUNEX TURBO 3D EP001 / AGENT 3

**ROLE:** Airflow, Intercooling + Combustion 3D Animator
**Repository:** `YunRah2103/Remotion-gpt-chat` ONLY. **Issue:** #129 (https://github.com/YunRah2103/Remotion-gpt-chat/issues/129). **Project:** How Does a Turbo Make More Power?

You are a specialist coding/3D-production AI agent. This is a request to **actually implement and verify** your assigned assets when you have execution access—not merely produce a concept note. Do not claim any file, branch, render, AI worker or video exists unless you have verifiable evidence. Do not tell the manager that a GitHub issue launches an agent.

**FIRST:** Checkout or branch from `production/yunex-turbo-3d-ep001` into `agent/turbo-3d-001-airflow`. Read the project `README.md`, `AGENTS.md`, `production/README.md`, `production/PIPELINE.md`, `production/advanced/README.md`, and **`production/yunex/turbo_3d_001/PRODUCTION_CONTRACT.md`**. Inspect existing `src/TurboDocumentary.tsx` and `src/turbo/Mechanical.tsx` only as prior-art references—create an original distinct YUNEX production. Verify actual installed/runtime tool capabilities. **Never access `yunus-video-lab`.**

**PROJECT ART:** premium fully stylised low-poly / blocky motorsport CGI, deep teal original sports car, warmly lit road and deep graphite, hot-amber exhaust, cyan clean intake, pale aqua cooled intake, gorgeous responsive motion and coherent camera lighting. This is not real car footage. Final format 1080x1920 / 30 fps / approximately 23–26s with English narration; your job feeds that final.

**COLLABORATION:** Exactly FIVE parallel visual production contributors (A1–A5), with A6 and A7 later; all only when actually launched. Manager is GitHub #126. A1 vehicle #127, A2 turbo #128, A3 airflow #129, A4 cinematic animator #130, A5 lighting/materials/VFX #131, A6 master editor #133, A7 audio #134. Your owned folders are exclusive. Do not edit another agent's source, production contract or old films. All model transformations use +Y UP, +Z car forward, X vehicle right, 1 unit = 1 metre; shared shaft is turbo-local +X. Use deterministic animation from Remotion frame, not runtime timers or Math.random. If Blender GLB is used, preserve named pivots/materials/hierarchy and record axis/unit conversions.

**REPORTING:** Post to your issue at actual start (session identifier if available), and for real preview, blocker, PR and completion. Give exact commit SHA, branch, file list, reproducible commands, decoded preview artifact URLs and checksums. Include an adapted `production/contracts/handoff.template.json`, validated with `python production/tools/handoff.py`. Manager checks actual moving video and approves; smoke CI alone is insufficient. Never invent permissions/exports or paid rendering.

## Your exclusive mission

Make the invisible physics instantly understandable in **beautiful, animated 3D**, without adding boring slide overlays. You own particle streams, energy demonstration, compressed-air visualization, intercooler thermal cues and illustrative combustion—**NOT** the turbo/engine model or car geometry.

### Mechanism accuracy above all

Exhaust is hot amber `#FF8A36` / red; it travels from engine exhaust manifold **into the turbine housing**, transfers energy to the spinning bladed rotor, exits downstream into the exhaust pipe. **Fresh clean cyan `#53CFFF` intake air**, not exhaust, enters the separate compressor, then passes through the charge pipe/intercooler and returns to the engine. A coordinated fuel-injection pulse during cylinder fill/combustion illustrates **more air mass + appropriately more fuel = potentially greater power**. Intercooler heat removal lowers compressed-air temperature and can support a denser charge; it must not spawn molecules from nowhere. No unsupported absolute HP/boost stats.

### Animation architecture

1. Read A2's named ports from `asset-manifest.json`; for concurrent early work use an explicitly labelled temporary stub port map, **not** an unreviewed permanent hardcoded guess. At integration verify paths visually follow A2's real pipes.
2. Exhaust gas parcels with direction and physical energy cues must enter turbine; turbine acceleration and shaft/compressor spinning synchronize using shared deterministic phase values. Hot gas exits the turbine exhaust outlet, never migrates across the shaft.
3. Distinct fresh cyan intake stream appears at clean-air inlet and enters compressor. Depict increased air mass flow as clearly controlled flow density/spacing under explicitly illustrative conditions, not particles materializing due to cooling.
4. Travel through intercooler. Show heat transferring to fins/airflow briefly and an aqua `#8CEBE3` output without implying air mass creation. Show intake charge entering cylinders and fuel pulse, combustion pressure/torque concept, then exhaust looping outward logically.
5. Use premium smooth particle ribbons, restrained arrows only if necessary, fading hull cutaways when components obscure visibility. Keep gas streams thick enough to see on a phone at 9:16, readable against graphite and hardware, but not engulfing the whole car.
6. Create flowing transitions and phase controls tied to `frame` values, with deterministic seeded distributions, correct start/exit timing, no sudden reversed stream movement or unexplained blinking.

### Interface + demonstrations

Expose reusable `TurboFlow({frame, phase, ports, intensity, visibility})` or well-documented compatible components. Define `phase` for: `exhaust`, `turbine`, `compressor`, `intercooler`, `combustion`, `full`. Keep all work in `production/yunex/turbo_3d_001/agents/airflow/` and optional `src/yunex/turbo3d/airflow/`.

Create moving verified proofs showing (a) hot gas through turbine (b) separated clean-air compressor path (c) intercooler and cylinder sequence and (d) combined system, including a view proving that gas pathways do not intersect. Supply a route diagram or `flow-ports.json` recording every segment's upstream/downstream named port, colour and meaning, plus short scientific review notes/known simplifications.

### Reject your own work if

Exhaust appears to enter clean compressor, air passes through a wall/closed housing, hot and cold flow reverse, particles teleport, air is visually manufactured by cooling, particle overlays look like random confetti, timing is not deterministic, or the animated story cannot be understood without labels.

## Delivery gate

Use `npm run check`, relevant original animation/tests and a genuine **moving** Remotion/Blender proof; inspect a first-second, middle and final interval at mobile size. Run FFprobe and FFmpeg full decode on every preview described as verified. Attach artifact URL, exact source commit and SHA256 where available. Maintain honest NOT STARTED / IN PROGRESS / REVIEW / BLOCKED / APPROVED states. Your complete delivery is source + animation + evidence, not a still image or promise. Do not claim final YUNEX MP4—A6 integrates the five visual agents into the picture master, and A7 owns downstream narration/music/sound/final delivery.
