#!/usr/bin/env python3
"""Shorts/TikTok vertical-frame safe-zone inspection, using explicit authored object boxes.

Detects declared text/subject overlap with conservative editable masks; NEVER
pretends OCR/object detection or exact platform interface layouts.
"""
import argparse
import json
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat

# Coordinates are fractions of frame width and height, approximate interface zones.
ZONES={"top_title":(0,.0,1,.12),"bottom_controls":(0,.83,1,.17),
       "right_buttons":(.80,.50,.20,.33),"left_caption_edge":(0,.40,.055,.43)}
COLORS={"top_title":"#e0a066","bottom_controls":"#f0787c",
        "right_buttons":"#f5d079","left_caption_edge":"#9f92ed"}
def rect(value):
    if not isinstance(value,(list,tuple)) or len(value)!=4:raise ValueError("Box must be [x,y,width,height]")
    a=[float(x) for x in value]
    if any(not math.isfinite(x) for x in a) or min(a)<0 or a[2]<=0 or a[3]<=0 or a[0]+a[2]>1.000001 or a[1]+a[3]>1.000001:
        raise ValueError("Box must use 0-1 fractional frame coordinates")
    return a

def overlap(a,b):
    x=max(0,min(a[0]+a[2],b[0]+b[2])-max(a[0],b[0]))
    y=max(0,min(a[1]+a[3],b[1]+b[3])-max(a[1],b[1]))
    return x*y

def audit(layout):
    if not isinstance(layout,dict) or layout.get("schemaVersion")!=1:raise ValueError("schemaVersion 1 required")
    captions=layout.get("captions",[])
    subjects=layout.get("subjects",[])
    if not isinstance(captions,list) or not isinstance(subjects,list):raise ValueError("captions/subjects must be arrays")
    if len(captions)+len(subjects)>60:raise ValueError("Too many authored boxes")
    problems=[]
    boxes=[]
    for kind,items in (("caption",captions),("subject",subjects)):
        for i,item in enumerate(items):
            box=rect(item.get("bounds"))
            name=str(item.get("name",kind+"-"+str(i)))[:120]
            boxes.append({"name":name,"type":kind,"bounds":box})
            for zone,area in ZONES.items():
                if overlap(box,area)>0:
                    problems.append({"object":name,"type":kind,"zone":zone,
                                     "severity":"warning","reason":"Declared important element overlaps conservative platform UI mask"})
            if kind=="caption":
                font=item.get("fontSizePx")
                if not isinstance(font,(int,float)) or font<=0:
                    problems.append({"object":name,"severity":"warning","reason":"No valid caption font size declared"})
                elif font<39:
                    problems.append({"object":name,"severity":"warning","reason":"Caption text may be small on a phone"})
    return {"declarations":len(boxes),"warnings":problems,"boxes":boxes,
            "layoutKnown":bool(boxes),
            "note":"Warning zones are conservative estimates, not official TikTok/YouTube specifications. Undeclared objects are NOT checked."}

def frame_from_video(video,directory):
    directory.mkdir(parents=True,exist_ok=True)
    info=json.loads(subprocess.run(["ffprobe","-v","error","-show_format","-show_streams",
                                    "-of","json",str(video)],capture_output=True,text=True,check=True).stdout)
    streams=[s for s in info.get("streams",[]) if s.get("codec_type")=="video"]
    if len(streams)!=1:raise ValueError("One video stream required")
    duration=float(info.get("format",{}).get("duration",0))
    if not 0<duration<=90:raise ValueError("Only videos up to 90 seconds")
    if streams[0].get("width")!=1080 or streams[0].get("height")!=1920:
        raise ValueError("Phone QC expects the final 1080x1920 master")
    outputs=[]
    for i,factor in enumerate((.05,.23,.42,.61,.78)):
        dest=directory/("sample-%02d.jpg"%i)
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y",
                        "-ss",str(duration*factor),"-i",str(video),"-frames:v","1",
                        "-q:v","3",str(dest)],check=True,capture_output=True,timeout=75)
        if not dest.is_file() or not dest.stat().st_size:
            # A short or oddly muxed video may report container duration beyond the last decoded frame.
            # Fall back to its first decodable frame instead of pretending a missing proof exists.
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y",
                            "-i",str(video),"-frames:v","1","-q:v","3",str(dest)],
                           check=True,capture_output=True,timeout=75)
        if not dest.is_file() or not dest.stat().st_size:
            raise ValueError("Could not extract frame sample "+str(i))
        outputs.append(dest)
    return outputs

def annotate(source,dest,boxes):
    with Image.open(source) as original:
        im=original.convert("RGB")
    w,h=im.size
    if h/w<1.6 or h/w>1.95:
        raise ValueError("Requires vertical phone content")
    draw=ImageDraw.Draw(im,"RGBA")
    for name,box in ZONES.items():
        x,y,dx,dy=box;area=(int(x*w),int(y*h),int((x+dx)*w),int((y+dy)*h))
        draw.rectangle(area,fill=(255,90,90,55),outline=(255,160,125,220),width=3)
        draw.text((area[0]+8,area[1]+8),name.replace("_"," "),fill=(255,255,255,240),
                  stroke_width=2,stroke_fill=(0,0,0,230))
    for item in boxes:
        x,y,bw,bh=item["bounds"];area=(int(x*w),int(y*h),int((x+bw)*w),int((y+bh)*h))
        draw.rectangle(area,outline=(65,230,175,250),width=5)
        draw.text((area[0]+4,area[1]+4),item["name"][:28],fill=(130,255,210,255),
                  stroke_width=2,stroke_fill=(0,0,0,230))
    dest.parent.mkdir(parents=True,exist_ok=True)
    im.save(dest,quality=86)

def perform(layout,output,video=None,images=None):
    report=audit(layout)
    directory=Path(output);directory.mkdir(parents=True,exist_ok=True)
    files=frame_from_video(video,directory/"samples") if video else [Path(p) for p in (images or [])]
    if not files:raise ValueError("At least one image or video input is required")
    if len(files)>12:raise ValueError("Maximum 12 screenshots")
    brightness=[]
    for index,path in enumerate(files):
        with Image.open(path) as img:
            luminance=img.convert("L").resize((64,96))
            brightness.append(ImageStat.Stat(luminance).mean[0])
        annotate(path,directory/("phone-preview-%02d.jpg"%index),report["boxes"])
    jumps=[{"between":[i-1,i],"meanLuminanceDelta":round(abs(brightness[i]-brightness[i-1]),1)}
           for i in range(1,len(brightness)) if abs(brightness[i]-brightness[i-1])>95]
    report.update({"inputFrames":len(files),"sampledBrightnessJumps":jumps,
                   "technicalStatus":"REVIEW_REQUIRED" if report["warnings"] or not report["layoutKnown"] else "DECLARED_LAYOUT_CLEAR",
                   "disclaimer":"Even CLEAR means only authored boxes checked; unknown text, UI changes and full-speed flashing require human inspection."})
    (directory/"phone-report.json").write_text(json.dumps(report,indent=2)+"\n")
    return report

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--layout",required=True)
    p.add_argument("--output",default="out/phoneqa");p.add_argument("--video")
    p.add_argument("--images",nargs="*")
    opts=p.parse_args()
    print(json.dumps(perform(json.loads(Path(opts.layout).read_text()),opts.output,opts.video,opts.images),indent=2))
