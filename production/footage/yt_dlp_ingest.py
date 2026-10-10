#!/usr/bin/env python3
"""Permission-gated, source-quality-verified YouTube ingest.

This is an optional production tool, not a change to any finished films.
It preserves the downloaded encoded video instead of transcoding/upscaling.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from fractions import Fraction
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

HOSTS = frozenset({"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"})
VIDEO_SUFFIXES = frozenset({".mkv", ".mp4", ".webm", ".mov", ".m4v"})
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")


def canonical_video_url(raw: str) -> str:
    """Only single-video HTTPS YouTube URLs; never treat a playlist as a video."""
    try:
        link = urlsplit(raw.strip())
        if link.scheme != "https" or link.hostname not in HOSTS:
            raise ValueError("Only HTTPS YouTube video links are supported")
        if link.username or link.password or link.port not in (None, 443):
            raise ValueError("URL credentials and custom ports are not supported")
    except (TypeError, ValueError) as error:
        raise ValueError("Invalid YouTube URL: " + str(error)) from error

    path = link.path.strip("/")
    if link.hostname in {"youtu.be", "www.youtu.be"}:
        candidate = path
    elif path == "watch":
        values = parse_qs(link.query).get("v", [])
        candidate = values[0] if len(values) == 1 else ""
    else:
        parts = path.split("/")
        candidate = parts[1] if len(parts) == 2 and parts[0] in {"shorts", "live"} else ""
    if not VIDEO_ID.fullmatch(candidate):
        raise ValueError("A single valid YouTube video ID is required (not a playlist/channel)")
    return "https://www.youtube.com/watch?v=" + candidate


def validate_limits(min_height: int, min_fps: float, max_mb: int, max_duration: int) -> None:
    if not 144 <= min_height <= 4320:
        raise ValueError("min-height must be 144–4320")
    if not 1 <= min_fps <= 120:
        raise ValueError("min-fps must be 1–120")
    if not 1 <= max_mb <= 1500:
        raise ValueError("max-mb must be 1–1500")
    if not 1 <= max_duration <= 21600:
        raise ValueError("max-duration must be 1–21600 seconds")


def build_download_command(url: str, destination: Path, max_mb: int) -> list[str]:
    # subprocess never invokes a shell; user input is not interpolated in a command string.
    return [
        sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist",
        "--no-overwrites", "--no-progress", "--js-runtimes", "node",
        "--format", "bv*+ba/b", "--merge-output-format", "mkv",
        "--max-filesize", str(max_mb) + "M",
        "--paths", str(destination), "--output", "%(id)s.%(ext)s",
        "--write-info-json", "--print", "after_move:filepath", url,
    ]


def inspect_video(path: Path) -> dict:
    if not path.is_file() or path.stat().st_size < 1000:
        raise ValueError("Output video is missing or empty")
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(path),
    ], check=True, capture_output=True, text=True, timeout=60)
    info = json.loads(probe.stdout)
    video_streams = [s for s in info.get("streams", []) if s.get("codec_type") == "video"]
    if len(video_streams) != 1:
        raise ValueError("Expected exactly one video stream")
    video = video_streams[0]
    rate = video.get("avg_frame_rate") or video.get("r_frame_rate") or "0/1"
    try:
        fps = float(Fraction(rate))
    except (ValueError, ZeroDivisionError):
        fps = 0.0
    audio = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
    return {
        "file": path.name,
        "bytes": path.stat().st_size,
        "width": int(video.get("width", 0)),
        "height": int(video.get("height", 0)),
        "fps": round(fps, 4),
        "videoCodec": video.get("codec_name"),
        "pixelFormat": video.get("pix_fmt"),
        "audioCodec": audio.get("codec_name") if audio else None,
        "durationSeconds": float(info.get("format", {}).get("duration") or 0),
        "bitrate": int(info.get("format", {}).get("bit_rate") or 0),
        "colourSpace": video.get("color_space"),
        "colourTransfer": video.get("color_transfer"),
    }


def quality_report(path: Path, min_height=1080, min_fps=24, max_mb=600, max_duration=1800) -> dict:
    validate_limits(min_height, min_fps, max_mb, max_duration)
    stats = inspect_video(path)
    issues = []
    if stats["height"] < min_height:
        issues.append("height below requested minimum; source was not upscaled")
    if stats["fps"] < min_fps:
        issues.append("frame rate below requested minimum")
    if stats["bytes"] > max_mb * 1024 * 1024:
        issues.append("file size exceeds configured cap")
    if not 0 < stats["durationSeconds"] <= max_duration:
        issues.append("duration missing or beyond configured cap")
    # The digest permits downstream agents to identify exact source bytes.
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return {
        "status": "PASS" if not issues else "REJECTED",
        "reason": issues,
        "sourceFileSha256": digest.hexdigest(),
        "probe": stats,
        "policy": {
            "minHeight": min_height,
            "minFps": min_fps,
            "maxMegabytes": max_mb,
            "maxDurationSeconds": max_duration,
            "reencoded": False,
            "upscaled": False,
        },
    }


def locate_download(stdout: str, output: Path) -> Path:
    root = output.resolve()
    for line in reversed(stdout.splitlines()):
        candidate = Path(line.strip()).resolve()
        if candidate.suffix.lower() in VIDEO_SUFFIXES and candidate.is_file() and candidate.is_relative_to(root):
            return candidate
    raise ValueError("yt-dlp did not report an existing video file inside the output directory")


def fetch(args) -> dict:
    if not args.rights_confirmed:
        raise ValueError("Confirm you own the media or have permission to download and use it")
    url = canonical_video_url(args.url)
    validate_limits(args.min_height, args.min_fps, args.max_mb, args.max_duration)
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    command = build_download_command(url, output, args.max_mb)
    if args.dry_run:
        return {"status": "DRY_RUN", "command": command, "note": "No video was retrieved"}
    result = subprocess.run(command, check=True, capture_output=True, text=True, timeout=2400)
    path = locate_download(result.stdout, output)
    report = quality_report(path, args.min_height, args.min_fps, args.max_mb, args.max_duration)
    report["sourceUrl"] = url
    report["downloader"] = "yt-dlp (default Python dependencies + Node 22), FFmpeg remux"
    report["sourceInfoFile"] = path.with_suffix(".info.json").name
    destination = output / (path.stem + ".qa.json")
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if report["status"] != "PASS":
        raise ValueError("Source quality rejected: " + "; ".join(report["reason"]))
    # Full decode, not just container metadata. Fail if the downloaded media is damaged.
    subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(path),
                    "-map", "0:v:0", "-f", "null", "-"],
                   check=True, stdout=subprocess.DEVNULL, timeout=1800)
    report["fullVideoDecode"] = "PASS"
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Permission-gated YouTube quality ingest for Remotion")
    sub = p.add_subparsers(dest="action", required=True)
    for action in ("fetch", "verify"):
        q = sub.add_parser(action)
        q.add_argument("--min-height", type=int, default=1080)
        q.add_argument("--min-fps", type=float, default=24)
        q.add_argument("--max-mb", type=int, default=600)
        q.add_argument("--max-duration", type=int, default=1800)
        if action == "fetch":
            q.add_argument("--url", required=True)
            q.add_argument("--output", default="out/footage-import")
            q.add_argument("--rights-confirmed", action="store_true")
            q.add_argument("--dry-run", action="store_true")
        else:
            q.add_argument("--input", required=True)
            q.add_argument("--manifest", default=None)
    return p


def main() -> int:
    args = parser().parse_args()
    try:
        if args.action == "fetch":
            result = fetch(args)
        else:
            result = quality_report(Path(args.input), args.min_height,
                                    args.min_fps, args.max_mb, args.max_duration)
            if args.manifest:
                target = Path(args.manifest)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(result, indent=2))
        return 0 if result["status"] in ("PASS", "DRY_RUN") else 2
    except (ValueError, subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError) as exc:
        print("INGEST_FAILED: " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
