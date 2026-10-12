#!/usr/bin/env python3
"""YUNEX CYBER//FUTURE 001 — deterministic original-song final mux & media QA.

Agent F owns audio and delivery. Visual input MUST come from Agent E's verified
film, never a synthetic montage. Do not add fake motor noises or alternate music.
Use --test-mode only for a synthetic CI smoke test (never as a release).
"""
from __future__ import annotations
import argparse
from array import array
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys

SONG_SHA256 = "d853d5209240bd9b84ebffc11aff9e68812df7a17eeb4aa266b8e028cd89784c"
FPS = 30
FINAL_FRAMES = 632
RUNTIME = FINAL_FRAMES / FPS


def run(cmd: list[str], *, capture: bool = True) -> str:
    result = subprocess.run(cmd, text=True, stdout=subprocess.PIPE if capture else None,
                            stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}): {cmd}\n{result.stderr[-4000:]}")
    return result.stdout or ""


def probe(path: Path) -> dict:
    return json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams",
                           "-of", "json", str(path)]))


def sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def stream(data: dict, stream_type: str) -> dict:
    candidates = [s for s in data.get("streams", []) if s.get("codec_type") == stream_type]
    if len(candidates) != 1 and stream_type == "video":
        # A smartphone source may have multiple non-video tracks. Choose first real video.
        candidates = [s for s in candidates if s.get("width") and s.get("height")]
    if not candidates:
        raise RuntimeError(f"No {stream_type} stream found")
    return candidates[0]


def audio_envelope(path: Path, stop: float) -> list[float]:
    """Per 50 ms average absolute level after 16-kHz mono decoding; no third-party libs."""
    pipe = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-vn",
                           "-map", "0:a:0", "-t", str(stop),
                           "-af", "aresample=16000:async=0",
                           "-ar", "16000", "-ac", "1", "-f", "s16le", "-"],
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    pcm = array("h")
    pcm.frombytes(pipe.stdout[:len(pipe.stdout) // 2 * 2])
    block = 800
    levels = []
    for i in range(0, len(pcm) - block + 1, block):
        levels.append(sum(abs(s) for s in pcm[i:i + block]) / block)
    return levels


def corr(left: list[float], right: list[float]) -> float:
    n = min(len(left), len(right))
    if n < 20:
        return 0.0
    a = left[:n]
    b = right[:n]
    ma, mb = sum(a) / n, sum(b) / n
    numerator = sum((x-ma)*(y-mb) for x,y in zip(a,b))
    den = math.sqrt(sum((x-ma)**2 for x in a) * sum((y-mb)**2 for y in b))
    return numerator / den if den else 0.0


def make_final(video: Path, song: Path, dest: Path, frames: int, preset: str) -> None:
    seconds = frames / FPS
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Exact source MUSIC, only MP3->48kHz AAC transcode + last ~14 ms necessary
    # because a 30-fps visual master cannot be 21.080816 seconds long.
    audio_filter = f"[1:a:0]atrim=start=0:end={seconds:.9f},asetpts=PTS-STARTPTS,aresample=48000:async=0[a]"
    run(["ffmpeg", "-hide_banner", "-nostdin", "-y", "-v", "warning",
         "-i", str(video), "-i", str(song),
         "-filter_complex", audio_filter,
         "-map", "0:v:0", "-map", "[a]",
         "-frames:v", str(frames), "-r", str(FPS),
         "-c:v", "libx264", "-preset", preset, "-crf", "17",
         "-pix_fmt", "yuv420p", "-profile:v", "high",
         "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
         "-movflags", "+faststart", "-t", f"{seconds:.9f}",
         str(dest)])


def qa(video: Path, original: Path, finished: Path, report_path: Path,
       frames: int, width: int, height: int, test_mode: bool) -> dict:
    duration = frames / FPS
    data = probe(finished)
    vid, aud = stream(data, "video"), stream(data, "audio")
    format_duration = float(data["format"]["duration"])
    rate = Fraction(vid["avg_frame_rate"])
    frame_count = int(vid.get("nb_frames") or 0)
    checks = {
        "H264": vid["codec_name"] == "h264",
        "pixel_yuv420p": vid["pix_fmt"] == "yuv420p",
        "correct_dimensions": (vid["width"], vid["height"]) == (width, height),
        "30fps": rate == 30,
        "frame_count_exact": frame_count == frames,
        "runtime_tolerance": abs(format_duration - duration) < 0.09,
        "AAC": aud["codec_name"] == "aac",
        "audio_stereo": aud.get("channels") == 2,
        "audio_48k": int(aud["sample_rate"]) == 48000,
        "mp4_nonempty": finished.stat().st_size > 10000,
    }
    # Decoder check: missing media and damaged frames must fail release.
    run(["ffmpeg", "-hide_banner", "-nostdin", "-xerror", "-v", "error",
         "-i", str(finished), "-f", "null", "-"])
    # This compares the actual song's dynamic envelope to decoded output audio;
    # catches missing song, wrong song and substantial temporal offsets.
    original_env = audio_envelope(original, duration)
    produced_env = audio_envelope(finished, duration)
    music_match = corr(original_env, produced_env)
    checks["original_music_envelope"] = music_match >= 0.94
    # Spectrally dark cinematic car scenes can look black to this automated filter;
    # report possible full-black sections, never silently claim visual approval.
    scan = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(finished),
                           "-vf", "blackdetect=d=0.16:pix_th=0.018:pic_th=0.98",
                           "-an", "-f", "null", "-"],
                          text=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    checks["black_scan_executed"] = scan.returncode == 0
    black_intervals = re.findall(r"black_start:([\d.]+)\s+black_end:([\d.]+)", scan.stderr)
    sheet = report_path.with_name("cyber_f_contact_sheet.jpg")
    run(["ffmpeg", "-nostdin", "-v", "error", "-y",
         "-i", str(finished), "-vf",
         "fps=1,scale=270:480:force_original_aspect_ratio=decrease,"
         "pad=270:480:(ow-iw)/2:(oh-ih)/2,tile=5x5",
         "-frames:v", "1", "-q:v", "3", str(sheet)])
    report = {
        "project": "YUNEX CYBER//FUTURE 001",
        "agent": "F",
        "release": not test_mode,
        "visual_source": str(video),
        "original_music_sha256": sha(original),
        "original_song_fully_preserved_except_final_frame_trim": not test_mode,
        "song_duration_seconds": float(probe(original)["format"]["duration"]),
        "output": str(finished),
        "output_sha256": sha(finished),
        "output_size_bytes": finished.stat().st_size,
        "output_duration_seconds": format_duration,
        "output_frame_count": frame_count,
        "output_streams": {
            "vcodec": vid["codec_name"], "size": [vid["width"], vid["height"]],
            "rate": str(rate), "pixel_format": vid["pix_fmt"],
            "acodec": aud["codec_name"], "audio_hz": int(aud["sample_rate"]),
            "audio_channels": aud["channels"]
        },
        "original_music_envelope_correlation": round(music_match, 5),
        "possible_black_intervals_to_review": black_intervals,
        "contact_sheet": str(sheet),
        "automated_checks": checks,
        "human_review": "REQUIRED: view full film, verify every car/source identity, cuts at music drop and last frame; listen to complete final AAC.",
        "automated_pass": all(checks.values())
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--editor-video", type=Path, required=True,
                        help="Actual Agent E approved video (must contain real footage)")
    parser.add_argument("--original-mp3", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--qa-json", type=Path, required=True)
    parser.add_argument("--test-mode", action="store_true",
                        help="Allows synthetic smoke input; NOT a publishable final")
    parser.add_argument("--frames", type=int, default=FINAL_FRAMES)
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1920)
    parser.add_argument("--preset", default="slow",
                        choices=["fast", "medium", "slow", "slower"])
    args = parser.parse_args()
    for path in (args.editor_video, args.original_mp3):
        if not path.is_file():
            parser.error(f"Required input missing: {path}")
    if not args.test_mode and (args.frames, args.width, args.height) != (FINAL_FRAMES, 1080, 1920):
        parser.error("Release master must use 632 frames at 1080x1920/30fps")
    actual_song_sha = sha(args.original_mp3)
    if not args.test_mode and actual_song_sha != SONG_SHA256:
        parser.error(f"Wrong user soundtrack: expected {SONG_SHA256}, got {actual_song_sha}")
    visual = stream(probe(args.editor_video), "video")
    visual_rate = Fraction(visual["avg_frame_rate"])
    if visual_rate != FPS:
        parser.error(f"Editor film should be exactly 30fps, got {visual_rate}")
    if (visual["width"], visual["height"]) != (args.width, args.height):
        parser.error(f"Wrong editor geometry {visual['width']}x{visual['height']}")
    if float(probe(args.editor_video)["format"]["duration"]) + 0.01 < args.frames/FPS:
        parser.error("Editor source film shorter than requested timeline")
    make_final(args.editor_video, args.original_mp3, args.out, args.frames, args.preset)
    report = qa(args.editor_video, args.original_mp3, args.out, args.qa_json,
                args.frames, args.width, args.height, args.test_mode)
    print(json.dumps(report, indent=2))
    if not report["automated_pass"]:
        sys.exit("FAIL: output failed at least one automated QA gate")
    print("AUTOMATED QA PASS — manual playback still required before FINAL")


if __name__ == "__main__":
    main()
