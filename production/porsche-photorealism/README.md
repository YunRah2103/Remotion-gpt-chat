# YUNEX Agent P — Porsche 992 photorealism experiment

**Status: review-only experimental branch. No visuals or final MP4 have been approved. Do not merge.**

## Deliverable contract
- Standalone Remotion entry: production/porsche-photorealism/entry.tsx
- Composition YunexPorsche992Photorealism, 1080×1920, 30fps, 180 native frames, six seconds
- Source must be real imported GLB. No toy/procedural fallback.
- Workflow: .github/workflows/yunex-porsche-photorealism.yml
- Native output: out/porsche-photorealism/porsche-992-six-second.mp4
- Visual review: contact-sheet.jpg, nine sampled frames including every shot boundary; a contact sheet is not equivalent to full-playback visual approval
- Technical QA: FFprobe, full FFmpeg decode, decoded frame count, frame hashes, SHA256, source commit

## Provenance is NOT verified
The principal candidates DR1KING100K's 992 (Sketchfab 70bf9c8) and HYPR:IMPS 3D's Manthey (09ccead) have public CC Attribution/download listings, but no authenticated original download bytes were retrieved. A third-party, public GitHub distribution names the 2023 Porsche 911 GT3 RS 2.7 Carrera Tribute 992, and Sketchfab lists a similarly named CC BY model under Alex Giardina. A filename match is NOT proof they are identical. The third-party asset is pinned by Git commit and Git blob SHA-1; acquisition calculates SHA-256. Confirm creator, source identity and rights before any public release. See model-manifest.json.

## Reused kit / creative decisions
This study is isolated from EP005 and unmerged PRs #233, #275 and #277. It reuses existing YUNEX world-kit WorldLighting with RoomEnvironment PMREM. A simple dark matte floor avoids the visibly weak showroom/garage props in earlier P1 experiments. Restrained filmic exposure, limited paint clearcoat, matte tyres, mesh shadows and bbox floor calibration are opt-in to this composition. Original imported geometry and textures are retained.

PR #275 ground-contact overlays rely on explicit procedural rig mounts, so cannot be safely reused for an unknown imported GLB. Real mesh shadows and source bounds are used instead. Orientation and contact remain visual review gates.

## Run and inspect
1. Push branch or create draft PR; isolated workflow triggers.
2. Check real Actions run; if acquisition/TypeScript/render fails, fix and rerender.
3. Download YUNEX-Agent-P-Porsche-992-review-only artifact. Expect MP4, contact sheet, manifest and hashes.
4. Watch actual complete MP4 AND inspect contact sheet. Check 992 front/side/rear accuracy, wheels, textures, glass, aero, shadows, lighting, camera, shot cuts and clipping.
5. Compare with a matching older P1 study frame; brightness alone is not a quality improvement.
6. Keep PR in draft and leave main untouched until source rights and visual quality are verified.

## Not yet claimed
The upstream binary, model identity, geometrical accuracy, visual quality and render output have not been independently verified as passing. Do not promote this experiment to the Premium Car Library before review.
