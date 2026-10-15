# Repository agent guide

> **NEW YUNEX AGENT? START HERE:** [S25 V4 agent quick-start](https://github.com/YunRah2103/Remotion-gpt-chat/blob/main/docs/YUNEX_V4_NEW_AGENT_START_HERE.md). **Use the role-specific [YUNEX V4 agent skill](.github/skills/yunex-v4-footage/SKILL.md) to choose the correct path; for finished phone footage the reusable [YUNEX V4 import action](.github/actions/yunex-v4-import/action.yml) is the default: one GitHub Actions step takes a completed phone issue number, retrieves its authenticated MP4/M4A and verifies SHA256/full decode.** Don't reimplement private Release download code, restart footage acquisition, or ask the owner to upload a media file already present in GitHub. See the [full agent protocol](docs/YUNEX_S25_V4_AGENT_GUIDE.md). **Do not modify or reinstall the S25 worker unless the user explicitly assigns worker maintenance.**


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

**Actual phone proofs:** [#55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55) (approved snowy-car YouTube clip) and [#56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56) (unregistered AutoTopNL RS6 source, 60-second private draft recording) both passed. Agents can now request **`--media audio`** to acquire/QA only the soundtrack as AAC M4A, or the legacy video MP4. The audio-only feature is CI-tested but not yet live-phone-tested. For **private draft Releases**, a working GitHub Actions test required **`permissions: contents: write`**; `contents: read` returned HTTP 403. Use the built-in `github.token`, not a user-provided token. Verify real playable media, SHA256 and `YUNEX_PHONE_DONE_V4` before claiming success. A running loop polls **120 seconds** by default, or `--interval 60` for faster checks; Termux can be stopped to save battery. New jobs do not remotely start the phone.

**New optional native 4K (2160p):** Latest V4 code accepts explicit `--height 2160` for true source-native UHD (at least 3840×2160 landscape, 2160×3840 portrait), while 1080p remains default. No upscaling: original H.264/HEVC/VP9/AV1 video is remuxed to MP4 rather than software-reencoded on the phone. A 1.5 GiB file cap, up to 8 GiB temporary workspace, source-pixel verification and full decode apply. **GitHub CI validated 4K FFmpeg remux plus rejection of fake 1080p upscales; actual S25 4K downloading is not yet phone-proven.** The user must install the latest branch version (after stopping the loop) before a real 2160p job. New agents should prefer short UHD shots, not assume every YouTube link is 4K, and read the [V4 quick-start](https://github.com/YunRah2103/Remotion-gpt-chat/blob/main/docs/YUNEX_V4_NEW_AGENT_START_HERE.md) before creating jobs.


## YUNEX optional cinematic editing tools (for explicitly assigned automotive edits)

A verified, opt-in download pack exists on branch [`experiments/yunex-cinematic-toolkit-20261015`](https://github.com/YunRah2103/Remotion-gpt-chat/tree/experiments/yunex-cinematic-toolkit-20261015). Read its [editor toolkit guide](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/yunex-cinematic-toolkit-20261015/production/toolkits/YUNEX_CINEMATIC_EDITING_TOOLS.md) **before** deciding to install or apply any tool. The [GitHub Actions download+smoke-test workflow](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38694107449) passed and produced [this toolkit artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38694107449/artifacts/11953675770) (retained temporarily; rerun the workflow for fresh copies).

Tools are **PySceneDetect** (discover individual genuine video shots), **Beat This!** (beat/downbeat alignment), **auto-editor** (preliminary motion/activity trimming), **GL Transitions** (shader reference library), **RIFE Vulkan** (GPU slow motion interpolation; source/model included but not full executable) and **Real-ESRGAN Vulkan** (optional restoration with GPU). The toolkit is **not** installed automatically and should **not** alter the approved edit, music, car identity, native resolution, S25 V4 worker or Remotion architecture. Use one only if the actual result is demonstrably better, keep user-requested audio exactly where requested, and deliver a real visually/audio-verified playable MP4. Interpolation/upscaling can introduce artifacts; compare with the original and reject degraded outputs. Beat This! and RIFE require additional runtime/models; do not claim they are ready to execute merely because source files were downloaded. Never blindly apply dozens of transitions.

## YUNEX actual editing improvements (V2)

For explicitly assigned car edits, use [`production/toolkits/YUNEX_EDITOR_UPGRADE.md`](production/toolkits/YUNEX_EDITOR_UPGRADE.md): tested FFmpeg video preflight, non-destructive approximate music-accent cues, native Remotion `CinematicTransition` component and a GitHub Actions audit of existing MP4 artifacts. The [original six-tool optional download pack](production/toolkits/YUNEX_CINEMATIC_EDITING_TOOLS.md) is included in this branch, but GPU-only source/model downloads are not guaranteed executable. Run the new `yunex-editor-preflight.yml` smoke before claiming CI functionality and perform full real-media visual/audio QA before declaring an edit complete. This does not change the V4 phone worker or approved user music.

## YUNEX improved editorial workflow (V3)

**Use for automotive edit assignments:** [YUNEX Edit Lab V3](production/toolkits/YUNEX_EDIT_LAB_V3.md) adds actual-source cut scouting/contact sheets to reduce reused angles, an FFmpeg silent speed-ramp exporter with source-based timecodes and full decode proof, EBU R128 original-audio loudness/true-peak diagnostics, and native deterministic `KineticTitle` for clean technical overlays. The reusable [GitHub Actions workflow](.github/workflows/yunex-editor-lab.yml) can process an existing run/artifact without changing original media. Its [real-media smoke tests](production/tests/test_yunex_edit_lab.py) must pass before relying on it. For luxury edits, avoid transitions/text unless essential; for engineering explainers, one clear phrase over moving footage is better than HUD noise. Always preserve the user's music and verify the actual final MP4 audiovisually.
