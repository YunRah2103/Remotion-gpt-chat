# Remotion GPT Chat — Independent 3D automotive documentaries

## Vehicle-quality correction — high-fidelity concept car

The original procedural block-like car and a subsequent CC0 prototype were **rejected by visual QA**. The corrective implementation uses a professionally surfaced, textured, riggable glTF model, with a separate four-wheel animation and corrected road-camera occlusion.

- **Vehicle model:** [Khronos Car Concept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept), model and textures by **Eric Chadwick**, ©2024 Darmstadt Graphics Group GmbH, licensed **Creative Commons Attribution 4.0 International**. Credit and licence are preserved in this source and documentation.
- **Pinned source commit:** `edc7c9e67c639d230715049ee31f9a96a6babbbe`.
- **Exact GLB SHA1 Git blob:** `c0f38c989a78cc4ba63253b5338705e0afb0142f`; 11,778,688 bytes (uncompressed glTF-Binary).
- **In-repository model:** `public/assets/carconcept.glb`.
- **Real geometry and wheel components:** `src/turbo/PremiumCar.tsx`, with fixed-position brake pads and rotating tires/rims/discs.
- **Visual preflight:** `.github/workflows/turbo-car-preview.yml`, including moving native Three.js WebGL footage and full-resolution screenshots.

The concept vehicle is licensed third-party work used within this independently built documentary, and is **not** any YUNEX vehicle or reused YUNEX geometry.

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
