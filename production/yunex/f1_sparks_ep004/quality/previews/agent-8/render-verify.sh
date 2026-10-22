#!/usr/bin/env bash
# Execute in a GitHub runner with repo checkout, npm dependencies and ffmpeg.
# Real native 1080x1920 MP4s only; deliberately no placeholder/fake outputs.
set -euo pipefail
ROOT=production/yunex/f1_sparks_ep004/quality
ENTRY="$ROOT/previews/agent-8/entry.tsx"
OUT="out/ep004-a8-native"
mkdir -p "$OUT"
npm run check
npx tsc -p "$ROOT/tests/agent-8/tsconfig.json"
node --test "$ROOT"/tests/agent-8/*.test.mjs
for spec in "technical EP004A8Underfloor 180" "cinematic EP004A8NightHero 240"; do
  read -r kind composition count <<< "$spec"
  npx remotion render "$ENTRY" "$composition" "$OUT/$kind.mp4" \
    --gl=swangle --codec=h264 --pixel-format=yuv420p --log=error
  ffmpeg -v error -xerror -i "$OUT/$kind.mp4" -f null -
  python3 - "$OUT/$kind.mp4" "$count" "$OUT" "$kind" <<'PY'
import json,subprocess,sys,pathlib
path,expected,output,kind=sys.argv[1],int(sys.argv[2]),pathlib.Path(sys.argv[3]),sys.argv[4]
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames',
  '-select_streams','v:0','-show_entries','stream=codec_name,profile,width,height,avg_frame_rate,nb_read_frames,duration',
  '-of','json',path]))['streams'][0]
assert meta['codec_name']=='h264',meta
assert [meta['width'],meta['height']]==[1080,1920],meta
assert meta['avg_frame_rate']=='30/1',meta
assert int(meta['nb_read_frames'])==expected,meta
for frame in [0,expected//2,expected-1]+([77,78,152,153] if kind=='cinematic' else []):
  fn=output/f'{kind}-{frame:03}.png'
  subprocess.run(['ffmpeg','-v','error','-y','-i',path,
    '-vf',f'select=eq(n\\,{frame})','-vsync','vfr','-frames:v','1',str(fn)],check=True)
  assert fn.stat().st_size>1000,fn
md5=subprocess.check_output(['ffmpeg','-v','error','-i',path,'-vf','fps=5',
  '-f','framemd5','-']).decode()
hashes=[line.split(',')[-1].strip() for line in md5.splitlines() if line and not line.startswith('#')]
unique=len(set(hashes))
assert unique>=int(expected/30*3),f'{kind} largely static: {unique} unique 5Hz frames'
(output/f'{kind}-probe.json').write_text(json.dumps({**meta,'5fps_unique_hashes':unique},indent=2))
print(kind,meta,'5fps unique',unique)
PY
done
printf 'Native EP004 A8 evidence: %s\n' "$OUT"
printf '%s\n' 'REQUIRED manual gate: watch BOTH whole moving films and compare matching frames to Agent6 V4.'
