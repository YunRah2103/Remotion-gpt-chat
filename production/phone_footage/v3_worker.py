#!/usr/bin/env python3
"""YUNEX production mobile footage worker V3.
Only owner-created GitHub jobs for independently reviewed sources are accepted.
Downloads are temporary; verified MP4 + machine-readable manifest are GitHub assets.
"""
import argparse
import fcntl
import hashlib
import signal
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

REPO = "YunRah2103/Remotion-gpt-chat"
OWNER = "YunRah2103"
TITLE_PREFIX = "[YUNEX PHONE JOB]"
MARKER = "YUNEX_PHONE_JOB_V3"
TEST_VIDEO = "https://www.youtube.com/watch?v=YE7VzlLtp-4"
CAR_VIDEO = "https://www.youtube.com/watch?v=DqiKOr1aS9w"
def load_approved_sources(path=None):
    """Only reviewed registry entries, never issue-body claims, confer source approval."""
    registry = path or Path(__file__).with_name("sources_v3.json")
    records = json.loads(Path(registry).read_text(encoding="utf-8"))
    if not isinstance(records, dict) or not records:
        raise RuntimeError("Empty or invalid approved source registry")
    for url, item in records.items():
        parsed = urllib.parse.urlsplit(url)
        if (parsed.scheme != "https" or parsed.hostname not in
                {"www.youtube.com", "youtube.com"} or parsed.path != "/watch"
                or not urllib.parse.parse_qs(parsed.query).get("v")):
            raise RuntimeError("Source registry contains noncanonical YouTube URL")
        if (not isinstance(item, dict) or item.get("license") not in ("CC0-1.0", "CC-BY-3.0", "CC-BY-4.0") or item.get("approved") is not True or item.get("reviewed_by") != OWNER
                or item.get("max_height") not in (720, 1080)
                or not all(item.get(k) for k in ("title", "author", "source",
                                                "license_reference"))
                or item["source"] != url):
            raise RuntimeError("Source registry is missing verified approval metadata")
    return records


LICENSED_PROOFS = load_approved_sources()

def refresh_sources():
    """Refresh reviewed source records from our GitHub branch; never execute remote code.

    A network failure preserves the last reviewed catalog on the phone.
    New sources still need an authorised, rights-checked registry commit.
    """
    global LICENSED_PROOFS
    remote = ("https://raw.githubusercontent.com/" + REPO
              + "/experiments/s25-footage-worker-v3-20261012/"
              + "production/phone_footage/sources_v3.json")
    destination = Path(__file__).with_name("sources_v3.json")
    temporary = destination.with_name(".sources_v3.download")
    try:
        req = urllib.request.Request(remote, headers={"User-Agent": "yunex-v3-catalog"})
        with urllib.request.urlopen(req, timeout=12) as response:
            data = response.read(128 * 1024 + 1)
        if len(data) > 128 * 1024:
            raise RuntimeError("Remote registry too large")
        temporary.write_bytes(data)
        updated = load_approved_sources(temporary)
        if data != destination.read_bytes():
            os.replace(temporary, destination)
            print(f"Updated approved source catalog ({len(updated)} entries)", flush=True)
        else:
            temporary.unlink(missing_ok=True)
        LICENSED_PROOFS = updated
        return True
    except Exception as exc:
        temporary.unlink(missing_ok=True)
        print("Catalog refresh unavailable; using existing reviewed sources: "
              + str(exc)[:100], flush=True)
        return False




DONE, FAILED = "YUNEX_PHONE_DONE_V3", "YUNEX_PHONE_FAILED_V3"
MAX_BYTES = 80 * 1024 * 1024
MAX_WORKSPACE_BYTES = 350 * 1024 * 1024
MIN_FREE_BYTES = 700 * 1024 * 1024
TEMP_ROOT = Path.home() / ".cache" / "yunex-v3-temp"


def api(method, path, token, payload=None, binary=None, content_type="application/json"):
    host = "https://uploads.github.com" if path.startswith("/UPLOAD/") else "https://api.github.com"
    if path.startswith("/UPLOAD/"):
        path = path[len("/UPLOAD"):]
    headers = {
        "Accept": "application/vnd.github+json", "Authorization": "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "yunex-s25-proof",
    }
    data = None
    if binary is not None:
        data = binary
        headers["Content-Type"] = content_type
    elif payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(host + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=80 if binary is not None else 25) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        raise RuntimeError(f"GitHub HTTP {err.code} on {method} {path.split('?')[0]}") from None


def issue_jobs(token):
    query = urllib.parse.urlencode({"state":"open", "sort":"created", "direction":"desc","per_page":"100"})
    items = api("GET", f"/repos/{REPO}/issues?{query}", token)
    return [i for i in items if i.get("title","").startswith(TITLE_PREFIX)
            and i.get("user",{}).get("login","").casefold() == OWNER.casefold()
            and "pull_request" not in i]


def parse_job(issue):
    """Strict, capped production job. Unreviewed issue URLs cannot authorize media."""
    body = issue.get("body") or ""
    if not body.startswith(MARKER + "\n") or len(body) > 4000:
        return None
    try:
        job = json.loads(body[len(MARKER)+1:].strip())
    except (ValueError, TypeError):
        return None
    if not isinstance(job, dict) or set(job) - {"url", "start", "duration", "height", "max_mb", "orientation"}:
        return None
    entry = LICENSED_PROOFS.get(job.get("url"))
    if not entry:
        return None
    start = job.get("start", 0)
    duration = job.get("duration", 6)
    height = job.get("height", 1080)
    max_mb = job.get("max_mb", 45)
    orientation = job.get("orientation", "landscape")
    if (type(start) not in (float, int) or type(duration) not in (float, int)
            or type(height) is not int or type(max_mb) is not int
            or not 0 <= start <= 3600 or not 2 <= duration <= 40
            or start + duration > 3640 or height not in (720, 1080)
            or height > entry["max_height"] or not 5 <= max_mb <= 80
            or orientation not in ("landscape", "portrait")):
        return None
    return {"url": job["url"], "start": float(start), "duration": float(duration),
            "height": height, "max_mb": max_mb, "orientation": orientation}

def already_reported(token, number):
    comments = api("GET",f"/repos/{REPO}/issues/{number}/comments?per_page=100",token)
    return any((c.get("body") or "").startswith((DONE,FAILED)) and
               c.get("user",{}).get("login","").casefold()==OWNER.casefold()
               for c in comments)


def issue_comment(token, number, message):
    api("POST",f"/repos/{REPO}/issues/{number}/comments",token,{"body":message})


def checked(cmd, timeout):
    try:
        p=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout)
    except subprocess.TimeoutExpired:
        raise RuntimeError("Command timed out") from None
    if p.returncode != 0:
        raise RuntimeError(f"{Path(cmd[0]).name} exit {p.returncode}; inspect local phone output")
    return p.stdout


def watched(command, timeout, folder):
    """Monitor temporary disk footprint; kill ffmpeg child processes on timeout."""
    log = folder / "process.log"
    with log.open("wb") as handle:
        proc = subprocess.Popen(command, stdout=handle, stderr=subprocess.STDOUT,
                                start_new_session=True)
        beginning = time.monotonic()
        try:
            while proc.poll() is None:
                footprint = sum(p.stat().st_size for p in folder.rglob("*") if p.is_file())
                if footprint > MAX_WORKSPACE_BYTES:
                    raise RuntimeError("Temporary media disk budget exceeded")
                if shutil.disk_usage(folder).free < 220 * 1024 * 1024:
                    raise RuntimeError("Phone free-space reserve reached")
                if time.monotonic() - beginning > timeout:
                    raise RuntimeError("Download or transcode timed out")
                time.sleep(1)
        except BaseException:
            if proc.poll() is None:
                os.killpg(proc.pid, signal.SIGTERM)
                try:
                    proc.wait(timeout=4)
                except subprocess.TimeoutExpired:
                    os.killpg(proc.pid, signal.SIGKILL)
                    proc.wait(timeout=4)
            raise
        if proc.returncode:
            raise RuntimeError(f"{Path(command[0]).name} exited {proc.returncode}: "
                               + log.read_text(errors="replace")[-300:])


def cleanup_stale():
    """Only our V3 temporary folders older than 24h. Never delete personal media."""
    TEMP_ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    count = 0
    for path in TEMP_ROOT.iterdir():
        if (path.name.startswith("yunex-v3-") and path.is_dir()
                and not path.is_symlink()
                and time.time() - path.stat().st_mtime > 86400):
            shutil.rmtree(path)
            count += 1
    return count


def download_proof(folder, job=None):
    if not all(shutil.which(x) for x in ("node", "ffmpeg", "ffprobe")):
        raise RuntimeError("Termux requires nodejs and ffmpeg")
    job = job or {"url": TEST_VIDEO, "start": 0.0, "duration": 6.0, "height": 720,
                  "max_mb": 45}
    if shutil.disk_usage(folder).free < MIN_FREE_BYTES:
        raise RuntimeError("At least 700 MiB of free phone storage required")
    start, duration, height = job["start"], job["duration"], job["height"]
    orientation = job.get("orientation", "landscape")
    segment = f"*{start:g}-{start + duration:g}"
    fmt = (f"bv*[width<={height}][height<={height*16//9}]+ba/b[width<={height}][height<={height*16//9}]/b"
           if orientation == "portrait" else
           f"bv*[height<={height}]+ba/b[height<={height}]/b")
    command = [sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist",
               "--no-progress", "--js-runtimes", "node", "--socket-timeout", "25",
               "--retries", "2", "--fragment-retries", "2", "--concurrent-fragments", "1",
               "--download-sections", segment, "--force-keyframes-at-cuts",
               "--merge-output-format", "mp4",
               "-f", fmt,
               "--max-filesize", "240M", "-o", str(folder/"source.%(ext)s"), job["url"]]
    watched(command, 540, folder)
    candidates = sorted((p for p in folder.iterdir() if p.is_file()
                         and p.name.startswith("source.")
                         and p.suffix.lower() in {".mp4", ".mkv", ".webm", ".mov"}),
                        key=lambda p: p.stat().st_size, reverse=True)
    if not candidates:
        raise RuntimeError("yt-dlp did not create a movie file")
    source_probe = json.loads(checked(["ffprobe", "-v", "error", "-show_streams",
                                       "-of", "json", str(candidates[0])], 25))
    source_video = next((x for x in source_probe.get("streams", [])
                         if x.get("codec_type") == "video"), None)
    source_short = (source_video or {}).get("width" if orientation == "portrait" else "height", 0)
    if (not source_video or (height == 1080 and source_short < 1080)
            or (orientation == "portrait" and source_video.get("width", 0) >= source_video.get("height", 0))):
        raise RuntimeError("Source lacks genuine 1080p frames")
    result = folder / "verified-phone-v3.mp4"
    watched(["ffmpeg", "-y", "-v", "error", "-i", str(candidates[0]),
             "-t", str(duration), "-map", "0:v:0", "-map", "0:a:0?",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
             "-pix_fmt", "yuv420p", "-threads", "3", "-c:a", "aac",
             "-b:a", "160k", "-movflags", "+faststart", str(result)], 540, folder)
    size = result.stat().st_size if result.is_file() else 0
    if not 4096 < size <= min(MAX_BYTES, job["max_mb"] * 1024 * 1024):
        raise RuntimeError("Output absent or exceeds approved size budget")
    video_probe = json.loads(checked(["ffprobe", "-v", "error", "-show_format",
                                      "-show_streams", "-of", "json", str(result)], 25))
    video = next((x for x in video_probe.get("streams", [])
                  if x.get("codec_type") == "video"), None)
    seconds = float(video_probe.get("format", {}).get("duration") or 0)
    short = (video or {}).get("width" if orientation == "portrait" else "height", 0)
    long = (video or {}).get("height" if orientation == "portrait" else "width", 0)
    if (not video or video.get("codec_name") != "h264"
            or short > height or (height == 1080 and short != 1080)
            or short < 320 or long < 320
            or (orientation == "portrait" and video.get("width", 0) >= video.get("height", 0))
            or not max(1.5, duration-1.2) <= seconds <= duration+2):
        raise RuntimeError("Decoded video codec, dimensions or duration invalid")
    checked(["ffmpeg", "-v", "error", "-xerror", "-i", str(result),
             "-map", "0:v:0", "-f", "null", "-"], 200)
    digest = hashlib.sha256()
    with result.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024*1024), b""):
            digest.update(chunk)
    return result, {"bytes": size, "width": video["width"], "height": video["height"],
                    "duration": round(seconds, 3), "codec": video["codec_name"],
                    "sha256": digest.hexdigest(), "requested_height": height,
                    "source_height": source_video["height"], "source_width": source_video["width"],
                    "orientation": orientation, "start": start,
                    "full_decode": "PASS"}

def upload_release(token, number, file, job=None, meta=None):
    """Publish binary plus machine-readable result that GitHub agents can ingest."""
    tag = f"yunex-phone-v3-{number}"
    entry = LICENSED_PROOFS[job["url"]]
    credit = (f"{entry['title']} by {entry['author']}\n"
              f"Source: {job['url']}\nLicense: {entry['license']}\n"
              f"Evidence: {entry['license_reference']}\n"
              f"Excerpt {job['start']}s for {job['duration']}s; H.264/AAC conversion.")
    release = api("POST", f"/repos/{REPO}/releases", token, {
        "tag_name": tag, "target_commitish": "main",
        "name": f"YUNEX S25 production footage #{number}",
        "draft": False, "prerelease": True, "body": credit})
    rid = release["id"]
    movie_name = f"yunex-v3-{number}.mp4"
    upload = "/UPLOAD/repos/" + REPO + f"/releases/{rid}/assets?name=" + urllib.parse.quote(movie_name)
    asset = api("POST", upload, token, binary=file.read_bytes(), content_type="video/mp4")
    manifest = {"schema": "YUNEX_PHONE_RESULT_V3", "status": "PASS",
                "issue": number, "source_url": job["url"], "license": entry["license"],
                "attribution": entry["author"], "license_evidence": entry["license_reference"],
                "requested_start": job["start"], "requested_duration": job["duration"],
                "requested_height": job["height"],
                "requested_orientation": job.get("orientation", "landscape"), **meta,
                "mp4_url": asset["browser_download_url"],
                "release_url": release["html_url"]}
    manifest_name = f"yunex-v3-{number}.json"
    manifest_upload = ("/UPLOAD/repos/" + REPO + f"/releases/{rid}/assets?name="
                       + urllib.parse.quote(manifest_name))
    report = api("POST", manifest_upload, token,
                 binary=(json.dumps(manifest, indent=2) + "\n").encode(),
                 content_type="application/json")
    manifest["manifest_url"] = report["browser_download_url"]
    return manifest

def previous_release_asset(token, number):
    """Do not re-upload a GitHub Release if an earlier phone run succeeded."""
    tag = f"yunex-phone-v3-{number}"
    try:
        release = api("GET", f"/repos/{REPO}/releases/tags/{tag}", token)
    except RuntimeError as exc:
        if "GitHub HTTP 404 on GET" in str(exc):
            return None
        raise
    assets = release.get("assets") or []
    if not assets:
        raise RuntimeError("Existing release has no asset; manual review needed")
    return assets[0].get("browser_download_url")


def run_once(token, dry_run=False):
    for issue in issue_jobs(token):
        job = parse_job(issue)
        if job is None:
            continue
        number = issue["number"]
        if already_reported(token, number):
            continue
        print(f"V3 approved issue #{number}: {job['height']}p, {job['duration']}s", flush=True)
        if dry_run:
            print("DRY RUN: no download or upload", flush=True)
            return True
        try:
            existing = previous_release_asset(token, number)
            if existing:
                issue_comment(token, number, FAILED +
                              "\n\nA previous release already exists; manual reconciliation required: "
                              + existing)
                print(f"SKIPPED #{number}: existing release", flush=True)
                return True
            cleanup_stale()
            with tempfile.TemporaryDirectory(prefix="yunex-v3-", dir=TEMP_ROOT) as tmp:
                movie, meta = download_proof(Path(tmp), job)
                report = upload_release(token, number, movie, job, meta)
            issue_comment(token, number, DONE + "\n\n~~~json\n"
                          + json.dumps(report, indent=2) + "\n~~~")
            print(f"PASS #{number} {meta['width']}x{meta['height']} "
                  f"{meta['bytes']} bytes\n{report['mp4_url']}", flush=True)
        except Exception as exc:
            detail = str(exc).replace("\n", " ")[:300]
            print(f"FAILED #{number}: {detail}", flush=True)
            issue_comment(token, number, FAILED + "\n\n" + detail)
        return True
    print("No pending approved V3 jobs", flush=True)
    return False

def read_token():
    token_file=Path(os.environ.get("YUNEX_GH_TOKEN_FILE",
                    str(Path.home()/".config/yunex/github-token")))
    if not token_file.is_file():
        raise RuntimeError("Create private token file ~/.config/yunex/github-token")
    return token_file.read_text().strip()


def main():
    p=argparse.ArgumentParser()
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument("--once",action="store_true")
    group.add_argument("--loop",action="store_true")
    group.add_argument("--doctor",action="store_true")
    group.add_argument("--clean",action="store_true")
    p.add_argument("--dry-run",action="store_true")
    args=p.parse_args()
    if args.doctor:
        print(json.dumps({"version":3,"approved_sources":len(LICENSED_PROOFS),
                          "node":bool(shutil.which("node")),
                          "ffmpeg":bool(shutil.which("ffmpeg")),
                          "ffprobe":bool(shutil.which("ffprobe")),
                          "free_mb":shutil.disk_usage(Path.home()).free//(1024*1024),
                          "token_file":(Path.home()/".config/yunex/github-token").is_file()},indent=2))
        return
    # Avoid two Termux shells both uploading the same issue at once.
    lock_path=Path.home()/".cache/yunex-phone-worker.lock"
    lock_path.parent.mkdir(parents=True,exist_ok=True)
    lock_handle=open(lock_path,"a+")
    try:
        fcntl.flock(lock_handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:
        print("Another YUNEX worker is already running on this phone",flush=True)
        return
    cleanup_stale()
    if args.clean:
        print("Removed stale V3 media workspaces; other videos untouched")
        return
    token=read_token()
    while True:
        try:
            refresh_sources()
            run_once(token,args.dry_run)
        except Exception as err:
            print("Worker error:",str(err)[:200],flush=True)
            if args.once:
                raise
        if args.once:
            return
        time.sleep(60)


if __name__=="__main__":
    main()
