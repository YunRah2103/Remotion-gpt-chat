---
name: engineering-production
description: Use for automotive educational video project creation, Remotion proof renders, project preflights and final 3D integration.
---

# Full automotive explainers

Only work in `YunRah2103/Remotion-gpt-chat`. Never access or copy from `yunus-video-lab`.

1. Read `production/AGENTS.md` and `production/PIPELINE.md`.
2. Write or update a brief with `production/tools/scaffold.py`, physics/storyboard, factual sources and rights.
3. Build detailed original assemblies with real pivot/shaft/valve motion, not flat decorative HUDs.
4. Register a real `src/Root.tsx` Remotion composition; set `sourceCompositionId` only after implementation. A preproduction stub is not a film.
5. Run `python production/tools/production_pipeline.py --project <slug>` and honour all errors.
6. First render moving low-res previews and full-res critical stills. Independent engineering review is still required.
7. For approved word timestamps use `approved-words.json` under the project's directory, then use `<FilmID>Captioned` only if registered. Never invent word timings or TTS.
8. Use the Production Pipeline workflow for chunked final MP4, FFprobe and full FFmpeg decode. Final artifact is a *candidate* until visual review.

Record exact source SHA, artifact IDs, blockers, and approved audio provenance.
