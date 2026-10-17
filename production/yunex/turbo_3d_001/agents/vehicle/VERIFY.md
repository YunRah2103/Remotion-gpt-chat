# YUNEX Turbo EP001 — A1 V6.3 sculpted vehicle proof

**Scope:** A1 original 3D vehicle + road only. **Status REVIEW, not APPROVED**; creative acceptance is an explicit A0 decision. Earlier V5 technical evidence remains historical; do not use it to claim V6.3 approval.

## Reproduce exactly

```bash
npm ci --no-audit --no-fund
npm run check
node production/yunex/turbo_3d_001/agents/vehicle/check-model.mjs
python3 production/tools/handoff.py production/yunex/turbo_3d_001/agents/vehicle/handoff.json
mkdir -p out
npx remotion render src/yunex/turbo3d/vehicle/inspection/index.ts A1VehicleCloseupInspection out/a1-closeups.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1 --frames=0-119 --scale=0.8
npx remotion render src/yunex/turbo3d/vehicle/inspection/index.ts A1V6FrontThreeQuarterHero out/a1-v6-hero.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1 --frames=0-119 --scale=0.8
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,r_frame_rate -show_entries format=duration -of json out/a1-v6-hero.mp4
ffmpeg -v error -i out/a1-v6-hero.mp4 -f null -
ffmpeg -hide_banner -loglevel error -i out/a1-v6-hero.mp4 -f framemd5 out/a1-v6-frames.md5
sha256sum out/a1-v6-hero.mp4
```

## Verified current proof — real native moving animation

- **Source geometry commit:** `f290915380c1449edf0c46de6b1dc5bd3c48f4f9`.
- **Passing CI run:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39065514179.
- **Four-second moving front three-quarter hero:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39065514179/artifacts/12112793802, SHA256 `fe106d4ae36fb42f89c08404bab91569f47e6401caa5367a06fefc0a0a565db0`.
- **Four-shot moving detail / wheel / engine hatch / rear proof:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39065514179/artifacts/12113127767, SHA256 `8be01446faa1856280861d316371e38c67a96ba1a358ac9e1d217a16c3db0b9e`.
- **Each MP4:** 432 × 768, 30fps, 4.000s, H.264, 120/120 distinct decoded frames, full ffmpeg decoding PASS; TypeScript, A1 mechanical/coordinate contract and handoff schema PASS.

## Actual moving-frame QC

Extracted and visually inspected hero frames `0,15,30,45,60,75,90,105,119`; four-shot reel frames `3,14,28,35,50,59,65,80,88,95,105,117`. Compared against V5 and first V6 hero (rejected because the nose clipped at late frames), then V6.1 (rejected because a raised headlamp plate floated above the new bonnet).

**Accepted technical package:** wheel arches are real tapered voids with sculpted fender lips; actual wheel pivots continue to rotate with road travel; low hood crown/haunch transitions are clearly visible in front three-quarter; the raked windscreen and greenhouse replace the blocky original roof; nose now stays inside frame; rear hinged deck and engine continue to reveal. Front lamps now have physical tapered bonnet apertures and surface-following lens meshes, rather than a separate elevated slab. The optics and hood remain **deliberately stylised**; independent manager aesthetic sign-off is still needed.

## Interface preservation and ownership

Source is `src/yunex/turbo3d/vehicle/VehicleWorld.tsx`, sculpt in `SculptedBody.tsx`, V5 mechanisms in `DetailKit.tsx`, proof compositions under `inspection/`. Public exports `VehicleWorld`, `VehicleModel`, `RoadEnvironment`; contract `frame`, `variant`, `revealProgress`, `travelMeters`; axes **+Y UP / +Z FRONT / +X RIGHT**, units metres. Wheel angle `-travelMeters/.355` and road parallax share distance. Preserved `CAR_BODY`, `ENGINE_BAY`, `EXHAUST_MANIFOLD_ZONE`, `REAR_CAMERA_TRACK`, `ROAD_SURFACE` anchors and model/material contracts. No A2–A5 ownership edits, no A6/A7 edits. No photoreal OEM CAD claimed.
