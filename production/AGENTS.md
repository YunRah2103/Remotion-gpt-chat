# Production agent instructions

- Repo scope: `YunRah2103/Remotion-gpt-chat` only. Never read, touch, copy, reference assets from or publish to `YunRah2103/yunus-video-lab`.
- This folder is for standalone mechanical explainer videos, not YUNEX automotive showcases.
- Use `python production/tools/scaffold.py` for a new lesson. Edit its timing/voiceover plan, make a real composition, and register it in `src/Root.tsx`.
- Look in `production/mechanics/catalog.json` and `src/mechanics/parts.tsx` for reusable original mechanics before duplicating 3D modelling work.
- The built-in parts are stylised physical illustrations. For ABS and other safety systems, verify the engineering narrative; do not depict a generic part as exact manufacturer hardware.
- Preview low-resolution moving clips first; then full-resolution important frames; then 1080x1920 final. Use actual MP4/PNG evidence and FFmpeg decoder QA.
- Keep deterministic frame-evaluable transforms and exact frame counts. Every new model/shot needs declared provenance and explicit accuracy limitations.
- Do not silently substitute missing audio/GLB; do not generate speech in place of an approved user voice track.
- Optimisation is opt-in and requires model hierarchy verification and native playback; Meshopt requires decoder support.
- Release and Pages gallery are public in this public repo and are manually invoked. Don't publish unapproved edits or user-uploaded files.
- Use cache-aware installs and GitHub Actions artifact handoffs. Do not purchase hardware/GPU minutes or third-party services.

## GitHub Media Bridge

- For permitted public image/video reference downloads, follow `production/media-bridge/README.md`.
- An ordinary ChatGPT agent may queue a rights-verified, text-only JSON request by committing a unique `production/media-bridge/requests/<slug>.json` to `main`. The `Production Suite - GitHub Media Bridge` workflow then downloads direct HTTPS media to an artifact, extracts thumbnails/video frames and writes manifest/credit/checksums.
- Do not invent licensing information or assert that a public web URL grants reuse. Do not submit private footage, tokens or credential-bearing URLs.
- This does **not** grant native ChatGPT binary image/video inspection; provide artifact links and use an appropriate visual tool if actually available.
- Preserve the YUNEX repository boundary; the media bridge is entirely within `Remotion-gpt-chat`.

## Engineering Studio and specialized agents

- See `production/studio/README.md` for reference galleries, FFmpeg cut-frame extraction, real Blender turntables, controlled voice alignment, kinematic telemetry checks, GLB catalogue candidate manifests and native PR visual comparisons.
- All generated images, tracks and reference clips are evidence for review, not proof of authenticity or permission to redistribute media.
- Agent profiles under `.github/agents/*.agent.md` are selectable only if the owner's GitHub Copilot cloud-agent features are enabled. Never represent markdown profiles as running AI workers or delegate without permission. Keep separate branches and explicit handoffs.
- Kinematic validators are heuristic and must not be interpreted as manufacturer certified engineering or road safety claims.

## Integrated production automation

- Read `production/PIPELINE.md` before film production or release edits.
- Do not claim `abs-001` is finished; its brief is preproduction and `sourceCompositionId` is null. Implement and register its real native Remotion composition before running the complete pipeline.
- Use `production/tools/production_pipeline.py` for honest video/shot/voiceover/registered-composition preflight. Run the Actions production pipeline for previews and exact native final output.
- Use reviewed actual word timestamps for `Captioned` variants; never manufacture approved speech or timestamp data. Keep original compositions unchanged.
- Run source-aware PR moving/native visual evidence, validated cross-agent handoffs, and real benchmark results before optimizing.
- Custom agent profiles and repo skills are instructions, not independently running coding agents or paid external services.

## Advanced original asset and video production

Before using advanced mechanical tooling read `production/advanced/README.md`. Scope exclusively to `Remotion-gpt-chat`; never use `yunus-video-lab`. Keep Blender object origins, rig names and author-approved source metadata. Treat overlap warnings as AABB broadphase signals only, not confirmed mechanical collisions. Review baked AO/normal textures before claiming production materials. Render recovery must reuse only exact source-commit SHA verified chunks from one original run. Two-version demo uses original illustrative 3D brake geometry, not a completed ABS episode. Comparison browser processes local clips unless explicitly provided otherwise.
