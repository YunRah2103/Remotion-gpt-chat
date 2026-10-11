#!/usr/bin/env python3
"""Retrieve full publisher Nürburgring TOP QUALIFYING original from provenance.

Known prior *real* source preview was first 14 s. This downloads FULL original,
no invented CDN URL, byte-verified actual original source from prior HRT manifest.
Create 54-frame timeline proof for true distinct 1080 NBR GT3 shot review.
"""
import os,json,hashlib,zipfile,subprocess,sys,io
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path("out/gt3-a-hrt-full-n24-topqualifying-actual1080")
FILM=ROOT/"native_unmodified_full_original"
SHEETS=ROOT/"true_1080_source_contact_panels"
for d in (ROOT,FILM,SHEETS):d.mkdir(parents=True,exist_ok=True)
SRC=Path("inputs/hrt_14s_source_manifest")
zips=list(SRC.rglob("*.zip"))
assert zips, "Previously acquired real HRT movie manifest ZIP missing"
with zipfile.ZipFile(zips[0]) as z:
 assert z.testzip() is None
 previous=json.loads(z.read("SOURCE_MANIFEST.json"))
 row=next(x for x in previous["sources"] if x["source_id"]=="hrt_24hnbr_topqualifying")
 assert row["status"]=="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING"
 assert row["resolution"]==[1920,1080]
 URL=row["actual_media_url"]
assert URL.startswith("https://")
def checksum(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def attempt(args,t=190):
 try:return subprocess.run(args,capture_output=True,text=True,timeout=t)
 except subprocess.TimeoutExpired:return subprocess.CompletedProcess(args,124,"","BOUNDED_DOWNLOAD_TIMEOUT")
def run(args,t=60):
 p=attempt(args,t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-450:])
 return p.stdout
report={"original_publisher":"https://www.hauptracingteam.de/en/video-detail/24h-nbr-top-qualifying.html",
 "original_publisher_video_URL":URL,"source_preview_14s_sha256":row["sha256"],
 "approved_additional_GT3_angles":0,"status":"ATTEMPT","never_count_previously_accepted_aerial_or_cockpit_twice":True}
try:
 print("PUBLISHER_DIRECT_ORIGINAL_URL",URL[:350],flush=True)
 dest=FILM/"HRT_NBR_TOP_QUALIFYING_FULL_%(ext)s"
 cmd=[sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings",
  "--socket-timeout","15","--retries","1","--fragment-retries","1","--max-filesize","220M",
  "-f","bv*[width>=1920][height>=1080]+ba/b[width>=1920][height>=1080]",
  "--merge-output-format","mp4","-o",str(dest),URL]
 got=attempt(cmd,230)
 report["ytdlp_stdout"]=got.stdout[-600:];report["ytdlp_stderr"]=got.stderr[-750:]
 if got.returncode:print("PRIMARY_FULL_DOWNLOAD_FAILED",got.stderr[-420:],flush=True)
 choices=[f for f in FILM.iterdir() if f.is_file() and f.stat().st_size>1_000_000]
 if not choices:
  # For truly public progressive files or HLS playlists FFmpeg stream-copy can work.
  out=FILM/"HRT_NBR_TOP_QUALIFYING_FULL_fallback.mkv"
  alt=attempt(["ffmpeg","-nostdin","-loglevel","error","-y","-i",URL,
    "-map","0:v:0","-map","0:a?","-c","copy","-t","170",str(out)],170)
  report["ffmpeg_fallback_log"]=alt.stderr[-600:]
  choices=[f for f in FILM.iterdir() if f.is_file() and f.stat().st_size>1_000_000]
 if not choices:raise RuntimeError("NO_FULL_REAL_VIDEO_DOWNLOADED")
 film=max(choices,key=lambda f:f.stat().st_size)
 meta=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(film)],30))
 v=next(x for x in meta["streams"] if x["codec_type"]=="video")
 w,h=int(v["width"]),int(v["height"]);dur=float(meta["format"].get("duration") or 0)
 if w<1920 or h<1080 or w<=h:raise RuntimeError(f"ORIGINAL_BELOW_NATIVE_1080_{w}x{h}")
 if dur<60:raise RuntimeError(f"ORIGINAL_NOT_FULL_FILM_DUR_{dur}")
 run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(film),"-f","null","-"],280)
 print("FULL_QUALIFYING_NATIVE_ORIGINAL_VERIFIED",w,h,dur,film.stat().st_size,checksum(film),flush=True)
 frames=[]
 for panel in range(3):
  board=Image.new("RGB",(6*330,3*218),(8,8,8));draw=ImageDraw.Draw(board)
  for i in range(18):
   k=panel*18+i
   t=dur*(k+.45)/54
   tmp=SHEETS/f"frame_tmp_{k:02d}.jpg"
   check=attempt(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{t:.3f}",
    "-i",str(film),"-frames:v","1","-vf","scale=330:186","-q:v","3",str(tmp)],30)
   if check.returncode:raise RuntimeError("FRAME_EXTRACTION_FAILED "+check.stderr[-200:])
   with Image.open(tmp) as photo:board.paste(photo.convert("RGB"),((i%6)*330,(i//6)*218+24))
   tmp.unlink(missing_ok=True)
   draw.text(((i%6)*330+3,(i//6)*218+3),f"HRT Nord N24 {t:.1f}s",fill="white")
   frames.append({"src_t":round(t,3),"panel":panel+1})
  path=SHEETS/(f"ACTUAL_HRT_TOPQ_FULL_1080_18FRAMES_PANEL_{panel+1}.jpg")
  board.save(path,quality=87)
  print("SOURCE_CAMERA_SURVEY_SAVED",panel+1,path.stat().st_size,flush=True)
 report.update(status="FULL_NATIVE_1080_MOVIE_FULL_DECODED_INDEPENDENT_RACING_FRAME_REVIEW_PENDING",
  original_path=str(film.relative_to(ROOT)),original_sha256=checksum(film),
  original_bytes=film.stat().st_size,duration=dur,native_pixels=[w,h],
  contact_panels=[str(p.relative_to(ROOT)) for p in sorted(SHEETS.glob("*PANEL*"))],
  timestamps=frames,full_decode=True)
except Exception as e:
 report.update(status="REJECTED_OR_BLOCKED",failure=str(e)[-650:])
 for f in FILM.glob("*"):f.unlink(missing_ok=True)
 print("ORIGINAL_FILM_FAILED",report["failure"],flush=True)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
