# Agent 1 — native 3D moving proof

Agent 1 owns **only** the original vehicle/world package. This proof is NOT the final video, which belongs to A6/A7.

## Native proof

```sh
npm ci
npm run check
npx remotion render src/yunex/turbo3d/vehicle/preview/index.ts A1VehiclePreview out/a1-vehicle-native-proof.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1 --frames=0-89 --scale=0.7
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,r_frame_rate -show_entries format=duration -of json out/a1-vehicle-native-proof.mp4
ffmpeg -v error -i out/a1-vehicle-native-proof.mp4 -f null -
sha256sum out/a1-vehicle-native-proof.mp4
```

Camera 0–67: approach/orbit, camera 68–89: rear-quarter tracking with moving tarmac and correctly turning wheels. Source preview composition has 120 deterministic frames at 30fps and native 540x960. Rendered 0–89 at 70% has expected 378x672 output, 3 seconds; this is **a low-res review preview**, not a final 1080x1920 film.

Reproduce independent GitHub Actions job `.github/workflows/yunex-turbo-a1-vehicle-proof.yml` (unique A1-owned workflow; it does not edit shared workflows). Its artifact includes MP4, ffprobe JSON and SHA256 if the run succeeds. Do not claim successful proof before real CI inspection.

## Named anchors

`CAR_BODY` (0,0.76,0), `ENGINE_BAY` (0,0.84,-1.33), `EXHAUST_MANIFOLD_ZONE` (0,0.63,-1.78), `REAR_CAMERA_TRACK` (0,1.32,-5.6), `ROAD_SURFACE` (0,0,0). +Y up, +Z nose, X lateral, m units. Wheel X local rotation. `travelMeters` controls both wheel angular velocity and moving road/environment parallax; DO NOT separately animate wheel spin.

## Materials for A5

`BODY_TEAL_ENAMEL`, `DARK_TINTED_GLASS`, `RIM_GRAPHITE`, `RIM_MACHINED_SPOKE`, `RUBBER_SIDEWALL`, `TYRE_TREAD`, `RACE_ASPHALT`, `GUARD_RAIL_SILVER`, `REAR_LED_CRIMSON`, `HEADLAMP_WHITE`, `AERO_REAR_SPOILER`, `ENGINE_COVER`.
