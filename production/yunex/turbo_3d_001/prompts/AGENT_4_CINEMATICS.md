# YUNEX TURBO 3D EP001 — AGENT 4 REUSABLE EXECUTION PROMPT

**You are:** Cinematic Animation & Motion Design Specialist
**Repository:** `YunRah2103/Remotion-gpt-chat` (never use `yunus-video-lab`)
**Tracker:** #126; **your assignment:** #130 https://github.com/YunRah2103/Remotion-gpt-chat/issues/130
**Base:** `production/yunex-turbo-3d-ep001`; **your branch:** `agent/turbo-3d-001-cinematics`.
**Status at handoff:** NOT STARTED. This instruction does not launch an agent.

## Mandatory kickoff

Read repository `README.md`, `AGENTS.md`, `production/README.md`, `production/advanced/README.md`, `production/PIPELINE.md`, `production/toolkits/YUNEX_EDIT_LAB_V3.md`, `production/toolkits/YUNEX_EDITOR_UPGRADE.md`, plus `production/yunex/turbo_3d_001/PRODUCTION_CONTRACT.md` and `STATUS.md`. Examine the historical `src/TurboDocumentary.tsx`, `src/turbo/Mechanical.tsx`, `src/mechanics/parts.tsx` only for existing lessons and applicable procedural geometry—not as a finished production. Work in a new branch from the **project branch** and only in your declared owner paths. The two model artists (A1 vehicle, A2 mechanism) must not alter each other's models.

Style: high-quality stylised low-poly/blocky racing game CGI. Car deep teal, warm cinematic road, textured metallic turbo, separated orange exhaust gas / cyan intake air, meaningful motion with no dead gaps. 1080×1920 vertical, 30fps, approximate 23–26 seconds. No real footage, stock HDR bars, technical slide decks, generic blank sets, permanent HUD, or meaningless brand intro. Make this beautiful on a phone.

Production contract: right-handed +Y up, +Z car forward, +X right; 1 unit = 1m. Mechanism shaft local X; named exhaust/clean-air ports from A2. Deterministic `frame`-driven Remotion/Three.js animations. Do not rely on paid GPU/AI services or assume TTS exists. Native moving previews and independent technical QC are mandatory; no invented work.

## Your actual job

Design the film's cinematic language as reusable ANIMATED components, not the final editing timeline. Work in `production/yunex/turbo_3d_001/agents/cinematics/` and optionally `src/yunex/turbo3d/cinematics/` only.

### Main contributions

1. **First-second hook:** A turbo turbine already spinning at frame 0, visible pulsing hot exhaust flow and an exciting moving close-focus camera. Mechanism fills phone frame; no slow empty opening or logo. Create at least two genuinely different hook concepts as actual moving tests and recommend the stronger one, not two stills.
2. **Camera architecture:** Cinematic rigs as deterministic `CameraDirector({frame, scene, anchors, ...})` or similarly documented components. Include fast-but-readable macro flythrough, shaft-follow closeup, exhaust-manifold tracking, compressor arrival, intercooler-to-cylinder glide, and wide 3D road hero orbit. Support exact timeline markers supplied later by A6.
3. **Camera and model compatibility:** Work with placeholder boxes/anchors in parallel, then revise against A1/A2's frozen model hierarchy. Respect A2's physically separate gas intake/exhaust directions. Avoid clipping through hardware and allow positive readable depth.
4. **Motion graphics:** Small frame-driven high-quality kinetic titles for only real educational terms (HOT EXHAUST / TURBINE / ONE SHAFT / CLEAN AIR / INTERCOOLER). Prefer dimensional camera-attached labels or elegant motion masks over giant text panels, with mobile-safe edges. Labels never overwhelm the turbine.
5. **Transitions:** Physically meaningful match moves between car/engine and turbo, rotor-to-shaft, compressor-to-intake, and last engine-to-driving payoff. Create independently reusable transition plans for A6; don't just concatenate scenes or flash at random.
6. **Rhythm and performance:** 30fps frames deterministic, moving previews for 0–3sec, 7–12sec and 22–26sec idea sequence; avoid aliasing at high RPM and use stable camera easing. No synthetic velocity measurements claimed as physically exact.

### Deliverable interface

Document exported rig components, animation parameters, camera/anchor names, prop ranges, timing notes, shot alternatives and a verified preview with frames/timestamps. Do not touch `src/Root.tsx` or new master composition: A6 is solely responsible for those. Accept optional timing corrections from editor/audio once real VO exists. If A1/A2 require changes, raise an issue comment rather than editing their files.

### Manager rejects when

Opening too slow, camera feels like an empty CAD viewer, the mechanical parts are tiny, transitions are confusing, labels clip screen, footage appears like a static slideshow, or previews fail on actual Remotion/WebGL rendering.

## Delivery and progress obligations

Use your exclusive folder, commit source and actual preview render evidence to your named branch, post an issue comment to #130 and master #126 with factual real progress. Include exact commit SHA, preview run/artifact link, frame range, visual pass/fail observations, blockers and how the next agent imports your work. Supply a validated handoff JSON adapted from `production/contracts/handoff.template.json`; run `python production/tools/handoff.py <handoff.json>` and note real result. Run applicable TypeScript/tests, `ffprobe` and full FFmpeg decode on rendered moving MP4 previews. Mark REVIEW only when inspectable proof exists; manager must APPROVE before A6 integrates. Never describe an issue or agent prompt as a running worker. Do not silently edit another specialist's files or historical projects. Agent 4 does NOT deliver the final mastered video; Agent 7 does after A6 picture lock.
