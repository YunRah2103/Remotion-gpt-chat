#!/usr/bin/env python3
"""Independently verify untranscoded-codec Porsche Newsroom *excerpts*.

Excerpt SHA is the SHA of remuxed excerpt bytes, NEVER the full 1.6GiB original.
No excerpt alone proves car identity, shot uniqueness or footage permissions.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit
from fractions import Fraction
import subprocess

from ingest_bridge import digest, within

MEDIA_ID={"286726","286727","286687"}
SOURCE_BASE="https://newstv.porsche.com/porschevideos/newstv.porsche.com_"
def inspect(path:Path)->dict:
    raw=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],
                       check=True,capture_output=True,text=True,timeout=75)
    meta=json.loads(raw.stdout)
    video=next((s for s in meta["streams"] if s.get("codec_type")=="video"),None)
    if video is None:raise ValueError("excerpt video stream not found")
    return dict(width=int(video["width"]),height=int(video["height"]),
                codec=video.get("codec_name"),
                fps=float(Fraction(video.get("avg_frame_rate") or "0/1")),
                duration=float(meta["format"]["duration"]),size=path.stat().st_size)

def verify(folder:Path)->dict:
    root=folder.resolve()
    report=json.loads(within(root,"excerpt-qa.json").read_text())
    mid=str(report.get("mediaId",""))
    if mid not in MEDIA_ID:raise ValueError("unexpected official Porsche media ID")
    url=SOURCE_BASE+mid+"_en.mp4"
    if report.get("sourceUrl")!=url:raise ValueError("official source link does not match ID")
    if report.get("status")!="EXCERPT_DOWNLOADED_PRESERVED_CODEC":
        raise ValueError("Agent A excerpt acquisition not approved")
    if report.get("completeExcerptDecode")!="PASS":
        raise ValueError("Agent A whole excerpt decode not approved")
    if report.get("originalReencoded") is not False or report.get("clipDoesNotRepresentEntireSource") is not True:
        raise ValueError("must be an excerpt with source codec preserved, not claimed original")
    clip=within(root,f"porsche-{mid}-native-excerpt.mp4")
    if digest(clip)!=report.get("excerptSha256"):
        raise ValueError("native excerpt SHA mismatch")
    metadata=inspect(clip)
    if metadata["size"]!=report.get("excerptBytes"):raise ValueError("excerpt size changed")
    if metadata["width"]!=report.get("width") or metadata["height"]!=report.get("height") or metadata["codec"]!=report.get("videoCodec"):
        raise ValueError("FFprobe source excerpt video fields mismatch")
    if abs(metadata["fps"]-float(Fraction(report.get("fps") or "0")))>.025:
        raise ValueError("FFprobe excerpt frame rate mismatch")
    if abs(metadata["duration"]-float(report.get("durationSeconds") or 0))>.03:
        raise ValueError("FFprobe excerpt duration mismatch")
    if metadata["width"]<1280 or metadata["height"]<720 or metadata["fps"]<20 or metadata["duration"]<3:
        raise ValueError("poor-quality or unsuitable-length excerpt")
    # D performs a new decode independent of Agent A metadata.
    subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(clip),
                    "-map","0:v:0","-f","null","-"],check=True,stdout=subprocess.DEVNULL,timeout=180)
    return {
        "status":"NATIVE_SOURCE_EXCERPT_VERIFIED_NOT_EDIT_SHOT",
        "sourceVideoId":mid, "sourceUrl":url,
        "excerptPath":str(clip), "excerptSha256":report["excerptSha256"],
        "isOriginalFullSource":False, "nativeStreamCopyReported":True,
        "recheckedIndependentDecode":"PASS",
        "originalSourceStartSeconds":float(report.get("rangeStartSeconds") or 0),
        "originalSourceDurationRequested":float(report.get("requestLengthSeconds") or 0),
        "probe":metadata,
        "verifiedUniqueTurboDrivingShots":0,
        "sceneReviewStatus":"NOT_SIGNED_OFF"
    }

def main()->int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--excerpt-root",required=True,type=Path,action="append")
    p.add_argument("--report-output",required=True,type=Path)
    args=p.parse_args()
    info=[verify(folder) for folder in args.excerpt_root]
    if len({s["sourceVideoId"] for s in info})!=len(info):
        raise ValueError("repeated source media ID")
    inventory={"schemaVersion":1,
               "status":"SOURCE_EXCERPTS_VERIFIED_SHOTS_UNAPPROVED",
               "verifiedNativeExcerptCount":len(info),
               "verifiedUniqueTurboDrivingShots":0,
               "sourceExcerpts":info}
    args.report_output.parent.mkdir(parents=True,exist_ok=True)
    args.report_output.write_text(json.dumps(inventory,indent=2)+"\n")
    print(json.dumps(inventory,indent=2))
    return 0
if __name__=="__main__":
    try:raise SystemExit(main())
    except (OSError,ValueError,KeyError,subprocess.CalledProcessError,subprocess.TimeoutExpired,json.JSONDecodeError) as e:
        raise SystemExit("PORSCHE_EXCERPT_INTEGRITY_FAILED: "+str(e))
