#!/usr/bin/env python3
"""Additional public-social-video smoke tests, real-media proof, no retained original files."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

SAMPLES = {
    "facebook": "https://www.facebook.com/reel/1283403743160634",
    "facebook2": "https://www.facebook.com/reel/2144727042986550",
    "twitter": "https://twitter.com/OPP_HSD/status/779210622571536384",
    "twitter2": "https://twitter.com/BrooklynNets/status/1349794411333394432",
    "twitter3": "https://twitter.com/CTVJLaidlaw/status/1600649710662213632/video/1",
    "reddit": "https://www.reddit.com/r/IdiotsInCars/comments/1x1j99a/almost_got_a_new_truck_yesterday_oc/",
    "snapchat": "https://www.snapchat.com/%40porschefromsam/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYZ2V2bGR2bnhpAaBGQ9RvAaBEhtm2AAAAAw",
    "pinterest": "https://uk.pinterest.com/pin/1084804629000125920/",
    "twitch": "https://www.twitch.tv/xqc/clip/CulturedAmazingKuduDatSheffy-TiZ_-ixAGYR3y2Uy",
    "bluesky": "https://bsky.app/profile/bsky.app/post/3l3vgf77uco2g",
}
p=argparse.ArgumentParser()
p.add_argument("--sample",choices=SAMPLES.keys(),required=True)
p.add_argument("--mode",choices=("yt-dlp","chrome"),required=True)
p.add_argument("--out",required=True)
a=p.parse_args()
out=Path(a.out)
tmp=out/"originals";tmp.mkdir(parents=True,exist_ok=True)
report={"platform":a.sample,"method":a.mode,"url":SAMPLES[a.sample],"status":"FAILED"}
base=[sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-progress",
      "--socket-timeout","14","--retries","0","--fragment-retries","0","--max-filesize","30M"]
if a.mode=="chrome":base+=["--impersonate","chrome"]
# Limit traffic by downloading the first 3 seconds; only actual playable bytes count.
cmd=base+["--download-sections","*0-3","-f","best[height<=720]/worst",
          "-o",str(tmp/"clip.%(ext)s"),SAMPLES[a.sample]]
try:
    result=subprocess.run(cmd,text=True,capture_output=True,timeout=110,stdin=subprocess.DEVNULL)
    log=(result.stdout+"\n"+result.stderr)[-7000:]
    (out/"extractor.log").write_text(log)
    report["exitCode"]=result.returncode
    files=sorted((f for f in tmp.rglob("*") if f.suffix.lower() in
                 (".mp4",".webm",".mkv",".mov") and f.is_file() and f.stat().st_size>2048),
                 key=lambda f:f.stat().st_size,reverse=True)
    report["candidateCount"]=len(files)
    if result.returncode!=0 or not files:raise RuntimeError("No successful source download; "+log[-900:])
    f=files[0]
    probe=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],
                         capture_output=True,text=True,check=True,timeout=20)
    dat=json.loads(probe.stdout)
    videos=[s for s in dat.get("streams",[]) if s.get("codec_type")=="video"]
    if not videos:raise RuntimeError("No video codec to decode")
    dec=subprocess.run(["ffmpeg","-hide_banner","-v","error","-xerror","-i",str(f),"-t","2",
                        "-map","0:v:0","-f","null","-"],capture_output=True,text=True,timeout=35)
    if dec.returncode:raise RuntimeError("FFmpeg real video decode failed: "+dec.stderr[-550:])
    report.update(status="PASS_REAL_VIDEO",media={"bytes":f.stat().st_size,"width":videos[0].get("width"),
             "height":videos[0].get("height"),"fps":videos[0].get("avg_frame_rate"),
             "source_sha256":hashlib.sha256(f.read_bytes()).hexdigest(),
             "decodeTwoSeconds":True})
except Exception as e:
    report["reason"]=str(e)[-1000:]
finally:
    shutil.rmtree(tmp,ignore_errors=True)
    out.mkdir(parents=True,exist_ok=True)
    (out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2))
sys.exit(0 if report["status"]=="PASS_REAL_VIDEO" else 2)
