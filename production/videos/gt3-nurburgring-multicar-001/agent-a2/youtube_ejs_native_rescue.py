#!/usr/bin/env python3
"""A2: test properly configured yt-dlp + EJS Node v24 from official public N24 race films.

No claims until real video bytes, native >=1920x1080, full decode, source SHA,
and visual review. Public streams only; no login/DRM/CAPTCHA bypass.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,hashlib,zipfile,shutil,datetime
OUT=Path("out/gt3-a2-youtube-ejs")
SRC=OUT/"originals_pending_human_review"; SHEETS=OUT/"contact_sheets"
for p in [OUT,SRC,SHEETS]:p.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("ferrari_frikadelli_2023_specific","https://www.youtube.com/watch?v=S5l4ILnFAZU",
  "Special Frikadelli Racing Ferrari 296 GT3 N24 2023 - independent race film"),
 ("ferrari_n24_2023_official_highlights","https://www.youtube.com/watch?v=0w0Bk7P2LiY",
  "ADAC Nürburgring 2023 official 51st race full highlights / Frikadelli Ferrari 296 GT3 win"),
 ("gtwc_2026_nurburgring_race_start","https://www.youtube.com/watch?v=nzZ4fAULc4g",
  "GT World GTWC Europe Nürburgring 2026 real pack start includes McLaren/Ferrari unverified")
]
def cmd(args,timeout=140):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 return p
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def make_sheet(p,stem,dur):
 canvas=Image.new("RGB",(1280,740),"#191919")
 d=ImageDraw.Draw(canvas)
 for i in range(12):
  ts=round(max(.2,dur*(i+.5)/12),2)
  filename=SHEETS/(stem+f"_{i}.jpg")
  r=cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(p),
         "-frames:v","1","-vf","scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2",
         str(filename)],25)
  if r.returncode:raise RuntimeError(r.stderr[-350:])
  with Image.open(filename) as frame:canvas.paste(frame.convert("RGB"),((i%4)*320, (i//4)*245+30))
  d.text(((i%4)*320+5,(i//4)*245+5),f"{stem} {ts}s",fill="white")
  filename.unlink(missing_ok=True)
 dst=SHEETS/(stem+"_12frame.jpg");canvas.save(dst,quality=88)
 return str(dst.relative_to(OUT))
log=[]
for name,url,desc in SOURCES:
 item={"id":name,"url":url,"description":desc,"status":"NOT_ACQUIRED",
       "approved_gt3_identity":False,"approved_camera_views":0}
 cmdline=["yt-dlp","--ignore-config","--no-playlist","--no-warnings",
       "--js-runtimes","node","--remote-components","ejs:github",
       "--socket-timeout","15","--retries","1","--fragment-retries","1",
       "--no-progress","--download-sections","*0-23",
       "-f","bestvideo[height>=1080]+bestaudio/best[height>=1080]",
       "--merge-output-format","mkv","-o",str(SRC/(name+".%(ext)s")),url]
 try:
  p=cmd(cmdline,115)
  item["yt_dlp_log_tail"]=(p.stdout+"\n"+p.stderr)[-2500:]
  if p.returncode:raise RuntimeError("yt-dlp:"+p.stderr[-850:])
  files=[f for f in SRC.glob(name+".*") if f.suffix.lower() in (".mkv",".mp4",".webm") and f.stat().st_size>=100000]
  if not files:raise RuntimeError("0 actually downloaded media bytes")
  f=max(files,key=lambda f:f.stat().st_size)
  pr=cmd(["ffprobe","-v","error","-of","json","-show_format","-show_streams",str(f)],25)
  if pr.returncode:raise RuntimeError("ffprobe: "+pr.stderr[-300:])
  meta=json.loads(pr.stdout)
  v=next(x for x in meta["streams"] if x["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  dur=float(meta["format"].get("duration") or 0)
  if w<1920 or h<1080 or dur<3:
   raise RuntimeError("Original lacks 1080 landscape pixels or duration "+str((w,h,dur)))
  decode=cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(f),"-map","0:v:0","-f","null","-"],110)
  if decode.returncode:raise RuntimeError("full decode: "+decode.stderr[-500:])
  item.update(status="NATIVE_LANDSCAPE_ORIGINAL_FULLY_DECODED_GT3_VISUAL_REVIEW_PENDING",
       native_pixels=[w,h],duration_s=dur,media_file=str(f.relative_to(OUT)),
       bytes=f.stat().st_size,sha256=sha(f),
       ffprobe=meta,contact_sheet=make_sheet(f,name,dur))
  print("REAL_NATIVE_1080_VIDEO",name,w,h,dur,f.stat().st_size,sha(f),flush=True)
 except Exception as e:
  item.update(status="REJECTED_NO_QUALIFYING_REAL_VIDEO",error=str(e)[-900:])
  for f in SRC.glob(name+".*"):f.unlink(missing_ok=True)
  print("REJECTED_SOURCE",name,item["error"],flush=True)
 log.append(item)
manifest={"agent":"A2","primary_gap":"Ferrari 296 GT3 and McLaren 720S GT3 EVO",
          "film_count_with_real_decoded_native_1080_bytes":sum(x["status"].startswith("NATIVE") for x in log),
          "approved_unique_gt3_shots":0,"status":"HUMAN_CAMERA_GT3_MODEL_QA_PENDING",
          "sources":log,"method":"yt-dlp default bundled EJS scripts + Node >=22; only public film downloads"}
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
(OUT/"README.md").write_text("# A2 YouTube EJS test / real source material\n\n"
 f"Real decoded >=1080p landscape video excerpts: {manifest['film_count_with_real_decoded_native_1080_bytes']}. "
 "No automatic Ferrari or McLaren make approval; original videos and 12-frame sheets only when bytes are genuinely obtained. "
 "Video segments have real timecode [0–23s]; original formats and source URL in manifest. "
 "Never infer independent racing shots from an upload or codec metadata alone.\n")
dst=OUT/"GT3_A2_YOUTUBE_EJS_REAL_NATIVE_MEDIA_AND_QA.zip"
with zipfile.ZipFile(dst,"w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
 for f in OUT.rglob("*"):
  if f.is_file() and f!=dst:z.write(f,str(f.relative_to(OUT)))
with zipfile.ZipFile(dst) as z:
 assert z.testzip() is None
 for x in log:
  if x["status"].startswith("NATIVE"):
   assert hashlib.sha256(z.read(x["media_file"])).hexdigest()==x["sha256"]
print("EJS_RUN_COMPLETE",manifest["film_count_with_real_decoded_native_1080_bytes"],
      "ZIP_BYTES",dst.stat().st_size,"SHA",sha(dst),flush=True)
