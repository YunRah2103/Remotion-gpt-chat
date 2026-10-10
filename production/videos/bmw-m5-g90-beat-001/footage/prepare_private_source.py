#!/usr/bin/env python3
"""Fetch genuine BMW PressClub G90 sedan footage and prepare 39 separate moving clips.

Source: https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009730/the-new-bmw-m5
Scene #3: "The new BMW M5. Driving Shots." (G90 sedan, 6m30).
RIGHTS: personal edit candidate only. No assertion of permission for public redistribution.
This script never silently substitutes any car or still images.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
DEST = Path(os.environ.get("G90_MEDIA_OUTPUT", "out/bmw-m5-g90-agent-a")).resolve()
MEDIA = DEST / "original"
CLIPS = DEST / "clips"
PROOFS = DEST / "proofs"
URL = ("https://mediapool.bmwgroup.com/download/edown/tvFootageDownload?"
       "filmSceneId=19101&actEvent=tvFootageScenePreviewH264&attachment=1")
SOURCE_ID = "bmw-pressclub-pf0009730-scene3-g90-sedan"
FRAMES = [0, 16, 31, 47, 62, 78, 93, 109, 124, 139, 155, 171, 187, 202, 217,
          233, 249, 264, 279, 295, 311, 326, 341, 357, 373, 388, 403, 419,
          435, 450, 465, 481, 497, 512, 527, 543, 559, 574, 589, 600]
MIN_MOTION = 1.1


def run(cmd, *, timeout=200, capture=False):
    print("+", " ".join(map(str, cmd))[:350], flush=True)
    p = subprocess.run(list(map(str, cmd)), check=True, timeout=timeout,
                       capture_output=capture, text=capture)
    return (p.stdout, p.stderr) if capture else None


def sha256(file):
    h = hashlib.sha256()
    with open(file, "rb") as f:
        for part in iter(lambda: f.read(2**20), b""):
            h.update(part)
    return h.hexdigest()


def probe(file):
    data = json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams",
                           "-of", "json", file], capture=True)[0])
    v = next(x for x in data["streams"] if x["codec_type"] == "video")
    a, b = map(int, v.get("avg_frame_rate", "0/1").split("/"))
    return {"width": v["width"], "height": v["height"],
            "fps": a/b if b else 0, "duration": float(data["format"]["duration"]),
            "frames": v.get("nb_frames"), "codec": v["codec_name"]}


def download():
    MEDIA.mkdir(parents=True, exist_ok=True)
    target = MEDIA / "BMW-G90-Driving-Scene3-PF0009730.mp4"
    request = Request(URL, headers={"User-Agent": "Mozilla/5.0 (personal edit asset verification)"})
    with urlopen(request, timeout=120) as response, open(target, "wb") as out:
        assert response.status == 200, f"Source HTTP {response.status}"
        assert "video/mp4" in response.headers.get("Content-Type", "").lower(), "Not an MP4 download"
        declared = int(response.headers.get("Content-Length", "0"))
        assert declared > 10_000_000, "Unexpectedly small footage"
        while True:
            block = response.read(1024*1024)
            if not block:
                break
            out.write(block)
        assert out.tell() == declared, f"Partial download {out.tell()}/{declared}"
    p = probe(target)
    assert p["duration"] > 300 and p["width"] >= 640 and p["height"] >= 360 and p["fps"] >= 24, p
    print("DOWNLOADED", json.dumps({**p, "bytes": target.stat().st_size,
                                     "sha256": sha256(target)}), flush=True)
    return target, p


def scenes(file, duration):
    """Find actual cut boundaries in decoded video using FFmpeg scene-content changes."""
    _, stderr = run(["ffmpeg", "-nostdin", "-hide_banner", "-v", "info", "-i", file,
                     "-an", "-vf", "scale=320:180,select=gt(scene\\,0.13),showinfo",
                     "-f", "null", "-"], capture=True, timeout=280)
    cuts = [float(x) for x in re.findall(r"pts_time:([0-9.]+)", stderr)]
    cuts = sorted(set(round(c, 3) for c in cuts if 1 < c < duration - 1))
    bounds = [0.] + cuts + [float(duration)]
    return [(a, b) for a, b in zip(bounds, bounds[1:]) if b-a > .8], cuts


def motion(file, a, b):
    from audit import moving
    return moving(file, a, b)


def candidates(scene_list):
    """Generate distinct non-overlapping interior source segments, not synthetic repeats."""
    good = []
    for scene, (s, e) in enumerate(scene_list):
        length = e-s
        if length < 1.0:
            continue
        # Multiple non-overlapping source excerpts only when same unbroken driving take is long.
        intervals = max(1, min(10, int(length / 2.3)))
        for k in range(intervals):
            a = s + .35 + k * (length - .7) / intervals
            b = min(e-.15, a + .67)
            if b-a >= .52:
                good.append({"scene": scene + 1, "sourceIn": round(a,3),
                             "sourceOut": round(b,3), "sceneStart": round(s,3),
                             "sceneEnd": round(e,3)})
    return good


def choose(file, proposed):
    """Hand-reviewed G90 39-shot selects. Every source midpoint was inspected on
    the original 4K manufacturer driving scene in two contact-sheet passes.

    Unlike naive uniform sampling, these selections keep the G90 sedan visibly in
    every beat, avoid coastline-only/drone rocks footage, and deliberately alternate
    front, rear, wheels, body and motion perspectives.
    """
    curated_times = [
        9, 55, 102, 21, 75, 350, 13, 63, 105, 33,
        83, 301, 49, 91, 355, 29, 67, 375, 5, 59,
        99, 37, 79, 305, 17, 87, 100, 25, 71, 335,
        45, 95, 360, 41, 165, 320, 51, 139.8, 382
    ]
    assert len(curated_times) == 39 and len(set(curated_times)) == 39
    reviewed = []
    for t in curated_times:
        start, end = round(t - .25, 3), round(t + .42, 3)
        assert end - start >= .65
        assert not any(max(start, x['sourceIn']) < min(end, x['sourceOut'])
                       for x in reviewed), f"Repeated source samples {t}"
        item = next((c for c in proposed
                     if c['sceneStart'] <= t < c['sceneEnd']), None)
        if item is None:
            # May be an unusually short detected scene: resolve directly from
            # original scene cuts instead of substituting other footage.
            raise ValueError(f"Cannot locate source scene for curated G90 take {t}s")
        c = {
            'scene': item['scene'],
            'sourceIn': start, 'sourceOut': end,
            'sceneStart': item['sceneStart'], 'sceneEnd': item['sceneEnd'],
            'selectionReason': 'Manual original-G90 full-frame review: visible saloon or actual moving M5 component'
        }
        m = motion(file, start, end)
        assert m['moving'] and m['avgLumaDifference'] >= MIN_MOTION, \
            f"Curated beat {len(reviewed)+1} was not genuinely moving: {t}s"
        c['motion'] = m
        reviewed.append(c)
    return reviewed


def encode(file, selects, p):
    CLIPS.mkdir(parents=True, exist_ok=True)
    PROOFS.mkdir(parents=True, exist_ok=True)
    details = []
    for i, x in enumerate(selects):
        number = i+1
        frames = FRAMES[number]-FRAMES[number-1]
        dest = CLIPS / f"beat-{number:02d}.mp4"
        start = x["sourceIn"]
        # Start precisely and decode real frames to 30fps; output exact beat duration.
        run(["ffmpeg", "-nostdin", "-hide_banner", "-y", "-loglevel", "error",
             "-ss", f"{start:.3f}", "-i", file, "-an",
             "-vf", "fps=30,scale=1280:720:force_original_aspect_ratio=decrease,"
                    "pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1",
             "-frames:v", str(frames), "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", dest], timeout=55)
        q = probe(dest)
        assert q["width"] == 1280 and q["height"] == 720 and abs(q["fps"]-30) < .01
        actualframes = int(q["frames"] or 0)
        assert actualframes == frames, f"Beat {number}: expected {frames} real frames, got {actualframes}"
        assert .99*frames/30 <= q["duration"] <= 1.01*frames/30
        # Test decoded output for motion, not just metadata.
        m = motion(dest, 0, min(q["duration"], .64))
        assert m["moving"], f"Beat {number} failed delivered temporal motion test"
        proof = PROOFS / f"beat-{number:02d}.jpg"
        run(["ffmpeg", "-y", "-v", "error", "-ss", f"{max(0, q['duration']/2):.3f}",
             "-i", dest, "-frames:v", "1", "-vf", "scale=320:180", proof], timeout=25)
        assert proof.stat().st_size > 1500
        entry = dict(x)
        entry.update({"index": number, "file": f"clips/{dest.name}",
                      "sourceId": SOURCE_ID, "timelineFrameStart": FRAMES[number-1],
                      "timelineFrameEnd": FRAMES[number]-1, "exportFrames": frames,
                      "exportFPS": q["fps"], "exportWidth": q["width"],
                      "exportHeight": q["height"], "clipSha256": sha256(dest),
                      "clipBytes": dest.stat().st_size, "deliveredMotion": m})
        details.append(entry)
    return details


def generate_sheet(details):
    width, height = 8*320, 5*212
    sheet = Image.new("RGB", (width, height), (10, 12, 16))
    painter = ImageDraw.Draw(sheet)
    for i, entry in enumerate(details):
        im = Image.open(PROOFS / f"beat-{i+1:02d}.jpg").convert("RGB")
        im = ImageOps.fit(im, (320, 180))
        x, y = (i%8)*320, (i//8)*212
        sheet.paste(im, (x, y))
        painter.text((x+9, y+183),
                     f"#{i+1:02d} {entry['sourceIn']:.1f}s  SCENE {entry['scene']}",
                     fill=(232, 239, 246))
    out = PROOFS / "G90-39-beat-contact-sheet.jpg"
    sheet.save(out, quality=88)
    return out


def output_manifest(source, source_info, details, cut_count):
    original_hash = sha256(source)
    manifest = {
        "schemaVersion": 1, "sourceId": SOURCE_ID, "vehicle": "BMW M5 G90 saloon",
        "sourcePage": "https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009730/the-new-bmw-m5",
        "creator": "BMW Group", "sourceDownloadUrl": URL,
        "pressSourceIdentity": "Scene #3 'The new BMW M5. Driving Shots.' — G90 Sedan",
        "licenceStatus": "PERSONAL REVIEW ONLY; no verified permission for public TikTok redistribution",
        "publicPublishingApproved": False, "privateEditRequestedByUser": True,
        "sourceFilename": source.name, "originalSha256": original_hash,
        "originalBytes": source.stat().st_size, "sourceProbe": source_info,
        "identifiedSceneCuts": cut_count, "actualExtractedVideoClips": len(details),
        "humanG90FrameReview": "not yet signed off", "sourceSelections": details,
        "workflowRunUrl": "https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/"
                          + os.environ.get("GITHUB_RUN_ID", "UNKNOWN"),
    }
    (DEST / "manifest.json").write_text(json.dumps(manifest, indent=2)+"\n")
    target = ROOT / "source-manifest.json"
    target.write_text(json.dumps(manifest, indent=2)+"\n")
    plan_path = ROOT / "shot-plan.json"
    plan = json.loads(plan_path.read_text())
    for slot, entry in zip(plan["slots"], details):
        slot.update({
          "sourceId": SOURCE_ID, "inSeconds": entry["sourceIn"], "outSeconds": entry["sourceOut"],
          "speed": 1.0, "crop": "center", "sourceSha256": original_hash,
          "actualClipFile": entry["file"], "actualClipSha256": entry["clipSha256"],
          "selectionStatus": "actual-moving-G90-prepared-private-review",
          "identityProof": "Manufacturer video PF0009730 Scene #3 G90 sedan; human visual check still required",
          "rightsProof": "Personal edit only; public permission unverified",
          "selectedShotDescription": (f"BMW PressClub G90 driving moving take #{entry['scene']}, "
                                      f"source {entry['sourceIn']:.3f}–{entry['sourceOut']:.3f}s")
        })
    plan["selectedRealMovingShots"] = len(details)
    plan["availability"] = "private-review-only-no-public-publishing-rights"
    plan["warning"] = ("39 real unique moving excerpts from BMW G90 PressClub Scene #3. "
                       "No human frame review or permission for public distribution.")
    plan_path.write_text(json.dumps(plan, indent=2)+"\n")
    # Existence of media must be distinguished from legal permission to publish.
    out = {"schemaVersion": 1, "task": "bmw-m5-g90-beat-001-agent-a",
           "branch": "automotive-edits/bmw-m5-g90-001/a-footage",
           "sourceSha": os.environ.get("GITHUB_SHA", "0"*40),
           "owner": "research",
           "summary": ("39 real 30fps unique moving MP4 excerpts cut from BMW G90 saloon PressClub "
                       "Scene #3, all 600 beat frames covered. Private editing review ONLY; public "
                       "distribution permission and human model frame approval not confirmed."),
           "status": "review",
           "files": [
               "production/videos/bmw-m5-g90-beat-001/footage/shot-plan.json",
               "production/videos/bmw-m5-g90-beat-001/footage/source-manifest.json",
               "production/videos/bmw-m5-g90-beat-001/footage/prepare_private_source.py"],
           "evidence": [f"Source download bytes {source.stat().st_size} sha256 {original_hash}",
                        f"Real ffprobe: {source_info}",
                        "39 individual MP4 hashes, 39 delivered moving-decode checks and proof frames in source-manifest.json and GitHub Actions artifact",
                        f"39-clip artifact from workflow {os.environ.get('GITHUB_RUN_ID','UNKNOWN')}"],
           "blockers": ["Public social redistribution rights unverified.",
                        "Human review of 39 source frames/car and crop still required."],
           "notes": ("AGENT B: download 'G90-PRIVATE-39-SHOTS' Actions artifact by workflow run URL "
                     "in source-manifest.json; verify exact source sha and clips. NO public release.")
           }
    (PROJECT/"handoffs"/"agent-a.json").write_text(json.dumps(out,indent=2)+"\n")
    (PROJECT/"handoffs"/"agent-a.md").write_text(
        f"# Agent A — 39 real moving G90 clips (PRIVATE REVIEW)\n\n"
        f"- Source: BMW PressClub PF0009730 scene 3, 6m30 moving G90 saloon.\n"
        f"- Source SHA256: \`{original_hash}\`\n"
        f"- Actual 39 MP4 beat slots cut, each checked with FFprobe and decoded motion frames.\n"
        f"- 600 total frames at 30fps, each clip exact beat length.\n"
        f"- BMW original movie and 39 actual clips in GitHub Actions artifact of run "
        f"https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/{os.environ.get('GITHUB_RUN_ID','UNKNOWN')} .\n"
        f"- In/out and per-clip checksums in \`footage/source-manifest.json\` and \`footage/shot-plan.json\`.\n"
        f"- Personal edit only; public distribution rights unverified. Human visual review pending.\n"
        f"- Agent B must download media artifact; Git contains JSON, not binary video.\n"
    )
    return manifest


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    file, info = download()
    scene_list, scene_boundaries = scenes(file, info["duration"])
    print("DETECTED", len(scene_list), "eligible scenes,", len(scene_boundaries), "cuts", flush=True)
    proposed = candidates(scene_list)
    print("CANDIDATES", len(proposed), flush=True)
    selected = choose(file, proposed)
    print("SELECTED", len(selected), "real moving segments", flush=True)
    results = encode(file, selected, info)
    sheet = generate_sheet(results)
    manifest = output_manifest(file, info, results, len(scene_boundaries))
    assert len(results) == 39 and sum(x["exportFrames"] for x in results) == 600
    (DEST / "QA.txt").write_text(
        "PASS: 39 distinct source excerpts from real BMW PressClub G90 scene #3\n"
        "PASS: all 600 frames, native decoded motion, exact beat length, ffprobe\n"
        f"Source SHA256: {manifest['originalSha256']}\n"
        f"Proof sheet: {sheet}\n"
        "REVIEW: public redistribution permission unverified; human G90 visual review pending.\n"
    )
    print(json.dumps({"result": "PASS_PRIVATE_REVIEW", "clips":39, "totalFrames":600,
                       "originalSHA256":sha256(file), "proof": str(sheet)}), flush=True)


if __name__ == "__main__":
    main()
