#!/usr/bin/env python3
"""Download directly linked, publisher-hosted Huracán STO research footage.

All identity and reuse decisions remain PENDING until manual inspection.
No URL guessing, anti-bot circumvention, or false full-resolution claims.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageStat

ROOT = Path("out/sto-footage-a")
SOURCES = [
    ("phantom-sto-primary", "Phantom Rent a Car",
     "https://phantomrentcar.com/car/lamborghini-huracan-sto/",
     "https://phantommedia.sgp1.cdn.digitaloceanspaces.com/Phantom-Footer-Videos/2022/04/Rent-Lamborghini-Huracan-STO-In-Dubai.mp4"),
    ("phantom-sto-lambo", "Phantom Rent a Car",
     "https://phantomrentcar.com/car/lamborghini-huracan-sto/",
     "https://phantommedia.sgp1.cdn.digitaloceanspaces.com/Phantom-Footer-Videos/2022/04/STO-LAMBO-VIDEO-.mp4"),
    ("phantom-sto-huracan", "Phantom Rent a Car",
     "https://phantomrentcar.com/car/lamborghini-huracan-sto/",
     "https://phantommedia.sgp1.cdn.digitaloceanspaces.com/Phantom-Footer-Videos/2022/04/Lamborghini-Huracan-STO.mp4"),
    ("phantom-unknown-video", "Phantom Rent a Car",
     "https://phantomrentcar.com/car/lamborghini-huracan-sto/",
     "https://phantommedia.sgp1.cdn.digitaloceanspaces.com/Phantom-Footer-Videos/2022/02/WhatsApp-Video-2022-02-09-at-6.00.29-PM.mp4"),
    ("monaco-island-sto-720", "Monaco Island",
     "https://www.monacoisland.io/post/lamborghini-hurac%C3%A1n-sto-super-trofeo-omologata",
     "https://video.wixstatic.com/video/ef7c1e_9bf925ada5ce445fb60a02a29fd3ce91/720p/mp4/file.mp4")
]

# Portrait-only 720x1280 LA Modz workshop videos were inspected previously.
# Excluded from new acquisition because the user locked 16:9 LANDSCAPE source and output.
# Historical candidate IDs: 2882, 2881, 2880, 2891, 2892, 2893.

VALID_HOSTS = {"phantommedia.sgp1.cdn.digitaloceanspaces.com", "video.wixstatic.com", "lamodz.co.uk"}
MAX_SOURCE_BYTES = 180 * 1024 * 1024
MAX_TOTAL_BYTES = 480 * 1024 * 1024


def run(args, timeout=90):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=timeout)


def hash_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch_video(url, dest):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in VALID_HOSTS:
        raise ValueError("Unexpected source URL")
    headers = {"User-Agent": "Mozilla/5.0 (compatible; STO-QA/1.0)"}
    request = urllib.request.Request(url, headers=headers)
    n = 0
    with urllib.request.urlopen(request, timeout=25) as response:
        location = urllib.parse.urlsplit(response.geturl())
        if location.scheme != "https" or location.hostname not in VALID_HOSTS:
            raise ValueError("Source redirected off trusted video CDN")
        if int(response.headers.get("Content-Length", "0") or 0) > MAX_SOURCE_BYTES:
            raise ValueError("Source exceeds 180 MiB bound")
        with dest.open("wb") as output:
            while True:
                buf = response.read(1024 * 1024)
                if not buf:
                    break
                n += len(buf)
                if n > MAX_SOURCE_BYTES:
                    raise ValueError("Source exceeds 180 MiB bound")
                output.write(buf)
    if n < 10000:
        raise ValueError("Downloaded file too small for video")
    return n


def inspect(src):
    data = json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams",
                           "-of", "json", str(src)], 40).stdout)
    vids = [s for s in data.get("streams", []) if s.get("codec_type") == "video"]
    if not vids:
        raise ValueError("No decoded video stream")
    v = vids[0]
    width, height = int(v["width"]), int(v["height"])
    dur = float(v.get("duration") or data["format"].get("duration") or 0)
    n, d = (v.get("avg_frame_rate") or "0/1").split("/")
    fps = float(n) / float(d) if float(d) else 0
    # Selected footage must be 16:9 LANDSCAPE, not portrait source forced to fit.
    cropw, croph = min(width, int(height * 16 / 9)), min(height, int(width * 9 / 16))
    cropw -= cropw % 2
    croph -= croph % 2
    if width < height:
        landscape_quality = "REJECT_PORTRAIT_SOURCE"
    elif cropw >= 1920 and croph >= 1080:
        landscape_quality = "FULL_HD_LANDSCAPE_OR_BETTER"
    elif cropw >= 1280 and croph >= 720:
        landscape_quality = "BELOW_1080P_LANDSCAPE_REVIEW_ONLY"
    else:
        landscape_quality = "REJECT_LOW_RESOLUTION_SOURCE"
    return {
        "output_canvas": [1920, 1080],
        "output_aspect": "16:9 landscape",
        "actual_resolution": [width, height],
        "actual_fps": round(fps, 3),
        "actual_duration_seconds": round(dur, 3),
        "container_bitrate": int(data["format"].get("bit_rate") or 0),
        "codec": v.get("codec_name"),
        "landscape_crop_source_pixels": [cropw, croph],
        "landscape_quality": landscape_quality,
        "technical_candidate": bool(dur >= 1 and fps >= 23 and width >= 1280
                                    and height >= 720 and width > height)
    }


def frame(src, when, meta, crop, output):
    width, height = meta["actual_resolution"]
    cw, ch = meta["landscape_crop_source_pixels"]
    x = {"left": 0, "center": (width - cw) // 2, "right": width - cw}[crop]
    y = (height - ch) // 2
    filt = f"crop={cw}:{ch}:{x}:{y},scale=384:216:flags=lanczos"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{when:.3f}",
         "-i", str(src), "-vf", filt, "-frames:v", "1", str(output)], 50)


def proof(src, meta, outpath, prefix):
    duration = meta["actual_duration_seconds"]
    timestamps = [round(max(.03, duration * q), 3) for q in (.10, .30, .50, .70, .90)]
    labels = ["left", "center", "right"]
    contact = Image.new("RGB", (3 * 384, 5 * 242), "#101010")
    pen = ImageDraw.Draw(contact)
    centers = []
    for i, time in enumerate(timestamps):
        for j, position in enumerate(labels):
            filename = outpath.parent / f".{prefix}-{i}-{j}.png"
            try:
                frame(src, time, meta, position, filename)
                with Image.open(filename) as im:
                    contact.paste(im.convert("RGB"), (j * 384, i * 242 + 24))
                    if position == "center":
                        centers.append(im.convert("RGB").resize((142, 80)))
            except Exception:
                pen.text((j * 384 + 5, i * 242 + 60), "FRAME ERROR", fill="red")
            finally:
                filename.unlink(missing_ok=True)
            pen.text((j * 384 + 6, i * 242 + 5), f"{time:.2f}s {position}", fill="white")
    contact.save(outpath, optimize=True)
    changes = []
    for one, two in zip(centers, centers[1:]):
        diff = ImageChops.difference(one, two)
        changes.append(round(sum(ImageStat.Stat(diff).mean) / 3, 2))
    return {"sample_times": timestamps, "mean_sample_pixel_differences": changes,
            "possibly_static": bool(changes and max(changes) < 3),
            "preview": str(outpath.relative_to(ROOT))}


def detect_scene_changes(src, meta):
    # Scene cut scores are PROPOSALS, not certification of camera-angle uniqueness.
    try:
        args = ["ffmpeg", "-hide_banner", "-i", str(src), "-t",
                str(min(meta["actual_duration_seconds"], 65)), "-vf",
                "scale=320:-1,select='gt(scene,0.32)',showinfo",
                "-an", "-f", "null", "-"]
        output = run(args, 150).stderr
        times = re.findall(r"pts_time:([0-9]+(?:\.[0-9]+)?)", output)
        return [round(float(t), 3) for t in times][:45]
    except Exception:
        return []


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "sources").mkdir(exist_ok=True)
    (ROOT / "previews").mkdir(exist_ok=True)
    report = {
        "project": "Huracan-STO-V10-001 Agent A",
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "required_final_format": "1920x1080 landscape 16:9, 30 fps, 316 frames",
        "status": "RESEARCH_ACQUISITION_UNVERIFIED",
        "identity_approved_angle_count": 0,
        "purpose": "16:9 landscape candidate acquisition and real FFprobe QA, not final approval",
        "sources": [],
        "manual_gate_requirements": [
            "Inspect all frames; STO identification for every selected shot",
            "10 or more genuinely distinct moving camera angles",
            "Frame the car in 16:9 landscape without unintended clipping",
            "Verify original soundtrack is not mistaken for genuine STO engine audio",
            "Obtain publishing rights and confirm uploader authority separately"
        ],
    }
    cumulative = 0
    for ident, publisher, page, media in SOURCES:
        item = {"id": ident, "publisher": publisher, "source_page": page,
                "direct_video": media, "identity": "UNVERIFIED",
                "rights": "NOT CONFIRMED",
                "distinct_angle_count_approved": 0}
        dest = ROOT / "sources" / f"{ident}.mp4"
        try:
            if cumulative >= MAX_TOTAL_BYTES:
                raise ValueError("Package total media cap reached")
            count = fetch_video(media, dest)
            cumulative += count
            meta = inspect(dest)
            if not meta["technical_candidate"]:
                raise ValueError("Decoded but technically too short or slow")
            item.update({"state": "ACQUIRED_AND_PROBED", "bytes": count,
                         "sha256": hash_file(dest), "ffprobe": meta})
            item["scene_change_time_proposals"] = detect_scene_changes(dest, meta)
            try:
                item["visual_evidence"] = proof(dest, meta, ROOT / "previews" / f"{ident}.jpg", ident)
            except Exception as ex:
                item["preview_error"] = str(ex)
        except Exception as error:
            dest.unlink(missing_ok=True)
            item.update({"state": "FAILED_OR_REJECTED", "error": str(error)[:600]})
        report["sources"].append(item)
        print(f"{ident}: {item['state']} {item.get('error','')}", flush=True)

    good = [it for it in report["sources"] if it["state"] == "ACQUIRED_AND_PROBED"]
    report["real_downloaded_source_count"] = len(good)
    report["acquired_source_sha256"] = {it["id"]: it["sha256"] for it in good}
    report["source_sha_duplicates"] = [
        [a["id"], b["id"]] for i, a in enumerate(good) for b in good[i+1:]
        if a["sha256"] == b["sha256"]
    ]
    report["status"] = ("CANDIDATES_DOWNLOADED_GATE_A_PENDING_VISUAL_REVIEW" if good
                        else "GATE_A_FAIL_NO_ACQUIRED_VIDEO")
    (ROOT / "manifest.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (ROOT / "README.txt").write_text(
        "Huracan STO V10 Agent A source-research download.\n"
        "Open LANDSCAPE previews/* and manifest.json BEFORE deciding which shots are usable.\n"
        "0 approved same-model distinct shots until manual visual inspection.\n"
        "The main user video/audio is not included. Do not call this a final film.\n",
        encoding="utf-8"
    )
    archive = ROOT.parent / "HURACAN_STO_A_CANDIDATES_SINGLE_ZIP.zip"
    import zipfile
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_STORED,
                         allowZip64=True) as z:
        for file in ROOT.rglob("*"):
            if file.is_file():
                z.write(file, arcname=file.relative_to(ROOT))
    print(json.dumps({"status": report["status"],
                      "downloaded": len(good),
                      "zip": str(archive),
                      "zip_bytes": archive.stat().st_size,
                      "gate_A": "NOT_PASSED"}, indent=2))
    # Fail only if absolutely no footage: partial work remains in uploaded artifact.
    if not good:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
