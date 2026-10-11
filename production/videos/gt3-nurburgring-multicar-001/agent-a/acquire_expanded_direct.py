#!/usr/bin/env python3
"""Agent A: acquire real non-YouTube publisher MP4s and strictly quality-gate.

Never upscale, mislabel GT4/street footage, or call candidates "approved shots".
Stores each accepted actual source sample and 8-frame visual review.
"""
from __future__ import annotations
import hashlib
import json
import subprocess
import time
from pathlib import Path

import requests
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parent
OUT=Path("out/gt3-direct-2026")
CLIPS=OUT/"native_hd_sources"
THUMBS=OUT/"review_sheets"
CLIPS.mkdir(parents=True,exist_ok=True)
THUMBS.mkdir(parents=True,exist_ok=True)
SOURCES=sorted(json.loads((ROOT/"expanded_direct_sources.json").read_text())["sources"],key=lambda a:a["priority"])
MAX_FULL=110*1024*1024
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"
SESSION=requests.Session()
SESSION.headers["User-Agent"]=UA
RESULTS=[]
def cmd(args,timeout=65):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    if p.returncode: raise RuntimeError((p.stderr or p.stdout)[-600:])
    return p.stdout
def sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()
def local_mp4(url,path,maxbytes=MAX_FULL):
    with SESSION.get(url,stream=True,timeout=(12,30),allow_redirects=True) as r:
        r.raise_for_status()
        if "text/html" in r.headers.get("content-type",""):
            raise RuntimeError("HTML instead of video response")
        total=0
        with path.open("wb") as o:
            for chunk in r.iter_content(512*1024):
                if not chunk: continue
                total+=len(chunk)
                if total>maxbytes:
                    raise RuntimeError(f"Source exceeds maximum {maxbytes} without range extraction")
                o.write(chunk)
def ffprobe(path):
    d=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],timeout=28))
    v=next((s for s in d["streams"] if s["codec_type"]=="video"),None)
    if not v: raise RuntimeError("No decodable video")
    return d,v
def contact(path, ident, duration):
    count=8
    image=Image.new("RGB",(480*4,310*2),(20,20,20))
    draw=ImageDraw.Draw(image)
    ts=[]
    for i in range(count):
        t=max(.1,min(duration-0.3,(i+.5)*duration/count))
        f=THUMBS/(f"{ident}-{i:02d}.jpg")
        cmd(["ffmpeg","-v","error","-nostdin","-y","-ss",f"{t:.2f}","-i",str(path),"-frames:v","1",
             "-vf","scale=480:-2","-q:v","4",str(f)],timeout=30)
        with Image.open(f) as img:
            img=img.convert("RGB")
            img.thumbnail((480,270))
            xx=i%4*480;yy=i//4*310
            image.paste(img,(xx,yy+28))
            draw.text((xx+8,yy+7),f"{ident} | {t:.1f}s",fill="white")
        f.unlink(missing_ok=True)
        ts.append(round(t,2))
    target=THUMBS/(ident+"_8FRAME.jpg")
    image.save(target,quality=86)
    return str(target.relative_to(OUT)),ts
for source in SOURCES:
    rec={**source,"result":"NOT_TESTED","accepted_gt3_model":False,"verified_distinct_camera_shots":0}
    url=source["url"]
    path=CLIPS/(source["id"]+".mp4")
    try:
        t0=time.monotonic()
        resp=SESSION.head(url,allow_redirects=True,timeout=(8,12))
        length=int(resp.headers.get("content-length") or 0)
        rec["http_head"]=resp.status_code
        rec["head_size"]=length
        rec["mime"]=resp.headers.get("content-type")
        print("HEAD",source["id"],resp.status_code,length,resp.url,flush=True)
        if resp.status_code>=400: raise RuntimeError(f"HTTP {resp.status_code}")
        if length>MAX_FULL:
            # Probe publisher remotely; save only 6-12 second native bitstream excerpt.
            remote=cmd(["ffprobe","-v","error","-show_entries","stream=width,height,codec_name",
                        "-select_streams","v:0","-of","json",url],timeout=35)
            dimensions=json.loads(remote)["streams"][0]
            rec["remote_probe"]=dimensions
            if int(dimensions.get("width") or 0)<1920 or int(dimensions.get("height") or 0)<1080:
                raise RuntimeError("Source native pixels below 1080")
            path=CLIPS/(source["id"]+"_ORIGINAL_BITSTREAM_12s.mkv")
            cmd(["ffmpeg","-nostdin","-v","error","-y","-ss","7","-i",url,
                 "-t","12","-map","0:v:0","-map","0:a?","-c","copy",str(path)],timeout=90)
            rec["extraction"]="12-second untouched source bitstream segment"
        else:
            local_mp4(url,path)
            rec["extraction"]="exact original publisher MP4"
        d,v=ffprobe(path)
        w,h=int(v["width"]),int(v["height"])
        landscape=(w>=1920 and h>=1080 and w>h)
        portrait=(w>=1080 and h>=1920 and h>w)
        if not (landscape or portrait):
            raise RuntimeError(f"REJECT: actual source dimensions {w}x{h} not native >=1080p landscape/portrait")
        duration=float(d["format"]["duration"])
        if duration<2.0:raise RuntimeError("REJECT: no usable scene duration")
        rec.update(result="NATIVE_HD_REVIEW_PENDING",width=w,height=h,
                   fps=v.get("avg_frame_rate"),codec=v.get("codec_name"),duration=duration,
                   bytes=path.stat().st_size,sha256=sha(path),file=str(path.relative_to(OUT)),
                   elapsed_seconds=round(time.monotonic()-t0,2))
        rec["contact_sheet"],rec["frame_sample_times"]=contact(path,source["id"],duration)
        print("ACQUIRED",source["id"],f"{w}x{h}",rec["bytes"],"time",rec["elapsed_seconds"],flush=True)
    except Exception as e:
        rec.update(result="REJECTED_OR_UNAVAILABLE",error=str(e)[-700:])
        path.unlink(missing_ok=True)
        print("REJECTED",source["id"],rec["error"][-280:],flush=True)
    RESULTS.append(rec)

(OUT/"manifest.json").write_text(json.dumps({"project":"YUNEX GT3 Multi-Car 001","agent":"A",
    "native_hd_source_files":sum(x["result"]=="NATIVE_HD_REVIEW_PENDING" for x in RESULTS),
    "distinct_gt3_shots_independently_verified":0,
    "make_gate_pass":False,
    "disclaimer":"These source clips are NOT verified distinct real GT3 race angles. Visual make, track, movement, class, watermark screening required.",
    "sources":RESULTS},indent=2)+"\n")
(OUT/"README.md").write_text(
    "# Native direct-source MP4s — additional Agent A batch\n\n"
    "Physical downloaded originals or stream-copy source excerpts, no upscaling. "
    "See manifest.json and per-source 8-frame contact sheets. "
    "Do not promote non-GT3, road/studio, spectator, duplicate or other-track clips to final editing shots. "
    "Only verified GT3 racing at Nürburgring qualifies for 24-shot, 6-make project gate.\n"
)
