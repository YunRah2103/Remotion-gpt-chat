# Agent C camera, x-ray and lighting lookdev

This specialist owns only src/brakes001/cinema/** and production/videos/carbon-ceramic-001/lookdev/** plus handoffs/agent-c.json and agent-c.md. Master owns full-film integration.

Frame-based interface within Remotion ThreeCanvas:
- import {BrakeCameraRig,BrakeLighting,GhostCarOutline} from './brakes001/cinema'
- <BrakeCameraRig frame={frame}/>
- <BrakeLighting frame={frame} heat01={brakeState.heat01}/>
- {frame<120 && <GhostCarOutline frame={frame}/>}

Axle X, disc plane YZ, Y up. Intro ghost brake locator [0.85,0.45,-1.42] metres. Real isolated A rotor should be centred on origin in shots >=120. Master handles hard editorial cut or dissolve at frame 120, and verifies A GLB bounds/scale. Camera never modifies brake model pivots or motion. The coloured light is illustrative only.

## Five 1080x1920 representative stills

- frame-048-vector-proof.svg — 0–119 context
- frame-168-vector-proof.svg — 120–269 reveal
- frame-321-vector-proof.svg — 270–449 heat/macro
- frame-531-vector-proof.svg — 450–629 repeated brake
- frame-705-vector-proof.svg — 630–749 hero

All are CPU-projective SVG previs on simple silhouette and rotor proxy, NOT native Remotion or final Agent A hardware. Exact sampled frame camera positions are in camera-frame-samples.json. Agent C separately generated a 122-frame 540x960 H264 CPU moving previs and validated it via ffprobe and complete ffmpeg decode; the MP4 is available in C's originating chat sandbox only.

## Native Remotion proof commands for Master

npm ci
npm run check
npx remotion still src/brakes001/cinema/proof-entry.ts Brakes001CinemaProof out/c048.png --frame=48 --gl=swangle
npx remotion still src/brakes001/cinema/proof-entry.ts Brakes001CinemaProof out/c168.png --frame=168 --gl=swangle
npx remotion still src/brakes001/cinema/proof-entry.ts Brakes001CinemaProof out/c321.png --frame=321 --gl=swangle
npx remotion still src/brakes001/cinema/proof-entry.ts Brakes001CinemaProof out/c531.png --frame=531 --gl=swangle
npx remotion still src/brakes001/cinema/proof-entry.ts Brakes001CinemaProof out/c705.png --frame=705 --gl=swangle
npx remotion render src/brakes001/cinema/proof-entry.ts Brakes001CinemaProof out/c-motion.mp4 --frames=135-195 --codec=h264 --pixel-format=yuv420p --gl=swangle
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,r_frame_rate -of default=nw=1 out/c-motion.mp4
ffmpeg -v error -i out/c-motion.mp4 -f null -

Camera math unit tests:
mkdir -p /tmp/brakes001-tests
npx tsc --module commonjs --target es2022 --strict --skipLibCheck --outDir /tmp/brakes001-tests src/brakes001/cinema/cameraMath.ts src/brakes001/cinema/cameraMath.test.ts
node /tmp/brakes001-tests/cameraMath.test.js

## Issues to inspect on native footage

Thermal shot intentionally crops the proxy annulus at frame 321; Master should confirm the real caliper and ventilation remain understandable. Agent A's vented rotor materials and Agent B's independent dynamics are not tested in CPU proxy. D signs off on native full film, not these proofs.
