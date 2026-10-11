#!/usr/bin/env python3
"""Bounded, unauthenticated social video downloader diagnostic. Do not publish copied media."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request

SOURCES = {
    # User-reported public example URLs from open-source extractor bug reports.
    "instagram": "https://www.instagram.com/reel/DZdOSuOyu2E/",
    "tiktok": "https://www.tiktok.com/@emaanch30/video/7676146052470230294",
}
def main(site, method, output):
    folder = Path(output)
    folder.mkdir(parents=True, exist_ok=True)
    stash = folder / "temporary_media"
    stash.mkdir(exist_ok=True)
    url = SOURCES[site]
    report = {"platform": site, "method": method, "url": url,
              "status": "NO_VERIFIED_VIDEO", "rights": "Diagnostic only: media never published"}
    if method == "yt-dlp":
        cmd = [sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist", "--no-progress",
               "--retries", "0", "--fragment-retries", "0", "--socket-timeout", "15",
               "--max-filesize", "20M", "--format", "b[height<=480]/worst",
               "--output", str(stash / "test.%(ext)s"), url]
    elif method == "yt-dlp-chrome":
        cmd = [sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist", "--no-progress",
               "--impersonate", "chrome", "--retries", "0", "--fragment-retries", "0",
               "--socket-timeout", "15", "--max-filesize", "20M",
               "--format", "b[height<=480]/worst", "--output", str(stash / "test.%(ext)s"), url]
    elif method == "gallery-dl":
        cmd = [sys.executable, "-m", "gallery_dl", "--no-mtime", "--directory", str(stash),
               "--option", "extractor.*.videos=true", url]
    elif method == "page-http":
        cmd = ["curl", "-IL", "--max-time", "15", url]
    else:
        raise ValueError("Unsupported strategy")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=80)
        logs = (result.stdout + "\n" + result.stderr)[-5500:]
        (folder / "extractor.log").write_text(logs, encoding="utf8")
        report["exitCode"] = result.returncode
        if method == "page-http":
            report["status"] = "HTTP_ACCESSIBLE_NOT_VIDEO" if result.returncode == 0 else "HTTP_ERROR"
        else:
            files = [p for p in stash.rglob("*")
                     if p.is_file() and p.suffix.lower() in {".mp4",".mov",".mkv",".webm"} and p.stat().st_size > 2048]
            report["candidateVideoFiles"] = len(files)
            for p in sorted(files,key=lambda f:f.stat().st_size,reverse=True):
                try:
                    q = subprocess.run(["ffprobe","-v","error","-show_streams","-show_format",
                                        "-of","json",str(p)],capture_output=True,text=True,
                                       timeout=20,check=True)
                    info = json.loads(q.stdout)
                    vs = [s for s in info.get("streams", []) if s.get("codec_type") == "video"]
                    if not vs:
                        continue
                    # Decode a genuine 2-second segment, then delete source and segment.
                    seg = folder / "temporary_decode.mp4"
                    v = subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(p),
                                        "-t","2","-an","-vf","scale=-2:180",
                                        "-c:v","libx264","-preset","ultrafast","-crf","32",str(seg)],
                                       capture_output=True,text=True,timeout=30)
                    if v.returncode != 0 or not seg.exists() or seg.stat().st_size <= 1500:
                        continue
                    report["media"] = {"bytes":p.stat().st_size,
                                       "width":vs[0].get("width"),"height":vs[0].get("height"),
                                       "duration":info.get("format",{}).get("duration"),
                                       "sha256":hashlib.sha256(p.read_bytes()).hexdigest(),
                                       "decodedTwoSeconds":True}
                    report["status"] = "PASS_VERIFIED_VIDEO"
                    break
                except Exception as ex:
                    report["probeError"] = str(ex)[:400]
        if report["status"] not in ("PASS_VERIFIED_VIDEO", "HTTP_ACCESSIBLE_NOT_VIDEO"):
            report["reason"] = logs[-750:]
    except Exception as ex:
        report["exception"] = str(ex)[:600]
    finally:
        shutil.rmtree(stash, ignore_errors=True)
        (folder / "temporary_decode.mp4").unlink(missing_ok=True)
        (folder / "report.json").write_text(json.dumps(report, indent=2) + "\n",encoding="utf8")
    print(json.dumps(report,indent=2))
    return 0 if report["status"] in ("PASS_VERIFIED_VIDEO","HTTP_ACCESSIBLE_NOT_VIDEO") else 2

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--site",choices=["instagram","tiktok"],required=True)
    p.add_argument("--method",choices=["yt-dlp","yt-dlp-chrome","gallery-dl","page-http"],required=True)
    p.add_argument("--out",required=True)
    a=p.parse_args()
    sys.exit(main(a.site,a.method,a.out))
