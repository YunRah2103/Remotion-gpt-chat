#!/usr/bin/env bash
# EP003 Agent 6 — mux the USER-SUPPLIED authorised Cedar VO, never synthetic replacement.
# Usage: bash scripts/ep003/mux-verified-vo.sh PICTURE.mp4 VO_MASTER.wav [OUT.mp4]
set -euo pipefail
picture="${1:?Supply 800-frame native 1080p Remotion picture}"
voice="${2:?Supply user-provided Cedar PCM WAV}"
out="${3:-YUNEX_TYRE_EP003_PICTURE_VO.mp4}"
[[ -s "$picture" && -s "$voice" && "$out" != "$picture" && "$out" != "$voice" ]] || {
  echo "Required picture/audio missing or output overwrites source" >&2; exit 2;
}
getv() { ffprobe -v error -select_streams v:0 -show_entries "stream=$1" -of default=noprint_wrappers=1:nokey=1 "$picture"; }
[[ "$(getv width)" == 1080 && "$(getv height)" == 1920 ]] || { echo "Not original 1080x1920" >&2; exit 3; }
[[ "$(getv avg_frame_rate)" == 30/1 && "$(getv nb_frames)" == 800 && "$(getv codec_name)" == h264 ]] || {
  echo "Not the complete native 800-frame H264/30fps picture" >&2; exit 3;
}
vo_seconds=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$voice")
python3 - "$vo_seconds" <<'PY'
import sys
duration=float(sys.argv[1])
assert abs(duration-26.664)<0.055, f'Actual Cedar VO length must be 26.664s, got {duration}'
PY
mkdir -p "$(dirname "$out")"
# Stream-copy untouched verified video. AAC voice only, loudness managed for clear dialogue.
# Pad the 26.664s VO by 0.003s so video ends at frame 800 (26.6667s).
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$picture" -i "$voice" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ac 1 -ar 48000 \
  -af 'loudnorm=I=-16:TP=-1.5:LRA=9,apad=pad_dur=0.1' \
  -t 26.6666667 -movflags +faststart "$out"
[[ "$(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of default=noprint_wrappers=1:nokey=1 "$out")" == 800 ]] || exit 4
[[ "$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "$out")" == 1080 ]] || exit 4
[[ "$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$out")" == 1920 ]] || exit 4
[[ "$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$out")" == 48000 ]] || exit 4
[[ "$(ffprobe -v error -select_streams v:0 -show_entries stream=index -of default=noprint_wrappers=1:nokey=1 "$out" | wc -l)" -eq 1 ]] || exit 4
[[ "$(ffprobe -v error -select_streams a:0 -show_entries stream=index -of default=noprint_wrappers=1:nokey=1 "$out" | wc -l)" -eq 1 ]] || exit 4
# Completely decode both streams (not an FFprobe-only claim).
ffmpeg -nostdin -hide_banner -v error -xerror -i "$out" -f null -
ffprobe -v error -show_entries format=duration,size -show_entries stream=index,codec_type,codec_name,width,height,avg_frame_rate,nb_frames,sample_rate -of json "$out" > "${out%.mp4}.ffprobe.json"
sha256sum "$picture" "$voice" "$out" > "${out%.mp4}.sha256sums.txt"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$out" \
  -vf "select='not(mod(n,50))',scale=270:480,tile=4x4" -frames:v 1 -update 1 "${out%.mp4}.contact-sheet.png"
echo "SUCCESS: true 800-frame full-res picture, actual authorised Cedar VO, and full A/V decode: $out"
