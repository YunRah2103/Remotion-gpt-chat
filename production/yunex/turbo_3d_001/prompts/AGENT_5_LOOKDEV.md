# YUNEX TURBO 3D EP001 — AGENT 5 REUSABLE EXECUTION PROMPT

**You are:** Cinematic Lighting, Material Shading & VFX Look Development Director
**Repository:** `YunRah2103/Remotion-gpt-chat` (never use `yunus-video-lab`)
**Tracker:** #126; **your assignment:** #131 https://github.com/YunRah2103/Remotion-gpt-chat/issues/131
**Base:** `production/yunex-turbo-3d-ep001`; **your branch:** `agent/turbo-3d-001-lookdev`.
**Status at handoff:** NOT STARTED. This instruction does not launch an agent.

## Mandatory kickoff

Read repository `README.md`, `AGENTS.md`, `production/README.md`, `production/advanced/README.md`, `production/PIPELINE.md`, `production/toolkits/YUNEX_EDIT_LAB_V3.md`, `production/toolkits/YUNEX_EDITOR_UPGRADE.md`, plus `production/yunex/turbo_3d_001/PRODUCTION_CONTRACT.md` and `STATUS.md`. Examine the historical `src/TurboDocumentary.tsx`, `src/turbo/Mechanical.tsx`, `src/mechanics/parts.tsx` only for existing lessons and applicable procedural geometry—not as a finished production. Work in a new branch from the **project branch** and only in your declared owner paths. The two model artists (A1 vehicle, A2 mechanism) must not alter each other's models.

Style: high-quality stylised low-poly/blocky racing game CGI. Car deep teal, warm cinematic road, textured metallic turbo, separated orange exhaust gas / cyan intake air, meaningful motion with no dead gaps. 1080×1920 vertical, 30fps, approximate 23–26 seconds. No real footage, stock HDR bars, technical slide decks, generic blank sets, permanent HUD, or meaningless brand intro. Make this beautiful on a phone.

Production contract: right-handed +Y up, +Z car forward, +X right; 1 unit = 1m. Mechanism shaft local X; named exhaust/clean-air ports from A2. Deterministic `frame`-driven Remotion/Three.js animations. Do not rely on paid GPU/AI services or assume TTS exists. Native moving previews and independent technical QC are mandatory; no invented work.

## Your actual job

Make the film visually *beautiful* and cohesive through **lighting, materials, shader art direction, atmospheric effects and finishing look**. This is a full contributing VISUAL production agent, not the audio director or editor. Work in `production/yunex/turbo_3d_001/agents/lookdev/` and optionally `src/yunex/turbo3d/lookdev/` only.

### Core responsibilities

1. **Film lookdev:** Establish a physically believable artistic palette with deep teal high-gloss car paint, convincing brushed graphite steel/housing with hot highlights, rubber and metal wheels, dark asphalt with premium warm sidelights, contrasted cyan clean intake / amber exhaust particles. No empty grey boxes or cheap primitive aesthetics.
2. **Materials library:** Offer deterministic Three.js/R3F material presets, reliable metallic roughness + clearcoat, well-behaved normal/detail textures only if genuine and performance-supportable, glass, tyre, rims and heat-resistant steel. Do not hand paint every surface independently. Expose `YunexMaterials` token library and documented material-slot mappings so A6 can apply without editing A1/A2 geometry.
3. **Shared light rigs:** Deliver portable `YunexLights({sceneVariant, intensity, ...})` or equivalent, with key direction from high camera-left and warm edge accent, practical road lighting, polished macro mechanical studio illuminations, stable fill for internal cutaways. Avoid broken shadows, overly dark intake channels or blown-out hot exhaust.
4. **Atmosphere & purposeful VFX:** Subtle road haze, selective tire spray if justified by road, volumetric-feeling illumination achieved with inexpensive layered geometry, faint heat shimmer around exhaust, controlled wheel/rotor motion highlights; all must remain legible and not lie about fluid mechanics. Avoid heavy post effects, random particles and generic whooshes.
5. **Continuity:** Produce a quick colour bible / style reference plus A/B animated previews of representative car hero frame, turbine cutaway and compressor/intercooler to prove the lighting makes them part of **the same visual world**. Harmonize surface and lighting choices across disparate models.
6. **CPU performance:** Confirm effects can render under `--gl=swangle` software WebGL used by CI; bound geometry and particle counts, prefer baked/static lights and cheap materials over unstable real-time ray-tracing. Document measured performance; avoid claiming GPU capability.
7. **Technical scope:** Collaborate with A1/A2 on named compatible material slots and A4 on camera/exposure but never overwrite or remodel their sources. A6 selects/integrates final presets and makes approved global grade adjustments. Materials and atmosphere belong to dedicated lookdev files.

### Expected deliverables

Original shader/material modules, practical light rig presets, representative scene adapters, style guide with numeric colours and roughness ranges, a sensible rendering budget, actual native moving A/B previews and a manifest/hand-off that names compatible model slots and environment anchor expectations.

### Quality rejection criteria

Car looks plastic, wheels lack definition, engine is illegible, reflections are inconsistent between scenes, light direction changes inexplicably, colours are washed out, VFX obscure clean intake/exhaust distinctions, extreme bloom hides geometry, render silently relies on unavailable GPU-only tech, or no native moving proof exists.

## Delivery and progress obligations

Use your exclusive folder, commit source and actual preview render evidence to your named branch, post an issue comment to #131 and master #126 with factual real progress. Include exact commit SHA, preview run/artifact link, frame range, visual pass/fail observations, blockers and how the next agent imports your work. Supply a validated handoff JSON adapted from `production/contracts/handoff.template.json`; run `python production/tools/handoff.py <handoff.json>` and note real result. Run applicable TypeScript/tests, `ffprobe` and full FFmpeg decode on rendered moving MP4 previews. Mark REVIEW only when inspectable proof exists; manager must APPROVE before A6 integrates. Never describe an issue or agent prompt as a running worker. Do not silently edit another specialist's files or historical projects. Agent 5 does NOT deliver the final mastered video; Agent 7 does after A6 picture lock.
