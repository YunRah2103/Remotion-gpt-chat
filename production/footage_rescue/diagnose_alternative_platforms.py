#!/usr/bin/env python3
"""Probe creator-posted Blender CC BY footage on other platforms with live bounded media QA."""
import argparse
from pathlib import Path
import subprocess
import json
import sys
import shutil

SITES={
 "vimeo":"https://vimeo.com/1084537", # Official Blender, Big Buck Bunny
 "dailymotion":"https://www.dailymotion.com/video/x6nqmd", # CC BY film, reupload
 "peertube":"https://video.blender.org/videos/watch/bf1f3fb5-b119-4f9f-9930-8e20e892b898", # Blender's video instance
}
p=argparse.ArgumentParser()
p.add_argument("--site",choices=SITES.keys(),required=True)
args=p.parse_args()
site,url=args.site,SITES[args.site]
out=Path("out/multisite")/site
raw=out/"temp";raw.mkdir(parents=True,exist_ok=True)
report={"site":site,"url":url,"status":"FAILED"}
base=[sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-progress",
      "--retries","0","--socket-timeout","15","--js-runtimes","deno"]
try:
    formats=subprocess.run(base+["--list-formats",url],capture_output=True,text=True,timeout=70)
    (out/"formats.log").write_text((formats.stdout+"\n"+formats.stderr)[-18000:])
    report["formatExitCode"]=formats.returncode
    report["formatHighlights"]=[x for x in formats.stdout.splitlines() if "1080" in x or "2160" in x][:10]
    # Download at most 5s of 240p source to keep bandwidth/time bounded.
    dl=subprocess.run(base+["--download-sections","*0-5","-f","best[height<=480]/worst",
                            "--max-filesize","25M","-o",str(raw/"video.%(ext)s"),url],
                            capture_output=True,text=True,timeout=125)
    (out/"download.log").write_text((dl.stdout+"\n"+dl.stderr)[-9000:])
    report["downloadExitCode"]=dl.returncode
    files=[f for f in raw.iterdir() if f.suffix.lower() in (".mp4",".webm",".mkv") and f.stat().st_size>2048]
    report["candidateCount"]=len(files)
    if dl.returncode or not files:raise RuntimeError("No playable media in download")
    f=files[0]
    probe=subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)],
                         capture_output=True,text=True,check=True,timeout=20)
    info=json.loads(probe.stdout)
    streams=[s for s in info["streams"] if s["codec_type"]=="video"]
    if not streams:raise RuntimeError("No native video stream")
    # Native 2-second decode rather than trusting extension or successful HTTP response.
    decoded=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-i",str(f),"-t","2","-f","null","-"],
                           capture_output=True,text=True,timeout=30)
    if decoded.returncode:raise RuntimeError("Failed full 2 second decode: "+decoded.stderr[-400:])
    report.update({"status":"PASS_REAL_VIDEO","bytes":f.stat().st_size,
         "width":streams[0].get("width"),"height":streams[0].get("height"),
         "duration":info.get("format",{}).get("duration")})
except Exception as exc:
    report["failure"]=str(exc)[:500]
finally:
    shutil.rmtree(raw,ignore_errors=True)
    (out/"result.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2))
sys.exit(0 if report["status"]=="PASS_REAL_VIDEO" else 2)
