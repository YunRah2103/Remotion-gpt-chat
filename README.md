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

## Automotive Engineering production suite

A separate, reusable video production toolchain has been added for mechanical explainers (ABS, suspension, brakes, differentials). It **does not** use or touch `yunus-video-lab` or YUNEX.

Start with **[production/README.md](production/README.md)** for the ready-to-run GitHub Actions workflows, model library, rendering modes, independent QA, versioned GitHub Releases and optional Pages gallery. The reusable procedural mechanical parts are in **[src/mechanics/parts.tsx](src/mechanics/parts.tsx)**. The unit/native test workflow is **Production Suite - tests and small real render**.

## Five new production upgrades

See [production/PIPELINE.md](production/PIPELINE.md) for a real preflight-to-final GitHub Actions workflow, opt-in animated captions using `@remotion/captions`, composition-aware native PR QA, Copilot-specific skills/handoff validation, and real software-WebGL render benchmarking. The legacy compositions remain registered and unchanged, with optional captioned versions. ABS-001 remains **preproduction** until an actual ABS animation is implemented.
