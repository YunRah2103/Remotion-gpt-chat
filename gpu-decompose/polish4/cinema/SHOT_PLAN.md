# GPU POLISH04 — B cinematic shot plan (D contract aligned)

**Manager contract:** `gpu-decompose/polish4/PRODUCTION_CONTRACT.md` on D commit `102064938a9a45540434c93d9ff03cdcd72f9cba`.
**Work branch:** `gpu-polish4/b-cinema`. Independent B-only native proof uses provisional POLISH03 A/C materials only and is **not** D final approval.

Film 1080 × 1920 portrait, 30 fps, frames 0–449. All camera values frame-deterministic. Coordinate convention +X long card, +Y up, +Z fans toward lens. Continuous perspective orbit and focus optical selection; **no world-space mesh movement belongs to B**.

| Frames | Subject and creative intent | Optical anchor / hero composition |
|---|---|---|
| 0–49 | complete premium 3/4 product hero | whole object; 18→28° yaw, -29→-32° roll, visibly large |
| 50–89 | shroud machining into fan macro | front group→center rotor, purposeful physical crop |
| 90–159 | fan travel, stagger, face clearances | center rotor→front grouping; near-front perspective, pan-out |
| 160–209 | cooler release, fins and routed heatpipes | cooler/thermal groups, 45→57° yaw |
| 210–279 | board and thermal close-up | heatpipe+die+PCB selected union, 57→59° yaw |
| 280–329 | silicon / VRAM detail then expand | die+VRAM+VRM focus→all object, 76→62° yaw |
| 330–404 | dramatic 3/4 exploded master | whole assembly, yaw 62→59°, -28→-34° roll |
| 405–449 | complete clean exploded payoff | full object, yaw 59→63°, roll -34→-32° |

**Lens:** perspective 28–34° FOV interpolated between authored keys. World bounds are calculated **after** C additive motion. A mathematically derived fit from eight transformed Box3 vertices, portrait aspect and FOV prevents complete-shot silhouette clipping; selected-anchor fits are used only for deliberate macro crops. Camera lookAt and roll are recomputed from scratch every frame, not accumulated.

**Lighting:** neutral graphite backdrop #1c2227; white/warm-white directional key (3.1), broad soft spot (21), front side fill (1.6), elevated rear rim (3.5), low bounce (1.0), subtle white-grey hemisphere (1.2), ambient (.42). Preserve A source PBR base color and texturing; only clamp pathological roughness < .27 and metalness > .92 on B's cloned scene.

**Editorial:** small eyebrow/top product mark; stage line and quiet progress at lower safe edge; title only during start and finale. No particles, HDR neon or dense HUD.

**Handoff integration:** Agent D imports `GpuDecompositionPolish4` from `src/gpu-polish4/GpuDecompositionPolish4.tsx` into its own `src/Root.tsx` or existing manager-owned alias. D must stage final exact GLB+JSON at `public/gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb` and `public/gpu-decompose/polish4/decomposition.json`. B-only CI stages old model/motion into these same locations *in its temporary runner checkout only*, with explicit old hashes; no old-model runtime fallback. D re-renders final A/C assets and inspects them before release.

**Native visual QA gate:** require actual native stills at 0/30/60/100/135/180/225/270/310/365/415/449 and native moving clips across eight stages. Evaluate thumbnail-scale crop, space, contrast, silhouette, occlusion and motion, not only TS/tests. Refine after pixel inspection. Source paths remain owned exclusively by B.
