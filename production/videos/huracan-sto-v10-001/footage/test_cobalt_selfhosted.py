#!/usr/bin/env python3
"""Single-run Cobalt 11 self-hosted acquisition/quality test for STO originals.

Runs against trusted localhost service only. Does not share account cookies,
signed video URLs, API tokens or browser login data. Cobalt output is merely
a candidate; exact STO identity, visible watermark, and unique moving camera
angles must be manually approved before edit integration.
"""
from __future__ import annotations
import hashlib,json,subprocess,urllib.error,urllib.parse,urllib.request,zipfile
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path("out/sto-cobalt-v1")
ROOT.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("tiktok-sto-7407202646785920287","https://www.tiktok.com/@luxury.speed/video/7407202646785920287"),
 ("instagram-sto-CwsgJPbMhBL","https://www.instagram.com/reel/CwsgJPbMhBL/"),
 ("youtube-official-sto-egjLBe6lMXU","https://www.youtube.com/watch?v=egjLBe6lMXU"),
]
API="http://127.0.0.1:9000/"
MAX_BYTES=150_000_000
def service_post(url):
 data=json.dumps({"url":url,"videoQuality":"max","downloadMode":"auto",
                  "filenameStyle":"basic","allowH265":True}).encode()
 req=urllib.request.Request(API,data=data,headers={"Accept":"application/json","Content-Type":"application/json","User-Agent":"STO-QA-Research/1.0"},method="POST")
 with urllib.request.urlopen(req,timeout=45) as r:
  if r.status != 200:raise RuntimeError("COBALT_HTTP_NON200")
  response=r.read(60_000)
 return json.loads(response)
def fetch_playable(url,dest):
 p=urllib.parse.urlparse(url)
 if p.scheme not in ("http","https") or not p.hostname:
  raise RuntimeError("MEDIA_URL_UNSUPPORTED")
 # The endpoint is untrusted server output; reject private IPs except expected
 # loopback port of this isolated GitHub runner's own Cobalt container.
 if p.hostname in ("127.0.0.1","localhost") and p.port!=9000:
  raise RuntimeError("UNEXPECTED_LOCAL_PORT")
 if p.hostname in ("169.254.169.254","metadata.google.internal","0.0.0.0"):
  raise RuntimeError("BLOCKED_HOST")
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=65) as r:
  if int(r.headers.get("Content-Length") or 0)>MAX_BYTES:raise RuntimeError("OVERSIZE_HEADER")
  total=0
  with dest.open("wb") as f:
   while True:
    part=r.read(1024*1024)
    if not part:break
    total+=len(part)
    if total>MAX_BYTES:raise RuntimeError("OVERSIZE_STREAM")
    f.write(part)
def probe(f):
 p=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],capture_output=True,text=True,timeout=24)
 if p.returncode:raise RuntimeError("FFPROBE_INVALID")
 data=json.loads(p.stdout);v=next(x for x in data["streams"] if x["codec_type"]=="video")
 return dict(width=int(v["width"]),height=int(v["height"]),duration=float(data["format"].get("duration") or 0),
             codec=v["codec_name"],bitrate=int(data["format"].get("bit_rate") or 0),
             sha256=hashlib.sha256(f.read_bytes()).hexdigest(),bytes=f.stat().st_size)
def contact(f,m,stem):
 w,h=240,155;canvas=Image.new("RGB",(w*4,h*4),"#121217");draw=ImageDraw.Draw(canvas)
 for i in range(16):
  at=min(m["duration"]-.05,max(.05,m["duration"]*(i+.5)/16))
  tmp=ROOT/".temp.jpg"
  subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-ss",str(at),"-i",str(f),
     "-vf","scale=240:135:force_original_aspect_ratio=decrease,pad=240:135:(ow-iw)/2:(oh-ih)/2",
     "-frames:v","1",str(tmp)],capture_output=True,timeout=35)
  if tmp.exists():
   with Image.open(tmp) as src:canvas.paste(src.convert("RGB"),((i%4)*w,(i//4)*h+18))
   tmp.unlink()
  draw.text(((i%4)*w+3,(i//4)*h+3),f"{at:.1f}s",fill="white")
 canvas.save(ROOT/(stem+"_16frames.jpg"),quality=85)
def main():
 report={"backend":"cobalt 11 self-hosted on ephemeral GitHub runner","sources":[],
         "actual_native_1920x1080_plus_landscape_mp4_count":0,
         "identity_watermark_motion_approved_shots":0,
         "note":"Cobalt redirect/tunnel success alone does NOT certify MP4 or shot quality."}
 for slug,url in SOURCES:
  entry={"id":slug,"source":url,"status":"UNATTEMPTED"}
  report["sources"].append(entry)
  f=ROOT/(slug+".mp4")
  try:
   data=service_post(url)
   if not isinstance(data,dict):
    entry["status"]="INVALID_API_RESPONSE";continue
   status=str(data.get("status") or "missing")
   entry["api_status"]=status
   if status=="error":
    err=data.get("error",{})
    # Never include third-party signed media URLs or request details in artifacts.
    entry.update(status="API_ERROR",safe_error_code=str(err.get("code","unknown"))[:160] if isinstance(err,dict) else "unknown")
    continue
   if status=="picker":
    entry["status"]="MULTIPLE_SOURCE_CHOICES_UNHANDLED";continue
   if status not in ("redirect","tunnel"):
    entry["status"]="PROCESSING_RESPONSE_UNSUPPORTED";continue
   media_url=data.get("url")
   if not isinstance(media_url,str):
    entry["status"]="MISSING_MEDIA_URL";continue
   fetch_playable(media_url,f)
   m=probe(f);entry["probe"]=m
   if m["width"]<1920 or m["height"]<1080 or m["width"]<=m["height"]:
    entry["status"]="REJECT_PORTRAIT_OR_BELOW_NATIVE_FULLHD"
    f.unlink(missing_ok=True);continue
   if m["duration"]<=1:
    entry["status"]="REJECT_TOO_SHORT";f.unlink(missing_ok=True);continue
   entry["status"]="REAL_NATIVE_FULLHD_MP4_REQUIRES_VISUAL_WATERMARK_AND_STO_CHECK"
   entry["filename"]=f.name
   report["actual_native_1920x1080_plus_landscape_mp4_count"]+=1
   contact(f,m,slug)
  except urllib.error.HTTPError as e:
   entry.update(status="HTTP_ERROR",http_code=e.code)
   f.unlink(missing_ok=True)
  except Exception as e:
   entry.update(status="ACQUISITION_FAILED",diagnostic=type(e).__name__,
                safe_note=str(e)[:120] if str(e).isupper() and "http" not in str(e).lower() else "")
   f.unlink(missing_ok=True)
  finally:
   (ROOT/"manifest.json").write_text(json.dumps(report,indent=2))
   print("COBALT_RESULT",slug,entry["status"],entry.get("safe_error_code",""),
         entry.get("probe",{}).get("width","?"),"x",entry.get("probe",{}).get("height","?"),flush=True)
 (ROOT/"manifest.json").write_text(json.dumps(report,indent=2))
 with zipfile.ZipFile("out/STO_COBALT_DIRECT_ORIGINALS.zip","w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
  for file in ROOT.rglob("*"):
   if file.is_file():z.write(file,file.relative_to(ROOT))
 print("REAL_NATIVE_FHD",report["actual_native_1920x1080_plus_landscape_mp4_count"])
if __name__=="__main__":main()
