#!/usr/bin/env python3
"""Independently inspect a native MP4: FFprobe, full decode and review alerts."""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

def capture(*args):
    return subprocess.run(args, capture_output=True, text=True, check=True).stdout

def sha256(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def verify(path, width=1080, height=1920, fps=30, frames=750):
    path = Path(path)
    if not path.is_file() or not path.stat().st_size:
        raise ValueError("Missing/empty video: " + str(path))
    raw = json.loads(capture("ffprobe", "-v", "error", "-count_frames",
                             "-show_streams", "-show_format", "-of", "json", str(path)))
    vids = [s for s in raw.get("streams", []) if s.get("codec_type") == "video"]
    auds = [s for s in raw.get("streams", []) if s.get("codec_type") == "audio"]
    if len(vids) != 1:
        raise ValueError("Expected exactly one video stream, got " + str(len(vids)))
    v = vids[0]
    metrics = {"codec": v.get("codec_name"), "pixelFormat": v.get("pix_fmt"),
               "width": v.get("width"), "height": v.get("height"),
               "avgFrameRate": v.get("avg_frame_rate"),
               "reportedFrameRate": v.get("r_frame_rate"),
               "declaredFrames": v.get("nb_frames"),
               "decodedByProbe": v.get("nb_read_frames"),
               "durationSeconds": float(raw["format"]["duration"])}
    errors = []
    for key, expected in [("codec", "h264"), ("pixelFormat", "yuv420p"),
                          ("width", width), ("height", height)]:
        if metrics[key] != expected:
            errors.append(f"{key} expected {expected}, got {metrics[key]}")
    if Fraction(str(metrics["avgFrameRate"])) != Fraction(fps, 1):
        errors.append("Incorrect average frame rate")
    for key in ("declaredFrames", "decodedByProbe"):
        if str(metrics[key]) != str(frames):
            errors.append(f"{key} expected {frames}, got {metrics[key]}")
    if abs(metrics["durationSeconds"] - frames / fps) > 0.045:
        errors.append("Duration does not match frame count/fps")
    result = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-xerror",
                             "-i", str(path), "-map", "0:v:0", "-f", "null", "-",
                             "-progress", "pipe:1", "-nostats"],
                            capture_output=True, text=True)
    decoded = [int(x) for x in re.findall(r"^frame=(\d+)$", result.stdout, re.M)]
    actual = decoded[-1] if decoded else None
    if result.returncode:
        errors.append("Full FFmpeg decode failed: " + result.stderr[-1200:])
    if actual != frames:
        errors.append(f"Decoded frames: {actual} (wanted {frames})")
    alerts = []
    for kind, filt in [("black", "blackdetect=d=0.35:pix_th=0.08"),
                       ("freeze", "freezedetect=n=-45dB:d=0.75")]:
        proc = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "info",
                               "-i", str(path), "-map", "0:v:0",
                               "-vf", filt, "-f", "null", "-"],
                              capture_output=True, text=True)
        if proc.returncode:
            alerts.append({"type": kind, "warning": "Detection failed; manual review required"})
        else:
            lines = [line.strip() for line in proc.stderr.splitlines()
                     if (("black_start:" in line) if kind == "black"
                         else ("freeze_start:" in line or "freeze_end:" in line))]
            if lines:
                alerts.append({"type": kind, "warning": "Inspect interval; can be intentional", "events": lines[:30]})
    return {"file": path.name, "bytes": path.stat().st_size, "sha256": sha256(path),
            "requirements": {"width": width, "height": height, "fps": fps,
                             "frames": frames, "codec": "h264", "pixelFormat": "yuv420p"},
            "ffprobe": raw, "metrics": metrics, "ffmpegDecodedFrames": actual,
            "audio": {"present": bool(auds),
                      "codec": auds[0].get("codec_name") if auds else None,
                      "note": "No approved VO means silent output; never substitute narration"},
            "automatedVisualReviewAlerts": alerts, "manualVisualReviewRequired": True,
            "technicalPass": not errors, "errors": errors}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("mp4", type=Path)
    for name, default in [("width", 1080), ("height", 1920),
                          ("fps", 30), ("frames", 750)]:
        p.add_argument("--" + name, type=int, default=default)
    p.add_argument("--report", type=Path)
    args = p.parse_args()
    try:
        data = verify(args.mp4, args.width, args.height, args.fps, args.frames)
    except (ValueError, subprocess.CalledProcessError, FileNotFoundError) as exc:
        data = {"technicalPass": False, "errors": [str(exc)], "file": str(args.mp4)}
    print(json.dumps({k: v for k, v in data.items() if k != "ffprobe"}, indent=2))
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(data, indent=2) + "\n")
    return 0 if data.get("technicalPass") else 2

if __name__ == "__main__":
    sys.exit(main())
