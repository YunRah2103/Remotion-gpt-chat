#!/usr/bin/env python3
"""Acquire ONE 4070x2160 source video from its officially linked Pexels download URL."""
import json,os,hashlib,subprocess,sys
from pathlib import Path
from PIL import Image, ImageDraw
URL="https://videos.pexels.com/video-files/6872069/6872069-uhd_2160_3840_25fps.mp4"
PAGE="https://www.pexels.com/video/close-up-shot-of-a-black-sports-car-6872069/"
OUT=Path("out/one-car") 
OUT.mkdir(parents=True, exist_ok=True)
VID=OUT/"YUNEX-ONE-CLIP-ORIGINAL-4K.mp4"
def run(a,timeout=180):
    r=subprocess.run(a,text=True,capture_output=True,timeout=timeout)
    if r.returncode:raise RuntimeError(f"{a}\n{(r.stderr or r.stdout)[-1500:]}")
    return r.stdout
def digest(f):
    h=hashlib.sha256()
    with f.open("rb") as r:
        while c:=r.read(4*1024*1024):h.update(c)
    return h.hexdigest()
rep={"sourcePage":PAGE,"sourceDirectMP4":URL,"attribution":"Tima Miroshnichenko / Pexels","licenseSource":"https://www.pexels.com/license/",
     "status":"NOT_VERIFIED"}
try:
    print("Downloading one and only one publicly downloadable Pexels video", flush=True)
    print(run(["curl","--fail","--location","--retry","2","--connect-timeout","30",
        "--max-time","420","-A","Mozilla/5.0","-o",str(VID),"-w","CODE:%{http_code} BYTES:%{size_download}",URL],timeout=460),flush=True)
    p=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(VID)]))
    v=next(x for x in p["streams"] if x["codec_type"]=="video")
    duration=float(p["format"]["duration"])
    if int(v.get("width",0))<2160 or int(v.get("height",0))<3840 or duration<8:raise RuntimeError("Reject low-quality native file")
    run(["ffmpeg","-v","error","-xerror","-i",str(VID),"-map","0:v:0","-f","null","-"],timeout=420)
    rep.update(status="SOURCE_DOWNLOADED_AND_FULLY_DECODED",file=VID.name,sha256=digest(VID),
               bytes=VID.stat().st_size,
               width=v["width"],height=v["height"],duration=duration,fps=v.get("avg_frame_rate"),
               codec=v.get("codec_name"),pixelFormat=v.get("pix_fmt"),
               colorPrimaries=v.get("color_primaries"),transfer=v.get("color_transfer"))
    rep["genuineHDRConfirmed"]=v.get("color_primaries")=="bt2020" and v.get("color_transfer") in ("smpte2084","arib-std-b67") and "10" in str(v.get("pix_fmt",""))
    thumbs=[]
    for i in range(6):
        t=round(duration*(i+.5)/6,2)
        jpg=OUT/f"frame-{i+1}.jpg"
        run(["ffmpeg","-hide_banner","-v","error","-y","-ss",str(t),"-i",str(VID),"-frames:v","1",
            "-vf","scale=640:-2",str(jpg)])
        im=Image.open(jpg).convert("RGB")
        thumbs.append((t,im))
    h=thumbs[0][1].height
    sheet=Image.new("RGB",(3*640,2*h),(0,0,0))
    for i,(t,im) in enumerate(thumbs):
        x=i%3*640;y=i//3*h
        sheet.paste(im,(x,y))
        ImageDraw.Draw(sheet).text((x+8,y+8),f"{t:.1f}s",fill="#ffffff",stroke_width=2,stroke_fill="#000000")
    sheet.save(OUT/"CONTACT-SHEET.jpg",quality=90)
except Exception as e:
    rep["status"]="FAILED";rep["error"]=str(e)
    VID.unlink(missing_ok=True)
finally:
    (OUT/"VERIFICATION.json").write_text(json.dumps(rep,indent=2)+"\n")
    print("FINAL",json.dumps(rep),flush=True)
sys.exit(0 if rep["status"]=="SOURCE_DOWNLOADED_AND_FULLY_DECODED" else 2)
