#!/usr/bin/env python3
"""Create an ATTRIBUTED, genuine video-bearing generic night-traffic atmosphere pack.
This is NOT Audi RS6 footage. Never count it as a C8 mechanical-detail clip.
"""
import hashlib, json, pathlib, subprocess, time, urllib.request
from urllib.error import HTTPError, URLError
ROOT=pathlib.Path("rs6-agent-c-bridge-pack")
ROOT.mkdir(exist_ok=True)
URL="https://commons.wikimedia.org/wiki/Special:Redirect/file/Traffic_on_bridge_at_night.webm"
PAGE="https://commons.wikimedia.org/wiki/File:Traffic_on_bridge_at_night.webm"
LICENSE="https://creativecommons.org/licenses/by/3.0/"
def run(cmd,timeout=90):
 p=subprocess.run(cmd,text=True,capture_output=True,timeout=timeout)
 if p.returncode:
  raise RuntimeError(f"command failed {cmd[0]} rc={p.returncode} stderr={p.stderr[-1000:]}")
 return p.stdout
def sha(path):
 with path.open("rb") as f: return hashlib.file_digest(f,"sha256").hexdigest()
def fetch():
 dest=ROOT/"source.webm"
 for i in range(3):
  try:
   req=urllib.request.Request(URL,headers={"User-Agent":"YUNEXMediaResearch/1.0 (https://github.com/YunRah2103/Remotion-gpt-chat)","Accept":"video/webm,*/*"})
   with urllib.request.urlopen(req,timeout=45) as resp, dest.open("wb") as f:
    while data:=resp.read(1024*1024):f.write(data)
   if dest.stat().st_size < 2_000_000:raise ValueError("download unexpectedly short")
   return dest
  except (HTTPError,URLError,TimeoutError,ValueError) as e:
   print("DOWNLOAD_RETRY",i+1,repr(e),flush=True)
   if i==2:raise
   time.sleep(3*(i+1))
src=fetch()
meta=json.loads(run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate","-of","json",str(src)]))
videos=[s for s in meta["streams"] if s.get("codec_type")=="video"]
assert len(videos)>0 and videos[0]["width"]>=1920 and videos[0]["height"]>=1080, "Original not native 1080p"
assert float(meta["format"]["duration"])>=35, "Original truncated"
run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(src),"-f","null","-"],timeout=150)
report={"source_page":PAGE,"source_sha256":sha(src),"source_bytes":src.stat().st_size,
        "source_ffprobe":meta,"license":"CC BY 3.0 Unported, Commons review 3 Feb 2013",
        "license_url":LICENSE,"creator":"Editor","identity":"Generic traffic on bridge at night, NOT Audi RS6",
        "rights":"attribution required; allowed to adapt and redistribute under CC BY 3.0",
        "clips":[]}
for n,start in enumerate([5.0,17.0,29.0],1):
 clip=ROOT/f"c-bridge-night-{n:02d}.mp4"
 run(["ffmpeg","-nostdin","-hide_banner","-v","error","-y","-ss",str(start),"-i",str(src),
      "-t","2.0","-map","0:v:0","-an","-c:v","libx264","-preset","fast","-crf","18",
      "-pix_fmt","yuv420p","-movflags","+faststart",str(clip)],timeout=90)
 cm=json.loads(run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate","-of","json",str(clip)]))
 assert clip.stat().st_size>30000 and float(cm["format"]["duration"])>1.7
 run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(clip),"-f","null","-"],timeout=60)
 for k,t in enumerate([0.3,0.9,1.6],1):
  run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(clip),
       "-frames:v","1","-vf","scale=640:-2",str(ROOT/f"c-bridge-{n:02d}-frame-{k:02d}.jpg")],timeout=30)
 report["clips"].append({"filename":clip.name,"source_start_seconds":start,"duration":cm["format"]["duration"],
                          "sha256":sha(clip),"bytes":clip.stat().st_size,"ffprobe":cm,
                          "visual_content":"NOT YET HUMAN APPROVED; generic road texture only"})
 print("CLIP_DECODE_PASS",clip.name,clip.stat().st_size,flush=True)
(ROOT/"MANIFEST.json").write_text(json.dumps(report,indent=2))
(ROOT/"ATTRIBUTION.txt").write_text(
 "Title: Traffic on bridge at night\nCreator: Editor\nOriginal: "+PAGE+
 "\nLicense: Creative Commons Attribution 3.0 Unported ("+LICENSE+")\n"+
 "Changes: extracted three 2-second silent clips, re-encoded from original VP8 to H.264.\n"+
 "Scene: generic traffic on the Golden Gate Bridge; NOT Audi RS6.\n"+
 "No endorsement by the original author is implied.\n")
# Source retained only ephemerally; public artifact contains licensed excerpts, not 16MB original.
src.unlink()
print("SOURCE_FULL_DECODE_PASS",json.dumps({"sha256":report["source_sha256"],"clips":len(report["clips"])}),flush=True)
