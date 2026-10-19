#!/usr/bin/env bash
# Usage: mux-23s2.sh NATIVE1080_PICTURE.mp4 SHORT_MASTER.wav OUTPUT_DIR
# Do not label FINAL before the user's audiovisual approval.
set -euo pipefail
if [[ $# -ne 3 ]]; then echo 'Usage: mux-23s2.sh PICTURE SHORT_MASTER_WAV OUTPUT_DIR' >&2; exit 2; fi
picture="$1"; audio="$2"; output="$3"
mkdir -p "$output"
# Trimming by frames, not by presentation timestamp: B-frame reorder otherwise
# caused the 23.2-second cut to contain 698, rather than 696, video frames.
ffmpeg -nostdin -y -v error -i "$picture" -map 0:v:0 -c:v copy \
  -frames:v 696 -an "$output/picture-696.mp4"
ffmpeg -nostdin -y -v error -i "$output/picture-696.mp4" -i "$audio" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -ac 2 -af atrim=0:23.2 -movflags +faststart \
  "$output/YUNEX_F1_EP002_SHORTER_AUDIO_REVIEW.mp4"
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames,sample_rate,channels \
  -show_entries format=duration -of json "$output/YUNEX_F1_EP002_SHORTER_AUDIO_REVIEW.mp4" > "$output/ffprobe.json"
python3 - "$output/ffprobe.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1]))
v=next(s for s in j['streams'] if s['codec_type']=='video')
a=next(s for s in j['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1080,1920)
assert v['r_frame_rate']=='30/1' and int(v['nb_frames'])==696
assert a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2
assert abs(float(j['format']['duration'])-23.2)<.0001
print('PASS: native 1080p, 696 picture frames, 23.200s, stereo AAC')
PY
ffmpeg -nostdin -v error -xerror -i "$output/YUNEX_F1_EP002_SHORTER_AUDIO_REVIEW.mp4" -f null -
