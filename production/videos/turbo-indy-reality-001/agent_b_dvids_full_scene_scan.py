#!/usr/bin/env python3
"""Agent B: find undiscovered ground-level IndyCar camera match shots by scanning ALL frame timecodes.
Never treat images as footage. Actual media only if a second, separate full-resolution clip package passes."""
import hashlib, json, os, subprocess, sys, zipfile
from pathlib import Path
from PIL import Image, ImageDraw

OUTPUT=Path("out/agent-b-dvids-scans")
OUTPUT.mkdir(parents=True,exist_ok=True)
SOURCE_DIR=OUTPUT/"working_orig";SOURCE_DIR.mkdir(exist_ok=True)
SRC=[
 {"code":"race26","name":"2026 Indy 500, National Guard B-roll","url":"https://www.dvidshub.net/video/1008379/us-armed-forces-participate-indy-500-2026-b-roll-package"},
 {"code":"roll25a","name":"2025 Indianapolis 500 B-roll Pt. 1","url":"https://www.dvidshub.net/video/964265/indianapolis-500-b-roll-reel-pt-1"},
 {"code":"roll25b","name":"2025 Indianapolis 500 B-roll Pt. 2","url":"https://www.dvidshub.net/video/964267/indianapolis-500-b-roll-pt-2"},
]
manifest=[]
def call(args,timeout=70):
 p=subprocess.run(args, text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError("cmd failed: "+p.stderr[-650:])
 return p.stdout
for src in SRC:
 row=dict(src)
 try:
  tpl=str(SOURCE_DIR/(src["code"]+".%(ext)s"))
  call(["yt-dlp","--no-playlist","--socket-timeout","20","--retries","2","--fragment-retries","2","-f","best","-o",tpl,src["url"]],500)
  vids=list(SOURCE_DIR.glob(src["code"]+".*"))
  if not vids:raise RuntimeError("No playable original")
  vid=max(vids,key=lambda p:p.stat().st_size)
  probe=json.loads(call(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(vid)]))
  v=next(x for x in probe["streams"] if x["codec_type"]=="video")
  duration=float(probe["format"]["duration"]);row.update(w=v["width"],h=v["height"],duration=duration,codec=v["codec_name"],bytes=vid.stat().st_size)
  if v["width"]<1920 or v["height"]<1080:raise RuntimeError("reject sub1080 original")
  # One representative sample every 4 seconds. Eliminate any guesswork about source timecodes.
  stamps=[round(1.5+4.0*i,2) for i in range(int((duration-3.0)/4.0)+1)]
  snapshots=[]
  for i,t in enumerate(stamps):
   p=SOURCE_DIR/(src["code"]+"_shot.jpg")
   try:
    call(["ffmpeg","-nostdin","-y","-v","error","-ss",str(t),"-i",str(vid),"-vf","scale=360:202:force_original_aspect_ratio=decrease,pad=360:202:(ow-iw)/2:(oh-ih)/2","-frames:v","1","-q:v","6",str(p)],50)
    im=Image.open(p).convert("RGB");snapshots.append((t,im.copy()))
   except Exception as e: print("FRAME_FAILURE",src["code"],t,str(e)[:200],flush=True)
   finally:
    if p.exists():p.unlink()
  # pages 4x4 at approx 1500 x 950 are easy for manual image vision assessment
  for first in range(0,len(snapshots),16):
   cells=snapshots[first:first+16]
   page=Image.new("RGB",(360*4,232*4),(10,10,10));draw=ImageDraw.Draw(page)
   for n,(t,im) in enumerate(cells):
    x=n%4*360;y=n//4*232
    page.paste(im,(x,y+24))
    draw.text((x+7,y+5),f'{src["code"]}  {t:06.1f} sec',fill=(255,255,255))
   out=OUTPUT/f'{src["code"]}_page_{first//16+1:02}.jpg'
   page.save(out,quality=82,optimize=True)
  row.update(status="SOURCE_DECODED_SCANNED",sample_seconds=stamps,frame_count=len(snapshots),contact_pages=(len(snapshots)+15)//16,source_rights="DVIDS public domain marked, third party rights subject to review")
  print("SOURCE_SCANNED",json.dumps({k:row[k] for k in ("code","w","h","duration","frame_count","contact_pages")}),flush=True)
 except Exception as e:row.update(status="FAILED",error=str(e)); print("SOURCE_FAILED",src["code"],str(e),flush=True)
 finally:
  for f in SOURCE_DIR.glob(src["code"]+".*"): f.unlink()
 manifest.append(row)
(OUTPUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
with zipfile.ZipFile("out/agent-b-dvids-contact-scans.zip","w",zipfile.ZIP_DEFLATED,compresslevel=3) as z:
 for p in OUTPUT.glob("*"):
  if p.is_file():z.write(p,p.relative_to(OUTPUT))
print("SCANNED_COUNT",sum(x["status"]=="SOURCE_DECODED_SCANNED" for x in manifest))
if not any(x["status"]=="SOURCE_DECODED_SCANNED" for x in manifest):raise SystemExit("No decoded real video")
