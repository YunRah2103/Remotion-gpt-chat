#!/usr/bin/env python3
"""Sample official large Porsche MP4 via FFmpeg HTTP byte-range seeks.

This makes review JPEGs only; never silently downloads or transcodes the full
1.6GiB source. JPEG proof does not establish footage rights or shot uniqueness.
"""
from __future__ import annotations
import argparse
import base64
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageDraw

SOURCES = {
    "286687": ("50 Years Porsche Turbo B-roll", [25, 80, 135, 190, 245, 300, 355, 410, 465, 520, 575, 630, 685, 740, 795]),
    "286726": ("930 Turbo feature", [20, 100, 180, 260, 340, 420, 500, 580, 660, 740, 820, 900]),
    "286727": ("992 Turbo feature", [20, 85, 150, 215, 280, 345, 410, 475, 540, 605, 670, 735, 800]),
}

def sample(mid: str, output: Path, local_source: Path | None=None) -> dict:
    title, times = SOURCES[mid]
    origin=f"https://newstv.porsche.com/porschevideos/newstv.porsche.com_{mid}_en.mp4"
    url=str(local_source) if local_source else origin
    output.mkdir(parents=True, exist_ok=True)
    frames=[]
    for second in times:
        path=output/f"frame-{second:04d}.jpg"
        clip=output/f"native-{second:04d}.mp4"
        # Use exactly the source-preserving method already successfully tested by Agent A:
        # native codec stream-copy over HTTP Range first, then JPEG from LOCAL short excerpt.
        command=["ffmpeg","-hide_banner","-nostdin","-loglevel","error",
                 "-rw_timeout","25000000","-ss",str(second),"-i",url,
                 "-t","2.0","-map","0:v:0","-c:v","copy",
                 "-movflags","+faststart","-y",str(clip)]
        try:
            result=subprocess.run(command,check=True,timeout=120,
                                  stdout=subprocess.DEVNULL,capture_output=True)
            if not clip.is_file() or clip.stat().st_size < 15000:
                raise ValueError("native stream-copy excerpt unexpectedly empty")
            render=subprocess.run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error",
                 "-ss","0.2","-i",str(clip),"-frames:v","1",
                 "-vf","scale=320:180:flags=lanczos","-q:v","3","-y",str(path)],
                 check=True,timeout=30,stdout=subprocess.DEVNULL,capture_output=True)
            if not path.is_file() or path.stat().st_size < 1000:
                raise ValueError("JPEG thumbnail not produced from native excerpt")
            frames.append((second,path))
        except (subprocess.TimeoutExpired,subprocess.CalledProcessError,ValueError) as exc:
            snippet=(exc.stderr.decode(errors="replace")[-240:] if isinstance(exc,subprocess.CalledProcessError) and exc.stderr else str(exc))
            print("SAMPLE_FRAME_FAILED",mid,second,type(exc).__name__,snippet,flush=True)
        finally:
            clip.unlink(missing_ok=True)
    if len(frames) < 8:
        raise ValueError(f"only {len(frames)}/{len(times)} source frames accessible")
    columns=3
    rows=(len(frames)+columns-1)//columns
    sheet=Image.new("RGB",(columns*320,rows*210),"#0c0c0e")
    draw=ImageDraw.Draw(sheet)
    for index,(sec,frame) in enumerate(frames):
        x,y=(index%columns)*320,(index//columns)*210
        with Image.open(frame) as im:
            sheet.paste(im.convert("RGB"),(x,y))
        draw.text((x+12,y+185),f"Official Porsche {mid} — {sec}s",fill="#ffffff")
    original=output/"contact-sheet.jpg"
    sheet.save(original,quality=83)
    thumb=output/"small-log-preview.jpg"
    sheet.resize((768,round(rows*210*.8))).save(thumb,quality=42,optimize=True)
    preview=base64.b64encode(thumb.read_bytes()).decode()
    print("PORSCHE_BROLL_CONTACT_BASE64_START",flush=True)
    for i in range(0,len(preview),6000):print(preview[i:i+6000],flush=True)
    print("PORSCHE_BROLL_CONTACT_BASE64_END",flush=True)
    report={
        "status":"SOURCE_PREVIEW_NOT_VERIFIED_SHOTS",
        "mediaId":mid, "sourceTitle":title, "sourceUrl":origin,
        "streamedSourceFileFullyDownloaded":False,
        "samplingMethod":"FFmpeg remote seeking, one JPEG per specified timestamp",
        "timesAttemptedSeconds":times,
        "timesSucceededSeconds":[sec for sec,_ in frames],
        "photoCount":len(frames),
        "verifiedUniquePorscheTurboShots":0,
        "rightsStatus":"UNVERIFIED_PRIVATE_REVIEW",
    }
    (output/"preview-report.json").write_text(json.dumps(report,indent=2)+"\n")
    print("PORSCHE_REMOTE_PROBE_SUMMARY",json.dumps(report),flush=True)
    return report

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--media-id",choices=sorted(SOURCES),required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    sample(args.media_id,args.output)

if __name__=="__main__":
    try:main()
    except (OSError,ValueError,subprocess.CalledProcessError,subprocess.TimeoutExpired) as error:
        raise SystemExit("REMOTE_SAMPLE_FAILED: "+str(error))
