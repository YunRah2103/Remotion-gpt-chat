#!/usr/bin/env bash
# From repository root; no main entrypoint modification.
set -euo pipefail
mkdir -p out/ep003-agent4
ENTRY="production/yunex/tyre_blowout_ep003/previews/agent-4/entry.tsx"
for id in EP003LookBeforeBeauty EP003LookAfterBeauty EP003LookBeforePortrait EP003LookAfterPortrait; do
  npx remotion render "$ENTRY" "$id" "out/ep003-agent4/$id.mp4" \
    --gl=swangle --codec=h264 --pixel-format=yuv420p \
    --concurrency=1 --scale=0.5 --log=error
  ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,nb_frames \
    -of default=noprint_wrappers=1 "out/ep003-agent4/$id.mp4"
  ffmpeg -v error -i "out/ep003-agent4/$id.mp4" -f null -
  ffmpeg -y -v error -ss 00:00:01 -i "out/ep003-agent4/$id.mp4" \
    -frames:v 1 "out/ep003-agent4/$id-frame-1s.png"
done
