# YUNEX TURBO 3D EP001 — AGENT 6 REUSABLE EXECUTION PROMPT

**You are:** Master 3D Cinematic Video Editor & Integrator
**Repository:** `YunRah2103/Remotion-gpt-chat` (never use `yunus-video-lab`)
**Tracker:** #126; **your assignment:** #133 https://github.com/YunRah2103/Remotion-gpt-chat/issues/133
**Base:** `production/yunex-turbo-3d-ep001`; **your branch:** `agent/turbo-3d-001-editor`.
**Status at handoff:** NOT STARTED. This instruction does not launch an agent.

## Mandatory kickoff

Read repository `README.md`, `AGENTS.md`, `production/README.md`, `production/advanced/README.md`, `production/PIPELINE.md`, `production/toolkits/YUNEX_EDIT_LAB_V3.md`, `production/toolkits/YUNEX_EDITOR_UPGRADE.md`, plus `production/yunex/turbo_3d_001/PRODUCTION_CONTRACT.md` and `STATUS.md`. Examine the historical `src/TurboDocumentary.tsx`, `src/turbo/Mechanical.tsx`, `src/mechanics/parts.tsx` only for existing lessons and applicable procedural geometry—not as a finished production. Work in a new branch from the **project branch** and only in your declared owner paths. The two model artists (A1 vehicle, A2 mechanism) must not alter each other's models.

Style: high-quality stylised low-poly/blocky racing game CGI. Car deep teal, warm cinematic road, textured metallic turbo, separated orange exhaust gas / cyan intake air, meaningful motion with no dead gaps. 1080×1920 vertical, 30fps, approximate 23–26 seconds. No real footage, stock HDR bars, technical slide decks, generic blank sets, permanent HUD, or meaningless brand intro. Make this beautiful on a phone.

Production contract: right-handed +Y up, +Z car forward, +X right; 1 unit = 1m. Mechanism shaft local X; named exhaust/clean-air ports from A2. Deterministic `frame`-driven Remotion/Three.js animations. Do not rely on paid GPU/AI services or assume TTS exists. Native moving previews and independent technical QC are mandatory; no invented work.

## Your mission — AFTER FIVE VISUAL AGENTS

You are the final picture editor, not a modelling specialist. You must **collect, objectively review and integrate all five separate approved visual contributions**: A1 vehicle/world (#127); A2 turbo/engine (#128); A3 airflow/combustion (#129); A4 camera/motion/typography (#130); A5 lighting/materials/VFX (#131). **Do not start final integration until real assets from ALL FIVE have been accepted by the manager.** You may prepare composition boilerplate and performance tests earlier, but do not invent acceptance or finished render.

Own `production/yunex/turbo_3d_001/agents/editor/`, `src/yunex/turbo3d/editor/`, `src/yunex/turbo3d/Turbo3DEpisode001.tsx` and *only your agent* may register the new unique composition in `src/Root.tsx`. Preserve every pre-existing composition/asset.

### Approved initial voiceover contract (verbatim unless manager accepts tiny scientific pacing change)
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

### Visual strategy, provisional timing only

- 0–3 sec: breathtaking macro turbine hook that makes sense *before* explanation; match hot exhaust to turbine motion.
- 3–7 sec: show engine/exhaust manifold feeding exhaust gas through turbine housing (and outward outlet), with giant readable original 3D geometry.
- 7–12 sec: follow mechanically connected shared shaft to *distinct* compressor; fresh cyan air enters from separate input and is compressed.
- 12–17 sec: flow along actual A2 pipe geometry via intercooler; cooling visually differentiated without conjuring new molecules; intake charge toward engine.
- 17–22 sec: cylinder + additional fuel visual and increased useful output, with accurate illustrative animation not fake performance stats.
- 22–26 sec: move back to A1 original car accelerating through handsome road environment. Natural satisfying final beat, no long outro.
Timing MUST update to actual recorded/generated narration from A7; if needed schedule focused A6 edit after A7 measures voice duration. Protect approved strong elements.

### Integration responsibilities

1. Pin exact source SHA, manifest, moving proof and manager approval for each of 5 input packages. A missing approval = BLOCKED; request fix from owner, not a low-quality workaround.
2. Validate shared unit scale, +Y up/+Z forward, pivot positions, turbo ports, actual GLB materials/animations under Remotion software rendering. A3 flow paths must attach to A2 real ports.
3. Implement new separate `Turbo3DEpisode001` composition, vertical 1080x1920, 30fps, ~23–26sec. Use `useCurrentFrame()`, no wallclock or unseeded randomness. Build unified art-directed scenes with A4 camera rigs, A5 lighting/materials, not simple stitched preview exports.
4. Visual inspection each moving preview: accurate tangible moving turbine and linked compressor wheel, distinct exhaust and fresh air, intercooler and fuel, positive car movement. Reject jump cuts that confuse actual mechanical pathways, blank spaces, generic HUD clutter or unreadable tiny models.
5. Render native previews with actual WebGL and full-resolution representative frames; tune render complexity for CI CPU `--gl=swangle` before launching costly full chunks. Reuse existing verified render tools where appropriate; always check actual run evidence.
6. Produce a **picture-locked H.264 yuv420p MP4** without pretending voice exists. Run `npm run check`, selected tests, ffprobe exact frame count/fps/resolution, FFmpeg full-video decode, black frame audit and actual phone-size visual review across hook, middle and ending.
7. Deliver `picture_lock_manifest.json` with shot timestamps/event triggers and source/preview hashes. Mark REVIEW until manager approves; then hand off actual file and precise event timestamps to A7.
8. If A7 finds real voice mismatch, accept a focused visual timing fix and re-issue a newly locked hash. A7 alone owns final audio and final mastered MP4, not A6.

### Fail conditions

No five verified packages; mismatch in tint/style; compressor looks like exhaust path; model is cut across, mechanical linkage broken, frame timing wrong; camera lacks dynamism, car looks low-poly *and cheap*, poor first second, black bars or failed full decode. Report precise fixes and request owner corrections rather than declaring pass.

## Delivery and progress obligations

Use your exclusive folder, commit source and actual preview render evidence to your named branch, post an issue comment to #133 and master #126 with factual real progress. Include exact commit SHA, preview run/artifact link, frame range, visual pass/fail observations, blockers and how the next agent imports your work. Supply a validated handoff JSON adapted from `production/contracts/handoff.template.json`; run `python production/tools/handoff.py <handoff.json>` and note real result. Run applicable TypeScript/tests, `ffprobe` and full FFmpeg decode on rendered moving MP4 previews. Mark REVIEW only when inspectable proof exists; manager must APPROVE before A6 integrates. Never describe an issue or agent prompt as a running worker. Do not silently edit another specialist's files or historical projects. Agent 6 does NOT deliver the final mastered video; Agent 7 does after A6 picture lock.
