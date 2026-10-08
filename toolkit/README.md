# Creative Toolkit — isolated experiments

This directory adds **headless, original-content proof tests** for a creative-video toolchain without changing the current Remotion compositions.

## Included tools and outputs

| Tool | Purpose | Smoke-test output |
|---|---|---|
| Blender (CPU Cycles) | 3D meshes, lights, cameras, procedural animations | `blender-wheel.png` |
| Godot 4 | Scripted physics / interactive 3D scenes | engine log + runtime assertion |
| OpenSCAD | Parametric CAD geometry / exports | `wheel-ring.stl` |
| PyBullet | Deterministic rigid-body physics prototypes | `physics.json` |
| Manim Community | Mathematical/technical animation | `SteeringSmoke.mp4` |
| Playwright Chromium | UI / visual regression checks | `playwright.png` |
| Remotion + Three.js | Existing independent video system | `remotion-smoke.mp4` |
| FFmpeg / FFprobe | Encoding, inspection, validation | decoded smoke MP4 validation |

All installations are **made on ephemeral GitHub Actions runners**, NOT permanent installs on GitHub servers or your desktop. The workflows are opted into explicitly; no GPU, cloud billing account, secrets, paid API, or access to other repositories is needed.

## GitHub workflow

`.github/workflows/creative-toolkit.yml` runs three separate tests (mechanical, animation, browser+Remotion) on ubuntu-24.04, and uploads outputs to Actions artifacts. It runs on changes to this branch and can be manually dispatched **once its workflow file is present on the default branch**. Other pre-existing workflows and video source files are deliberately untouched.

The demo inputs are original minimal scripts in `toolkit/smoke/`. They do **not** use models or files from any other repository.

## Running locally

The GitHub workflow is the authoritative installation reference; these are examples if the corresponding tools are available:

```bash
blender -b --python toolkit/smoke/blender_scene.py
openscad -o toolkit/out/wheel-ring.stl toolkit/smoke/wheel_ring.scad
python toolkit/smoke/pybullet_sim.py
manim -ql --disable_caching --media_dir toolkit/out/manim toolkit/smoke/manim_scene.py SteeringSmoke
python toolkit/smoke/playwright_ui.py
npm install
npm run check
```

## Deliberately omitted

Unreal Engine 5 and ComfyUI are NOT installed here. Unreal has large installation/licensing/hardware requirements; ComfyUI's intended image generation workflow generally requires a dedicated supported GPU and model weights. Do not pretend ordinary GitHub-hosted CPU runners are GPU workstations. A separate self-hosted GPU runner can be explored later with explicit approval and security precautions.

## Security / reproducibility

- No forks/PRs from strangers trigger privileged workflows.
- CI has read-only GitHub permissions and uploads original demonstration assets.
- Python packages use an isolated virtual environment.
- The main Remotion package.json and existing release workflows remain unmodified.
- Dependencies are pinned or resolved by Ubuntu 24.04 packages. Outputs report actual tool versions.
