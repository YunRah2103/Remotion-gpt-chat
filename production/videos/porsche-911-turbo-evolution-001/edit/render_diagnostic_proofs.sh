#!/usr/bin/env bash
set -euo pipefail
# Genuine native Remotion RENDER of clearly labelled abstract diagnostics.
# Not genuine Porsche footage; must never be released as finished car edit.
npm ci --no-audit --no-fund
npm run check
node production/videos/porsche-911-turbo-evolution-001/edit/test_timeline.mjs
OUT="out/porsche-turbo-edit-diagnostic"
if [ "$#" -ge 1 ]; then OUT="$1"; fi
mkdir -p "$OUT"
for F in 2 138 208 277 434 509; do
  npx remotion still src/porsche-turbo-evolution/edit/proof-entry.tsx \
    PorscheTurboEditDiagnostic "$OUT/diag-frame-$F.png" --frame="$F" \
    --gl=swangle --scale=.5
done
for RANGE in 60-73 200-213; do
  npx remotion render src/porsche-turbo-evolution/edit/proof-entry.tsx \
    PorscheTurboEditDiagnostic "$OUT/diagnostic-$RANGE.mp4" \
    --frames="$RANGE" --gl=swangle --codec=h264 --pixel-format=yuv420p \
    --scale=.5 --concurrency=1
done
for VIDEO in "$OUT"/*.mp4; do
  ffmpeg -v error -xerror -i "$VIDEO" -f null -
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,width,height,nb_frames,r_frame_rate \
    -of default=nw=1 "$VIDEO"
done
sha256sum "$OUT"/*.mp4 > "$OUT/SHA256SUMS.txt"
printf 'DIAGNOSTIC ONLY - NO REAL PORSCHE FOOTAGE\n' > "$OUT/STATUS.txt"
