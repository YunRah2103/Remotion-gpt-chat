#!/usr/bin/env python3
"""Download a single authorised social-video URL with independent engines and real QA."""
import argparse
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import urllib.request
from urllib.parse import urlsplit, parse_qs
import zipfile

EXTS = {".mp4", ".webm", ".mkv", ".mov", ".m4v"}
DOMAINS = {
    "youtube": ("youtube.com", "youtu.be"),
    "instagram": ("instagram.com",),
    "tiktok": ("tiktok.com",),
    "dailymotion": ("dailymotion.com", "dai.ly"),
}

def site_for(url):
    p = urlsplit(url)
    if p.scheme != "https" or not p.hostname or p.username or p.password or p.port not in (None, 443):
        raise ValueError("Expected a public HTTPS URL without embedded credentials")
    host, path = p.hostname.lower().rstrip("."), p.path.strip("/")
    for name, hosts in DOMAINS.items():
        if any(host == h or host.endswith("." + h) for h in hosts):
            parts = path.split("/")
            if name == "youtube":
                valid = (path == "watch" and len(parse_qs(p.query).get("v", [])) == 1
                         or len(parts) == 2 and parts[0] in ("shorts", "live")
                         or host.endswith("youtu.be") and len(parts) == 1 and bool(parts[0]))
            elif name == "instagram":
                valid = len(parts) == 2 and parts[0] in ("reel", "p", "tv")
            elif name == "tiktok":
                valid = host in ("vm.tiktok.com", "vt.tiktok.com") or (
                    len(parts) >= 3 and parts[0].startswith("@") and parts[1] == "video")
            else:
                valid = host.endswith("dai.ly") or path.startswith("video/")
            if not valid:
                raise ValueError("Use a single video/post URL, not a creator profile or playlist")
            return name
    raise ValueError("Unsupported video site")

def engines_for(site, engine, cobalt_available=False):
    choices = {
        "youtube": ["yt-dlp", "pytubefix", "cobalt"],
        "instagram": ["yt-dlp", "yt-dlp-chrome", "gallery-dl", "cobalt"],
        "tiktok": ["yt-dlp", "yt-dlp-chrome", "gallery-dl", "cobalt"],
        "dailymotion": ["yt-dlp", "cobalt"],
    }[site]
    if engine != "auto":
        if engine not in choices or engine == "cobalt" and not cobalt_available:
            raise ValueError("Selected engine unavailable for this platform/configuration")
        return [engine]
    return [x for x in choices if x != "cobalt" or cobalt_available]

def classify(message):
    m = message.lower()
    if any(k in m for k in ("429", "too many requests", "rate limit")):
        return "RATE_LIMITED"
    if any(k in m for k in ("403", "forbidden", "blocked your ip", "cloudflare")):
        return "REMOTE_ACCESS_DENIED"
    if any(k in m for k in ("sign in", "login", "private", "authentication")):
        return "AUTH_REQUIRED"
    if "drm" in m or "protected media" in m:
        return "PROTECTED_MEDIA"
    if any(k in m for k in ("unavailable", "not found", "unsupported url", "404")):
        return "SOURCE_UNAVAILABLE"
    if "timeout" in m or "timed out" in m:
        return "NETWORK_FAILURE"
    return "EXTRACTION_FAILED"

def run(cmd, timeout=1200):
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError((result.stderr or result.stdout or "Command failed")[-1000:])

def ytdlp(url, out, limit):
    run([sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist",
         "--no-progress", "--js-runtimes", "deno", "--format", "bv*+ba/b",
         "--merge-output-format", "mkv", "--max-filesize", str(limit)+"M",
         "--paths", str(out), "--output", "%(id)s.%(ext)s", url])

def ytdlp_chrome(url, out, limit):
    run([sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist",
         "--no-progress", "--impersonate", "chrome", "--js-runtimes", "deno",
         "--format", "bv*+ba/b", "--merge-output-format", "mkv",
         "--max-filesize", str(limit)+"M", "--paths", str(out),
         "--output", "%(id)s.%(ext)s", url])


def gallerydl(url, out, limit):
    run([sys.executable, "-m", "gallery_dl", "--directory", str(out), "--no-mtime", url])

def pytubefix(url, out, limit):
    from pytubefix import YouTube
    streams = [s for s in YouTube(url).streams.filter(only_video=True)
               if s.subtype == "mp4" and s.resolution]
    streams.sort(key=lambda s: int(s.resolution.rstrip("p")), reverse=True)
    if not streams:
        raise RuntimeError("No MP4 video streams")
    streams[0].download(output_path=str(out), filename="pytubefix_video.mp4",
                        skip_existing=False)

def public_host(url):
    p = urlsplit(url)
    if p.scheme != "https" or not p.hostname or p.username or p.password or p.port not in (None, 443):
        raise ValueError("Invalid HTTPS Cobalt instance/tunnel")
    host = p.hostname.lower().rstrip(".")
    if host in ("localhost", "cobalt.tools", "api.cobalt.tools"):
        raise ValueError("Use a self-hosted or authorised Cobalt instance")
    for entry in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM):
        if not ipaddress.ip_address(entry[4][0]).is_global:
            raise ValueError("Cobalt endpoint is not public")
    return host

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("Cobalt redirect denied; use direct instance tunnel")

def cobalt(url, out, limit):
    origin = os.environ.get("COBALT_API_URL", "").rstrip("/")
    host = public_host(origin)
    if urlsplit(origin).path not in ("", "/") or urlsplit(origin).query:
        raise ValueError("COBALT_API_URL must be only the HTTPS origin")
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if os.environ.get("COBALT_API_KEY"):
        headers["Authorization"] = "Api-Key " + os.environ["COBALT_API_KEY"]
    req = urllib.request.Request(origin+"/", method="POST", headers=headers,
        data=json.dumps({"url": url, "videoQuality": "max",
                         "localProcessing": "disabled"}).encode())
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(req, timeout=40) as response:
        answer = json.loads(response.read(1024*1024))
    if answer.get("status") != "tunnel":
        raise RuntimeError("Cobalt response: " + str(answer.get("status")))
    tunnel = answer.get("url", "")
    if public_host(tunnel) != host:
        raise ValueError("Cobalt tunnel must use same instance")
    with opener.open(tunnel, timeout=60) as response, (out/"cobalt.mp4").open("wb") as dest:
        total = 0
        while chunk := response.read(1024*1024):
            total += len(chunk)
            if total > limit * 1024*1024:
                raise RuntimeError("Cobalt file too large")
            dest.write(chunk)

def examine(path, minheight, limit, duration):
    from fractions import Fraction
    p = subprocess.run(["ffprobe", "-v", "error", "-show_streams",
                        "-show_format", "-of", "json", str(path)],
                       capture_output=True, text=True, check=True, timeout=45)
    data = json.loads(p.stdout)
    video = [s for s in data["streams"] if s["codec_type"] == "video"]
    if len(video) != 1:
        raise ValueError("Expected single video stream")
    v = video[0]
    width, height = int(v["width"]), int(v["height"])
    fps = float(Fraction(v.get("avg_frame_rate") or v.get("r_frame_rate") or "0/1"))
    seconds = float(data.get("format", {}).get("duration") or 0)
    meta = {"width": width, "height": height, "fps": round(fps, 3),
            "durationSeconds": seconds, "videoCodec": v.get("codec_name"),
            "audioPresent": any(s["codec_type"] == "audio" for s in data["streams"]),
            "sizeBytes": path.stat().st_size,
            "nativeVertical1080CropPossible": width >= 1080 and height >= 1920}
    issues = []
    if height < minheight: issues.append("LOW_RESOLUTION")
    if fps < 23: issues.append("LOW_FPS")
    if not 0 < seconds <= duration: issues.append("INVALID_DURATION")
    if path.stat().st_size > limit * 1024*1024: issues.append("TOO_LARGE")
    return meta, issues

def archive(out):
    z = out/"footage-rescue.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as writer:
        for path in out.iterdir():
            if path.is_file() and path != z:
                writer.write(path, path.name)

def acquire(url, out, engine="auto", minheight=1080, limit=600,
            duration=1200, rights_confirmed=False):
    if not rights_confirmed:
        raise ValueError("Confirm you have rights or permission to use footage")
    if not 360 <= minheight <= 4320 or not 1 <= limit <= 1500 or not 1 <= duration <= 21600:
        raise ValueError("Invalid acquisition limits")
    site = site_for(url)
    plan = engines_for(site, engine, bool(os.environ.get("COBALT_API_URL")))
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "FAILED", "source": url, "site": site,
              "enginePlan": plan, "attempts": []}
    runners = {"yt-dlp": ytdlp, "yt-dlp-chrome": ytdlp_chrome, "gallery-dl": gallerydl,
               "pytubefix": pytubefix, "cobalt": cobalt}
    try:
        for index, name in enumerate(plan):
            folder = out/("attempt-%s-%s" % (index+1, name))
            folder.mkdir(exist_ok=True)
            attempt = {"engine": name, "status": "FAILED"}
            try:
                runners[name](url, folder, limit)
                files = sorted((p for p in folder.rglob("*")
                                if p.is_file() and p.suffix.lower() in EXTS),
                               key=lambda p: p.stat().st_size, reverse=True)
                if not files:
                    raise RuntimeError("No video bytes were downloaded")
                for candidate in files:
                    meta, issues = examine(candidate, minheight, limit, duration)
                    if issues:
                        attempt = {"engine": name, "status": "REJECTED_QUALITY",
                                   "issues": issues, "qa": meta}
                        continue
                    run(["ffmpeg", "-v", "error", "-xerror", "-i", str(candidate),
                         "-map", "0:v:0", "-f", "null", "-"], timeout=600)
                    final = out/("source"+candidate.suffix.lower())
                    shutil.copy2(candidate, final)
                    digest = hashlib.sha256()
                    with final.open("rb") as source:
                        for block in iter(lambda: source.read(1024*1024), b""):
                            digest.update(block)
                    attempt = {"engine": name, "status": "PASS", "qa": meta}
                    report.update({"status": "PASS", "selectedEngine": name,
                                   "sourceFile": final.name, "sha256": digest.hexdigest(),
                                   "qa": meta, "verticalCropWarning":
                                   not meta["nativeVertical1080CropPossible"]})
                    for i, factor in enumerate((.12, .5, .87), 1):
                        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error",
                            "-y", "-ss", str(round(meta["durationSeconds"]*factor, 2)),
                            "-i", str(final), "-frames:v", "1", "-vf", "scale=640:-2",
                            str(out/("preview_%s.jpg" % i))],
                            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=45,
                            check=True)
                    break
                if report["status"] == "PASS":
                    report["attempts"].append(attempt)
                    break
            except Exception as exc:
                attempt = {"engine": name, "status": "FAILED",
                           "reasonCode": classify(str(exc))}
            report["attempts"].append(attempt)
        if report["status"] != "PASS":
            report["reasonCode"] = ("SOURCE_BLOCKED_OR_UNAVAILABLE"
                if any(a.get("reasonCode") in ("REMOTE_ACCESS_DENIED", "AUTH_REQUIRED", "RATE_LIMITED")
                       for a in report["attempts"]) else "NO_SOURCE_MEETING_QUALITY")
    finally:
        (out/"manifest.json").write_text(json.dumps(report, indent=2)+"\n")
        archive(out)
    return report

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--url", required=True)
    p.add_argument("--output", default="out/footage-rescue")
    p.add_argument("--engine", choices=["auto", "yt-dlp", "yt-dlp-chrome", "gallery-dl", "pytubefix", "cobalt"], default="auto")
    p.add_argument("--min-height", type=int, default=1080)
    p.add_argument("--max-mb", type=int, default=600)
    p.add_argument("--max-duration", type=int, default=1200)
    p.add_argument("--rights-confirmed", action="store_true")
    args = p.parse_args()
    try:
        r = acquire(args.url, Path(args.output), args.engine, args.min_height,
                    args.max_mb, args.max_duration, args.rights_confirmed)
        print(json.dumps({"status": r["status"], "attempts": r["attempts"]}, indent=2))
        return 0 if r["status"] == "PASS" else 2
    except (ValueError, OSError) as exc:
        print("FOOTAGE_RESCUE_CONFIG_ERROR: " + str(exc), file=sys.stderr)
        return 2

if __name__ == "__main__":
    sys.exit(main())
