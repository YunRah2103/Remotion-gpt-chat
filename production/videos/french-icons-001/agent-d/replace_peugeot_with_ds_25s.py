#!/usr/bin/env python3
"""French Legends 25s — replace weak Peugeot at frames 182..211 with real Citroen DS Paris.

Source media and the user's soundtrack stay private; pass local exact media paths.
The rest of the 25s video is frame-aligned, and 48k AAC music+engine track
is stream-copied bit for bit. Requires ffmpeg and ffprobe.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

FPS = 30
TOTAL = 750
REPLACE_FIRST = 182
REPLACE_END = 212
SOURCE_MOVIE_SHA256 = "901b52b5a9e227414f1d7bf73ac3fd3b4c3e8a0c612338ab2cfdecfa608fd202"
DS_CLIP_SHA256 = "d953c1e47a52be0f4ec1826d8a38607d01667a02b00090d102e9f3b397e6b19d"


def run(argv):
    p = subprocess.run(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode:
        raise RuntimeError(p.stderr[-4000:])
    return p.stdout


def sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1048576), b""):
            h.update(chunk)
    return h.hexdigest()


def probe(path):
    return json.loads(run(["ffprobe", "-v", "error", "-count_frames", "-show_streams",
                           "-show_format", "-of", "json", str(path)]))


def audio_sha(mp4, temp_file):
    run(["ffmpeg", "-y", "-v", "error", "-nostdin", "-i", str(mp4), "-map", "0:a:0",
         "-c:a", "copy", "-f", "adts", str(temp_file)])
    return sha(temp_file)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", required=True, type=Path, help="Previously approved 25s 1080p with engines")
    ap.add_argument("--ds", required=True, type=Path, help="Actual ds-paris-black-rear-night-drive.mp4 from canonical source ZIP")
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--qa", type=Path, help="JSON result path")
    args = ap.parse_args()

    for path, expected in ((args.input, SOURCE_MOVIE_SHA256), (args.ds, DS_CLIP_SHA256)):
        actual = sha(path)
        if actual != expected:
            raise ValueError(f"Wrong source {path}, expected {expected}, got {actual}")

    inp = probe(args.input)
    video = next(s for s in inp["streams"] if s["codec_type"] == "video")
    if (video["width"], video["height"], video.get("nb_read_frames"),
        round(float(inp["format"]["duration"]), 3)) != (1920, 1080, "750", 25.0):
        raise ValueError("Expected existing exact 25-second 1920x1080 750-frame edit")

    graph = (
        "[0:v]trim=start_frame=0:end_frame=182,setpts=PTS-STARTPTS,fps=30,format=yuv420p[before];"
        "[1:v]trim=start_frame=0:end_frame=18,setpts=(PTS-STARTPTS)*1.333333333,"
        "fps=30,tpad=stop_mode=clone:stop_duration=0.15,"
        "trim=start_frame=0:end_frame=30,setsar=1,format=yuv420p[ds];"
        "[0:v]trim=start_frame=212:end_frame=750,setpts=PTS-STARTPTS,"
        "fps=30,format=yuv420p[after];"
        "[before][ds][after]concat=n=3:v=1:a=0,format=yuv420p[out]"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-y", "-v", "error", "-nostdin",
         "-i", str(args.input), "-i", str(args.ds),
         "-filter_complex", graph, "-map", "[out]", "-map", "0:a:0",
         "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p",
         "-r", "30", "-c:a", "copy", "-movflags", "+faststart",
         "-video_track_timescale", "30000", str(args.output)])
    out = probe(args.output)
    s = next(s for s in out["streams"] if s["codec_type"] == "video")
    a = next(s for s in out["streams"] if s["codec_type"] == "audio")
    if not (s["codec_name"] == "h264" and s["width"] == 1920 and s["height"] == 1080
            and int(s.get("nb_read_frames", 0)) == TOTAL and a["codec_name"] == "aac"
            and a["sample_rate"] == "48000"
            and abs(float(out["format"]["duration"]) - 25) < .03):
        raise RuntimeError("Final MP4 stream and exact frame/duration check failed")

    from tempfile import TemporaryDirectory
    with TemporaryDirectory() as temp:
        oldaudio = audio_sha(args.input, Path(temp) / "before.aac")
        newaudio = audio_sha(args.output, Path(temp) / "after.aac")
    if oldaudio != newaudio:
        raise RuntimeError("Original song + authentic engine cues have changed")

    # Entire final video and audio must be fully decodable.
    run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(args.output), "-f", "null", "-"])
    result = {
        "status": "PASS", "final_sha256": sha(args.output),
        "output": str(args.output), "duration": float(out["format"]["duration"]),
        "frames": int(s["nb_read_frames"]), "width": s["width"], "height": s["height"],
        "replaced_original_model": "Peugeot 205 GTI", "replacement": "Citroen DS in Paris at night",
        "replacement_frames": [REPLACE_FIRST, REPLACE_END],
        "original_music_and_engine_audio_sha256": oldaudio,
        "final_audio_sha256": newaudio,
        "music_and_engine_mix_preserved_exactly": True,
        "publishing_rights": "Not cleared; review creator/footage rights before publishing"
    }
    if args.qa:
        args.qa.parent.mkdir(parents=True, exist_ok=True)
        args.qa.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
