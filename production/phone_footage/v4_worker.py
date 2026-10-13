#!/usr/bin/env python3
"""YUNEX production mobile footage worker V4 (600-second ceiling).
Owner-created GitHub jobs may request any canonical YouTube watch URL.
Known licensed sources may publish; unknown-rights media stays in owner-only draft Releases.
"""
import argparse
import fcntl
import hashlib
import http.client
import math
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
MARKER = "YUNEX_PHONE_JOB_V4"
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
              + "/experiments/s25-footage-worker-v4-10min-20261012/"
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




DONE, FAILED = "YUNEX_PHONE_DONE_V4", "YUNEX_PHONE_FAILED_V4"
MIB = 1024 * 1024
MAX_SECONDS = 600
MAX_OUTPUT_MB = 512            # Unchanged legacy 720p/1080p and audio cap.
MAX_OUTPUT_MB_4K = 1536        # Separate explicit 4K budget: 1.5 GiB per job.
MAX_BYTES = MAX_OUTPUT_MB_4K * MIB
MAX_WORKSPACE_BYTES = 8192 * MIB  # 4K can temporarily need multiple GiB.
TEMP_ROOT = Path.home() / ".cache" / "yunex-v4-temp"
COMPLETION_CACHE = Path.home() / ".cache" / "yunex-v4-completed.json"
PENDING_REPORTS = Path.home() / ".cache" / "yunex-v4-pending"
DEFAULT_POLL_SECONDS = 120
CATALOG_REFRESH_SECONDS = 1800
_LAST_IDLE_LOG = 0.0


def default_output_mb(duration, height=1080):
    """4K defaults favour source-quality preservation; 1080p stays unchanged."""
    if height == 2160:
        return min(MAX_OUTPUT_MB_4K, max(180, math.ceil(duration * 9.0)))
    return min(MAX_OUTPUT_MB, max(45, math.ceil(duration * 0.85)))


def workspace_limit(job):
    """4K source + native remux may require much more space than the result."""
    if job.get("media") != "audio" and job.get("height") == 2160:
        return min(MAX_WORKSPACE_BYTES,
                   max(1024 * MIB, (job["max_mb"] * 4 + 512) * MIB))
    return min(2300 * MIB, max(350 * MIB, job["max_mb"] * 4 * MIB))


def minimum_free(job):
    if job.get("media") != "audio" and job.get("height") == 2160:
        return workspace_limit(job) + 1500 * MIB
    return max(700 * MIB, workspace_limit(job) + 450 * MIB)



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


def upload_media_file(path, token, file):
    """Stream large MP4/M4A uploads from disk; do not duplicate media in RAM.

    HTTPSConnection accepts a file object with explicit Content-Length and sends
    bounded chunks internally, unlike reading the entire MP4 into Python bytes.
    """
    if not path.startswith("/UPLOAD/"):
        raise ValueError("Upload endpoint must be a GitHub release asset")
    destination = path[len("/UPLOAD"):]
    if not destination.startswith(f"/repos/{REPO}/releases/"):
        raise ValueError("Unexpected upload destination")
    size = file.stat().st_size
    if size <= 0 or size > MAX_BYTES:
        raise RuntimeError("Upload exceeds maximum size")
    headers = {"Accept": "application/vnd.github+json", "Authorization": "Bearer " + token,
               "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "yunex-s25-v4",
               "Content-Type": "audio/mp4" if file.suffix.lower() == ".m4a" else "video/mp4",
               "Content-Length": str(size)}
    # Slow mobile links may need substantial time for a large 4K upload.
    upload_timeout = min(3600, max(180, math.ceil(size / MIB) * 15))
    conn = http.client.HTTPSConnection("uploads.github.com", timeout=upload_timeout)
    try:
        with file.open("rb") as video:
            conn.request("POST", destination, body=video, headers=headers)
            response = conn.getresponse()
            content = response.read(1024 * 1024)
            if response.status not in (200, 201):
                raise RuntimeError(f"GitHub upload HTTP {response.status}: " +
                                   content[:150].decode(errors="replace"))
            return json.loads(content)
    finally:
        conn.close()


def issue_jobs(token):
    query = urllib.parse.urlencode({"state":"open", "sort":"created", "direction":"desc","per_page":"100"})
    items = api("GET", f"/repos/{REPO}/issues?{query}", token)
    return [i for i in items if i.get("title","").startswith(TITLE_PREFIX)
            and i.get("user",{}).get("login","").casefold() == OWNER.casefold()
            and "pull_request" not in i]


def valid_youtube_url(url):
    """Only canonical HTTPS YouTube watch URLs, never arbitrary hosts or URL tricks."""
    if not isinstance(url, str) or len(url) > 150 or url != url.strip():
        return False
    try:
        parsed = urllib.parse.urlsplit(url)
        if (parsed.scheme != "https" or parsed.netloc not in ("youtube.com", "www.youtube.com")
                or parsed.path != "/watch" or parsed.fragment):
            return False
        query = urllib.parse.parse_qs(parsed.query, strict_parsing=True)
        video_id = query.get("v", [None])[0]
        return (len(query) == 1 and isinstance(video_id, str) and len(video_id) == 11
                and parsed.query == "v=" + video_id
                and all(char.isascii() and (char.isalnum() or char in "-_") for char in video_id))
    except (ValueError, TypeError):
        return False


def parse_job(issue):
    """Strict owner-only job; licence registry is no longer a job requirement."""
    body = issue.get("body") or ""
    if not body.startswith(MARKER + "\n") or len(body) > 4000:
        return None
    try:
        job = json.loads(body[len(MARKER)+1:].strip())
    except (ValueError, TypeError):
        return None
    if not isinstance(job, dict) or set(job) - {"url", "start", "duration", "height", "max_mb", "orientation", "media"}:
        return None
    url = job.get("url")
    if not valid_youtube_url(url):
        return None
    entry = LICENSED_PROOFS.get(url)
    source_height_limit = entry["max_height"] if entry else 2160
    media = job.get("media", "video")
    start = job.get("start", 0)
    duration = job.get("duration", 6)
    height = job.get("height", 1080)
    max_mb = job.get(
        "max_mb",
        (45 if media == "audio" else default_output_mb(duration, height))
        if type(duration) in (float, int) and math.isfinite(float(duration)) else 45)
    output_cap = MAX_OUTPUT_MB_4K if media == "video" and height == 2160 else MAX_OUTPUT_MB
    orientation = job.get("orientation", "landscape")
    if (type(start) not in (float, int) or type(duration) not in (float, int)
            or type(height) is not int or type(max_mb) is not int
            or not math.isfinite(float(start)) or not math.isfinite(float(duration))
            or not 0 <= start <= 21600 or not 2 <= duration <= MAX_SECONDS
            or start + duration > 22200 or height not in (720, 1080, 2160)
            or (media == "audio" and height == 2160)
            or height > source_height_limit or not 5 <= max_mb <= output_cap
            or orientation not in ("landscape", "portrait")
            or media not in ("video", "audio")):
        return None
    return {"url": job["url"], "start": float(start), "duration": float(duration),
            "height": height, "max_mb": max_mb, "orientation": orientation, "media": media}

def load_completed_issues():
    """Avoid rechecking the same completed jobs on every poll.

    An issue represents one immutable request. Retry/new footage = new issue.
    """
    try:
        numbers = json.loads(COMPLETION_CACHE.read_text(encoding="utf-8"))
        if isinstance(numbers, list):
            return {n for n in numbers if type(n) is int and n > 0}
    except (OSError, ValueError, TypeError):
        pass
    return set()


def mark_issue_completed(number):
    completed = load_completed_issues()
    if number in completed:
        return
    completed.add(number)
    try:
        COMPLETION_CACHE.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        temporary = COMPLETION_CACHE.with_suffix(".tmp")
        with temporary.open("w", encoding="utf-8") as handle:
            os.chmod(temporary, 0o600)
            json.dump(sorted(completed)[-2500:], handle)
        os.replace(temporary, COMPLETION_CACHE)
    except OSError:
        # Never turn a verified GitHub success into a failed job because a
        # local battery-saving cache could not be written.
        pass
    finally:
        try:
            temporary.unlink(missing_ok=True)
        except (OSError, UnboundLocalError):
            pass


def pending_report_path(number):
    if type(number) is not int or number < 1:
        raise ValueError("Invalid GitHub issue number")
    return PENDING_REPORTS / f"issue-{number}.json"


def save_pending_report(number, report):
    """Store a small GitHub handoff *before* posting its success comment."""
    PENDING_REPORTS.mkdir(parents=True, exist_ok=True, mode=0o700)
    destination = pending_report_path(number)
    temporary = destination.with_suffix(".tmp")
    try:
        with temporary.open("w", encoding="utf-8") as handle:
            os.chmod(temporary, 0o600)
            json.dump(report, handle)
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def load_pending_report(number):
    try:
        report = json.loads(pending_report_path(number).read_text(encoding="utf-8"))
        if (isinstance(report, dict) and report.get("schema") == "YUNEX_PHONE_RESULT_V4"
                and report.get("status") == "PASS" and report.get("issue") == number):
            return report
    except (OSError, ValueError, TypeError):
        pass
    return None


def clear_pending_report(number):
    try:
        pending_report_path(number).unlink(missing_ok=True)
    except OSError:
        pass


def already_reported(token, number):
    if number in load_completed_issues():
        return True
    comments = api("GET", f"/repos/{REPO}/issues/{number}/comments?per_page=100", token)
    done = any((c.get("body") or "").startswith((DONE, FAILED)) and
               c.get("user", {}).get("login", "").casefold() == OWNER.casefold()
               for c in comments)
    if done:
        mark_issue_completed(number)
    return done


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


def watched(command, timeout, folder, max_workspace_bytes=MAX_WORKSPACE_BYTES):
    """Monitor temporary disk footprint; kill ffmpeg child processes on timeout."""
    log = folder / "process.log"
    with log.open("wb") as handle:
        proc = subprocess.Popen(command, stdout=handle, stderr=subprocess.STDOUT,
                                start_new_session=True)
        beginning = time.monotonic()
        try:
            while proc.poll() is None:
                footprint = sum(p.stat().st_size for p in folder.rglob("*") if p.is_file())
                if footprint > max_workspace_bytes:
                    raise RuntimeError("Temporary media disk budget exceeded")
                if shutil.disk_usage(folder).free < 400 * MIB:
                    raise RuntimeError("Phone free-space reserve reached")
                if time.monotonic() - beginning > timeout:
                    raise RuntimeError("Download or transcode timed out")
                time.sleep(3)
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
    """Only our V4 temporary folders older than 24h. Never delete personal media."""
    TEMP_ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    count = 0
    for path in TEMP_ROOT.iterdir():
        if (path.name.startswith("yunex-v4-") and path.is_dir()
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
    free = minimum_free(job)
    if shutil.disk_usage(folder).free < free:
        raise RuntimeError(f"Need at least {math.ceil(free/MIB)} MiB free for this job")
    budget = workspace_limit(job)
    start, duration, height = job["start"], job["duration"], job["height"]
    if job.get("media") == "audio":
        return download_audio_proof(folder, job, budget)
    orientation = job.get("orientation", "landscape")
    segment = f"*{start:g}-{start + duration:g}"
    fmt = (f"bv*[width<={height}][height<={height*16//9}]+ba/b[width<={height}][height<={height*16//9}]/b"
           if orientation == "portrait" else
           f"bv*[height<={height}]+ba/b[height<={height}]/b")
    command = [sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist",
               "--no-progress", "--js-runtimes", "node", "--socket-timeout", "25",
               "--retries", "2", "--fragment-retries", "2", "--concurrent-fragments", "1",
               "--download-sections", segment]
    if height != 2160:
        # Legacy <=1080 workflow keeps precise cut boundaries through encoding.
        command.append("--force-keyframes-at-cuts")
    # 4K keeps the original source codec; a phone-side UHD re-encode is too
    # slow, power-hungry and can artificially degrade the original pixels.
    command += ["--merge-output-format", "mp4", "-f", fmt,
                "--max-filesize", f"{budget // MIB}M",
                "-o", str(folder/"source.%(ext)s"), job["url"]]
    watched(command, min(3000, max(540, duration * 4 + 300)), folder, budget)
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
    source_long = (source_video or {}).get("height" if orientation == "portrait" else "width", 0)
    if not source_video or (orientation == "portrait"
                            and source_video.get("width", 0) >= source_video.get("height", 0)):
        raise RuntimeError("Source video missing or source orientation mismatched")
    if height == 2160:
        if source_short < 2160 or source_long < 3840:
            raise RuntimeError("Source is not native 4K (needs >=3840x2160, no upscaling)")
        if source_video.get("codec_name") not in ("h264", "hevc", "vp9", "av1"):
            raise RuntimeError("Source 4K codec cannot be losslessly remuxed to MP4")
    elif height == 1080 and source_short < 1080:
        raise RuntimeError("Source lacks genuine 1080p frames")
    result = folder / "verified-phone-v4.mp4"
    output_command = ["ffmpeg", "-y", "-v", "error", "-i", str(candidates[0]),
                      "-t", str(duration), "-map", "0:v:0", "-map", "0:a:0?"]
    if height == 2160:
        # Native 4K is copied bit-for-bit instead of re-encoded on the phone.
        # VP9/AV1 may be retained inside MP4; downstream editing can transcode.
        output_command += ["-c:v", "copy"]
    else:
        output_command += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
                           "-pix_fmt", "yuv420p", "-threads", "3"]
    output_command += ["-c:a", "aac", "-b:a", "160k",
                       "-movflags", "+faststart", str(result)]
    watched(output_command, min(3000, max(540, duration * 5 + 300)), folder, budget)
    size = result.stat().st_size if result.is_file() else 0
    if not 4096 < size <= min(MAX_BYTES, job["max_mb"] * MIB):
        raise RuntimeError("Output absent or exceeds approved size budget")
    video_probe = json.loads(checked(["ffprobe", "-v", "error", "-show_format",
                                      "-show_streams", "-of", "json", str(result)], 25))
    video = next((x for x in video_probe.get("streams", [])
                  if x.get("codec_type") == "video"), None)
    seconds = float(video_probe.get("format", {}).get("duration") or 0)
    short = (video or {}).get("width" if orientation == "portrait" else "height", 0)
    long = (video or {}).get("height" if orientation == "portrait" else "width", 0)
    if (not video or short > height
            or (height == 1080 and short != 1080)
            or short < 320 or long < 320
            or (orientation == "portrait" and video.get("width", 0) >= video.get("height", 0))
            or not max(1.5, duration-1.2) <= seconds <= duration+2):
        raise RuntimeError("Decoded video codec, dimensions or duration invalid")
    if height == 2160:
        if (short < 2160 or long < 3840
                or video.get("width") != source_video.get("width")
                or video.get("height") != source_video.get("height")
                or video.get("codec_name") != source_video.get("codec_name")):
            raise RuntimeError("4K remux changed source resolution or video codec")
    elif video.get("codec_name") != "h264":
        raise RuntimeError("1080p/720p output must remain H.264")
    checked(["ffmpeg", "-v", "error", "-xerror", "-i", str(result),
             "-map", "0:v:0", "-f", "null", "-"], max(200, duration * 4))
    digest = hashlib.sha256()
    with result.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024*1024), b""):
            digest.update(chunk)
    return result, {"bytes": size, "width": video["width"], "height": video["height"],
                    "duration": round(seconds, 3), "codec": video["codec_name"],
                    "sha256": digest.hexdigest(), "requested_height": height,
                    "source_height": source_video["height"], "source_width": source_video["width"],
                    "orientation": orientation, "start": start,
                    "native_4k": height == 2160,
                    "source_codec_preserved": height == 2160,
                    "full_decode": "PASS"}

def download_audio_proof(folder, job, budget):
    """Acquire just the original recording's audio, saving bandwidth and encoding.

    The same bounded section and rights-aware GitHub release rules apply. AAC
    output is verified by a full FFmpeg decode; no video stream is downloaded
    or re-encoded for an audio job.
    """
    start, duration = job["start"], job["duration"]
    segment = f"*{start:g}-{start + duration:g}"
    command = [sys.executable, "-m", "yt_dlp", "--ignore-config",
               "--no-playlist", "--no-progress", "--js-runtimes", "node",
               "--socket-timeout", "25", "--retries", "2", "--fragment-retries", "2",
               "--concurrent-fragments", "1", "--download-sections", segment,
               "-f", "bestaudio/best", "--max-filesize", f"{budget // MIB}M",
               "-o", str(folder / "source.%(ext)s"), job["url"]]
    watched(command, min(3000, max(540, duration * 3 + 300)), folder, budget)
    candidates = sorted((p for p in folder.iterdir()
                         if p.is_file() and p.name.startswith("source.")
                         and p.suffix.lower() in
                         {".m4a", ".webm", ".mp4", ".opus", ".ogg", ".mp3", ".mkv"}),
                        key=lambda p: p.stat().st_size, reverse=True)
    if not candidates:
        raise RuntimeError("yt-dlp did not create an audio file")
    source_info = json.loads(checked(["ffprobe", "-v", "error", "-show_streams",
                                      "-of", "json", str(candidates[0])], 25))
    if not any(x.get("codec_type") == "audio" for x in source_info.get("streams", [])):
        raise RuntimeError("Source section has no usable audio stream")
    result = folder / "verified-phone-v4.m4a"
    watched(["ffmpeg", "-y", "-v", "error", "-i", str(candidates[0]),
             "-t", str(duration), "-map", "0:a:0", "-vn", "-ar", "48000",
             "-ac", "2", "-c:a", "aac", "-b:a", "192k",
             "-movflags", "+faststart", str(result)],
            min(3000, max(540, duration * 3 + 300)), folder, budget)
    size = result.stat().st_size if result.is_file() else 0
    if not 4096 < size <= min(MAX_BYTES, job["max_mb"] * MIB):
        raise RuntimeError("Audio output absent or exceeds budget")
    probe = json.loads(checked(["ffprobe", "-v", "error", "-show_format",
                                "-show_streams", "-of", "json", str(result)], 25))
    audio = next((x for x in probe.get("streams", [])
                  if x.get("codec_type") == "audio"), None)
    seconds = float(probe.get("format", {}).get("duration") or 0)
    if (not audio or audio.get("codec_name") != "aac"
            or int(audio.get("sample_rate") or 0) != 48000
            or int(audio.get("channels") or 0) != 2
            or any(x.get("codec_type") == "video" for x in probe.get("streams", []))
            or not max(1.5, duration - 1.2) <= seconds <= duration + 2):
        raise RuntimeError("Decoded audio codec, layout or duration invalid")
    checked(["ffmpeg", "-v", "error", "-xerror", "-i", str(result),
             "-map", "0:a:0", "-f", "null", "-"], max(200, duration * 4))
    digest = hashlib.sha256()
    with result.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return result, {"bytes": size, "width": None, "height": None, "codec": "aac",
                    "duration": round(seconds, 3), "sha256": digest.hexdigest(),
                    "sample_rate": 48000, "channels": 2, "media": "audio",
                    "start": start, "full_decode": "PASS"}


def upload_release(token, number, file, job=None, meta=None):
    """Licensed media may be public; unknown-rights media is kept in an owner-only draft."""
    tag = f"yunex-phone-v4-{number}"
    entry = LICENSED_PROOFS.get(job["url"])
    rights_verified = entry is not None
    if rights_verified:
        credit = (f"{entry['title']} by {entry['author']}\n"
                  f"Source: {job['url']}\nLicense: {entry['license']}\n"
                  f"Evidence: {entry['license_reference']}\n"
                  f"Excerpt {job['start']}s for {job['duration']}s; H.264/AAC conversion.")
    else:
        credit = (f"Source: {job['url']}\nRights: not verified; review-only draft. "
                  f"Do not publish this media without permission.\n"
                  f"Excerpt {job['start']}s for {job['duration']}s; H.264/AAC conversion.")
    release = api("POST", f"/repos/{REPO}/releases", token, {
        "tag_name": tag, "target_commitish": "main",
        "name": f"YUNEX S25 production footage #{number}",
        "draft": not rights_verified, "prerelease": True, "body": credit})
    rid = release["id"]
    media = job.get("media", "video")
    suffix = ".m4a" if media == "audio" else ".mp4"
    movie_name = f"yunex-v4-{number}{suffix}"
    upload = "/UPLOAD/repos/" + REPO + f"/releases/{rid}/assets?name=" + urllib.parse.quote(movie_name)
    asset = upload_media_file(upload, token, file)
    manifest = {"schema": "YUNEX_PHONE_RESULT_V4", "status": "PASS",
                "issue": number, "source_url": job["url"],
                "rights_status": "approved_cc_license" if rights_verified else "unverified",
                "license": entry["license"] if entry else None,
                "attribution": entry["author"] if entry else None,
                "license_evidence": entry["license_reference"] if entry else None,
                "release_visibility": "public_prerelease" if rights_verified else "draft",
                "release_id": rid, "media": media,
                "asset_filename": movie_name,
                "asset_id": asset.get("id"),
                "asset_api_url": asset.get("url"),
                "mp4_asset_id": asset.get("id") if media == "video" else None,
                "mp4_asset_api_url": asset.get("url") if media == "video" else None,
                "audio_asset_id": asset.get("id") if media == "audio" else None,
                "audio_asset_api_url": asset.get("url") if media == "audio" else None,
                "requested_start": job["start"], "requested_duration": job["duration"],
                "requested_height": job["height"],
                "requested_orientation": job.get("orientation", "landscape"), **meta,
                "mp4_url": asset["browser_download_url"] if rights_verified and media == "video" else None,
                "audio_url": asset["browser_download_url"] if rights_verified and media == "audio" else None,
                "release_url": release["html_url"]}
    manifest_name = f"yunex-v4-{number}.json"
    manifest_upload = ("/UPLOAD/repos/" + REPO + f"/releases/{rid}/assets?name="
                       + urllib.parse.quote(manifest_name))
    report = api("POST", manifest_upload, token,
                 binary=(json.dumps(manifest, indent=2) + "\n").encode(),
                 content_type="application/json")
    manifest["manifest_url"] = report["browser_download_url"] if rights_verified else None
    manifest["manifest_asset_api_url"] = report.get("url")
    return manifest

def previous_release_asset(token, number):
    """Do not re-upload a GitHub Release if an earlier phone run succeeded."""
    tag = f"yunex-phone-v4-{number}"
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
            clear_pending_report(number)
            continue
        pending = load_pending_report(number)
        if pending:
            # A verified release already exists: repair only its GitHub comment.
            # Never download/encode/upload the same media twice.
            print(f"V4 #{number}: retrying completed handoff comment", flush=True)
            try:
                issue_comment(token, number, DONE + "\n\n~~~json\n"
                              + json.dumps(pending, indent=2) + "\n~~~")
            except Exception as exc:
                print("Report handoff temporarily unavailable:", str(exc)[:140],
                      flush=True)
                return True
            clear_pending_report(number)
            mark_issue_completed(number)
            return True
        print(f"V4 queued issue #{number}: {job.get('media','video')}, {job['height']}p, {job['duration']}s", flush=True)
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
            with tempfile.TemporaryDirectory(prefix="yunex-v4-", dir=TEMP_ROOT) as tmp:
                movie, meta = download_proof(Path(tmp), job)
                report = upload_release(token, number, movie, job, meta)
            save_pending_report(number, report)
            try:
                issue_comment(token, number, DONE + "\n\n~~~json\n"
                              + json.dumps(report, indent=2) + "\n~~~")
            except Exception as exc:
                # Preserve PASS metadata; next poll repairs only the comment.
                print("Media uploaded; pending GitHub report retry:", str(exc)[:140],
                      flush=True)
                return True
            clear_pending_report(number)
            mark_issue_completed(number)
            details = (f"{meta['sample_rate']}Hz stereo" if report["media"] == "audio"
                       else f"{meta['width']}x{meta['height']}")
            print(f"PASS #{number} {details} "
                  f"{meta['bytes']} bytes ({report['release_visibility']})\n"
                  f"{report.get('mp4_url') or report.get('audio_url') or report['release_url']}", flush=True)
        except Exception as exc:
            detail = str(exc).replace("\n", " ")[:300]
            print(f"FAILED #{number}: {detail}", flush=True)
            issue_comment(token, number, FAILED + "\n\n" + detail)
            mark_issue_completed(number)
        return True
    global _LAST_IDLE_LOG
    if _LAST_IDLE_LOG == 0 or time.monotonic() - _LAST_IDLE_LOG >= 600:
        print("V4 idle: no pending jobs (Ctrl+C to stop)", flush=True)
        _LAST_IDLE_LOG = time.monotonic()
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
    p.add_argument("--interval",type=int,default=DEFAULT_POLL_SECONDS,
                   help="Polling interval 60–900 seconds; default 120")
    args=p.parse_args()
    if not 60 <= args.interval <= 900:
        p.error("--interval must be 60..900 seconds")
    if args.doctor:
        print(json.dumps({"version":4,"approved_sources":len(LICENSED_PROOFS),
                          "node":bool(shutil.which("node")),
                          "ffmpeg":bool(shutil.which("ffmpeg")),
                          "ffprobe":bool(shutil.which("ffprobe")),
                          "free_mb":shutil.disk_usage(Path.home()).free//(1024*1024),
                          "token_file":(Path.home()/".config/yunex/github-token").is_file(),
                          "poll_seconds":DEFAULT_POLL_SECONDS,
                          "completed_jobs_cached":len(load_completed_issues()),
                          "source_registration_required":False},indent=2))
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
        print("Removed stale V4 media workspaces; other videos untouched")
        return
    token=read_token()
    last_catalog_refresh=0.0
    while True:
        try:
            now=time.monotonic()
            if last_catalog_refresh == 0 or now - last_catalog_refresh >= CATALOG_REFRESH_SECONDS:
                refresh_sources()
                last_catalog_refresh=now
            run_once(token,args.dry_run)
        except Exception as err:
            print("Worker error:",str(err)[:200],flush=True)
            if args.once:
                raise
        if args.once:
            return
        time.sleep(args.interval)


if __name__=="__main__":
    main()
