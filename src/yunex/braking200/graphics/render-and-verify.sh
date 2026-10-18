#!/usr/bin/env bash
# Native proof runner; execute from repository root on a Remotion-capable runner.
set -euo pipefail
test -f package.json || { echo "Run from repository root" >&2; exit 2; }
DIR="out/braking-a5"
ENTRY="src/yunex/braking200/graphics/entry.tsx"
mkdir -p "$DIR"
npm ci --no-audit --no-fund
npm run check
node --experimental-strip-types --test src/yunex/braking200/graphics/logic.test.mjs
for composition in BrakingGraphicsMacroProof BrakingGraphicsTrackProof; do
  name="macro"; [[ "$composition" == *Track* ]] && name="track"
  output="$DIR/$name.mp4"
  npx remotion render "$ENTRY" "$composition" "$output" \
    --frames=0-149 --gl=swangle --scale=0.5 --codec=h264 \
    --pixel-format=yuv420p --concurrency=1
  ffprobe -v error -show_streams -show_format -of json "$output" > "$DIR/$name.ffprobe.json"
  ffmpeg -v error -xerror -i "$output" -f null -
  ffmpeg -v error -xerror -i "$output" -f framemd5 "$DIR/$name.framemd5"
  python3 - "$DIR/$name.ffprobe.json" "$DIR/$name.framemd5" <<'PY'
import json,sys
from fractions import Fraction
metadata=json.load(open(sys.argv[1]))
video=next(x for x in metadata['streams'] if x['codec_type']=='video')
assert video['codec_name']=='h264',video
assert (video['width'],video['height'])==(540,960),video
assert Fraction(video['r_frame_rate'])==30,video
assert int(video['nb_frames'])==150,video
lines=[x for x in open(sys.argv[2]) if x.strip() and not x.startswith('#')]
hashes=[x.strip().split(',')[-1] for x in lines]
assert len(hashes)==150,len(hashes)
assert len(set(hashes))>=3,'Proof is static, lacks three independently distinct decoded frames'
print('NATIVE_MOVING_PASS',sys.argv[1],'frames=',len(hashes),'distinct=',len(set(hashes)))
PY
done
for info in "BrakingGraphicsMacroProof macro 12" "BrakingGraphicsMacroProof macro 90" \
  "BrakingGraphicsTrackProof track 15" "BrakingGraphicsTrackProof track 125"; do
  read -r composition name frame <<< "$info"
  npx remotion still "$ENTRY" "$composition" "$DIR/$name-$frame.png" \
    --frame="$frame" --gl=swangle --scale=0.5
done
echo "Generated moving MP4s, 4 stills and ffprobe/framemd5 reports in $DIR"
echo "Exact local source SHA: $(git rev-parse HEAD)"
echo "GATE: still requires independent watching of whole clips and manager review."
