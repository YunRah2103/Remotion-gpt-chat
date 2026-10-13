#!/usr/bin/env python3
"""B2: Target real Audi RS6 C8 *owner* clips via public TikTok feeds.

All media is transient and deleted before artifact upload. Captions suggest a
subject, not proof of C8 authenticity; motion heuristics aren't visual signoff.
Creator permission is necessary for a source-media deliverable and YUNEX edits.
"""
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from yt_dlp import YoutubeDL
from yt_dlp.utils import download_range_func

OUT = Path("b2-owner-motion-evidence")
OUT.mkdir(parents=True, exist_ok=True)
# fe78_rs6 is previously documented as a C8 owner's feed, but its videos
# have not been validated by B2. luan_rs6 is a previously technical-HD source,
# rejected as static hero material: revisit selectively for moving videos only.
ACCOUNTS = ("fe78_rs6", "luan_rs6")
RS6_PATTERN = re.compile(r"\b(?:audi\s*)?rs[\s-]?6\b|\bc8\b|\bavant\b", re.I)
MOTION_PATTERN = re.compile(r"roll|driv|road|tunnel|night|run|accel|race|flyby|fly.by|motorway|move|fahrt|fahren|drive.by|pass", re.I)
INVALID_PATTERN = re.compile(r"\bc7\b|\brs[\s-]?7\b|\brs[\s-]?3\b|\bforza\b|\bcgi\b", re.I)

def opts():
    return {
        "quiet": True, "no_warnings": True, "ignoreerrors": True,
        "skip_download": True, "socket_timeout": 14,
        "retries": 1, "fragment_retries": 1, "extractor_retries": 1,
        "noplaylist": False,
    }

def cmd(argv, timeout=100):
    try:
        r = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr[-500:]
    except Exception as e:
        return -999, "", str(e)[:500]

def clip_info(file):
    code, data, err = cmd(["ffprobe", "-v", "error", "-show_entries",
        "stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate:"
        "format=duration,size", "-of", "json", str(file)], 25)
    probe = json.loads(data) if code == 0 else {}
    decode_rc, _, dec_err = cmd(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel",
        "error", "-xerror", "-i", str(file), "-f", "null", "-"], 90)
    # A 3fps frame-to-frame luma difference metric can distinguish nearly
    # frozen scenes from action candidates, but cannot prove exterior driving.
    motion_rc, _, motion_err = cmd([
        "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "info",
        "-i", str(file), "-vf", "fps=3,scale=320:-2,signalstats,"
        "metadata=print:file=-", "-an", "-f", "null", "-"], 40)
    # Above metrics can be in metadata stdout, which is not stored to avoid
    # oversized logs or incidental private content. Dedicated luma analysis:
    return dict(probe=probe, ffprobe_rc=code, decode_rc=decode_rc,
        decode_error=dec_err, motion_probe_rc=motion_rc,
        motion_probe_error=motion_err,
        sha256=hashlib.sha256(file.read_bytes()).hexdigest(),
        byte_count=file.stat().st_size)

def extract_feed(handle):
    record = {"handle": handle, "url": "https://www.tiktok.com/@" + handle,
        "status": "DISCOVERY_NOT_RUN", "posts_examined": 0,
        "candidates": [], "media_publicly_distributed": False}
    try:
        with YoutubeDL(dict(opts(), extract_flat="in_playlist", playlistend=55)) as ydl:
            data = ydl.extract_info(record["url"], download=False)
        entries = [x for x in (data or {}).get("entries", []) if x]
        record["posts_examined"] = len(entries)
        # Check captions; keep verifiable links + titles for provenance.
        selected = []
        for item in entries:
            title = item.get("title") or ""
            url = item.get("url") or item.get("webpage_url") or ""
            if not str(url).startswith("http"):
                vid = item.get("id")
                if vid:
                    url = f"https://www.tiktok.com/@{handle}/video/{vid}"
            if not str(url).startswith("https://www.tiktok.com/"):
                continue
            if INVALID_PATTERN.search(title):
                continue
            score = 3 * bool(MOTION_PATTERN.search(title)) + 2 * bool(RS6_PATTERN.search(title))
            if handle in ("fe78_rs6", "luan_rs6"):
                score += 1
            selected.append({"title": title[:220], "url": url, "score": score})
        selected.sort(key=lambda x: x["score"], reverse=True)
        record["selected_preliminary"] = selected[:12]
        record["status"] = "DISCOVERY_OK"
        return record, selected[:4]
    except Exception as e:
        record["status"] = "DISCOVERY_ERROR"
        record["error"] = str(e)[-350:]
        return record, []

def trial(handle, candidate, i):
    doc = dict(candidate, handle=handle, key=f"{handle}-{i}",
        rights="No commercial/publishing rights verified",
        published_to_artifacts=False, c8_identity="NEEDS_VISUAL_CONFIRMATION",
        driving_visual="NEEDS_VISUAL_CONFIRMATION")
    with tempfile.TemporaryDirectory(prefix="b2-tiktok-motion-") as td:
        dest = Path(td)
        dl = opts()
        dl.update(skip_download=False, noplaylist=True,
            format="bv*+ba/b", outtmpl=str(dest/"clip.%(ext)s"),
            download_ranges=download_range_func(None, [(0, 7)]),
            force_keyframes_at_cuts=True, merge_output_format="mp4")
        try:
            with YoutubeDL(dl) as ydl:
                item = ydl.extract_info(candidate["url"], download=True)
            if item:
                doc["extracted_title"] = (item.get("title") or "")[:180]
                doc["source_uploader"] = item.get("uploader")
                doc["source_height"] = item.get("height")
                doc["source_duration"] = item.get("duration")
                doc["source_licence"] = item.get("license")
            medias = sorted((p for p in dest.iterdir()
                if p.suffix.lower() in (".mp4", ".mkv", ".webm")),
                key=lambda p: p.stat().st_size, reverse=True)
            if not medias:
                doc["status"] = "NO_REAL_MEDIA"
            else:
                doc.update(clip_info(medias[0]))
                streams = doc.get("probe", {}).get("streams") or []
                video = next((s for s in streams if s.get("codec_type") == "video"), {})
                long_side = max(video.get("width") or 0, video.get("height") or 0)
                short_side = min(video.get("width") or 0, video.get("height") or 0)
                doc["native_dimensions_sufficient"] = long_side >= 1920 and short_side >= 1080
                doc["status"] = ("TECHNICAL_HD_FULL_DECODE_PASS"
                    if doc["decode_rc"] == 0 and doc["native_dimensions_sufficient"]
                    else "MEDIA_LOW_RES_OR_DECODE_REJECT")
        except Exception as e:
            doc["status"] = "MEDIA_ACQUISITION_ERROR"
            doc["error"] = str(e)[-350:]
    return doc

def main():
    report = []
    for handle in ACCOUNTS:
        feed, selected = extract_feed(handle)
        print("FEED", handle, feed["status"], feed["posts_examined"], flush=True)
        for i, item in enumerate(selected, 1):
            result = trial(handle, item, i)
            feed["candidates"].append(result)
            print("SAMPLE", result["key"], result["status"], item["title"][:80], flush=True)
        report.append(feed)
    (OUT/"report.json").write_text(json.dumps(report, indent=2))
    (OUT/"README.txt").write_text(
        "B2 creator motion technical QA. Transient real media is deleted. "
        "No third-party MP4/stills or signed download URLs publicly uploaded. "
        "Successful technical decode is NOT a source licence or editor-ready material. "
        "C8 identity and cinematic driving require independent visual review; "
        "only owner-rights-cleared video may enter public GitHub artifacts.\n")
    print("B2_SUMMARY", json.dumps([
        {"handle": x["handle"], "feed": x["status"],
         "download_pass": sum(y["status"] == "TECHNICAL_HD_FULL_DECODE_PASS"
           for y in x["candidates"])}
        for x in report]), flush=True)

if __name__ == "__main__":
    main()
