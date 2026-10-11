#!/usr/bin/env python3
"""A2: attempt actual publisher Vimeo 2023 Nürburgring race film original HD.
The film predates known Ferrari 296 GT3 victory but could show other racing makes.
Do not attribute Ferrari or McLaren merely because of the event.
"""
import json,hashlib,subprocess,zipfile,os,shutil,time
from pathlib import Path
from PIL import Image,ImageDraw
OUT=Path("out/gt3-a2-vimeo-2023")
MEDIA=OUT/"native_media"; SHEETS=OUT/"review_sheets"
for x in [MEDIA,SHEETS]:x.mkdir(parents=True,exist_ok=True)
SRC={"id":"ravenol_n24_2023","publisher":"Russart & Lösch / RAVENOL","source_url":"https://vimeo.com/844209222",
     "event":"2023 24 Hours Nürburgring","expected_models":"MULTI GT3 CANDIDATE, Ferrari 296 GT3 NOT YET VERIFIED"}
def cmd(args,timeout=90):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-700:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
 return h.hexdigest()
records=[]
source=MEDIA/"RAVENOL_N24_2023_REAL_PUBLISHER_REVIEW.mkv"
record={**SRC,"status":"NOT_ACQUIRED","manually_approved_gt3_shots":0}
try:
 opt=["yt-dlp","--ignore-config","--no-playlist","--socket-timeout","12","--retries","1","--fragment-retries","1",
      "--no-part","--no-progress","--merge-output-format","mkv",
      "-f","bestvideo[height>=1080]+bestaudio/best[height>=1080]",
      "-o",str(MEDIA/"RAVENOL_N24_2023_REAL_PUBLISHER_REVIEW.%(ext)s"),SRC["source_url"]]
 try:cmd(opt,115)
 except Exception as e:
  record["primary_error"]=str(e)[-600:]
  # Alternate direct player on the same public official Vimeo source
  opt[-1]="https://player.vimeo.com/video/844209222"
  cmd(opt,115)
 files=[p for p in MEDIA.iterdir() if p.suffix.lower() in (".mkv",".mp4",".webm") and p.stat().st_size>100000]
 if not files:raise RuntimeError("NO_REAL_VIDEO_DOWNLOADED")
 src=max(files,key=lambda p:p.stat().st_size)
 raw=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(src)],30))
 v=next(x for x in raw["streams"] if x["codec_type"]=="video")
 w,h=int(v["width"]),int(v["height"])
 if w<1920 or h<1080:raise RuntimeError(f"REAL_NATIVE_BELOW_HD_{w}x{h}")
 dur=float(raw["format"].get("duration") or 0)
 if dur<2:raise RuntimeError("SOURCE_TOO_SHORT")
 # For huge long documentary film, sample only first 70s -- still real original video source, no upscaling.
 if dur>70:
  output=MEDIA/"RAVENOL_2023_NATIVE_FIRST_70_SECONDS.mkv"
  cmd(["ffmpeg","-nostdin","-v","error","-y","-i",str(src),"-t","70","-map","0:v:0","-map","0:a?","-c","copy",str(output)],110)
  src.unlink()
  src=output
  raw=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(src)],30))
  dur=float(raw["format"].get("duration") or 0)
 cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(src),"-f","null","-"],160)
 sheet=Image.new("RGB",(1600,990),"#141414");d=ImageDraw.Draw(sheet)
 for i in range(16):
  ts=round(dur*(i+.45)/16,2)
  fn=SHEETS/(f"_tmp_{i}.jpg")
  cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(src),"-frames:v","1",
       "-vf","scale=400:225:force_original_aspect_ratio=decrease,pad=400:225:(ow-iw)/2:(oh-ih)/2","-q:v","5",str(fn)],30)
  with Image.open(fn) as img:sheet.paste(img.convert("RGB"),((i%4)*400,(i//4)*247+22))
  d.text(((i%4)*400+8,(i//4)*247+3),f"N24 2023  t={ts}s",fill="white")
  fn.unlink(missing_ok=True)
 review=SHEETS/"N24_2023_16_FRAME_FILM_IDENTITY_REVIEW.jpg";sheet.save(review,quality=85)
 record.update(status="REAL_NATIVE_HD_FULLY_DECODED_VISUAL_REVIEW_REQUIRED",
   media_file=str(src.relative_to(OUT)),sha256=sha(src),
   file_bytes=src.stat().st_size,native_pixels=f"{w}x{h}",
   duration_s=dur,ffprobe=raw,contact_sheet=str(review.relative_to(OUT)))
 print("NATIVE_HD_VIDEO_DOWNLOADED",record["media_file"],record["native_pixels"],record["sha256"],flush=True)
except Exception as e:
 record.update(status="REJECTED_NO_QUALIFYING_REAL_VIDEO",error=str(e)[-800:])
 print("REJECT",str(e)[-400:],flush=True)
 shutil.rmtree(MEDIA,ignore_errors=True)
 MEDIA.mkdir(exist_ok=True)
records.append(record)
report={"agent":"A2","source_films_native_hd":int(record["status"].startswith("REAL_NATIVE")),
        "verified_gt3_shots":0,"verified_ferrari":False,"verified_mclaren":False,
        "status":"PENDING_VISUAL_GT3_ID" if record["status"].startswith("REAL_NATIVE") else "BLOCKED",
        "record":record}
(OUT/"manifest.json").write_text(json.dumps(report,indent=2)+"\n")
(OUT/"README.md").write_text("# A2 publisher-Native Vimeo 2023 Nürburgring source\n\n"
"Actual decoded media and film-scale contact sheet only if native-resolution checks pass. "
"Do NOT infer car manufacturer/class merely from a Nürburgring film title. "
"No Ferrari/McLaren shot declared until visually inspected.\n")
zipfile_path=OUT/"GT3_A2_RAVENOL_2023_NATIVE_REVIEW.zip"
with zipfile.ZipFile(zipfile_path,"w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
 for p in OUT.rglob("*"):
  if p.is_file() and p!=zipfile_path:z.write(p,str(p.relative_to(OUT)))
with zipfile.ZipFile(zipfile_path) as z:assert z.testzip() is None
print("COMPLETE",report["source_films_native_hd"],zipfile_path.stat().st_size,sha(zipfile_path),flush=True)
