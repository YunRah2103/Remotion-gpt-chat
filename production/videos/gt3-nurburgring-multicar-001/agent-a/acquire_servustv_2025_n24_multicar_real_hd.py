#!/usr/bin/env python3
"""Real ServusTV Nürburgring official N24 highlights source media retrieval and FFprobe strict full-HD gate.
Only public accessible streams; zero credit for metadata and unsuccessful requests.
"""
from pathlib import Path
import json,subprocess,hashlib,sys
from PIL import Image,ImageDraw
ROOT=Path("out/gt3-a-servustv-n24-originals");MEDIA=ROOT/"native_hd_video";REVIEW=ROOT/"contact_sheets"
for p in (ROOT,MEDIA,REVIEW):p.mkdir(parents=True,exist_ok=True)
VIDEOS=[
 {"id":"servustv_n24_2025_official_highlights","url":"https://www.servustv.com/sport/v/aafwdh76i3svl59w3v36/","expected":"2025 full Nürburgring 24h race highlights"},
 {"id":"servustv_n24_2025_livestream_replay","url":"https://www.servustv.com/sport/v/aab3by7x6w3wmrp22hm7/","expected":"2025 N24 live replay; may not be currently available"}
]
def run(a,t=65):
 try:return subprocess.run(a,capture_output=True,text=True,timeout=t)
 except subprocess.TimeoutExpired:return subprocess.CompletedProcess(a,124,"","REQUEST_TIME_BOUND_EXCEEDED")
def check(a,t=65):
 p=run(a,t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-650:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for v in iter(lambda:f.read(1024*1024),b''):h.update(v)
 return h.hexdigest()
for src in VIDEOS:
 src['status']="NO_PHYSICAL_HD_VIDEO"
 try:
  text=check(["yt-dlp","--ignore-config","--no-playlist","--no-warnings",
   "--socket-timeout","15","--retries","0","--fragment-retries","0","-J",src["url"]],80)
  j=json.loads(text)
  src.update(publisher_title=j.get("title"),duration_s=j.get("duration"),extractor=j.get("extractor"))
  fmts=[f for f in j.get('formats',[]) if (f.get('width') or 0)>=1920 and (f.get('height') or 0)>=1080 and (f.get('vcodec')!='none')]
  src["hd_format_candidates"]=[{k:v.get(k) for k in ("format_id","width","height","ext","protocol","tbr")} for v in fmts][-20:]
  if not fmts:raise ValueError("NO_LISTED_NATIVE_1920x1080_LANDSCAPE_FORMAT")
  dur=float(j.get("duration") or 0)
  offsets=[0,20,45,70,100,135,170,220] if dur>=250 else [0,12,28,50,70,90,115,150] if dur>=180 else [0,9,20,30,40,50] if dur>=65 else [0,10,20]
  shots=[]
  for n,t in enumerate(offsets[:8]):
   if dur and t>=dur-3:continue
   dest=MEDIA/(src["id"]+f"_ORIGINAL_SECTION_{n:02d}_t{int(t):03d}.%(ext)s")
   p=run(["yt-dlp","--ignore-config","--no-playlist","--no-warnings",
      "--socket-timeout","15","--retries","0","--fragment-retries","0",
      "-f","bv*[width>=1920][height>=1080]/b[width>=1920][height>=1080]",
      "--download-sections",f"*{t}-{t+6}","--merge-output-format","mp4",
      "--max-filesize","100M","-o",str(dest),src["url"]],100)
   videos=[f for f in MEDIA.glob(src["id"]+f"_ORIGINAL_SECTION_{n:02d}_t{int(t):03d}.*") if f.is_file() and f.stat().st_size>200000]
   if p.returncode or not videos:
    shots.append({"source_time":t,"status":"DOWNLOAD_FAILED","error":(p.stderr or p.stdout)[-400:]});continue
   f=max(videos,key=lambda v:v.stat().st_size)
   try:
    ff=json.loads(check(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)]))
    vid=next(x for x in ff["streams"] if x["codec_type"]=="video")
    w,h=int(vid["width"]),int(vid["height"])
    if w<1920 or h<1080 or w<=h:raise RuntimeError(f"SOURCE_NOT_NATIVE_LANDSCAPE_1080_{w}x{h}")
    check(["ffmpeg","-nostdin","-loglevel","error","-xerror","-i",str(f),"-f","null","-"],80)
    length=float(ff['format'].get('duration') or 0)
    im=Image.new("RGB",(960,215),(9,9,9));d=ImageDraw.Draw(im)
    for k in range(4):
     out=REVIEW/(f.stem+f"_f{k}.jpg")
     time=min(length-.02,max(.1,length*(k+.5)/4))
     check(["ffmpeg","-nostdin","-v","error","-y","-ss",str(time),"-i",str(f),
      "-frames:v","1","-vf","scale=240:180:force_original_aspect_ratio=decrease,pad=240:180:(ow-iw)/2:(oh-ih)/2",str(out)],40)
     with Image.open(out) as photo:im.paste(photo.convert("RGB"),(k*240,25))
     out.unlink(missing_ok=True);d.text((k*240+2,4),f"{t+time:.1f}s",fill="white")
    sheet=REVIEW/(f.stem+"_4FRAME.jpg");im.save(sheet,quality=87)
    shots.append({"source_time":t,"status":"REAL_NATIVE_HD_FULLY_DECODED_SCENE_MODEL_QA_PENDING",
     "file":str(f.relative_to(ROOT)),"width":w,"height":h,"bytes":f.stat().st_size,"sha256":sha(f),
     "contact_sheet":str(sheet.relative_to(ROOT)),"duration":length})
    print("REAL_GT3_POTENTIAL_RACE_SECTION",src["id"],t,w,h,shots[-1]["sha256"],flush=True)
   except Exception as e:
    shots.append({"source_time":t,"status":"REJECTED_DECODE_OR_NATIVE_PIXELS","error":str(e)[-400:]})
    f.unlink(missing_ok=True)
  src.update(status="PHYSICAL_VIDEO_PARTIAL_REVIEW" if any(x['status'].startswith("REAL_NATIVE") for x in shots) else "FAILED_ALL_DOWNLOADS",sections=shots)
 except Exception as e:src.update(status="BLOCKED_AT_SOURCE",error=str(e)[-800:])
 print("OFFICIAL_SERVUSTV_RESULT",src["id"],src["status"],src.get("error","")[-180:],flush=True)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps({"publisher":"ServusTV public Nürburgring racing video","sources":VIDEOS,
 "gate":"PENDING_INDEPENDENT_GT3_MAKE_VISUAL_AUDIT","no_synthetic_media":True},indent=2,ensure_ascii=False))
