#!/usr/bin/env python3
"""Test exact production extraction functions on public posts; do not redistribute media."""
import argparse, importlib.util, json, pathlib, shutil, sys

ROOT=pathlib.Path(__file__).parent
spec=importlib.util.spec_from_file_location("rescue",ROOT/"acquire.py")
rescue=importlib.util.module_from_spec(spec);spec.loader.exec_module(rescue)
POSTS={"instagram":"https://www.instagram.com/reel/DZdOSuOyu2E/",
       "tiktok":"https://www.tiktok.com/@emaanch30/video/7676146052470230294"}
ap=argparse.ArgumentParser()
ap.add_argument("--site",choices=POSTS.keys(),required=True)
ap.add_argument("--method",choices=["yt-dlp","yt-dlp-chrome"],required=True)
args=ap.parse_args()
out=pathlib.Path("out/production-equivalent")/args.site/args.method
scratch=out/"raw";scratch.mkdir(parents=True,exist_ok=True)
report={"site":args.site,"method":args.method,"url":POSTS[args.site],
        "status":"FAILED","productionCodePath":f"rescue.{ 'ytdlp_chrome' if args.method=='yt-dlp-chrome' else 'ytdlp'}"}
try:
    downloader=rescue.ytdlp_chrome if args.method=="yt-dlp-chrome" else rescue.ytdlp
    downloader(POSTS[args.site],scratch,30)
    movies=sorted([f for f in scratch.rglob("*") if f.suffix.lower() in rescue.EXTS and f.is_file()],
                  key=lambda x:x.stat().st_size,reverse=True)
    if not movies:raise RuntimeError("No actual media bytes")
    f=movies[0]
    meta,issues=rescue.examine(f,720,30,200)
    report["nativeMetadata"]=meta
    report["issues"]=issues
    if issues:raise RuntimeError("Source rejected by 720p minimum height and QA: "+str(issues))
    rescue.run(["ffmpeg","-v","error","-xerror","-i",str(f),"-map","0:v:0","-f","null","-"],timeout=180)
    report["status"]="PASS_REAL_DECODE"
except Exception as error:
    report["exception"]=str(error)[-900:]
finally:
    shutil.rmtree(scratch,ignore_errors=True)
    (out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2))
sys.exit(0 if report["status"]=="PASS_REAL_DECODE" else 2)
