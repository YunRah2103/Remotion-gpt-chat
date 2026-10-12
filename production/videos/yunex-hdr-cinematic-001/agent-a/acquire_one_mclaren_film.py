#!/usr/bin/env python3
"""Single-source YUNEX car-film acquisition. Output exactly one video, not a montage."""
from pathlib import Path
import subprocess, json, hashlib, zipfile, os, sys, shutil
from PIL import Image, ImageDraw, ImageStat

OUT=Path("out/yunex-one-film")
OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get("SOURCE_URL","https://vimeo.com/349379849")
AUTHOR="Mykhailo Dolgin; commercial filmed for O'Gara San Diego McLaren"
PAGE="https://vimeo.com/349379849"
META=OUT/"diagnostics.json"

def run(cmd, timeout=100):
    r=subprocess.run(cmd,text=True,capture_output=True,timeout=timeout)
    if r.returncode:raise RuntimeError(f"{' '.join(cmd)}\n{(r.stderr or r.stdout)[-1700:]}")
    return r.stdout
def sha256(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        while b:=f.read(1024*1024*4):h.update(b)
    return h.hexdigest()
def probe(p):
    return json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
report={"source":URL,"author":AUTHOR,"rights":"Source is a public creator portfolio upload, but NO remix/repost licence is established. Obtain permission before publishing.","status":"UNVERIFIED"}
try:
    # Do not force access via cookies, credentials, proxies or anti-DRM tools.
    inspect=run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","-J",URL],timeout=160)
    info=json.loads(inspect)
    report["page"]={"title":info.get("title"),"uploader":info.get("uploader"),
        "duration":info.get("duration"),"original_url":info.get("webpage_url"),
        "formats":[{"id":f.get("format_id"),"height":f.get("height"),"width":f.get("width"),"vcodec":f.get("vcodec")}
                   for f in info.get("formats",[]) if (f.get("height") or 0)>=1080][:35]}
    print("META",json.dumps(report["page"])[:2300],flush=True)
    if (info.get("duration") or 0)<15:raise RuntimeError("Source film too short for a cinematic edit")
    best=max((f.get("height") or 0) for f in info.get("formats",[]) if f.get("vcodec") not in (None,"none"))
    if best<1080:raise RuntimeError("Best accessible video source below native 1080p")
    # Only one URL; no alternative candidate movies packaged.
    run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
       "--no-progress","--no-mtime","--format","bv*[height>=1080]+ba/b[height>=1080]",
       "--merge-output-format","mp4","--max-filesize","700M",
       "--output",str(OUT/"selected-one-car-video.%(ext)s"),URL],timeout=720)
    videos=list(OUT.glob("selected-one-car-video.*"))
    if len(videos)!=1: raise RuntimeError("Expected exactly one media file, got "+str([x.name for x in videos]))
    vid=videos[0]
    if vid.suffix.lower() not in (".mp4",".mov",".mkv"):raise RuntimeError("Unexpected media container "+vid.suffix)
    prob=probe(vid)
    v=next(x for x in prob["streams"] if x["codec_type"]=="video")
    duration=float(prob["format"].get("duration") or 0)
    if int(v.get("width") or 0)<1920 or int(v.get("height") or 0)<1080 or duration<15:
        raise RuntimeError("Actual downloaded video fails min native resolution/duration")
    report["actual"]={"filename":vid.name,"bytes":vid.stat().st_size,"sha256":sha256(vid),
      "codec":v.get("codec_name"),"profile":v.get("profile"),"width":v.get("width"),
      "height":v.get("height"),"pix_fmt":v.get("pix_fmt"),"fps":v.get("avg_frame_rate"),
      "color_primaries":v.get("color_primaries"),"color_transfer":v.get("color_transfer"),
      "color_space":v.get("color_space"),"duration":duration,"audio":any(x["codec_type"]=="audio" for x in prob["streams"])}
    report["actual"]["HDR_metadata_pass"]=bool(v.get("color_primaries")=="bt2020" and
      v.get("color_transfer") in ("arib-std-b67","smpte2084") and "10" in str(v.get("pix_fmt","")))
    (OUT/"ffprobe.json").write_text(json.dumps(prob,indent=2)+"\n")
    run(["ffmpeg","-v","error","-xerror","-i",str(vid),"-map","0:v:0","-f","null","-"],timeout=440)
    from statistics import median
    thumbs=[]; diff=[]
    for i in range(12):
        t=round((i+0.5)*duration/12,2)
        jpg=OUT/f"still_{i+1:02}.jpg"
        run(["ffmpeg","-v","error","-y","-ss",str(t),"-i",str(vid),"-frames:v","1",
            "-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
            str(jpg)],timeout=80)
        im=Image.open(jpg).convert("RGB")
        if thumbs:
            import PIL.ImageChops
            delta=PIL.ImageChops.difference(thumbs[-1],im)
            diff.append(round(sum(ImageStat.Stat(delta).mean)/3,2))
        thumbs.append(im)
    sheet=Image.new("RGB",(480*4,270*3),(0,0,0))
    for i,im in enumerate(thumbs):
        sheet.paste(im,((i%4)*480,(i//4)*270))
        ImageDraw.Draw(sheet).text((i%4*480+8,i//4*270+8),f"{(i+.5)*duration/12:05.1f}s",fill="white",stroke_width=2,stroke_fill="black")
    sheet.save(OUT/"contact-sheet-ONE-film.jpg",quality=91)
    report["frameDiffs"]=diff
    report["medianSceneDifference"]=median(diff)
    report["status"]="DOWNLOADED_AND_DECODED"
except Exception as e:
    report["status"]="FAILED_SOURCE_ACQUISITION"
    report["failure"]=str(e)
    print("FAILED",str(e),flush=True)
finally:
    META.write_text(json.dumps(report,indent=2)+"\n")
    print("REPORT",json.dumps(report)[:3600],flush=True)
    dest=OUT.parent/"YUNEX-ONE-CAR-FILM.zip"
    with zipfile.ZipFile(dest,"w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
        for p in OUT.iterdir():
            if p.is_file():z.write(p,p.name)
    print("ARTIFACT",dest,report["status"],flush=True)
sys.exit(0 if report["status"]=="DOWNLOADED_AND_DECODED" else 2)
