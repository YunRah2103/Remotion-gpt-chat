#!/usr/bin/env python3
"""Fail-closed private Porsche Turbo film validation.

This is a release gate, NOT evidence that A supplied source media or D rendered
a film. Use --manifest with A's actual staged media, --video with the finished
17-second master, and --audio with the private uncommitted WAV.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parents[2]
WAV_SHA = "39b8d7eef63b1c67cb14108484de8a63508149f64b6d3b84b7f7252dcd0bcdc9"
ORDER = ["930"]*4 + ["964"]*4 + ["993"]*4 + ["996"]*4 + ["997"]*4 + ["991"]*5 + ["992"]*5

def failure(msg: str) -> None:
    raise ValueError(msg)

def probe(path: Path) -> dict:
    command = ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    return json.loads(result.stdout)

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024*1024), b""):
            h.update(block)
    return h.hexdigest()

def check_audio(path: Path) -> dict:
    if not path.is_file():
        failure("Private master WAV missing: " + str(path))
    actual = digest(path)
    if actual != WAV_SHA:
        failure("Private WAV SHA256 mismatch")
    meta = probe(path)
    aud = next((s for s in meta["streams"] if s["codec_type"] == "audio"), None)
    if not aud or aud["codec_name"] != "pcm_s24le" or int(aud["sample_rate"]) != 48000 or aud["channels"] != 2:
        failure("Private WAV is not 48kHz, stereo, 24-bit PCM")
    if abs(float(meta["format"]["duration"]) - 17.) > .003:
        failure("Private WAV must be precisely 17 seconds")
    return {"audioSha256": actual, "audioStatus": "PASS"}

def check_manifest(path: Path, media_dir: Path) -> dict:
    if not path.is_file():
        failure("Agent A footage manifest missing: " + str(path))
    data = json.loads(path.read_text(encoding="utf-8"))
    shots = data.get("shots", [])
    if len(shots) != 30:
        failure("30 actual Porsche clips required: got " + str(len(shots)))
    if data.get("status") == "planning_template_no_footage":
        failure("Cannot render from a placeholder manifest")
    seen_keys, seen_fingerprints = set(), set()
    for i, shot in enumerate(shots):
        slot = i+1
        if shot.get("slot") != slot or shot.get("generation") != ORDER[i]:
            failure("Wrong Turbo chronology on beat " + str(slot))
        if shot.get("verifiedMovingVideo") is not True or shot.get("uniqueAngleVerified") is not True:
            failure("Real moving unique shot not verified on beat " + str(slot))
        identity = shot.get("actualTurboIdentityEvidence")
        if not isinstance(identity, str) or not identity.strip():
            failure("Porsche Turbo identity unverified on beat " + str(slot))
        key = shot.get("shotKey")
        fingerprint = shot.get("visualFingerprint")
        if not key or key in seen_keys or not fingerprint or fingerprint in seen_fingerprints:
            failure("Repeated camera/content fingerprint at beat " + str(slot))
        seen_keys.add(key); seen_fingerprints.add(fingerprint)
        sha = shot.get("sha256")
        if not isinstance(sha, str) or len(sha) != 64 or any(c not in "0123456789abcdefABCDEF" for c in sha):
            failure("Missing original SHA256 on beat " + str(slot))
        local = shot.get("file") or shot.get("sourceFileLocal")
        if not local or Path(local).is_absolute() or ".." in Path(local).parts:
            failure("Local staged video path missing/unsafe on beat " + str(slot))
        source_path = (media_dir/local).resolve()
        if not source_path.is_relative_to(media_dir.resolve()) or not source_path.is_file():
            failure("Cannot open actual source video on beat " + str(slot) + ": " + str(source_path))
        if digest(source_path).lower() != sha.lower():
            failure("Video bytes differ from Agent A manifest on beat " + str(slot))
        p = probe(source_path)
        video = next((s for s in p["streams"] if s.get("codec_type") == "video"), None)
        if not video or int(video.get("width", 0)) < 480 or int(video.get("height", 0)) < 360:
            failure("Unusable source clip on beat " + str(slot))
        if float(p["format"].get("duration", 0)) < .3:
            failure("Source video is too short for beat " + str(slot))
    return {"mediaStatus": "PASS", "uniqueTurboViews": 30, "generations": ["930","964","993","996","997","991","992"]}

def check_video(path: Path) -> dict:
    if not path.is_file():
        failure("Master MP4 was not created: " + str(path))
    meta = probe(path)
    video = next((s for s in meta["streams"] if s.get("codec_type") == "video"), None)
    audio = next((s for s in meta["streams"] if s.get("codec_type") == "audio"), None)
    if not video or video.get("codec_name") != "h264":
        failure("Master video is not H.264")
    if (video.get("width"), video.get("height")) != (1080,1920):
        failure("Master is not 1080x1920")
    if video.get("avg_frame_rate") != "30/1" or int(video.get("nb_frames", -1)) != 510:
        failure("Master must be exactly 510 frames at 30fps")
    if not audio or audio.get("codec_name") != "aac" or audio.get("sample_rate") != "48000" or audio.get("channels") != 2:
        failure("Missing 48k stereo AAC soundtrack")
    if abs(float(meta["format"]["duration"]) - 17) > .085:
        failure("Master duration outside 17.0s tolerance")
    subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-xerror", "-i", str(path),
                    "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"],
                   check=True, capture_output=True, text=True)
    return {
      "masterStatus": "PASS", "frames": 510, "duration": float(meta["format"]["duration"]),
      "width": 1080, "height": 1920, "fps": 30, "videoCodec": "h264",
      "audioCodec": "aac", "sha256": digest(path),
      "bitrate": int(meta["format"].get("bit_rate", 0))
    }

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", type=Path, help="Private master WAV (never commit)")
    parser.add_argument("--manifest", type=Path, help="Agent A verified manifest JSON")
    parser.add_argument("--media-dir", type=Path, help="Private staged source videos folder")
    parser.add_argument("--video", type=Path, help="Rendered final H264/AAC MP4")
    args = parser.parse_args()
    results = {"task": "porsche-911-turbo-evolution-001", "gate": "Agent D actual-media master gate"}
    try:
        if not args.audio and not args.manifest and not args.video:
            failure("No media supplied. Planning and diagnostic renders are not a finished film.")
        if args.audio: results.update(check_audio(args.audio))
        if args.manifest:
            if not args.media_dir:failure("--media-dir required with --manifest")
            results.update(check_manifest(args.manifest, args.media_dir))
        if args.video: results.update(check_video(args.video))
        if not (args.audio and args.manifest and args.video):
            failure("Release requires all three: original WAV, 30 verified moving Turbo clips, 510-frame master")
        results["status"] = "PASS"
        print(json.dumps(results, indent=2))
        return 0
    except (ValueError, subprocess.CalledProcessError, OSError, KeyError) as error:
        results["status"] = "BLOCKED"
        results["reason"] = str(error)
        print(json.dumps(results, indent=2))
        return 2

if __name__ == "__main__":
    sys.exit(main())
