#!/usr/bin/env python3
"""ONE targeted authentic landscape 2025 N24 Lamborghini #27 full-HD onboard source.

Explicit JavaScript-enabled YouTube original extractor test. Do not bypass
accounts, CAPTCHA/DRM, or quality gate. No media approval from metadata alone.
"""
import json,hashlib,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path("out/gt3-a-lambo27-official-2025-original")
VIDEOS=ROOT/"native_16by9_originals";STILLS=ROOT/"contact_sheets"
for p in (ROOT,VIDEOS,STILLS):p.mkdir(parents=True,exist_ok=True)
URL="https://www.youtube.com/watch?v=ZEPAuItPQSI"
record={"url":URL,"publisher":"Official ADAC RAVENOL 24h Nürburgring","expected":"2025 N24 ABT #27 Lamborghini Huracan GT3 EVO2 onboard, actual visual and source QA required","status":"UNACQUIRED"}
def call(a,t=70):
 try:return subprocess.run(a,capture_output=True,text=True,timeout=t)
 except subprocess.TimeoutExpired:return subprocess.CompletedProcess(a,124,"","BOUNDED_TIMEOUT")
def check(a,t=70):
 p=call(a,t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-650:])
 return p.stdout
def hashf(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for block in iter(lambda:f.read(1048576),b""):h.update(block)
 return h.hexdigest()
base=[sys.executable,"-m","yt_dlp","--ignore-config","--no-warnings","--no-playlist",
 "--js-runtimes","node","--remote-components","ejs:github",
 "--socket-timeout","15","--retries","0","--fragment-retries","0"]
try:
 data=json.loads(check(base+["--skip-download","-J",URL],105))
 record.update(actual_title=data.get("title"),actual_duration=data.get("duration"),extractor=data.get("extractor"))
 fmts=[x for x in data.get("formats",[]) if (x.get("width") or 0)>=1920 and (x.get("height") or 0)>=1080 and x.get("vcodec")!="none"]
 record["fhd_actual_formats"]=[{k:x.get(k) for k in ("format_id","height","width","fps","ext","protocol")} for x in fmts][-25:]
 if not fmts:raise RuntimeError("NO_YOUTUBE_SOURCE_NATIVE_1920x1080_RENDITION")
 choice=fmts[-1]
 print("OFFICIAL_REAL_LAMBO_VIDEO_HD_FORMAT",choice.get("format_id"),choice.get("width"),choice.get("height"),flush=True)
 target=VIDEOS/"ADAC_RED_BULL_ABT_GT3_ONBOARD_2025_%(ext)s"
 download=call(base+["--download-sections","*20-33","--max-filesize","150M",
   "-f",choice["format_id"],"--merge-output-format","mp4","-o",str(target),URL],150)
 record["download_exit"]=download.returncode
 if download.returncode:raise RuntimeError("YT_EXTRACTION_FAIL "+download.stderr[-550:])
 files=[f for f in VIDEOS.iterdir() if f.is_file() and f.stat().st_size>100000]
 if not files:raise RuntimeError("NO_MEDIA_BYTES_AFTER_DOWNLOAD")
 file=max(files,key=lambda p:p.stat().st_size)
 info=json.loads(check(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(file)]))
 v=next(x for x in info["streams"] if x["codec_type"]=="video")
 w,h=int(v["width"]),int(v["height"]);dur=float(info["format"]["duration"])
 if w<1920 or h<1080 or w<=h:raise RuntimeError("ORIGINAL_NOT_FHD")
 check(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(file),"-f","null","-"],100)
 img=Image.new("RGB",(4*480,2*295),(9,9,9));draw=ImageDraw.Draw(img)
 for i in range(8):
  sec=dur*(i+.45)/8
  still=STILLS/(f"frame_{i:02d}.jpg")
  check(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{sec:.3f}","-i",str(file),
         "-frames:v","1","-vf","scale=480:270","-q:v","3",str(still)],35)
  with Image.open(still) as im:img.paste(im.convert("RGB"),((i%4)*480,(i//4)*295+23))
  still.unlink()
  draw.text(((i%4)*480+5,(i//4)*295+2),f"clip sec={sec:.1f}",fill="white")
 sheet=STILLS/"LAMBO_ABT27_2025_REAL_ONBOARD_8FRAMES.jpg";img.save(sheet,quality=87)
 record.update(status="REAL_NATIVE_FULL_HD_ORIGINAL_DECODED_MODEL_CAMERA_QA_PENDING",
     original_movie=str(file.relative_to(ROOT)),actual_native_pixels=[w,h],bytes=file.stat().st_size,sha256=hashf(file),
     cut_duration=dur,contact_sheet=str(sheet.relative_to(ROOT)),ffprobe=info)
 print("NEW_ORIGINAL_LAMBO_GT3_N24_FHD_LANDSCAPE_VIDEO",w,h,record["sha256"],file.stat().st_size,flush=True)
except Exception as e:
 record.update(status="UNAVAILABLE_OR_FAIL_FULL_NATIVE_1080_GATE",reason=str(e)[-850:])
 for v in VIDEOS.iterdir():v.unlink(missing_ok=True)
 print("OFFICIAL_ONBOARD_ORIGINAL_REJECTED",record["reason"],flush=True)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps(record,indent=2,ensure_ascii=False)+"\n")
