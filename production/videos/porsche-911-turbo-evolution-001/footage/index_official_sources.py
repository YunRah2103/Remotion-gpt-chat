#!/usr/bin/env python3
"""Sparse visual indexing of authentic Porsche Newsroom MP4s by HTTP seek.

Purpose: discover candidate intervals, not prove 911 Turbo model/unique shots.
Downloads only short decoded stills, never invents original source SHA or resolution.
"""
import argparse
import hashlib
import json
import math
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from fractions import Fraction
from pathlib import Path
from PIL import Image, ImageDraw

OFFICIAL = {
    "286687": "Porsche 50 Years Turbo B-roll",
    "286726": "Porsche 930 Turbo dedicated footage",
    "286727": "Porsche 992 Turbo dedicated footage",
    "167585": "A duel between seven 911 Turbo generations from 1975 to 2020",
    "295872": "Porsche Turbo Transfagarasan highway with 930, 964, 993 and 992 Turbo",
    "202036": "9:11 Magazine Episode 21 - Eight Porsche 911 Turbo generations",
}
PRESS_KIT = "https://newsroom.porsche.com/en/press-kits/50-years-porsche-turbo.html"

def execute(args, timeout):
    return subprocess.run(args, capture_output=True, check=True, timeout=timeout)

def remote_info(url):
    value = json.loads(execute(["ffprobe","-v","error","-show_format","-show_streams","-of","json",url],70).stdout)
    video = next(s for s in value["streams"] if s["codec_type"]=="video")
    return {
        "nativeWidth":int(video["width"]),
        "nativeHeight":int(video["height"]),
        "nativeFps":float(Fraction(video.get("avg_frame_rate","0/1"))),
        "nativeCodec":video["codec_name"],
        "durationSeconds":float(value["format"]["duration"]),
    }

def screenshot(url, seconds, dest):
    # Original HTTP MP4 input, one decoded JPEG preview. No source transcoding / fake HD.
    execute(["ffmpeg","-hide_banner","-loglevel","error","-nostdin",
             "-rw_timeout","40000000","-ss",str(seconds),"-i",url,
             "-frames:v","1","-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
             "-q:v","3","-y",str(dest)],timeout=95)
    with Image.open(dest) as im:
        im.verify()
    digest=hashlib.sha256(dest.read_bytes()).hexdigest()
    return {"timeSeconds":round(seconds,2),"file":dest.name,"previewSha256":digest,"previewBytes":dest.stat().st_size}

def generate_sheet(good, output, media_id):
    pages=[]
    for offset in range(0,len(good),24):
        group=good[offset:offset+24]
        canvas=Image.new("RGB",(480*6,300*4),"#101010")
        draw=ImageDraw.Draw(canvas)
        for index,shot in enumerate(group):
            x=index%6*480
            y=index//6*300
            with Image.open(output/shot["file"]) as photo:
                canvas.paste(photo.convert("RGB"),(x,y))
            draw.text((x+12,y+277),f"{media_id} / {shot['timeSeconds']:.1f} s",fill="white")
        name=f"source-{media_id}-page-{offset//24+1:02d}.jpg"
        canvas.save(output/name,quality=95,subsampling=0)
        pages.append(name)
    return pages

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--media-id",choices=sorted(OFFICIAL),default="286687")
    ap.add_argument("--step",type=float,default=24.0)
    ap.add_argument("--max-samples",type=int,default=40)
    ap.add_argument("--out",type=Path,default=Path("out/porsche-official-sparse-index"))
    a=ap.parse_args()
    if not 2<=a.step<=120 or not 1<=a.max_samples<=80:
        ap.error("Invalid sample interval or count")
    a.out.mkdir(parents=True,exist_ok=True)
    url=f"https://newstv.porsche.com/porschevideos/newstv.porsche.com_{a.media_id}_en.mp4"
    if a.media_id=="202036":
        urls=[
            url,
            "https://newstv.porsche.com/porschevideos/202036_en_12000000.mp4",
            "https://newstv.porsche.com/porschevideos/202036_en_6000000.mp4",
            "https://newstv.porsche.com/porschevideos/202036_en_3000000.mp4",
        ]
        viable=[]
        for candidate in urls:
            try:
                probe=remote_info(candidate)
                viable.append((probe['nativeHeight'],probe['nativeWidth'],probe['nativeFps'],candidate))
            except Exception as e:
                print("SOURCE_VARIANT_UNAVAILABLE",candidate,str(e)[:130])
        if not viable:
            raise SystemExit("No accessible Porsche 9:11 Magazine media source")
        url=max(viable)[3]
        print("ACTUAL_SELECTED_SOURCE_URL",url)
    report={"schemaVersion":1,"sourceId":"porsche-newsroom-"+a.media_id,
            "title":OFFICIAL[a.media_id],"sourceUrl":url,"sourcePageUrl":PRESS_KIT,
            "status":"FAILED", "sourceVideoDownloaded":False, "originalSourceBytesSha256":None,
            "verifiedTurboGeneration":None,"verifiedDistinctMovingShots":0,
            "note":"Sparse single-frame previews establish only visual leads, NOT identifiable moving Porsche Turbo coupe shots.",
            "rights":"PRIVATE_REVIEW; REUSE RIGHTS UNVERIFIED"}
    try:
        metadata=remote_info(url)
        report.update(metadata)
        marks=[min(metadata["durationSeconds"]-1,(n+.5)*a.step)
               for n in range(min(a.max_samples,math.ceil(metadata["durationSeconds"]/a.step)))]
        marks=sorted(set(round(x,2) for x in marks if x>=0))
        good=[]
        errors=[]
        with ThreadPoolExecutor(max_workers=3) as pool:
            jobs={pool.submit(screenshot,url,t,a.out/f"{a.media_id}-{i:03d}.jpg"):(i,t) for i,t in enumerate(marks)}
            for future in as_completed(jobs):
                i,t=jobs[future]
                try:
                    shot=future.result()
                    shot["index"]=i
                    good.append(shot)
                except Exception as exc:
                    errors.append({"timeSeconds":t,"error":str(exc)[:220]})
        good.sort(key=lambda x:x["index"])
        pages=generate_sheet(good,a.out,a.media_id) if good else []
        report.update(status="SPARSE_SOURCE_VISUAL_LEADS" if len(good)>=4 else "INSUFFICIENT_PREVIEWS",
                      sampleIntervalSeconds=a.step,requestedSamples=len(marks),usableSamples=len(good),
                      contactSheets=pages,samples=good,failures=errors)
    except Exception as e:
        report["error"]=str(e)[:700]
    (a.out/"sparse-index.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf8")
    print(json.dumps({key:report.get(key) for key in ("status","sourceId","nativeWidth","nativeHeight","durationSeconds","requestedSamples","usableSamples","contactSheets","error")},indent=2))
    return 0 if report["status"]=="SPARSE_SOURCE_VISUAL_LEADS" else 2

if __name__=="__main__":
    raise SystemExit(main())
