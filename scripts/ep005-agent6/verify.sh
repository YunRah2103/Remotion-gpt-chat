#!/usr/bin/env bash
set -euo pipefail
VIDEO="${1:?MP4 input required}"
DEST="${2:?Output directory required}"
mkdir -p "${DEST}/samples"
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_frames,pix_fmt,duration -of json "$VIDEO" > "${DEST}/ffprobe.json"
python3 - "$DEST/ffprobe.json" <<'PY'
import json,sys
s=json.load(open(sys.argv[1]))['streams'][0]
assert s['codec_name']=='h264',s
assert s['pix_fmt']=='yuv420p',s
assert s['r_frame_rate']=='30/1',s
assert int(s['nb_frames'])==120,s
assert (int(s['width']),int(s['height'])) in ((1080,1920),(1920,1080)),s
PY
# Full native FFmpeg decode: fatal on damaged/truncated frame.
ffmpeg -hide_banner -v error -xerror -i "$VIDEO" -f null -
for frame in 0 24 52 76 92 119; do
  ffmpeg -hide_banner -v error -y -i "$VIDEO" -vf "select=eq(n\,${frame})" -vsync vfr -frames:v 1 "${DEST}/samples/frame-$(printf '%03d' "$frame").png"
done
python3 - "${DEST}/samples" "${DEST}/contact-sheet.jpg" <<'PY'
import sys
from pathlib import Path
from PIL import Image,ImageDraw
items=sorted(Path(sys.argv[1]).glob('frame-*.png'))
assert len(items)==6,f'missing frames: {items}'
out=Image.new('RGB',(1800,1360),(231,233,235))
for i,f in enumerate(items):
    im=Image.open(f).convert('RGB')
    im.thumbnail((600,600))
    x=(i%3)*600+(600-im.width)//2
    y=(i//3)*680+(640-im.height)//2
    out.paste(im,(x,y))
    ImageDraw.Draw(out).text(((i%3)*600+16,(i//3)*680+643),f.name,fill=(30,30,35))
out.save(sys.argv[2],quality=91)
PY
sha256sum "$VIDEO" | tee "${DEST}/SHA256SUMS.txt"
echo "Passed native media checks: $VIDEO"
