# YUNEX TURBO 3D EP001 — ENERGY IN MOTION

**Reusable master takeover prompt:** [MASTER_PRODUCTION_MANAGER.md](prompts/MASTER_PRODUCTION_MANAGER.md) — five simultaneous visual specialists, A6 editor, A7 audio.

**Current stage:** PREPRODUCTION / seven prompts ready; NO running AI agent sessions verified.  
**Master tracker:** [#126](https://github.com/YunRah2103/Remotion-gpt-chat/issues/126)  
**Draft production PR:** [#132](https://github.com/YunRah2103/Remotion-gpt-chat/pull/132)

## Correct pipeline: FIVE VISUAL specialists → A6 editor → A7 audio

| Agent | Issue | Specialist | Owns | Starts |
|---|---|---|---|---|
| A1 | [#127](https://github.com/YunRah2103/Remotion-gpt-chat/issues/127) | **Vehicle and racing environment 3D modeller** | `agents/vehicle/` / `src/yunex/turbo3d/vehicle/` | Parallel phase |
| A2 | [#128](https://github.com/YunRah2103/Remotion-gpt-chat/issues/128) | **Turbocharger and engine 3D modeller** | `agents/mechanism/` / `src/yunex/turbo3d/mechanism/` | Parallel phase |
| A3 | [#129](https://github.com/YunRah2103/Remotion-gpt-chat/issues/129) | Airflow, intercooling and combustion animator | `agents/airflow/` / `src/yunex/turbo3d/airflow/` | Parallel phase; A2 ports coordinated |
| A4 | [#130](https://github.com/YunRah2103/Remotion-gpt-chat/issues/130) | Cinematic 3D camera, motion design and typography | `agents/cinematics/` / `src/yunex/turbo3d/cinematics/` | Parallel phase, with placeholder anchors |
| A5 | [#131](https://github.com/YunRah2103/Remotion-gpt-chat/issues/131) | Cinematic lighting, material shading and VFX lookdev | `agents/lookdev/` / `src/yunex/turbo3d/lookdev/` | Parallel phase, with named material slots |
| A6 | [#133](https://github.com/YunRah2103/Remotion-gpt-chat/issues/133) | **Master cinematic video editor and integrator** | `agents/editor/` and new unique Remotion composition/Root registration | After ALL five visual packages manager-approved |
| A7 | [#134](https://github.com/YunRah2103/Remotion-gpt-chat/issues/134) | **Narration, music, sound and final master** | `agents/audio/` and final mix/export | After picture-lock master from A6 |

**Each agent's ready-to-copy, detailed instructions:**

- [A1 — Vehicle model](prompts/AGENT_1_VEHICLE.md)
- [A2 — Turbo/engine model](prompts/AGENT_2_MECHANISM.md)
- [A3 — Airflow/combustion](prompts/AGENT_3_AIRFLOW.md)
- [A4 — Cinematic animation](prompts/AGENT_4_CINEMATICS.md)
- [A5 — Lighting/materials/VFX](prompts/AGENT_5_LOOKDEV.md)
- [A6 — Master editor](prompts/AGENT_6_EDITOR.md)
- [A7 — Audio director](prompts/AGENT_7_AUDIO.md)

**Shared production contract:** [PRODUCTION_CONTRACT.md](PRODUCTION_CONTRACT.md). **Honest current state:** [STATUS.md](STATUS.md).

## Production goal

One genuinely beautiful original 3D-only automotive engineering short, not a slideshow. Premium blocky racing-game car/world and macro turbo mechanics, hot amber exhaust causing a turbine to spin; common shaft drives separate cyan fresh-air compressor, through intercooler to engine, with appropriate fuel for extra power; hero car drives away. No live footage.

**Final spec:** `YUNEX_TURBO_3D_EP001_FINAL.mp4`: 1080x1920, full-screen vertical, 30fps H.264, ~23–26s adjusted to actual natural narration, 48kHz stereo AAC, music and restrained sound design; verified real media, not just files and claims.

A1–A5 may run in parallel only when separately launched in a compatible platform and on separate branches; issue/prompt/PR creation alone launches nothing. A4/A5 must not overwrite geometry from A1/A2; A6 integrates five distinct approved assets and A7 supplies the mastered sound. Read-only historical `TurboDocumentary` can inform technique but is not reused unchanged. Never modify the retired `yunus-video-lab`.
