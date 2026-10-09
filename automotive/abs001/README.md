# Automotive Engineering 001 — How ABS Brakes Work

## Production delivery
25 seconds / 750 frames / 30 fps / 1080×1920 / H.264 yuv420p; approved Cedar voiceover is 23.712 seconds, muxed as AAC 48 kHz stereo with silence to complete 25 seconds. The user's approved narration is never regenerated.

## Two independent 3D production paths
- `src/ABS001.tsx`: editable independent **Remotion + Three.js** procedural 3D composition registered as `ABS001` in `src/Root.tsx`. On branch push, `.github/workflows/abs-engineering-001.yml` attempts five 150-frame 3D render jobs, a complete MP4 assembly and FFprobe/FFmpeg checks. It has its own release artifact if and only if the run completes successfully. Approved audio is included on CI only if independently published to `public/audio/abs001-approved.mp3`; otherwise CI's composition output is silent.
- `automotive/abs001/abs_render.py`: **VTK 3D + FFmpeg** implementation corresponding to the actual local MP4 provided in the original ChatGPT conversation. Requires Python packages vtk, Pillow, numpy, and FFmpeg. Environment variable `ABS_OUT` controls generated directory. This produces the 540×960 genuine 3D original animation frames; the final vertical H.264 1080×1920, yuv420p, approved speech AAC 48 kHz stereo is upscaled and muxed with FFmpeg after the run. For accurate source provenance, this VTK path and the Remotion source are separate exports, not the same rendered binary.
- `automotive/abs001/blender_assets.py`: original reusable **Blender** GLB generators for (1) wheel/brake/encoder/sensor and (2) hydraulic manifold/solenoids/pump with still PNG previews. The Blender job separately validates exports on Ubuntu; Blender GLBs are not claimed to be integrated into the separately procedural VTK or Remotion animations unless subsequently imported.

## Educational mechanism
- Hard braking may reduce wheel rotation much faster than vehicle velocity, leading to tyre slip or lockup.
- An encoder target and wheel-speed sensor communicate rotational speed, not grip directly. Brake control uses estimated vehicle speed and monitored changes to infer lock risk.
- Representative two-solenoid hydraulic control: **normal brake apply** inlet open/outlet closed, **pressure reduction** inlet closed/outlet open, **hold** both closed, and **reapply** inlet open/outlet closed. The pump returns released brake fluid through the recovery circuit. The caliper piston moves with changing pressure.
- The ABS-side tyre continues rotating close to the available grip limit, helping maintain lateral steering control during an emergency stop.
- This is a deliberately simplified circuit. ABS does **not** universally shorten braking distances (loose gravel, deep snow and some other surfaces are exceptions). This is not OEM CAD or safety-certified dynamics simulation.

## Frames and output
| Time | Frames | Lesson |
|---|---:|---|
| 0–4 s | 0–119 | Hard braking / impending lockup |
| 4–8 s | 120–239 | Skidding versus rolling |
| 8–12 s | 240–359 | Encoder + wheel-speed signal |
| 12–20 s | 360–599 | ABS modulator valves, pump, pressure cycle |
| 20–25 s | 600–749 | ABS helps preserve steering |

## Scope and exclusions
All additions are limited to this named ABS series and the new registration in Root.tsx. Existing GPU and turbo compositions are retained. Do not access, copy, or import anything from `YunRah2103/yunus-video-lab`.
