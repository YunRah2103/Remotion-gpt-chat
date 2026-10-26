#!/usr/bin/env bash
# Reproducible YUNEX HDR10 *SDR-source* grade; not a native-camera HDR reconstruction.
set -euo pipefail
if (( $# != 5 )); then
  echo "Usage: $0 INPUT_SDR_BT709_MP4 OUTPUT_HDR10_MP4 SECONDS SOURCE_CROP_W:H:X:Y OUTPUT_W:H" >&2
  echo "Example: $0 193667.mp4 out.mp4 10.533333 1920:1080:0:1166 1080:1920" >&2
  exit 2
fi
input="$1"; output="$2"; secs="$3"
IFS=: read -r CW CH CX CY <<< "$4"
IFS=: read -r W H <<< "$5"
command -v ffmpeg >/dev/null; command -v ffprobe >/dev/null
[[ -f "$input" ]] || { echo "Source missing: $input" >&2; exit 1; }
transfer="$(ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer -of default=nokey=1:noprint_wrappers=1 "$input" | head -1)"
if [[ "$transfer" == smpte2084 || "$transfer" == arib-std-b67 ]]; then
  echo "This is already HDR footage; do NOT use an SDR-specific tonality lift" >&2
  exit 1
fi
HH=$(( W * CH / CW / 2 * 2 ))
HY=$(( (H-HH)/2 ))
if (( W%2 != 0 || H%2 != 0 || HH > H || HH < 2 )); then echo "Invalid target geometry" >&2; exit 1; fi

# Explicit BT.709 -> linear BT.2020 -> 16bit creative highlight stretch -> BT.2020 PQ.
# Metadata: 1000/0.005 nit mastering display; MaxCLL/FALL are declared, not whole-file-measured.
filter="[0:v]crop=$CW:$CH:$CX:$CY,split=2[a][b];[b]scale=$W:$H:force_original_aspect_ratio=increase:flags=bilinear,crop=$W:$H,gblur=sigma=25,eq=brightness=-0.19:saturation=0.75[bg];[a]scale=$W:$HH:flags=lanczos[fg];[bg][fg]overlay=0:$HY:shortest=1,format=yuv444p16le,zscale=matrixin=bt709:transferin=bt709:primariesin=bt709:matrix=gbr:transfer=linear:primaries=bt2020:npl=800,format=gbrp16le,lutrgb=r='pow(val/maxval,2.05)*maxval':g='pow(val/maxval,2.05)*maxval':b='pow(val/maxval,2.05)*maxval',zscale=matrixin=gbr:transferin=linear:primariesin=bt2020:matrix=bt2020nc:transfer=smpte2084:primaries=bt2020:npl=800,format=yuv420p10le[v]"

ffmpeg -hide_banner -nostdin -y -loglevel error -threads 4 -i "$input" -t "$secs" \
 -filter_complex "$filter" -map '[v]' -map '0:a:0?' \
 -c:v libx265 -preset fast -crf 18 -threads 4 -tag:v hvc1 \
 -x265-params 'log-level=error:hdr10=1:hdr10-opt=1:repeat-headers=1:colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc:master-display=G(13250,34500)B(7500,3000)R(35400,14600)WP(15635,16450)L(10000000,50):max-cll=1000,200' \
 -color_primaries bt2020 -color_trc smpte2084 -colorspace bt2020nc -pix_fmt yuv420p10le \
 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$output"

ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,pix_fmt,color_primaries,color_transfer,color_space -of default=noprint_wrappers=1 "$output"
sha256sum "$output"
echo "Completed: HDR10 encoded picture values from SDR original; native HDR capture is not implied."
