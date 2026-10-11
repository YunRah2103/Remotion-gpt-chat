#!/usr/bin/env python3
"""Live alternative downloader comparison for Lamborghini Huracan STO social videos.

Independent acquisition backends: gallery-dl, Instaloader, and tt-dlp.
Run unauthenticated against two pre-identified public STO posts. Downloaded media
requires FFprobe-native resolution and frame QC before delivery to Agent B.
Do not treat a successful exit code as downloaded watermark-free footage.
"""
import hashlib,json,subprocess,time,zipfile
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path("out/sto-independent-downloaders");ROOT.mkdir(parents=True,exist_ok=True)
CANDIDATES=[
 ("instagram","https://www.instagram.com/reel/CwsgJPbMhBL/"),
 ("tiktok","https://www.tiktok.com/@luxury.speed/video/7407202646785920287")
]
TARGETS=[
 ("gallery-dl-instagram",CANDIDATES[0][1],["gallery-dl","--directory","{OUT}","--no-part",CANDIDATES[0][1]]),
 ("instaloader-reel",CANDIDATES[0][1],["instaloader","--dirname-pattern","{OUT}","--no-captions","--no-video-thumbnails","--no-metadata-json","--","-CwsgJPbMhBL"]),
 ("gallery-dl-tiktok",CANDIDATES[1][1],["gallery-dl","--directory","{OUT}","--no-part",CANDIDATES[1][1]]),
 ("tt-dlp-tiktok",CANDIDATES[1][1],["tt-dlp","--no-stories",CANDIDATES[1][1]]),
]
def probe(f):
 r=subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)],capture_output=True,text=True,timeout=30)
 if r.returncode:raise ValueError("FFPROBE_INVALID_MEDIA")
 j=json.loads(r.stdout)
 video=next(x for x in j["streams"] if x["codec_type"]=="video")
 return {"width":video["width"],"height":video["height"],"duration":round(float(j["format"].get("duration") or 0),2),
  "codec":video.get("codec_name"),"bytes":f.stat().st_size,"sha256":hashlib.sha256(f.read_bytes()).hexdigest()}
def category(log):
 v=log.lower()
 if "403" in v or "forbidden" in v:return "FORBIDDEN_403"
 if "429" in v or "too many requests" in v:return "RATE_LIMIT_429"
 if "login" in v or "authenticate" in v or "log in" in v:return "LOGIN_REQUIRED"
 if "404" in v or "not found" in v:return "POST_NOT_FOUND"
 if "unsupported" in v:return "UNSUPPORTED_SITE_OR_MEDIA"
 if "challenge" in v or "verify" in v:return "BOT_CHALLENGE"
 if "no video" in v or "no media" in v:return "NO_MEDIA"
 if "could not resolve" in v or "connection" in v:return "NETWORK_OR_DNS"
 return "UNCLASSIFIED_FAILURE"
def make_board(file,m,out):
 dur=m["duration"]
 if dur<=0.1:return
 im=Image.new("RGB",(960,6*155),"#101015");draw=ImageDraw.Draw(im)
 for i in range(24):
  t=min(dur-.05,max(.08,dur*(i+.5)/24))
  p=ROOT/".sample.jpg"
  subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-ss",str(t),"-i",str(file),
    "-vf","scale=240:135:force_original_aspect_ratio=decrease,pad=240:135:(ow-iw)/2:(oh-ih)/2",
    "-frames:v","1",str(p)],capture_output=True,timeout=35)
  if p.exists():
   with Image.open(p) as pic:im.paste(pic.convert("RGB"),((i%4)*240,(i//4)*155+17))
   p.unlink()
  draw.text(((i%4)*240+3,(i//4)*155+3),str(round(t,1)),fill="white")
 im.save(out,quality=87)
def main():
 results=[]
 for label,url,base in TARGETS:
  directory=ROOT/label;directory.mkdir(parents=True,exist_ok=True)
  args=[p.replace("{OUT}",str(directory.resolve())) for p in base]
  entry={"backend":label,"source_url":url,"status":"NOT_ATTEMPTED","native_fullhd_landscape_mp4s":[]}
  started=time.monotonic()
  try:
   # Change working directory for backends with their own folder creation rules.
   run=subprocess.run(args,capture_output=True,text=True,cwd=directory,timeout=95)
   media=[f for f in directory.rglob("*") if f.is_file() and f.suffix.lower() in (".mp4",".mkv",".webm",".mov")]
   entry.update(return_code=run.returncode,elapsed_s=round(time.monotonic()-started,1),
                actual_media_files=len(media),safe_failure_code=category((run.stderr or "")+"\n"+(run.stdout or "")) if run.returncode or not media else None)
   entry["status"]="REAL_MEDIA_DOWNLOADED_REQUIRES_FFPROBE" if media else "NO_MEDIA_DOWNLOADED"
   for f in media[:6]:
    try:
     p=probe(f)
     p["filename"]=str(f.relative_to(ROOT))
     p["accepted_native_fhd_landscape"]=(p["width"]>=1920 and p["height"]>=1080 and p["width"]>p["height"] and p["duration"]>=2)
     entry["native_fullhd_landscape_mp4s"].append(p)
     if p["accepted_native_fhd_landscape"]:
      make_board(f,p,ROOT/(label+"_contact.jpg"))
     else:
      f.unlink(missing_ok=True)
    except Exception as e:
     entry.setdefault("probe_errors",[]).append(type(e).__name__)
     f.unlink(missing_ok=True)
   if any(p["accepted_native_fhd_landscape"] for p in entry["native_fullhd_landscape_mp4s"]):
    entry["status"]="NATIVE_FHD_SOURCE_ACQUIRED_BUT_NOT_WATERMARK_OR_STO_ID_APPROVED"
   elif media:
    entry["status"]="REJECT_ALL_MEDIA_BELOW_NATIVE_FHD"
  except subprocess.TimeoutExpired:
   entry.update(status="TIMEOUT",elapsed_s=95)
  except FileNotFoundError:
   entry.update(status="BACKEND_NOT_INSTALLED")
  except Exception as e:
   entry.update(status="ERROR",error_code=type(e).__name__)
  finally:
   # Delete all non-video files; do not package scraped metadata or thumbnails.
   for f in directory.rglob("*"):
    if f.is_file() and f.suffix.lower() not in (".mp4",".mkv",".webm",".mov"):
     f.unlink(missing_ok=True)
   results.append(entry)
   (ROOT/"manifest.json").write_text(json.dumps({"scope":"native landscape 1920x1080+ Lamborghini Huracan STO",
       "actual_results":results,"visually_approved_clean_sto_shots":0,
       "note":"Download success does not establish unwatermarked genuine moving road STO"},indent=2))
   print("INDEPENDENT_BACKEND",label,entry["status"],entry.get("safe_failure_code"),entry.get("actual_media_files",0),flush=True)
 accepted=sum(sum(p["accepted_native_fhd_landscape"] for p in r["native_fullhd_landscape_mp4s"]) for r in results)
 with zipfile.ZipFile("out/STO_INDEPENDENT_DOWNLOADERS_REVIEW.zip","w",zipfile.ZIP_STORED,allowZip64=True) as z:
  for f in ROOT.rglob("*"):
   if f.is_file():z.write(f,f.relative_to(ROOT))
 print("NATIVE_FULLHD_LANDSCAPE_ACQUIRED",accepted)
if __name__=="__main__":main()
