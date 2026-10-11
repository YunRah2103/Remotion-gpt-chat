#!/usr/bin/env python3
"""Test actual X/Twitter Nürburgring official public race videos with native visual QA.
Original 2023 Ferrari 296 GT3 #30 Nürburgring winning N24 status IDs from media publication.
All sources model-PENDING until visually inspected.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,zipfile,hashlib
OUT=Path("out/gt3-a2-2023-x-race-originals"); SRC=OUT/"original_race_videos";SHEETS=OUT/"contact_sheets"
for p in (OUT,SRC,SHEETS):p.mkdir(parents=True,exist_ok=True)
SITES=[
 ("n24_2023_nuerburgring_official_finish","https://twitter.com/nuerburgring/status/1660286167554703364"),
 ("n24_2023_24hNBR_official_winner","https://twitter.com/24hNBR/status/1660286421867929600"),
 ("nls_2025_ferrari_verstappen_press_video","https://twitter.com/x/status/1970866121168281841"),
 ("n24_2026_gt3_intercontinental","https://x.com/IntercontGTC/status/2055273377791918136")
]
def run(cmd,timeout=55):
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 return p
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for block in iter(lambda:f.read(1048576),b""):h.update(block)
 return h.hexdigest()
def frames(path,name,dur):
 image=Image.new("RGB",(1280,640),"#101010");d=ImageDraw.Draw(image)
 for i in range(8):
  t=min(dur-0.1,max(0.3,dur*(i+0.5)/8))
  dest=SHEETS/(name+f"_{i}.jpg")
  r=run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(path),"-frames:v","1",
      "-vf","scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2",str(dest)],30)
  if r.returncode:raise RuntimeError(r.stderr[-180:])
  with Image.open(dest) as piece:image.paste(piece.convert("RGB"),((i%4)*320,(i//4)*310+30))
  d.text(((i%4)*320+4,(i//4)*310+4),f"{name} {t:.2f}s",fill="white")
  dest.unlink()
 fn=SHEETS/(name+"_8frames.jpg");image.save(fn,quality=90)
 return str(fn.relative_to(OUT))
report=[]
for id,url in SITES:
 row={"id":id,"url":url,"status":"NO_ACTUAL_NATIVE_VIDEO","visual_gt3_model_proven":False}
 try:
  d=run(["yt-dlp","--ignore-config","--no-playlist","--socket-timeout","12",
       "--retries","1","--fragment-retries","1","--no-warnings",
       "--download-sections","*0-18","-f","bestvideo[height>=1080]+bestaudio/best[height>=1080]",
       "--merge-output-format","mp4","-o",str(SRC/(id+".%(ext)s")),url],55)
  row["yt_dlp_output_tail"]=(d.stdout+"\n"+d.stderr)[-2500:]
  if d.returncode:raise RuntimeError(d.stderr[-1000:])
  files=[x for x in SRC.glob(id+".*") if x.is_file() and x.suffix in (".mp4",".mkv",".webm") and x.stat().st_size>=100000]
  if not files:raise RuntimeError("No genuine media downloaded")
  f=max(files,key=lambda x:x.stat().st_size)
  p=run(["ffprobe","-v","error","-of","json","-show_format","-show_streams",str(f)],20)
  if p.returncode:raise RuntimeError(p.stderr[-400:])
  meta=json.loads(p.stdout);v=next(s for s in meta["streams"] if s["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"]);dur=float(meta["format"]["duration"])
  if w<1920 or h<1080 or w<=h:raise RuntimeError(f"native source only {w}x{h}; strict gate 1920x1080")
  decode=run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(f),"-map","0:v:0","-f","null","-"],65)
  if decode.returncode:raise RuntimeError(decode.stderr[-450:])
  row.update(status="REAL_FULLY_DECODED_NATIVE_1080_MODEL_VISUAL_REVIEW_ONLY",pixels=[w,h],duration=dur,
             source_file=str(f.relative_to(OUT)),sha256=sha(f),bytes=f.stat().st_size,
             contact_sheet=frames(f,id,dur))
  print("TWITTER_REAL_1080_VIDEO",id,w,h,row["bytes"],row["sha256"],flush=True)
 except Exception as e:
  row["failure"]=str(e)[-900:]
  for f in SRC.glob(id+".*"):f.unlink(missing_ok=True)
  print("TWITTER_REJECT",id,row["failure"],flush=True)
 report.append(row)
m={"project":"YUNEX GT3 Nürburgring Multi-Car 001","agent":"A2","approved_ferrari_shots":0,"approved_mclaren_shots":0,
   "physical_native_full_decode_videos":sum(r["status"].startswith("REAL_FULLY") for r in report),
   "status":"VISUAL_MANUFACTURER_AND_FULLFRAME_INSPECTION_REQUIRED","results":report}
(OUT/"manifest.json").write_text(json.dumps(m,indent=2)+"\n")
(OUT/"README.md").write_text("A2 authentic Ferrari Nürburgring 2023 official public X source film QA. Titles/tweet publisher do not prove Ferrari 296 GT3 appears. If 1080 original exists, contact sheets and real playable source included; gate still requires manufacturer/model and distinct camera inspection.")
pack=OUT/"GT3_A2_2023_OFFICIAL_N24_TWEET_RACE_ORIGINALS_QA.zip"
with zipfile.ZipFile(pack,"w",compression=zipfile.ZIP_STORED) as z:
 for f in OUT.rglob("*"):
  if f.is_file() and f!=pack:z.write(f,str(f.relative_to(OUT)))
with zipfile.ZipFile(pack) as z:
 assert z.testzip() is None
 for r in report:
  if r["status"].startswith("REAL_FULLY"):
   assert hashlib.sha256(z.read(r["source_file"])).hexdigest()==r["sha256"]
print("TWITTER_OFFICIAL_2023_RUN_COMPLETE",m["physical_native_full_decode_videos"],pack.stat().st_size,sha(pack),flush=True)
