# Remotion GPT Chat — Independent 3D automotive documentaries

## THE HIDDEN POWER OF A TURBOCHARGER

A **28-second, 1080 × 1920, 30 fps, 840-frame** original automotive mini-documentary. Implemented with Remotion 4, React, TypeScript, React Three Fiber, Three.js, and genuine WebGL rendering.

The film follows the vehicle on a road, exhaust turbine, linked common shaft, fresh-air compressor/intercooler, and return to driving. Bodywork is an original parametric/lofted 3D mesh. Mechanical components include the two rotating bladed wheels, shaft, turbine housing, pipework, dynamic flow markers and intercooler. This is procedural/stylized CGI, **not an imported photoreal CAD vehicle**.

**Composition:** `TurboDocumentary` in `src/Root.tsx`

**Scene director:** `src/TurboDocumentary.tsx`

**Original 3D models/worlds:** `src/turbo/Mechanical.tsx`

**Source independence:** no code, models or assets from `YunRah2103/yunus-video-lab` or YUNEX; the prior short `GpuDriveFilm` remains in this repository as a separate composition.

### Workflows

- `.github/workflows/turbo-documentary.yml` checks TypeScript and composition registration, renders four moving native WebGL previews, produces seven 120-frame full-resolution chunks in parallel, assembles an AAC soundtrack and H264 MP4, forces limited-range yuv420p, decodes the entire file and validates 840 frames.
- `.github/workflows/turbo-release.yml` publishes the verified 840-frame master using previously successful native chunks (release source run `37776329123`, final successful release run `37777361493`). Download the artifact named `TURBOCHARGER-FINAL-840F-YUV420P` from the release run.
- GPU note: CI uses **software-backed** WebGL through `--gl=swangle`. This is genuine 3D geometry and animation but **not** hardware-GPU acceleration. A self-hosted GPU experiment for the older prototype exists separately.

### Audio and editorial limitations

The narration supplied in the documentary brief is represented as precisely scheduled **on-screen subtitles**. No quality-verified speech generation is available in this pipeline, so the delivered MP4 has **no spoken narrator**; its AAC soundtrack contains generated mechanical rumble, airflow and turbo whine. There are no unsupported numerical boost/pressure claims.

### Local setup

```bash
npm install
npm run check
npm run studio
npx remotion render src/index.ts TurboDocumentary out/turbo-visual.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
```

For a rigorously validated final master use the GitHub workflows, which include audio, correct the full-range WebGL colour encoding to limited-range `yuv420p`, and run FFprobe plus a complete decode.

## YUNEX — S25 V4 footage bridge for new agents

**New YUNEX agent?** Start with **[the quick-start](docs/YUNEX_V4_NEW_AGENT_START_HERE.md)**. For a completed phone issue, **use the [one-step S25 V4 media import action](.github/actions/yunex-v4-import/action.yml)** inside your own editing workflow; it retrieves private draft MP4/M4A bytes and automatically performs SHA256 + full-decode verification. [Verified against real phone job #56](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38470166071). No user upload, new token, or duplicated download script required. For the complete specification, see [the full V4 agent guide](docs/YUNEX_S25_V4_AGENT_GUIDE.md).

V4 implementation and CLI live on [the separate worker branch](https://github.com/YunRah2103/Remotion-gpt-chat/tree/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage), **not main**. The Galaxy S25 already has V4 installed; **agents must not request another install/token/upload**, and GitHub cannot turn on a stopped Termux loop remotely.

**Real phone proofs:** [#55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55) (approved 1080p YouTube car footage) and [#56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56) (unregistered AutoTopNL RS6 video uploaded as a **private draft**) passed. New `--media audio` generates AAC M4A instead of video, but currently has automated CI proof only, **not** a live-phone audio-only test.

No source licence registration is required to **queue** a canonical YouTube URL for private review; publishing/reusing rights-unverified source media is **not** authorised by a successful download. **Draft-access lesson:** GitHub Actions `contents: read` returned HTTP 403 for #56, while narrowly scoped `contents: write` succeeded with the built-in token in [run #38441894486](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38441894486). New agents should use the proven authenticated workflow, **not ask the owner to reattach existing files**.

## Automotive Engineering production suite

A separate, reusable video production toolchain has been added for mechanical explainers (ABS, suspension, brakes, differentials). It **does not** use or touch `yunus-video-lab` or YUNEX.

Start with **[production/README.md](production/README.md)** for the ready-to-run GitHub Actions workflows, model library, rendering modes, independent QA, versioned GitHub Releases and optional Pages gallery. The reusable procedural mechanical parts are in **[src/mechanics/parts.tsx](src/mechanics/parts.tsx)**. The unit/native test workflow is **Production Suite - tests and small real render**.

## Five new production upgrades

See [production/PIPELINE.md](production/PIPELINE.md) for a real preflight-to-final GitHub Actions workflow, opt-in animated captions using `@remotion/captions`, composition-aware native PR QA, Copilot-specific skills/handoff validation, and real software-WebGL render benchmarking. The legacy compositions remain registered and unchanged, with optional captioned versions. ABS-001 remains **preproduction** until an actual ABS animation is implemented.

## Advanced Studio production tools

Six additional native tools are described in [production/advanced/README.md](production/advanced/README.md): Blender-to-GLB rig export with preserved named parts, browser-only A/B video comparison, per-frame Blender AABB clearance warnings, source-locked recovery of failed render chunks, real AO/high-to-low normal texture baking, and two distinct 3D studio/circuit Remotion MP4 variants. Existing projects remain untouched. ABS-001 is still preproduction; AI agents require separate access and explicit execution.
