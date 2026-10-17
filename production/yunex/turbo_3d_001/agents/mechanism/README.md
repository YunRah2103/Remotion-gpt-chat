# YUNEX TURBO EP001 — Agent 2 moving mechanism package

**Issue:** #128. **Branch:** agent/turbo-3d-001-mechanism. Exclusive source owner: A2.

## Implemented
- Two original 11-curved-blade rotor meshes and separate turbine and compressor housings.
- A rigid +X common shaft; both rotors use precisely the same deterministic phase = rotationPhase + 0.165 × frame.
- Separate physically connected hot exhaust manifold → turbine → outlet and filtered fresh air → compressor → intercooler → engine charge path.
- Simplified original four-cylinder engine/head with fuel connection cue; no fabricated valve or piston timing.
- Intact, sectioned and mechanically exploded modes; eight immutable named ports for Agent 3.
- Independent native Remotion entry point in src/yunex/turbo3d/mechanism/preview.entry.tsx. Only Agent 6 may edit src/Root.tsx.

### Engineering truth
Exhaust and fresh air never mix inside the turbo and never flow down the shaft. Compression with suitable fuel delivery can produce higher power. No fabricated boost/horsepower/CAD numbers.

## Commands for actual native Remotion preview
Run with repository npm dependencies installed:

~~~bash
npm ci --no-audit --no-fund
npm run check
npx remotion render src/yunex/turbo3d/mechanism/preview.entry.tsx A2TurboCutaway out/a2-cutaway-native.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.4166667
npx remotion render src/yunex/turbo3d/mechanism/preview.entry.tsx A2TurboExploded out/a2-exploded-native.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.4166667
npx remotion render src/yunex/turbo3d/mechanism/preview.entry.tsx A2EnginePlumbing out/a2-plumbing-native.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.4166667
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,r_frame_rate:format=duration -of json out/a2-cutaway-native.mp4
ffmpeg -v error -i out/a2-cutaway-native.mp4 -f null -
~~~

Actual offline software-projected 3D mesh previews were created in this ChatGPT session: cutaway, exploded and full engine. Each is 450x800, 96 frames, 30 fps, H264 and 3.2 s; full FFmpeg decode passed. These are real moving 3D mesh proofs, but NOT native Remotion output and NOT public GitHub artifacts. Their actual hashes are in asset-manifest.json. Original ChatGPT session carries downloadable MP4s.

## A6/A3 integration
Import TurboMechanism and TURBO_PORTS from src/yunex/turbo3d/mechanism/index.ts.
One unit is one metre, +Y up, +Z vehicle forward, local shaft +X.
Frame required. rotationPhase (radians) default 0; cutaway, exploded, visibility values in 0..1; variant turbo or full. A3 uses exact port centres from ports.ts.
A5 controls compatible lighting/material look, not A2 geometry. A6 imports approved model only after manager QC and alone owns central composition registration.

**Still pending:** npm run check and a genuine native Remotion render in a network/dependency-capable environment, manager independent quality approval, and A3/A5 integration. Do not mislabel the offline previews as native, or claim an episode final MP4.