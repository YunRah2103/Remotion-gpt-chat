#!/usr/bin/env python3
"""Actual FORMAT67 Nürburgring 24h film original MP4 acquisition with strict QA."""
import hashlib,json,html,re,subprocess,requests
from pathlib import Path
from urllib.parse import urljoin
from PIL import Image,ImageDraw
PAGE="https://format67.net/portfolio/falken-the-perfect-lap-nuerburgring-nordschleife/"
ROOT=Path("out/gt3-a-format67-real-film");MEDIA=ROOT/"originals";SHEETS=ROOT/"sheets"
for d in (ROOT,MEDIA,SHEETS):d.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers.update({"User-Agent":"Mozilla/5.0","Accept":"*/*"})
def run(a,t=90):
 p=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-350:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1<<20),b""):h.update(c)
 return h.hexdigest()
results=[]
try:
 rsp=S.get(PAGE,timeout=(9,18));rsp.raise_for_status()
 txt=html.unescape(rsp.text.replace("\\/","/"))
 found=re.findall(r'(?:https?:)?//[^\s"<>\\]+?\.mp4(?:\?[^\s"<>\\]*)?',txt,re.I)
 found+=re.findall(r'/wp-content/uploads/[^\s"<>\\]+?\.mp4',txt,re.I)
 urls=sorted(set(urljoin(PAGE,u.strip(' "\',;()')) for u in found))
 print("FORMAT67 DISCOVERED",len(urls),flush=True)
except Exception as e:
 urls=[];print("PAGE FAILED",repr(e),flush=True)
for i,url in enumerate(urls[:12]):
 rec={"id":str(i),"original_url":url,"status":"PENDING"}
 path=MEDIA/f"format67_n24_{i:02d}.mp4"
 try:
  print("TEST SOURCE",i,url,flush=True)
  head=S.head(url,timeout=(7,10),allow_redirects=True)
  size=int(head.headers.get("content-length") or 0)
  rec.update(head_http=head.status_code,head_bytes=size,content_type=head.headers.get("content-type"))
  if size>190_000_000:raise RuntimeError("TOO_LARGE_FOR_SAFE_FULL_RETRIEVAL")
  total=0
  with S.get(url,timeout=(10,45),stream=True,headers={"Referer":PAGE}) as rr:
   rr.raise_for_status()
   with path.open("wb") as f:
    for chunk in rr.iter_content(1024*1024):
     if chunk:
      total+=len(chunk)
      if total>190_000_000:raise RuntimeError("DOWNLOAD_EXCEEDS_190MB")
      f.write(chunk)
  rec["downloaded_bytes"]=total
  if total<100000:raise RuntimeError("NOT_VIDEO_BYTES")
  j=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]))
  v=next(z for z in j["streams"] if z["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  rec.update(native_width=w,native_height=h,source_sha256=sha(path),duration=float(j["format"].get("duration") or 0))
  if w<1920 or h<1080 or w<=h:raise RuntimeError("NATIVE_RESOLUTION_FAIL")
  run(["ffmpeg","-nostdin","-loglevel","error","-i",str(path),"-f","null","-"],180)
  sheet=Image.new("RGB",(1600,960),(10,10,10));draw=ImageDraw.Draw(sheet)
  for k in range(12):
   sec=rec["duration"]*(k+.45)/12
   thumb=SHEETS/(f"shot_{i}_{k}.jpg")
   p=subprocess.run(["ffmpeg","-nostdin","-loglevel","error","-y","-ss",str(sec),"-i",str(path),"-frames:v","1",
       "-vf","scale=400:225:force_original_aspect_ratio=decrease,pad=400:225:(ow-iw)/2:(oh-ih)/2",str(thumb)],capture_output=True,timeout=35)
   if p.returncode==0 and thumb.exists():
    with Image.open(thumb) as im:sheet.paste(im.convert("RGB"),((k%4)*400,(k//4)*320+30))
    thumb.unlink()
   draw.text(((k%4)*400+4,(k//4)*320+4),f"source {sec:.2f}s",fill="white")
  sheet_path=SHEETS/f"FORMAT67_{i:02d}_12FRAME.jpg";sheet.save(sheet_path,quality=89)
  rec.update(status="REAL_NATIVE_LANDSCAPE_HD_DECODED_VISUAL_GT3_QA_PENDING",contact_sheet=str(sheet_path.relative_to(ROOT)),media_file=str(path.relative_to(ROOT)),ffprobe=j)
  print("REAL NEW NATIVE HD VIDEO",i,w,h,total,rec["source_sha256"],flush=True)
 except Exception as e:
  rec.update(status="REJECTED_OR_BLOCKED",failure=str(e)[-350:])
  path.unlink(missing_ok=True)
  print("SOURCE REJECTED",i,rec["failure"],flush=True)
 results.append(rec)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps({"publisher":"FORMAT67", "source_page":PAGE,"source_records":results,"approved_gt3_shots":0,"qa":"All source models must be independently visually identified, no publisher url alone is credit."},indent=2)+"\n")
print("ACTUAL_HD_SOURCE_COUNT",sum(r["status"].startswith("REAL_NATIVE") for r in results),flush=True)
