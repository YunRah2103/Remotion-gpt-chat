# YUNEX TURBO 3D EP001 — ENERGY IN MOTION

**Stage:** PREPRODUCTION. **Actual running agents:** none verified. **GitHub manager:** [#126](https://github.com/YunRah2103/Remotion-gpt-chat/issues/126).

Five agent execution assignments; two dedicated original-3D modellers:

| Agent | Issue | Role | Source owner | Depends on |
|---|---|---|---|---|
| A1 | [#127](https://github.com/YunRah2103/Remotion-gpt-chat/issues/127) | Car, wheels, racing road/world | `agents/vehicle/` | Contract |
| A2 | [#128](https://github.com/YunRah2103/Remotion-gpt-chat/issues/128) | Turbo + engine mechanical modelling | `agents/mechanism/` | Contract |
| A3 | [#129](https://github.com/YunRah2103/Remotion-gpt-chat/issues/129) | Exhaust, intake, intercooler, combustion animation | `agents/airflow/` | Contract + geometry ports from A2 |
| A4 | [#130](https://github.com/YunRah2103/Remotion-gpt-chat/issues/130) | Master 3D film editor + cinematic motion | `agents/editor/` and new `src/yunex/turbo3d/` | A1–A3 APPROVED |
| A5 | [#131](https://github.com/YunRah2103/Remotion-gpt-chat/issues/131) | Narration, music, sound mix, final MP4 | `agents/audio/` | A4 picture lock |

Prompts are in `prompts/`. Each can be copied verbatim into an enabled coding/agent execution session. They are instructions, not running sessions, and a GitHub Issue does not launch an agent.

First read `PRODUCTION_CONTRACT.md`. Agents 1, 2 and 3 may execute concurrently when agent execution supports it. Agents 4 and 5 execute sequential integration gates, with A4 allowed to pre-design camera choreography while A1–A3 work. Agent 0 (production manager) reviews factual progress at #126 and this branch's `STATUS.md`.

**Creative direction:** Fully animated high-quality low-poly/blocky sports-car racing-world. A turbo cutaway bursting to life with hot amber exhaust energy, linked shaft, isolated cyan intake flow, intercooler, fuel/combustion and a fast racing-road payoff. Visually interesting from the first 0.5 seconds, not an explainer slide deck.

**Final only when proven:** `YUNEX_TURBO_3D_EP001_FINAL.mp4`: 1080x1920, 30fps, approximately 23–26 seconds, H.264 yuv420p, stereo AAC, voiced in English and accompanied by music/SFX. Require a downloadable file or a successful verified run/artifact link and a factual QC report; never substitute a text response for the MP4.

Historical `TurboDocumentary` and all previous YUNEX projects remain unchanged. Old `yunus-video-lab` is out of scope.
