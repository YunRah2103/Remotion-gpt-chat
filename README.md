# Remotion GPT Chat — Independent 3D automotive documentaries

## Vehicle-quality correction (V2, independent CC0 asset)

The original procedural lofted/body-box car was rejected as unsuitable for a premium automotive film. The corrective branch replaces it, without modifying YUNEX or the turbo internals, with an actually modelled performance vehicle.

- **Car:** [Spectral GT RS](https://github.com/JaronKBragg7337/spectral-gt-rs) by Jaron K Bragg, **CC0 1.0**, Blender-built source and game-ready GLB (263 mesh objects including mechanical detail).
- **Pinned source:** `34499c501908818a2b08e589a7aecf963343cee7`; binary Git blob SHA `f5b814848453a6c75a48f5047fdadaa7bdc78969`.
- **Local model:** `public/assets/spectral_gt_rs_game_ready.glb`; versioned directly in this repository.
- **Implementation:** `src/turbo/PremiumCar.tsx`; grouped independent spinning wheel components and stationary brake calipers, chassis correctly grounded and normalized to 4.98 metres, refined pearl-silver car paint and larger driving compositions.
- **Proof workflow:** `.github/workflows/turbo-car-preview.yml`, moving WebGL footage, TypeScript, genuine 1080×1920 stills. Approval depends on inspecting actual clips, not compilation alone.

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
