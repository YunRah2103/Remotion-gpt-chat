#!/usr/bin/env python3
"""Fail-closed import of official Porsche Newsroom source artifacts from Agent A.

Accepts verified source-qa.json + original MP4. Preserves original bytes.
Does not verify car generation, camera-shot distinctness, or publication rights.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

from ingest_bridge import build_selection_template, digest, within

SOURCE_PAGE = "https://newsroom.porsche.com/en/press-kits/50-years-porsche-turbo.html"
SOURCE_URL = re.compile(r"^https://newstv\.porsche\.com/porschevideos/newstv\.porsche\.com_(\d{6})_en\.mp4$")
MEDIA_IDS = {"286306", "286687", "286726", "286727"}

def probe(path: Path) -> dict:
    response = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
        capture_output=True, text=True, check=True, timeout=60,
    )
    meta = json.loads(response.stdout)
    video = next((s for s in meta.get("streams", []) if s.get("codec_type") == "video"), None)
    if not video:
        raise ValueError("no video stream in original source")
    rate = video.get("avg_frame_rate") or video.get("r_frame_rate") or "0/1"
    num, den = (int(n) for n in rate.split("/"))
    return {"width": int(video.get("width", 0)),
            "height": int(video.get("height", 0)),
            "fps": num / den if den else 0,
            "durationSeconds": float(meta.get("format", {}).get("duration") or 0),
            "videoCodec": video.get("codec_name"),
            "bytes": path.stat().st_size}

def official_inventory(root: Path) -> dict:
    root = root.resolve()
    report_path = within(root, "source-qa.json")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    if report.get("status") != "MEDIA_ACQUIRED_PENDING_MANUAL_SCENE_REVIEW":
        raise ValueError("Porsche official download is not approved by source acquisition QA")
    if report.get("fullDecode") != "PASS" or report.get("noTranscode") is not True:
        raise ValueError("missing original full decode/no-transcode proof")
    media_id = str(report.get("mediaId", ""))
    source_url = report.get("sourceUrl", "")
    match = SOURCE_URL.fullmatch(source_url)
    if media_id not in MEDIA_IDS or not match or match[1] != media_id:
        raise ValueError("official video ID does not match approved original Porsche Newsroom source")
    if report.get("sourcePageUrl") != SOURCE_PAGE:
        raise ValueError("original source-page provenance mismatch")
    raw = within(root, f"porsche-newsroom-{media_id}-original.mp4")
    hashed = digest(raw)
    if not re.fullmatch(r"[a-f0-9]{64}", str(report.get("originalSha256", ""))) or hashed != report["originalSha256"]:
        raise ValueError("official original video checksum mismatch")
    actual = probe(raw)
    source_probe = report.get("probe") or {}
    for key in ("width","height","fps","durationSeconds","videoCodec"):
        expected = source_probe.get(key)
        got = actual[key]
        if expected is None or (abs(float(got)-float(expected)) > .025 if key in ("fps","durationSeconds") else got != expected):
            raise ValueError(f"ffprobe mismatch: {key}")
    if actual["bytes"] != report.get("originalBytes"):
        raise ValueError("official original byte length differs from report")
    if actual["width"] < 1280 or actual["height"] < 720 or actual["fps"] < 20:
        raise ValueError("original Porsche source below permitted minimum media quality")
    return {
        "schemaVersion":1, "status":"SOURCE_FILES_VERIFIED_NOT_SHOTS",
        "importedSources":1,"verifiedUniquePorscheShots":0,
        "sourceArtifactType":"Porsche Newsroom original MP4",
        "note":"Source checksum, format, original video bytes and supplier URL verified; visual Porsche identity, 30 unique moving setups, and rights require manual signoff.",
        "sources":[{
            "sourceId":hashed[:16],"sourceFileSha256":hashed,
            "absolutePath":str(raw),"sourceUrl":source_url,
            "sourcePageUrl":SOURCE_PAGE,"mediaId":media_id,
            "width":actual["width"],"height":actual["height"],
            "fps":actual["fps"],"durationSeconds":actual["durationSeconds"],
            "fileBytes":actual["bytes"],"videoCodec":actual["videoCodec"],
            "rightsStatus":report.get("rightsStatus","UNVERIFIED"),
            "shotReviewStatus":"NOT_STARTED"
        }]
    }

def main() -> int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source-root", required=True, type=Path,
                   help="extracted original Agent A artifact directory with source-qa.json")
    p.add_argument("--beat-map", required=True, type=Path)
    p.add_argument("--inventory-output", required=True, type=Path)
    p.add_argument("--selection-output", required=True, type=Path)
    a=p.parse_args()
    inv=official_inventory(a.source_root)
    selection=build_selection_template(json.loads(a.beat_map.read_text()), inv)
    for out, doc in ((a.inventory_output,inv),(a.selection_output,selection)):
        out.parent.mkdir(parents=True,exist_ok=True)
        out.write_text(json.dumps(doc,indent=2)+"\n")
    print(json.dumps({"status":inv["status"],"importedSources":1,"verifiedPorscheShots":0,
                      "sourceSha256":inv["sources"][0]["sourceFileSha256"]},indent=2))
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError,OSError,KeyError,ZeroDivisionError,subprocess.CalledProcessError,subprocess.TimeoutExpired,json.JSONDecodeError) as error:
        raise SystemExit("PORSCHE_OFFICIAL_IMPORT_BLOCKED: "+str(error))
