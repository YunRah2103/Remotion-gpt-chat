#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
mkdir -p out/yunex/turbo3d/a4
npm run check
node production/yunex/turbo_3d_001/agents/cinematics/camera.test.cjs
ENTRY=src/yunex/turbo3d/cinematics/previewEntry.tsx
# LOW-resolution timed ranges first to limit swangle CPU use. User-facing final resolution belongs to A6.
while read -r ID RANGE NAME; do
  npx remotion render "$ENTRY" "$ID" "out/yunex/turbo3d/a4/${NAME}.mp4" --frames="$RANGE" --scale=.4 --concurrency=1 --gl=swangle --codec=h264 --pixel-format=yuv420p
  ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,nb_frames,r_frame_rate -of json "out/yunex/turbo3d/a4/${NAME}.mp4" | tee "out/yunex/turbo3d/a4/${NAME}.ffprobe.json"
  ffmpeg -v error -xerror -i "out/yunex/turbo3d/a4/${NAME}.mp4" -f null -
  sha256sum "out/yunex/turbo3d/a4/${NAME}.mp4" | tee "out/yunex/turbo3d/a4/${NAME}.sha256"
done <<'SHOTS'
YunexA4HookOrbit 0-89 hook_orbit
YunexA4HookRush 0-89 hook_rush
YunexA4Shaft 0-149 shaft_follow
YunexA4Charge 0-149 charge_glide
YunexA4Road 0-119 road_hero
SHOTS
echo "Rendered ALL five real moving Remotion/WebGL previews; CHECK visually and publish exact artifacts before review."