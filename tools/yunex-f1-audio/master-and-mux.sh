#!/usr/bin/env bash
# Usage: master-and-mux.sh PICTURE.mp4 PREMASTER.wav OUTDIR [--picture-approved]
set -euo pipefail
if [[ $# -lt 3 ]]; then echo 'Usage: master-and-mux.sh PICTURE.mp4 PREMASTER.wav OUTDIR [--picture-approved]' >&2; exit 2; fi
picture="$1"; audio="$2"; outdir="$3"; approved=""
if [[ $# -ge 4 ]]; then approved="$4"; fi
mkdir -p "$outdir"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,nb_frames,r_frame_rate -show_entries format=duration -of json "$picture" > "$outdir/picture-probe.json"
python3 - "$outdir/picture-probe.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1]))
v=next(s for s in j['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'])==(1080,1920),v
assert v['r_frame_rate']=='30/1',v
assert int(v['nb_frames'])==780,v
assert abs(float(j['format']['duration'])-26)<.03,j
PY
ffmpeg -nostdin -hide_banner -i "$audio" -af 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json' -f null - 2> "$outdir/first-pass.log"
python3 - "$outdir/first-pass.log" "$outdir/filter.txt" <<'PY'
import re,json,sys
s=open(sys.argv[1]).read()
m=re.findall(r'\{[^{}]*"input_i"[^{}]*\}',s,re.S)
if not m:raise ValueError('No EBU R128 analysis returned')
j=json.loads(m[-1])
expr='loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true'.format(**j)
open(sys.argv[2],'w').write(expr)
PY
filter="$(cat "$outdir/filter.txt")"
ffmpeg -nostdin -y -v error -i "$audio" -af "$filter" -ar 48000 -ac 2 -c:a pcm_s24le "$outdir/YUNEX_F1_EP002_VO_ENGINES_SFX_MASTER.wav"
ffmpeg -nostdin -hide_banner -i "$outdir/YUNEX_F1_EP002_VO_ENGINES_SFX_MASTER.wav" -filter_complex 'ebur128=peak=true' -f null - 2> "$outdir/loudness-report.txt"
if [[ "$approved" == '--picture-approved' ]]; then
  name='YUNEX_F1_RACING_LINE_EP002_FINAL.mp4'
else
  name='YUNEX_F1_RACING_LINE_EP002_AUDIO_REVIEW.mp4'
fi
# Never transcode the already graded H.264 picture.
ffmpeg -nostdin -y -v error -i "$picture" -i "$outdir/YUNEX_F1_EP002_VO_ENGINES_SFX_MASTER.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -t 26 -movflags +faststart "$outdir/$name"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,nb_frames,r_frame_rate,sample_rate,channels -show_entries format=duration -of json "$outdir/$name" > "$outdir/final-probe.json"
ffmpeg -nostdin -v error -xerror -i "$outdir/$name" -f null -
python3 - "$outdir/final-probe.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1]))
v=next(x for x in j['streams'] if x['codec_type']=='video')
a=next(x for x in j['streams'] if x['codec_type']=='audio')
assert (v['width'],v['height'])==(1080,1920)
assert v['r_frame_rate']=='30/1' and int(v['nb_frames'])==780
assert a['sample_rate']=='48000' and a['channels']==2
assert abs(float(j['format']['duration'])-26)<.03
PY
echo "Native-video stream-copy MP4 validated: $outdir/$name"
