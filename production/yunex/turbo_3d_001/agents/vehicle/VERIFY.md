# YUNEX Turbo EP001 — A1 V5 Native Proof and Review

**Scope:** original procedural stylised car and world ONLY. Handoff status **REVIEW** pending A0 approval, not final episode or A6/A7 deliverable.

## Reproduce
```bash
npm ci
npm run check
node production/yunex/turbo_3d_001/agents/vehicle/check-model.mjs
python3 production/tools/handoff.py production/yunex/turbo_3d_001/agents/vehicle/handoff.json
mkdir -p out
npx remotion render src/yunex/turbo3d/vehicle/inspection/index.ts A1VehicleCloseupInspection out/a1-vehicle-v4-inspection.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1 --frames=0-119 --scale=0.8
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,r_frame_rate -show_entries format=duration -of json out/a1-vehicle-v4-inspection.mp4
ffmpeg -v error -i out/a1-vehicle-v4-inspection.mp4 -f null -
ffmpeg -hide_banner -loglevel error -i out/a1-vehicle-v4-inspection.mp4 -f framemd5 out/a1-v4-frames.md5
sha256sum out/a1-vehicle-v4-inspection.mp4
```

**Source commit:** `85f1dc4b780a6aec8d18d16922ef161651038bb5`.
**Native GitHub Actions PASS:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39044260650
**Decoded MP4 artifact:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39044260650/artifacts/12105615160
**Actual rendered proof:** 4.000s, 120 frames, 120 distinct decoded frame MD5s, 432x768 9:16, H.264, 30fps; FFprobe + full FFmpeg decode passed. Video SHA256: `4bd2422e8b220dab6f79336d8f44652f92dfb13ac48b60214e6d0dc6b16e9a62`.

## Four-shot actual visual QC

- Frames 0–29: front fascia / three-layer bonnet-integrated headlight / genuine front aperture wall and vanes
- Frames 30–59: rotating front wheel, 5 split-spoke construction, lugged hub and recessed brake hardware; no detached tread cuboids
- Frames 60–89: rear powertrain plenum, two bank masses, hose connections and hinge-open rear deck with internal ribs
- Frames 90–119: rear-three-quarter original car, smoked rear lenses and newly designed red LED signature

Manually inspected frames `5,18,27,35,48,55,64,75,85,95,108,116`; rejected previous V2 first pass after actual frame inspection (oversized lamp rings/caliper, detached tyre tread, giant hatch). Iterations through V5 corrected those problems. Rendering success does **not** certify photorealism or creative approval. Car intentionally remains geometrically simplified in the contract's low-poly videogame aesthetic.

## Integration

`VehicleWorld({frame,variant,revealProgress,travelMeters})`, `VehicleModel`, `RoadEnvironment` exported from `src/yunex/turbo3d/vehicle/VehicleWorld.tsx`. Geometry primitives in `DetailKit.tsx`. Anchors `CAR_BODY`, `ENGINE_BAY`, `EXHAUST_MANIFOLD_ZONE`, `REAR_CAMERA_TRACK`, `ROAD_SURFACE`. 1 unit=1 metre, +Y UP, +Z front; wheel pivots X, tyre angle `-travelMeters/.355`, road parallax from SAME distance. Front fascia has two actual Shape perforations, side panels omitted at rear-quarter duct section, with recessed backing and dark guide vanes. Rear deck variant opens with eased 0–.83 rad hinge, lower than earlier rejected version. A5 owns final lookdev; A4 owns cinematic rigs; A6 owns registered film/Root; A7 owns mastered audio. Do not modify old compositions.

## Review risks

- Simplified low-poly body and illustrative engine hardware, not manufacturer CAD. A4/A5 should test lighting, camera and stylized performance on phone before locking.
- No Blender/GLB source because this project exports deterministic native R3F geometry; original mesh, style slots and rig transforms all source-controlled.
- This is only an A1 isolated asset-proof video. The final film cannot be claimed ready until A2–A7 complete their own contracts.
