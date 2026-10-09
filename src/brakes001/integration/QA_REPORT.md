# Agent E actual native QA — CarbonCeramic001

**Status: REVIEW.** Verified integration branch source `714238ccd67a38036c51258821d1880145536519`. Specialist files remain imported with unchanged original blob hashes; see `SOURCES.md`.

## Native GitHub Actions evidence

- **[Run 37947404308](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37947404308)**: `integration-native` **SUCCESS**, `hardware-native` **FAILURE AFTER successful Blender export** due to a missing OpenImageDenoiser implementation. Overall workflow therefore shows FAILURE; do not conflate that with the successful film proof job.
- **[Native video and five-still artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37947404308/artifacts/11624317868)** (GitHub artifact ID `11624317868`, 30-day retention). Five genuine Remotion/Three.js PNG frames **48, 168, 321, 531, 705**, at **540×960**, plus `contact-sheet.jpg`. No synthetic still substitutions.
- **Clamp video:** `clamp-135-195.mp4`, real frames **135–195 inclusive**, **61 frames**, 378×672, 30/1fps, H.264, 2.033333 seconds, full FFmpeg decode PASS, SHA256 `1d4f5aa5689941da6f8c015b113838504212116e6aac899ec346f9e60e0a2e7f`.
- **Heat video:** `heat-300-360.mp4`, real frames **300–360 inclusive**, **61 frames**, 378×672, 30/1fps, H.264, 2.033333 seconds, full FFmpeg decode PASS, SHA256 `08c328b09e8d3d035bbc2c8faa5de27f99d944d7573cc6078511159d8dd93d79`.
- Native preview video pixel format per FFprobe: `yuvj420p` (full-range YUV420). **This is acceptable for previews; Agent F must independently confirm final `yuv420p` contract.**
- Tested locally again after GitHub artifact extraction with actual FFprobe and full `ffmpeg -v error -xerror -i <video> -f null -` decode; both passed. Frame sampling at 0,15,30,45,60 proved visual pixel change (motion). Do not confuse native movement with physical/cinematic approval.

## Executed software tests

| Test | Actual result |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS |
| `npm run check` | PASS |
| `node src/brakes001/integration/integration.test.cjs` | PASS, all 750 frame states, five shots, rotor stops; fixed caliper and no face penetration |
| `bash production/videos/carbon-ceramic-001/physics/run-tests.sh` | PASS, 5/5 |
| `python production/videos/carbon-ceramic-001/hardware/test_hardware.py` | PASS source contract only |
| `python production/videos/carbon-ceramic-001/qa/check_graphics.py` | PASS, 750 frame layout checks |
| `node production/videos/carbon-ceramic-001/qa/component_smoke.cjs` | PASS, 750 frame JSX/1216 cue instances |
| `python production/videos/carbon-ceramic-001/validate_setup.py` | PASS |
| `python -m unittest discover -s production/tests -v` | PASS, 39/39 |
| Native five stills / contact | PASS render + actual manual image inspection |
| Native clamp / thermal motion | PASS render, FFprobe, complete FFmpeg decode |
| Agent D film acceptance | PENDING |

## Independent visual inspection

The original native review artifact showed an unacceptably cropped thermal rotor. Two strictly E-owned source changes corrected it: first a thermal-scene scale/dolly offset, then replacement of the guessed offset by C's dynamic `brakeCameraAt(frame).target` with world scale 0.56 (source `714238ccd67a38036c51258821d1880145536519`). Re-rendered native frame 321 and sequential thermal frames 300/315/330/345/360 now show rotor mostly fully on-screen. **The outer thermal rim remains near the right frame edge at 360**, so do not claim a perfect macro crop or release-grade shot.

The rotor/hat genuinely rotate while the caliper remains stationary (source-pose and visual sequence evidence). Real pads are separate X-axis moving geometries and pass no-penetration tests, **but pad travel is extremely difficult to resolve at 378px front-biased viewing angle** and visual proof alone cannot establish their contact surfaces. The caliper cheek looks like a blocky rectangular assembly rather than a highly detailed production caliper; Agent A owns any reconstruction. Lighting is low-key, readable but a little flat. Heat orange is localized to the annulus, does not light hub in isolation and is correctly labelled **ILLUSTRATIVE**, though saturation/visual restraint needs D's artistic signoff. Opening ghost line art is readable but thin, with conspicuous dark space in vertical composition. Titles and labels remain inside the authored safe areas. No overlay collision was obvious in five stills.

## Native Blender/GLB structure and unresolved render blocker

The [Blender artifact 11624482332](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37947404308/artifacts/11624482332) contains a **real stock Blender 4.0.2 generated** `carbon-ceramic-brake.blend` (2,748,960 bytes), `carbon-ceramic-brake.glb` (1,194,348 bytes), `rig-manifest.json` and build log. Actual binary GLB SHA256 **`fe517944c5ee4e43dd0b6247deea59774ba82590bd6e892f546c5fa2d8db8a35`**. Independent glTF2 header/chunk parsing and node traversal: **133 nodes, 125 meshes, 9 PBR materials; required eight named groups and rotor descendant / fixed caliper/pads hierarchy PASS**.

Blender builder first failed missing NumPy; E changed ONLY the scoped workflow to install distro `python3-numpy`. The second build successfully wrote GLB and .blend before `setup_stage()` Cycles proof still failed with `RuntimeError: Error: Build without OpenImageDenoiser`. There are **no actual Blender PNGs**, so no native hardware aesthetic signoff. Do not edit A-owned `build_brake.py` silently. Agent A should supply OIDN-independent Blender render or Master should stage an Eevee proof script with correct lights/camera.

## Master and F acceptance

A–D source remains verbatim. Agent E **does not deliver a full 750-frame MP4**. Required next gates: independently review both moving native clips and stills, obtain D's technical/visual signoff, inspect hardware GLB stills from a compatible Blender renderer, resolve non-readability of pad clamp and toy-like caliper visual, then Master approves source. **Agent F**, not E, renders and checks the 25-second native release.
