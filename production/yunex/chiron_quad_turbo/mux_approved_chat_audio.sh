#!/usr/bin/env bash
# YUNEX EP002: locally combine existing private Chiron picture master with
# the 28.6s user-approved narration+Killswitch Lullaby audio mix from ChatGPT.
# This DOES NOT upload copyrighted source video or audio to public GitHub.
set -euo pipefail
if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: bash $0 PRIVATE_PICTURE.mp4 APPROVED_AUDIO_MIX.m4a [OUTPUT.mp4]" >&2
  exit 2
fi
PICTURE="$1"
AUDIO="$2"
OUTPUT="${3:-YUNEX_CHIRON_EP002_FINAL_PRIVATE.mp4}"
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
for f in "$PICTURE" "$AUDIO"; do
  [[ -s "$f" ]] || { echo "Missing file $f" >&2; exit 3; }
done
ffmpeg -hide_banner -loglevel error -xerror -y -i "$PICTURE" -i "$AUDIO" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -t 28.6 \
  -movflags +faststart "$OUTPUT"
ffmpeg -hide_banner -loglevel error -xerror -i "$OUTPUT" -f null -
python3 - "$OUTPUT" <<'PY'
import json,sys,subprocess,hashlib,pathlib
p=pathlib.Path(sys.argv[1])
i=json.loads(subprocess.check_output([
  'ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
v=next(s for s in i['streams'] if s['codec_type']=='video')
a=next(s for s in i['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1080,1920),(v['width'],v['height'])
assert v['codec_name']=='h264' and a['codec_name']=='aac'
assert a['sample_rate']=='48000'
assert 28.45<float(i['format']['duration'])<28.80
s=subprocess.check_output(['ffprobe','-v','error','-count_frames',
  '-select_streams','v:0','-show_entries','stream=nb_read_frames',
  '-of','csv=p=0',str(p)]).decode().strip()
assert s.split(',')[0].strip()=='858',repr(s)
print('PRIVATE_USER_AUDIO_FILM_TECHNICAL_PASS',p.stat().st_size,
    hashlib.sha256(p.read_bytes()).hexdigest())
PY
echo "Local-only private render complete: $OUTPUT"
