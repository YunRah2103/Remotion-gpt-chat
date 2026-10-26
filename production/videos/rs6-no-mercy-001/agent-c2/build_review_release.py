#!/usr/bin/env python3
"""Create playable C2-only Audi RS6 detail cuts, native QA, contact sheets and ZIP.
Any external video source rights MUST be reviewed before a draft release is made public.
Never promote the QA state to permission-approved automatically.
"""
import hashlib, json, pathlib, subprocess, shutil, sys, zipfile
from datetime import datetime, timezone
from PIL import Image, ImageDraw

ROOT = pathlib.Path("c2_review_release")
RAW = pathlib.Path("c2_acquisition_work")
ROOT.mkdir(exist_ok=True)
RAW.mkdir(exist_ok=True)
SOURCES = [
  {"id":"black", "url":"https://www.tiktok.com/@glenmoreaudi/video/7482802812783512887",
   "shots":[("BLACK_MATRIX_LED_REVEAL",2.50,0.32),("BLACK_WHEEL_BRAKE",3.76,0.25),
            ("BLACK_LED_MACRO",5.02,0.35),("BLACK_RS6_TAIL_LIGHT",6.40,0.45)]},
  {"id":"green", "url":"https://www.tiktok.com/@glenmoreaudi/video/7616094158398246165",
   "shots":[("GREEN_RS_CALIPER_WHEEL",0.96,0.48),("GREEN_GRILLE_BADGE",3.03,0.50)]},
  {"id":"cabin", "url":"https://www.tiktok.com/@glenmoreaudi/video/7615694799869349140",
   "shots":[("BLUE_CABIN_AMBIENT",0.45,0.85)]},
  {"id":"exhaust", "url":"https://www.tiktok.com/@glenmoreaudi/video/7616084230715526420",
   "shots":[("BLUE_OVAL_EXHAUST",2.08,0.70)]}
]
def run(cmd, timeout=120):
    proc=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
    if proc.returncode:
        raise RuntimeError("command failed: "+repr(cmd)+"\n"+proc.stderr[-2800:])
    return proc.stdout
def sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""):h.update(block)
    return h.hexdigest()
def probe(path):
    d=json.loads(run(["ffprobe","-v","error","-show_entries",
                      "format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate,pix_fmt",
                      "-of","json",str(path)],30))
    v=next((x for x in d["streams"] if x["codec_type"]=="video"),None)
    if not v:raise RuntimeError("no video stream")
    return {"width":v["width"],"height":v["height"],"codec":v["codec_name"],
            "fps":v["avg_frame_rate"],"duration":float(d["format"]["duration"]),"pix_fmt":v.get("pix_fmt")}
rows=[]
sources=[]
for source in SOURCES:
    location=RAW/source["id"];location.mkdir(parents=True,exist_ok=True)
    command=["yt-dlp","--no-playlist","--no-progress","--no-overwrites","--socket-timeout","20",
             "--retries","3","--fragment-retries","2","--download-sections","*0-8",
             "-f","bv*+ba/best","--merge-output-format","mp4","-o",
             str(location/"source.%(ext)s"),source["url"]]
    try:
        run(command,150)
        videos=[p for p in location.glob("source.*") if p.suffix.lower() in (".mp4",".mkv",".webm") and p.stat().st_size>100000]
        if not videos: raise RuntimeError("no valid source video downloaded")
        original=max(videos,key=lambda p:p.stat().st_size)
        p=probe(original)
        if p["width"]<1080 or p["height"]<1920:raise RuntimeError("source below native portrait 1080x1920")
        src={"source_id":source["id"],"url":source["url"],"downloaded_original_sha256":sha(original),"native_probe":p}
        sources.append(src)
        for shot_id,start,length in source["shots"]:
            if start+length>p["duration"]+0.05:
                raise RuntimeError(f"range exceeds source duration: {shot_id}")
            target=ROOT/(shot_id+".mp4")
            run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(original),
                 "-t",str(length),"-map","0:v:0","-an","-vf","fps=30,scale=1080:1920:flags=lanczos,format=yuv420p",
                 "-c:v","libx264","-preset","medium","-crf","17",
                 "-movflags","+faststart",str(target)],90)
            v=probe(target)
            if v["width"]!=1080 or v["height"]!=1920 or v["duration"]<0.15:raise RuntimeError("bad clip "+shot_id)
            run(["ffmpeg","-hide_banner","-v","error","-xerror","-i",str(target),"-f","null","-"],30)
            thumb=ROOT/(shot_id+".jpg")
            run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(min(length/2,v["duration"]*.5)),
                 "-i",str(target),"-frames:v","1","-q:v","3",str(thumb)],30)
            rows.append({"clip_file":target.name,"thumbnail":thumb.name,"source_id":source["id"],
              "source_url":source["url"],"source_original_sha256":src["downloaded_original_sha256"],
              "source_start_seconds":start,"source_extract_seconds":length,
              "output_probe":v,"output_sha256":sha(target),
              "full_decode":"PASS","rights":"NOT VERIFIED","source_car":"Audi C8 RS6 Avant (visual QA source)"})
    except Exception as e:
        raise RuntimeError("Release build cannot claim completed source '"+source["id"]+"': "+str(e))
    finally:
        shutil.rmtree(location,ignore_errors=True)
if len(rows)!=8:raise RuntimeError("Expected all 8 detail shots; got "+str(len(rows)))
# Make a genuine 4x2 thumbnail contact sheet in original shot order.
w,h=270,480
canvas=Image.new("RGB",(w*4,h*2+88),"#12161c")
draw=ImageDraw.Draw(canvas)
for i,shot in enumerate(rows):
    image=Image.open(ROOT/shot["thumbnail"]).convert("RGB")
    image.thumbnail((w,h))
    x=(i%4)*w; y=(i//4)*h
    canvas.paste(image,(x+(w-image.width)//2,y))
    draw.rectangle((x,y+h-32,x+w,y+h),fill="#141920")
    draw.text((x+6,y+h-23),shot["clip_file"].replace(".mp4","")[:33],fill="white")
draw.text((12,h*2+30),"YUNEX RS6 C2 / frame QA | sources: Glenmore Audi | 1080x1920 detail beats",fill="white")
canvas.save(ROOT/"CONTACT_SHEET.jpg",quality=92)
manifest={
    "build_timestamp_utc":datetime.now(timezone.utc).isoformat(),
    "project":"YUNEX RS6 NO MERCY 001","agent":"C2",
    "purpose":"Creator-source technical review; publication rights not verified",
    "video_redistribution_authorization":"UNVERIFIED",
    "release_must_remain_draft_without_permission":True,
    "source_count":len(sources),"clip_count":len(rows),
    "sources":sources,"clips":rows,
    "note":"No claim that source media may be publicly redistributed. Cars are stationary in these details; not B2/A2 driving footage."
}
(ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2))
(ROOT/"SHA256SUMS.txt").write_text("".join(sha(p)+"  "+p.name+"\n" for p in sorted(ROOT.iterdir()) if p.is_file() and p.name!="SHA256SUMS.txt"))
with zipfile.ZipFile(ROOT/"YUNEX_RS6_C2_DETAILS_REVIEW.zip","w",compression=zipfile.ZIP_DEFLATED,compresslevel=4) as z:
    for p in sorted(ROOT.iterdir()):
        if p.is_file() and p.suffix.lower() in (".mp4",".jpg",".json",".txt") and p.name!="YUNEX_RS6_C2_DETAILS_REVIEW.zip":
            z.write(p,arcname=p.name)
print(json.dumps({"clips":len(rows),"source_count":len(sources),"all_full_decodes":"PASS",
 "zip_sha256":sha(ROOT/"YUNEX_RS6_C2_DETAILS_REVIEW.zip"),
 "mp4_shas":[(r["clip_file"],r["output_sha256"]) for r in rows]},indent=2))
