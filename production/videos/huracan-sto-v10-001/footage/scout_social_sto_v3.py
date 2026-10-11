#!/usr/bin/env python3
"""Scout genuine Lamborghini Huracan STO social video masters for Agent B.

Sources are exact public TikTok/Instagram post URLs or social-video page links
discovered on publisher metadata pages. Download only accessible playback files.
Gate: NATIVE >=1920x1080 LANDSCAPE, non-upscaled, decent bitrate/duration.
Visual watermark and correct road-STO identity require inspection of contact
sheets before footage is approved for edit; no automatic gate PASS.
"""
from __future__ import annotations
import hashlib, html, json, re, subprocess, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path("out/sto-social-v3")
VIDEOS=ROOT/"original_videos"
SHEETS=ROOT/"contact_sheets"
VIDEOS.mkdir(parents=True,exist_ok=True)
SHEETS.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {"id":"tiktok-luxuryspeed-sto","platform":"TikTok","url":"https://www.tiktok.com/@luxury.speed/video/7407202646785920287","why":"STO clip explicitly identifies original photographer @speedfxusa; sound and pull"},
 {"id":"instagram-sto-cerdena","platform":"Instagram","url":"https://www.instagram.com/reel/CwsgJPbMhBL/","why":"STO Instagram reel linked directly in automotive forum"},
]
DISCOVERY_PAGES=[
 "https://pictame.com/en/discover/hashtag/huracansto",
 "https://pictame.com/en/discover/hashtag/lamborghini-huracan-sto",
 "https://pictame.com/en/discover/hashtag/huracan-sto",
 "https://pictame.com/en/discover/hashtag/lamborghinihuracansto",
]
MAX_CANDIDATES=14
MAX_DURATION=180
MAX_PER_FILE=190_000_000
TOTAL_CAP=600_000_000
def accepted_url(u):
 p=urllib.parse.urlsplit(u)
 if p.scheme!="https" or not p.hostname:return None
 host=p.hostname.lower().removeprefix("www.")
 path=p.path
 if host=="instagram.com" and re.fullmatch(r"/(?:reel|p)/[a-zA-Z0-9_-]{6,30}/?",path):
  return "https://www.instagram.com"+path.rstrip("/")+"/"
 if host=="tiktok.com" and re.fullmatch(r"/@[\w.\-]+/video/\d{15,22}/?",path):
  return "https://www.tiktok.com"+path.rstrip("/")
 return None
def discover():
 found=[]
 for page in DISCOVERY_PAGES:
  report={"page":page,"found":0}
  try:
   req=urllib.request.Request(page,headers={"User-Agent":"Mozilla/5.0"})
   with urllib.request.urlopen(req,timeout=16) as r:raw=r.read(3_000_000).decode("utf-8","replace")
   raw=html.unescape(raw).replace("\\/","/")
   extracted=set()
   for value in re.findall(r'''https?://(?:www\.)?instagram\.com/(?:p|reel)/[A-Za-z0-9_-]{6,30}/?''',raw):
    u=accepted_url(value)
    if u:extracted.add(u)
   for val in re.findall(r'''(?:href=["']|["'])(/(?:reel|p)/[A-Za-z0-9_-]{6,30}/?)''',raw):
    u=accepted_url("https://www.instagram.com"+val)
    if u:extracted.add(u)
   for u in sorted(extracted):
    found.append({"id":"instagram-discovered-"+str(len(found)+1),"platform":"Instagram","url":u,"why":"STO hashtag landing metadata page "+page})
   report["found"]=len(extracted)
  except Exception as e:report["error"]=str(e)[:160]
  yield report,found
def probe(file):
 p=subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(file)],capture_output=True,text=True,timeout=35)
 if p.returncode:raise RuntimeError("ffprobe rejected source")
 j=json.loads(p.stdout);video=next(x for x in j["streams"] if x["codec_type"]=="video")
 dur=float(j["format"].get("duration") or 0)
 return {"width":video["width"],"height":video["height"],"fps":video.get("avg_frame_rate"),
  "duration":round(dur,3),"bitrate":int(j["format"].get("bit_rate") or 0),
  "bytes":file.stat().st_size,"codec":video.get("codec_name"),
  "sha256":hashlib.sha256(file.read_bytes()).hexdigest()}
def contacts(file,meta,stem):
 canvas=Image.new("RGB",(960,930),"#09090d");d=ImageDraw.Draw(canvas)
 dur=meta["duration"]
 for i in range(24):
  t=max(.05,min(dur-.05,dur*(i+.5)/24))
  temp=SHEETS/".frame.jpg"
  p=subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-ss",str(t),"-i",str(file),
    "-vf","scale=240:135:force_original_aspect_ratio=decrease,pad=240:135:(ow-iw)/2:(oh-ih)/2",
    "-frames:v","1",str(temp)],capture_output=True,timeout=34)
  if temp.exists():
   with Image.open(temp) as src:canvas.paste(src.convert("RGB"),((i%4)*240,(i//4)*155+18))
   temp.unlink()
  d.text(((i%4)*240+3,(i//4)*155+3),f"{t:.2f}s",fill="white")
 canvas.save(SHEETS/(stem+"_24_frames.jpg"),quality=86)
def diagnose(s):
 t=s.lower()
 if "login required" in t or "login_required" in t or "cookies" in t and "login" in t:return "LOGIN_REQUIRED"
 if "http error 403" in t or "403 forbidden" in t:return "HTTP_403"
 if "http error 429" in t or "too many requests" in t:return "RATE_LIMIT"
 if "unable to extract universal" in t or "unable to extract webpage" in t:return "PLATFORM_EXTRACTOR_BROKEN"
 if "not found" in t or "http error 404" in t:return "POST_NOT_FOUND"
 if "unsupported url" in t:return "UNSUPPORTED_URL"
 if "private" in t:return "PRIVATE_MEDIA"
 return "DOWNLOAD_FAILED"
def main():
 report={"specification":"NATIVE >=1920x1080 (16:9 preferred); no baked-in watermark/text",
  "artifact_type":"source discovery; NOT an automatic watermark or STO identity certification",
  "known_candidate_pages":[],"discovery":[],"sources":[],"accepted_origins":[],"confirmed_clean_sto_moving_shots":0}
 seen=set()
 for i,item in enumerate(SOURCES):
  seen.add(item["url"])
 allsources=list(SOURCES)
 for page,found in discover():
  report["discovery"].append(page)
  for x in found:
   if x["url"] not in seen:
    seen.add(x["url"]);allsources.append(x)
 print("DISCOVERY_CANDIDATES",len(allsources),flush=True)
 total=0;good=0
 for idx,item in enumerate(allsources[:MAX_CANDIDATES]):
  safe={k:v for k,v in item.items() if k in ("id","platform","url","why")}
  safe["status"]="NOT_TRIED";report["sources"].append(safe)
  if total>=TOTAL_CAP or good>=5:
   safe["status"]="SKIPPED_PACKAGE_CAP";continue
  prefix=f"social_{idx:02}_{item['platform'].lower()}"
  template=str(VIDEOS/(prefix+".%(ext)s"))
  argv=["yt-dlp","--no-config","--no-playlist","--no-progress","--no-warnings",
    "--no-call-home","--ignore-errors","--socket-timeout","13","--retries","1",
    "--fragment-retries","1","--max-filesize","190M","--max-downloads","1",
    "--merge-output-format","mp4","--remux-video","mp4",
    "-f","bv[height>=1080]+ba/b[height>=1080]/bestvideo+bestaudio/best",
    "--output",template,item["url"]]
  try:
   p=subprocess.run(argv,capture_output=True,text=True,timeout=110)
   files=sorted(x for x in VIDEOS.glob(prefix+".*") if x.suffix.lower() in (".mp4",".mkv",".webm",".mov"))
   if p.returncode!=0 or not files:
    safe.update(status="UNAVAILABLE",reason_code=diagnose((p.stderr or "")+"\n"+(p.stdout or "")))
    for f in files:f.unlink(missing_ok=True)
    continue
   file=max(files,key=lambda f:f.stat().st_size)
   m=probe(file);safe["probe"]=m
   if m["width"]<1920 or m["height"]<1080 or m["width"]<=m["height"]:
    safe["status"]="REJECT_NOT_NATIVE_1920X1080_LANDSCAPE"
    file.unlink(missing_ok=True);continue
   if m["duration"]<2 or m["duration"]>MAX_DURATION:
    safe["status"]="REJECT_DURATION";file.unlink(missing_ok=True);continue
   if m["bytes"]>MAX_PER_FILE:
    safe["status"]="REJECT_OVERSIZE";file.unlink(missing_ok=True);continue
   if file.suffix.lower()!=".mp4":
    safe["status"]="REJECT_NOT_NATIVE_MP4";file.unlink(missing_ok=True);continue
   safe.update(status="FULLHD_LANDSCAPE_ORIGINAL_PENDING_WATERMARK_AND_STO_VISUAL_QA",filename=file.name)
   contacts(file,m,prefix)
   report["accepted_origins"].append(file.name)
   total+=m["bytes"];good+=1
  except subprocess.TimeoutExpired:
   safe.update(status="TIMEOUT_SOURCE")
  except Exception as e:
   safe.update(status="ERROR",reason=str(e)[:150])
  finally:
   for f in VIDEOS.glob(prefix+".*"):
    if safe["status"]!="FULLHD_LANDSCAPE_ORIGINAL_PENDING_WATERMARK_AND_STO_VISUAL_QA":
     f.unlink(missing_ok=True)
   (ROOT/"manifest.json").write_text(json.dumps(report,indent=2))
   print("SOURCE_RESULT",item["id"],safe["status"],safe.get("probe",{}).get("width","?"),safe.get("probe",{}).get("height","?"),safe.get("reason_code",""),flush=True)
 (ROOT/"manifest.json").write_text(json.dumps(report,indent=2))
 with zipfile.ZipFile("out/HURACAN_STO_TIKTOK_INSTAGRAM_ORIGINALS.zip","w",compression=zipfile.ZIP_STORED,allowZip64=True) as zipfile_out:
  for f in ROOT.rglob("*"):
   if f.is_file():zipfile_out.write(f,f.relative_to(ROOT))
 print("RESULT",json.dumps({"downloaded_native_fhd_sources":good,"bytes":total,"discovery_items":len(allsources)}),flush=True)
if __name__=="__main__":main()
