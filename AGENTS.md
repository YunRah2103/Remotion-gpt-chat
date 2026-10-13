# Repository agent guide

Work ONLY in `YunRah2103/Remotion-gpt-chat`. Never read, import, copy, or modify the *old* `YunRah2103/yunus-video-lab` repository or its assets. Keep the engineering-documentary productions below separate from YUNEX footage/editing work **unless a user explicitly assigns YUNEX work in this repository**.

Independent compositions currently registered in `src/Root.tsx`:

- `GpuDriveFilm`: legacy 6-second, 1080x1920, 30fps / 180 frames.
- `TurboDocumentary`: THE HIDDEN POWER OF A TURBOCHARGER, 28-second, 1080x1920, 30fps / 840 frames.

Turbo source: `src/TurboDocumentary.tsx` and `src/turbo/Mechanical.tsx`. All animation must be deterministic and based on `useCurrentFrame`, using real R3F/Three.js geometry and WebGL (`--gl=swangle` for CI software rendering). 2D typography is for subtitles and explanations only.

Render workflow: `.github/workflows/turbo-documentary.yml`. Verified master-only release: `.github/workflows/turbo-release.yml`, successful run 37777361493. The MP4 contains an AAC mechanical soundtrack and on-screen narration subtitles, but no synthesized speech. Never describe the original stylized 3D meshes as photoreal CAD.

Maintain exact 840 frames and 28s at 1080x1920/30fps, H264 yuv420p limited range and AAC 48kHz stereo. Use `npm run check`, moving native preview MP4s, FFprobe and full decoding before claiming QA PASS. Verify complete remote SHAs, actions run IDs and artifact IDs. Do not store secrets or use paid render services without permission.

## Separate creative toolkit

The isolated CI smoke-test tools (Blender, Godot 4, Manim Community, OpenSCAD, PyBullet, Playwright, FFmpeg) are documented in `toolkit/README.md` and tested by `.github/workflows/creative-toolkit.yml`. These do NOT replace Remotion; use them only for deliberately assigned experiments or production improvements, and distinguish a successful smoke test from a finished film. Do not install Unreal/ComfyUI or start paid GPU instances without explicit approval.

## Automotive Engineering production suite (separate from YUNEX)

Read `production/README.md` and `production/AGENTS.md` before starting a new engineering explainer. Use the existing `src/mechanics/parts.tsx` for illustrative reusable brake/wheel/sensor/spring/gears before designing new assets. Use `production/tools/scaffold.py` for a new lesson brief and voiceover placeholder. New compositions must be registered explicitly; scaffolding is not a completed video.

Use the `production-render.yml` preview/stills workflow first and do actual moving-frame visual inspection. Only promote an independently reviewed, decoded full-resolution MP4 to `production-release.yml`. Pages gallery is optional and requires Pages configured under Settings. Never silently optimise/replace animation-critical GLB meshes; `production/tools/gltf_guard.py` enforces the canonical GPU anchors. Never replace approved narration with invented audio.

## Production pipeline, agent specialisms and captions

For standalone automotive engineering explainer work, read `production/PIPELINE.md`, use `.github/skills/` as appropriate, verify cross-agent work with `production/tools/handoff.py`, and run `production/tools/production_pipeline.py` to ensure a real registered composition and contiguous storyboard exist before rendering. `GpuDriveFilmCaptioned` and `TurboDocumentaryCaptioned` add optional word-timed overlays while preserving originals. ABS-001 remains preproduction. Never access `yunus-video-lab` or YUNEX sources.

## YUNEX Galaxy S25 V4 footage jobs (when explicitly assigned)

**Required agent instructions:** [docs/YUNEX_S25_V4_AGENT_GUIDE.md](docs/YUNEX_S25_V4_AGENT_GUIDE.md). Read this before proposing, queuing, monitoring or reporting any S25 V4 footage job. The V4 implementation, approved YouTube source registry and exact issue-body generator live on branch `experiments/s25-footage-worker-v4-10min-20261012`, not in main. Do **not** improvise job payloads. **Licence registration is no longer required to queue a canonical YouTube URL**: unknown-rights clips are kept in owner-only DRAFT Releases and must not be publicly published without permission.

The S25 has a verified phone-side YouTube download: issue [#55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55), an **approved non-RS6 snowy-car test source**. The specific RS6 YouTube links have **not** been tested on the phone. Before saying a video is acquired, verify its real playable GitHub Release MP4, the `YUNEX_PHONE_DONE_V4` report and quality. Direct licensed creator MP4 downloads via GitHub Actions remain preferable when available. The phone may be idle/off to save battery; creating a job does not start Termux.
