#!/usr/bin/env python3
"""Fail-closed independent GT3 Nürburgring multi-car source and final-master QA.

Example:
 python3 manager_qa.py --footage-zip FOOTAGE.zip --music-mp3 song.mp3 \
     --final-mp4 final.mp4 --report manager-audit.json

A technical pass NEVER certifies visual uniqueness, real model identity, or engine
audio matching; those require independent manager frame/audio inspection.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
import zipfile
from fractions import Fraction
from pathlib import Path

EXPECTED_SONG_SHA = "87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678"
VIDEO_EXT = (".mp4", ".mov", ".mkv", ".m4v")


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for part in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(part)
    return digest.hexdigest()


def probe(path, count=False):
    cmd = ["ffprobe", "-v", "error"]
    if count:
        cmd += ["-count_frames"]
    cmd += ["-show_entries",
            "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,"
            "pix_fmt,sample_rate,channels,nb_read_frames",
            "-of", "json", str(path)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode:
        raise ValueError(result.stderr.strip()[:300])
    return json.loads(result.stdout)


def result(status, reasons, **fields):
    return {"status": status, "reasons": reasons, **fields}


def song_gate(path):
    if not path or not Path(path).is_file():
        return result("BLOCKED", ["Original supplied MP3 absent"])
    found = sha256(path)
    if found != EXPECTED_SONG_SHA:
        return result("FAIL", ["MP3 SHA256 differs from user's exact song"], actual_sha256=found)
    try:
        duration = float(probe(path)["format"]["duration"])
        reasons = [] if abs(duration - 10.553469) < 0.08 else ["Unexpected MP3 duration"]
        return result("PASS" if not reasons else "FAIL", reasons, sha256=found, duration=duration)
    except (ValueError, KeyError, OSError) as exc:
        return result("FAIL", [str(exc)])


def master_gate(path):
    if not path or not Path(path).is_file():
        return result("BLOCKED", ["Actual final playable MP4 absent"])
    errors = []
    try:
        meta = probe(path, count=True)
        streams = meta["streams"]
        v = next((s for s in streams if s.get("codec_type") == "video"), {})
        a = next((s for s in streams if s.get("codec_type") == "audio"), {})
        fps = float(Fraction(v.get("r_frame_rate", "0/1")))
        frames = int(v.get("nb_read_frames") or -1)
        duration = float(meta["format"].get("duration") or -1)
        checks = [
            (v.get("codec_name") == "h264", "Not H.264"),
            ((v.get("width"), v.get("height")) == (1920, 1080), "Not 1920x1080"),
            (v.get("pix_fmt") == "yuv420p", "Not yuv420p"),
            (abs(fps - 30) < 0.001, "Not 30fps"),
            (frames == 316, f"Not 316 decoded frames: {frames}"),
            (abs(duration - 316 / 30) < 0.15, "Incorrect duration"),
            (a.get("codec_name") == "aac", "Missing AAC"),
            (a.get("sample_rate") == "48000", "Not 48kHz audio"),
            (a.get("channels") == 2, "Not stereo"),
        ]
        errors.extend(message for good, message in checks if not good)
        decoded = subprocess.run(
            ["ffmpeg", "-nostdin", "-hide_banner", "-v", "error", "-xerror",
             "-i", str(path), "-map", "0:v:0", "-f", "null", "-"],
            capture_output=True, text=True)
        if decoded.returncode:
            errors.append("Full frame decode failed: " + decoded.stderr[-300:])
        return result("FAIL" if errors else "TECHNICAL_PASS_REVIEW_REQUIRED", errors,
                      sha256=sha256(path), frames=frames, fps=fps,
                      resolution=[v.get("width"), v.get("height")], duration=duration,
                      manual_review="Independently inspect decoded shot contact sheet, source identity, full-bleed/no watermarks, song and real car-matched engine audio")
    except (ValueError, KeyError, OSError) as exc:
        return result("FAIL", ["Master probe error: " + str(exc)])


def footage_gate(path):
    if not path or not Path(path).is_file():
        return result("BLOCKED", ["Agent A actual source ZIP absent"], usable_shots_verified=0)
    errors = []
    probes = []
    try:
        with zipfile.ZipFile(path) as bundle:
            names = bundle.namelist()
            clips = [name for name in names if name.lower().endswith(VIDEO_EXT)]
            manifest_names = [name for name in names if Path(name).name.lower()
                              in ("manifest.json", "source_manifest.json", "footage_manifest.json")]
            records = []
            if manifest_names:
                body = json.loads(bundle.read(manifest_names[0]))
                records = body if isinstance(body, list) else next(
                    (body[key] for key in ("shots", "clips", "assets", "footage")
                     if isinstance(body.get(key), list)), [])
            else:
                errors.append("Source manifest.json absent")
            if len(clips) < 24:
                errors.append(f"Only {len(clips)} video files; minimum 24")
            if len(records) < 24:
                errors.append(f"Only {len(records)} manifest entries; minimum 24")
            makes = {str(r.get("marque") or r.get("make") or r.get("manufacturer")).lower()
                     for r in records if r.get("marque") or r.get("make") or r.get("manufacturer")}
            sources = {str(r.get("source_url") or r.get("source_film") or r.get("source_id"))
                       for r in records if r.get("source_url") or r.get("source_film") or r.get("source_id")}
            if len(makes) < 6:
                errors.append(f"Only {len(makes)} declared GT3 makes; minimum 6")
            if len(sources) < 3:
                errors.append(f"Only {len(sources)} source films; minimum 3")
            known_names = {Path(name).name for name in clips}
            for r in records:
                name = r.get("filename") or r.get("file") or r.get("path")
                if name and Path(name).name not in known_names:
                    errors.append("Manifest media missing: " + str(name))
            with tempfile.TemporaryDirectory(prefix="gt3-audit-") as temp:
                for index, member in enumerate(clips):
                    target = Path(temp) / (str(index) + Path(member).suffix)
                    with bundle.open(member) as source, target.open("wb") as out:
                        shutil.copyfileobj(source, out, 1024 * 1024)
                    try:
                        media = probe(target)
                        v = next((s for s in media["streams"]
                                  if s.get("codec_type") == "video"), {})
                        w, h = int(v.get("width") or 0), int(v.get("height") or 0)
                        if not ((w >= 1920 and h >= 1080) or (w >= 1080 and h >= 1920)):
                            errors.append(f"Insufficient native resolution {member} ({w}x{h})")
                        probes.append({"filename": member, "width": w, "height": h,
                                       "sha256": sha256(target)})
                    except (OSError, ValueError, KeyError) as exc:
                        errors.append(f"Bad media {member}: {exc}")
            if len({p["sha256"] for p in probes}) < 24:
                errors.append("Fewer than 24 unique video files by SHA256")
            return result("FAIL" if errors else "TECHNICAL_PASS_REVIEW_REQUIRED", errors,
                          zip_sha256=sha256(path), clip_files=len(clips), manifest_entries=len(records),
                          makes=sorted(makes), distinct_sources=len(sources),
                          media_probes=probes,
                          manual_review="Native frame review required for different camera angles, correct GT3 models, absence of watermarks, appropriate 16:9 crop")
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        return result("FAIL", ["Invalid footage bundle: " + str(exc)])


def audit(footage_zip=None, music_mp3=None, final_mp4=None):
    a = footage_gate(footage_zip)
    music = song_gate(music_mp3)
    c = master_gate(final_mp4)
    technically_ready = all(x["status"] in ("PASS", "TECHNICAL_PASS_REVIEW_REQUIRED")
                            for x in (a, music, c))
    return {
        "project": "YUNEX GT3 NURBURGRING MULTICAR 001",
        "contract": {"marques_min": 6, "unique_source_shots_min": 24, "master": "1920x1080 30fps 316f", "song_sha256": EXPECTED_SONG_SHA},
        "gate_a_footage": a, "song_gate": music, "gate_c_master": c,
        "gate_b_visual": "BLOCKED_PENDING_NATIVE_FRAME_REVIEW",
        "gate_d_manager": "BLOCKED_PENDING_MANUAL_VISUAL_AUDIO_REVIEW" if technically_ready else "BLOCKED",
        "important": "Automated technical checks are not a creative or authenticity signoff. Even a green CI workflow alone does not pass production gates.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--footage-zip")
    parser.add_argument("--music-mp3")
    parser.add_argument("--final-mp4")
    parser.add_argument("--report", default="gt3-manager-audit.json")
    args = parser.parse_args()
    data = audit(args.footage_zip, args.music_mp3, args.final_mp4)
    Path(args.report).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value.get("status") if isinstance(value, dict) else value
                      for key, value in data.items() if key.startswith("gate_") or key == "song_gate"}, indent=2))
    return 2 if data["gate_d_manager"] == "BLOCKED" else 0


if __name__ == "__main__":
    raise SystemExit(main())
