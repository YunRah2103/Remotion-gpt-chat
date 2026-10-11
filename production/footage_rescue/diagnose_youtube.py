#!/usr/bin/env python3
"""Bounded real-video smoke test of YouTube methods. Does not claim success without media bytes."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import urllib.request

SOURCE = "https://www.youtube.com/watch?v=YE7VzlLtp-4"  # Big Buck Bunny, Blender Foundation CC-BY-3.0
CONTROL = "https://raw.githubusercontent.com/chintan9/Big-Buck-Bunny/master/BigBuckBunny480p30s.mp4"

def inspect(path: Path) -> dict:
    p = subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],
        capture_output=True,text=True,timeout=25,check=True)
    info=json.loads(p.stdout)
    video=[x for x in info.get("streams",[]) if x.get("codec_type")=="video"]
    if not video: raise RuntimeError("No decodable video stream")
    return {"bytes":path.stat().st_size,"width":video[0].get("width"),"height":video[0].get("height"),
            "duration":info.get("format",{}).get("duration"),"sha256":hashlib.sha256(path.read_bytes()).hexdigest()}

def run(method: str, out: Path):
    out.mkdir(parents=True, exist_ok=True)
    root=out/"source";root.mkdir(exist_ok=True)
    report={"method":method,"source":SOURCE if method!="direct-control" else CONTROL,"status":"FAILED"}
    commands = {
      "default": [sys.executable,"-m","yt_dlp"],
      "web_embedded": [sys.executable,"-m","yt_dlp","--extractor-args","youtube:player_client=web_embedded"],
      "android_vr": [sys.executable,"-m","yt_dlp","--extractor-args","youtube:player_client=android_vr"],
      "tv": [sys.executable,"-m","yt_dlp","--extractor-args","youtube:player_client=tv"],
      "web_safari": [sys.executable,"-m","yt_dlp","--extractor-args","youtube:player_client=web_safari"],
      "ios": [sys.executable,"-m","yt_dlp","--extractor-args","youtube:player_client=ios"],
      "impersonate": [sys.executable,"-m","yt_dlp","--impersonate","chrome"],
      "embedded_combined": [sys.executable,"-m","yt_dlp","--extractor-args","youtube:player_client=web_embedded,android_vr"],
      "nightly": [sys.executable,"-m","yt_dlp"],
    }
    if method in commands:
        cmd=commands[method]+["--ignore-config","--no-playlist","--no-progress","--retries","0",
           "--fragment-retries","0","--socket-timeout","15","--js-runtimes","deno","-f",
           "best[height<=240]/worst[height<=240]/worst",
           "--max-filesize","25M","-o",str(root/"test.%(ext)s"),SOURCE]
    elif method=="you-get":
        cmd=[sys.executable,"-m","you_get","--no-merge","--output-dir",str(root),SOURCE]
    elif method=="pytubefix":
        cmd=[sys.executable,"-c",
            "from pytubefix import YouTube; y=YouTube("+repr(SOURCE)+"); "
            "s=sorted((x for x in y.streams.filter(only_video=True) if x.resolution and int(x.resolution.rstrip('p'))<=360),"
            "key=lambda x:int(x.resolution.rstrip('p')));"
            "assert s,'No low-res stream';s[0].download(output_path="+repr(str(root))+",filename='pytubefix.mp4')"]
    elif method=="direct-control":
        cmd=["curl","-fsSL","--max-time","70","--max-filesize","25000000","-o",str(root/"control.mp4"),CONTROL]
    else:
        raise ValueError("Unknown strategy")
    report["argv"]=cmd[:5]+["[omitted]"]  # sanitized; full debug kept in local log
    try:
        proc=subprocess.run(cmd,stdin=subprocess.DEVNULL,text=True,capture_output=True,timeout=110)
        details=(proc.stdout+"\n"+proc.stderr)[-5000:]
        (out/"extractor.log").write_text(details,encoding="utf8")
        report["exitCode"]=proc.returncode
        candidates=sorted((f for f in root.rglob("*") if f.suffix.lower() in (".mp4",".mkv",".webm",".mov")
                            and f.is_file() and f.stat().st_size>1500),
                          key=lambda x:x.stat().st_size, reverse=True)
        report["candidateCount"]=len(candidates)
        if proc.returncode==0 and candidates:
            meta=inspect(candidates[0])
            report["media"]=meta
            # Inspect actual media bytes and generate a small playable preview to prove decoding.
            preview=out/"proof.mp4"
            render=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                                   "-i",str(candidates[0]),"-t","3","-an","-vf","scale=-2:180",
                                   "-c:v","libx264","-preset","ultrafast","-crf","30",str(preview)],
                                  capture_output=True,text=True,timeout=30)
            if render.returncode!=0 or not preview.exists() or preview.stat().st_size<1000:
                raise RuntimeError("FFmpeg proof failed: "+render.stderr[-300:])
            report["proofBytes"]=preview.stat().st_size
            report["status"]="PASS_REAL_VIDEO"
        else:
            report["reason"]=("Exit %s; "%proc.returncode)+details[-600:]
    except Exception as error:
        report["reason"]=str(error)[:600]
    finally:
        # Do not archive full movie to keep artifacts very small.
        for f in root.rglob("*"):
            if f.is_file():f.unlink()
        (out/"report.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf8")
    print(json.dumps(report,indent=2))
    return 0 if report["status"]=="PASS_REAL_VIDEO" else 2

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--method",required=True);p.add_argument("--out",required=True)
    a=p.parse_args();sys.exit(run(a.method,Path(a.out)))
