#!/usr/bin/env bash
set -euo pipefail
# Always run from repository root. Private review never uploads copyrighted audio.
cd "$(dirname "$0")/../../../.."
PROJECT=production/videos/bmw-m5-g90-beat-001
OUTPUT=out/bmw-m5-g90-beat-001
mkdir -p "$OUTPUT"
MODE=visual
if [[ $# -ge 1 ]]; then MODE="$1"; fi
case "$MODE" in
  visual|private-review|publish) ;;
  *) echo "Usage: $0 {visual|private-review|publish}" >&2; exit 2 ;;
esac
if [[ "$MODE" == publish ]]; then
  : "$MUSIC_RIGHTS_EVIDENCE"
  python "$PROJECT/editor/validate_editor.py" --phase publish \
    --music-rights-evidence "$MUSIC_RIGHTS_EVIDENCE" --verify-sha
else
  python "$PROJECT/editor/validate_editor.py" --phase render --verify-sha
fi
npm run check
npx remotion render src/index.ts BmwM5G90Beat001 "$OUTPUT/visual.mp4" \
  --codec h264 --pixel-format yuv420p --crf 18 --gl swangle --concurrency 2
# Validate full 20s H.264 visual before any soundtrack is muxed.
ffmpeg -nostdin -v error -xerror -i "$OUTPUT/visual.mp4" -f null -
VIDEO_INFO="$(ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=codec_name,width,height,avg_frame_rate,nb_read_frames \
  -of default=noprint_wrappers=1 "$OUTPUT/visual.mp4")"
echo "$VIDEO_INFO" | grep -F 'codec_name=h264'
echo "$VIDEO_INFO" | grep -F 'width=1080'
echo "$VIDEO_INFO" | grep -F 'height=1920'
echo "$VIDEO_INFO" | grep -F 'avg_frame_rate=30/1'
echo "$VIDEO_INFO" | grep -F 'nb_read_frames=600'
if [[ "$MODE" == visual ]]; then
  echo "Visual-only 600f render validated. No music publicly redistributed."
  exit 0
fi
: "$AUDIO_PATH"
AUDIO="$AUDIO_PATH"
[[ -f "$AUDIO" ]] || { echo "Missing private audio" >&2; exit 2; }
if [[ "$MODE" == private-review ]]; then
  MASTER="$OUTPUT/PRIVATE_REVIEW_NOT_FOR_PUBLICATION.mp4"
else
  MASTER="$OUTPUT/BMW_M5_G90_FINAL_RIGHTS_CLEARED.mp4"
fi
ffmpeg -y -nostdin -hide_banner -loglevel error -i "$OUTPUT/visual.mp4" -i "$AUDIO" \
  -map 0:v:0 -map 1:a:0 -frames:v 600 -c:v copy -c:a aac -b:a 192k \
  -ar 48000 -ac 2 -af "alimiter=limit=0.95" -t 20 -movflags +faststart "$MASTER"
ffmpeg -nostdin -v error -xerror -i "$MASTER" -f null -
ffprobe -v error -show_entries format=duration:stream=codec_name,nb_frames,avg_frame_rate \
  -of json "$MASTER" > "$OUTPUT/ffprobe.json"
echo "Validated local master: $MASTER"
