#!/usr/bin/env python3
"""YUNEX GT3 Agent A: acquire *actual* source excerpts and report non-inflated media QA.

Source timestamps are candidates, not pre-verified distinct shots. Onboards remain
a single viewpoint regardless of how many timestamps are cut from one feed.
No upload is represented as ready until the media and model/shot IDs are reviewed.
"""
import argparse
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import time
import zipfile
from collections import Counter
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VIDEO_SUFFIXES = {".mp4", ".mkv", ".webm", ".mov", ".m4v"}

def command(argv, timeout=240):
    return subprocess.run(argv, text=True, capture_output=True, timeout=timeout)

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda: f.read(1024 * 1024), b""):
            h.update(b)
    return h.hexdigest()

def probe(path):
    p = command(["ffprobe", "-v", "error", "-show_streams", "-show_format",
                 "-of", "json", str(path)], timeout=40)
    if p.returncode:
        raise ValueError("ffprobe error: " + p.stderr[-300:])
    d = json.loads(p.stdout)
    v = next((s for s in d.get("streams", []) if s.get("codec_type") == "video"), None)
    if not v:
        raise ValueError("No video stream")
    w, h = int(v.get("width", 0)), int(v.get("height", 0))
    fps = float(Fraction(v.get("avg_frame_rate") or v.get("r_frame_rate") or "0/1"))
    duration = float(d["format"].get("duration") or 0)
    if not ((w >= 1920 and h >= 1080 and w > h) or
            (w >= 1080 and h >= 1920 and h > w)):
        raise ValueError(f"Non-native-HD source: {w}x{h}")
    if fps < 23.9 or not (2 <= duration <= 25):
        raise ValueError(f"Clip FPS/duration rejected: {fps:.2f}fps, {duration:.2f}s")
    if path.stat().st_size < 75000:
        raise ValueError("Small or truncated file")
    return {"width": w, "height": h, "fps": round(fps, 3),
            "duration": round(duration, 3), "video_codec": v.get("codec_name"),
            "bit_rate": d["format"].get("bit_rate"),
            "audio": any(s.get("codec_type") == "audio" for s in d.get("streams", [])),
            "bytes": path.stat().st_size}

def frame(path, at, output):
    p = command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                 "-ss", str(at), "-i", str(path), "-frames:v", "1",
                 "-vf", "scale=480:-2", str(output)], timeout=45)
    if p.returncode or not output.exists():
        raise ValueError("Frame decode failed: " + p.stderr[-300:])

def visuals(path, clip_id, duration, folder):
    """Decode visual proof and reject still images. This is NOT car-ID verification."""
    from PIL import Image, ImageChops, ImageStat, ImageOps, ImageDraw
    frames = []
    for k, ratio in enumerate((0.2, 0.5, 0.8)):
        p = folder / f"{clip_id}_{k}.jpg"
        frame(path, max(0.1, duration * ratio), p)
        frames.append(p)
    imgs = [Image.open(p).convert("RGB") for p in frames]
    scores = []
    for a, b in zip(imgs, imgs[1:]):
        scores.append(sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3)
    if max(scores) < 1.5:
        raise ValueError(f"Insufficient actual frame change: {scores}")
    w, h = imgs[0].size
    sheet = Image.new("RGB", (w * 3, h + 42), (24, 24, 24))
    for i, im in enumerate(imgs):
        sheet.paste(im, (w * i, 42))
    ImageDraw.Draw(sheet).text((8, 10), f"{clip_id} | sampled motion {scores}", fill="white")
    sheetpath = folder / f"{clip_id}_CONTACT.jpg"
    sheet.save(sheetpath, quality=85)
    return {"contact_sheet": f"contact_sheets/{sheetpath.name}",
            "mean_rgb_difference": [round(v, 3) for v in scores],
            "decodable_sample_frames": 3}

def extract(source, start, clip_id, target, duration):
    if source.get("method") == "direct-mp4":
        # Official publisher's direct file, cached once on the runner. Preserve
        # source bytes and stream-copy only a bounded excerpt without upscaling.
        cache = target / "_source_cache"
        cache.mkdir(parents=True, exist_ok=True)
        raw = cache / (source["id"] + ".mp4")
        if not raw.is_file() or raw.stat().st_size < 100000:
            proc = command(["curl", "-fL", "--retry", "2", "--max-time", "150",
                            "--user-agent", "Mozilla/5.0",
                            "-o", str(raw), source["url"]], timeout=175)
            if proc.returncode:
                raw.unlink(missing_ok=True)
                raise ValueError("Direct MP4 HTTP fetch failed: " + proc.stderr[-500:])
        # ffprobe the full file before editing to avoid treating HTML as video.
        original = command(["ffprobe", "-v", "error", "-select_streams",
                            "v:0", "-show_entries", "stream=width,height",
                            "-of", "csv=p=0", str(raw)], timeout=30)
        if original.returncode or not original.stdout.strip():
            raise ValueError("Fetched publisher URL does not decode as MP4")
        output = target / (clip_id + ".mkv")
        proc = command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                        "-ss", str(start), "-i", str(raw), "-t", str(duration),
                        "-map", "0:v:0", "-map", "0:a?", "-c", "copy",
                        "-avoid_negative_ts", "make_zero", str(output)], timeout=120)
        if proc.returncode or not output.exists() or output.stat().st_size < 75000:
            raise ValueError("Direct publisher trim failed: " + proc.stderr[-350:])
        return output
    # This is a normal, unauthenticated extraction. No CAPTCHA/cookie bypass.
    # FFmpeg copies the downloaded compressed stream (no upscaling).
    outtmpl = str(target / (clip_id + ".%(ext)s"))
    cmd = [sys.executable, "-m", "yt_dlp", "--ignore-config", "--no-playlist",
           "--no-progress", "--no-warnings", "--no-overwrites",
           "--js-runtimes", "node", "--socket-timeout", "10",
           "--retries", "1", "--fragment-retries", "1",
           "--format", "bv*[height>=1080]+ba/b[height>=1080]",
           "--merge-output-format", "mkv",
           "--download-sections", f"*{start}-{start + duration}",
           "--output", outtmpl, "--", source["url"]]
    proc = command(cmd, timeout=230)
    candidates = [p for p in target.glob(clip_id + ".*") if p.suffix.lower() in VIDEO_SUFFIXES]
    if proc.returncode or not candidates:
        raise ValueError("Extraction unavailable: " + (proc.stderr or proc.stdout)[-650:])
    return max(candidates, key=lambda p: p.stat().st_size)

def full_decode(path):
    p = command(["ffmpeg", "-v", "error", "-xerror", "-i", str(path),
                 "-map", "0:v:0", "-f", "null", "-"], timeout=120)
    if p.returncode:
        raise ValueError("Native video decode failure: " + p.stderr[-350:])

def package(folder, report):
    zip_path = folder / "GT3_MULTICAR_AGENT_A_ACTUAL_MEDIA.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED, allowZip64=True) as z:
        for sub in ("clips", "contact_sheets"):
            for p in sorted((folder / sub).glob("*")):
                accepted = {clip["file"] for clip in json.loads((folder / "manifest.json").read_text())["clips"]}
                accepted_contact = {clip["contact_sheet"] for clip in json.loads((folder / "manifest.json").read_text())["clips"]}
                if p.is_file() and str(p.relative_to(folder)) in (accepted if sub == "clips" else accepted_contact):
                    z.write(p, p.relative_to(folder))
        for p in ("manifest.json", "README.md", "acquisition-log.json"):
            z.write(folder / p, p)
    report["zip_sha256"] = sha256(zip_path)
    report["zip_size_bytes"] = zip_path.stat().st_size
    (folder / "QA_SUMMARY.json").write_text(json.dumps(report, indent=2) + "\n")
    return zip_path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="out/gt3-multicar-agent-a")
    ap.add_argument("--max-attempts", type=int, default=48)
    ap.add_argument("--max-minutes", type=int, default=65)
    ap.add_argument("--candidates", default="source-candidates.json", help="JSON file in agent-a directory; default legacy sources")
    args = ap.parse_args()
    output = Path(args.output).resolve()
    for part in ("clips", "contact_sheets"):
        (output / part).mkdir(parents=True, exist_ok=True)
    conf = json.loads((ROOT / Path(args.candidates).name).read_text())
    ok, fails, attempted, observed = [], [], 0, set()
    deadline = time.monotonic() + 60 * args.max_minutes
    providers_failed = Counter()
    for src in conf["sources"]:
        for n, start in enumerate(src["starts"]):
            if attempted >= args.max_attempts or time.monotonic() > deadline:
                break
            clip_id = src["id"] + f"_{n+1:02d}"
            attempted += 1
            try:
                file = extract(src, start, clip_id, output / "clips",
                               int(conf["seconds_per_candidate"]))
                metrics = probe(file)
                full_decode(file)
                vis = visuals(file, clip_id, metrics["duration"], output / "contact_sheets")
                digest = sha256(file)
                if digest in observed:
                    raise ValueError("Duplicate identical source bytes")
                observed.add(digest)
                ok.append({"id": clip_id, "file": f"clips/{file.name}",
                           "sha256": digest, "source_url": src["url"],
                           "source_publisher": src["publisher"],
                           "source_event": src["event"], "source_film": src["id"],
                           "gt3_make_candidate": src["make"], "gt3_model_candidate": src["model"],
                           "camera_type": src["type"], "source_timestamp_seconds": start,
                           "probe": metrics, **vis,
                           "native_1080_or_better": True,
                           "camera_uniqueness": "UNCONFIRMED visual review required",
                           "model_identity": "UNCONFIRMED visual review required",
                           "full_decode": "PASS", "upscaled": False})
                print(f"ACQUIRED {clip_id} {metrics['width']}x{metrics['height']}", flush=True)
            except Exception as error:
                fails.append({"candidate": clip_id, "source_url": src["url"],
                              "reason": str(error)[-900:]})
                print(f"REJECTED {clip_id}: {str(error)[-250:]}", flush=True)
                # If two downloads fail in the same film, don't hammer that film.
                providers_failed[src["id"]] += 1
                if providers_failed[src["id"]] >= 2:
                    break
        if attempted >= args.max_attempts or time.monotonic() > deadline:
            break
    make_candidates = sorted({x["gt3_make_candidate"] for x in ok
                              if x["gt3_make_candidate"] != "UNVERIFIED"})
    films = sorted({x["source_film"] for x in ok})
    report = {"project": "YUNEX GT3 MULTICAR 001", "agent": "A",
              "attempts": attempted, "downloaded_hd_media_clips": len(ok),
              "distinct_source_films": len(films), "films": films,
              "onboard_make_candidates": make_candidates,
              "count_warning": "Automated source excerpts are NOT independently verified unique camera shots",
              "gate": "BLOCKED" if len(ok) < 24 or len(make_candidates) < 6 else "NEEDS_VISUAL_REVIEW",
              "full_footage_gate_pass": False,
              "failed_candidates": len(fails), "target": "30-40 shots >=6 verified makes"}
    (output / "manifest.json").write_text(json.dumps({"qa": report, "clips": ok}, indent=2) + "\n")
    (output / "acquisition-log.json").write_text(json.dumps(fails, indent=2) + "\n")
    (output / "README.md").write_text(
        "# Actual downloadable GT3 footage — Agent A\n\n"
        f"Native-HD decoded files: **{len(ok)}**, source films: **{len(films)}**, "
        f"make leads: **{', '.join(make_candidates) or 'none'}**.\n\n"
        "Each file is a downloaded source excerpt, NOT automatically a distinct shot. "
        "Review contact sheets, verify visible makes/camera angles, reject any source watermark, "
        "and clear unique-shot identity before calling the 24-shot footage gate PASS. "
        "Raw media was not upscaled. No video was fabricated. "
        "For media provenance and exact SHA256 see manifest.json.\n")
    zipfile_path = package(output, report)
    print(json.dumps({"gate": report["gate"], "clips": len(ok), "makes": make_candidates,
                      "zip_file": str(zipfile_path), "zip_sha256": report["zip_sha256"]}, indent=2))
    return 0 if ok else 2

if __name__ == "__main__":
    raise SystemExit(main())
