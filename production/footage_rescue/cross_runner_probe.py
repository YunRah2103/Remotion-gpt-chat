#!/usr/bin/env python3
"""Small CC-BY YouTube source test from different GitHub-hosted operating systems."""
import hashlib
import json
import pathlib
import platform
import subprocess
import sys
import imageio_ffmpeg

URL="https://www.youtube.com/watch?v=YE7VzlLtp-4"
out=pathlib.Path("out/cross-platform-youtube")
source=out/"source"
source.mkdir(parents=True,exist_ok=True)
report={"system":platform.platform(),"url":URL,"status":"FAILED"}
try:
    cmd=[sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-progress",
         "--retries","0","--fragment-retries","0","--socket-timeout","15",
         "--js-runtimes","deno","--max-filesize","30M",
         "-f","best[height<=240]/worst[height<=240]",
         "-o",str(source/"youtube.%(ext)s"),URL]
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=125)
    (out/"yt-dlp.log").write_text(p.stdout+"\n"+p.stderr)
    report["exitCode"]=p.returncode
    files=[x for x in source.iterdir() if x.is_file() and x.stat().st_size>1024 and x.suffix.lower() in (".mp4",".webm",".mkv")]
    report["candidateCount"]=len(files)
    if p.returncode!=0 or not files:raise RuntimeError("No video returned: "+p.stderr[-500:])
    f=files[0]
    report["sourceBytes"]=f.stat().st_size
    report["sha256"]=hashlib.sha256(f.read_bytes()).hexdigest()
    test=out/"proof.mp4"
    v=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),"-hide_banner","-loglevel","error","-y",
           "-i",str(f),"-t","2","-an","-vf","scale=-2:180","-c:v","libx264",
           "-preset","ultrafast","-crf","32",str(test)],
           capture_output=True,text=True,timeout=40)
    if v.returncode!=0 or not test.is_file() or test.stat().st_size<1024:
        raise RuntimeError("Decoded proof failed "+v.stderr[-400:])
    report["decodeProofBytes"]=test.stat().st_size
    report["status"]="PASS_REAL_YOUTUBE_VIDEO"
except Exception as exc:
    report["reason"]=str(exc)[:900]
finally:
    for f in source.glob("*"):
        if f.is_file():f.unlink()
    (out/"proof.mp4").unlink(missing_ok=True)
    out.mkdir(parents=True,exist_ok=True)
    (out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2))
sys.exit(0 if report["status"]=="PASS_REAL_YOUTUBE_VIDEO" else 2)
