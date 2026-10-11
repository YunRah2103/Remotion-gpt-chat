#!/usr/bin/env python3
"""Discover *actual linked* producer media from Nürburgring.tv portfolio.
Only download provider-present URLs, never synthesize candidate filenames.
Native-HD/4K original streams, hash, ffprobe, full decode, review frames.
The produced media are NOT automatically confirmed GT3 or manufacturer shots.
"""
import re,json,subprocess,hashlib,time,html
from pathlib import Path
from urllib.parse import urljoin,urlparse,unquote
import requests
from bs4 import BeautifulSoup
from PIL import Image,ImageDraw
PAGE="https://www.nuerburgring.tv/en/work"
OUT=Path("out/gt3-nbrtv-second-wave")
CLIPS=OUT/"original_hd_pending_model_qa";SHEETS=OUT/"contact_sheets"
for p in (OUT,CLIPS,SHEETS):p.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers.update({"User-Agent":"Mozilla/5.0 (compatible; Mozilla/5.0; Chrome/127.0)"})
t=time.time();log=[]
def exec(cmd,timeout=60):
 p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(" ".join(cmd[:2])+": "+p.stderr[-280:])
 return p.stdout
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def get_html(url):
 r=S.get(url,timeout=(8,15));r.raise_for_status()
 return r.text
txt=get_html(PAGE)
(OUT/"work_url_evidence.txt").write_text("Publisher "+PAGE+"\nFetched bytes: "+str(len(txt))+"\n")
soup=BeautifulSoup(txt,"html.parser")
media=set()
def add(x,origin):
 x=html.unescape(unquote(str(x)).replace("\\/","/")).strip(' \t\r\n\'"')
 if ".mp4" not in x.lower() and ".m3u8" not in x.lower():return
 if x.startswith("//"):x="https:"+x
 url=urljoin(PAGE,x)
 if urlparse(url).scheme not in ("http","https"):return
 if "nuerburgring.tv" not in url and "your-objectstorage.com" not in url and "nbrtv" not in url:return
 media.add(url.split('#')[0])
for tag in soup.find_all(True):
 for a in ["src","href","data-src","data-video","data-video-src","data-url","poster"]:
  if tag.has_attr(a):add(tag.get(a),f"tag_{tag.name}_{a}")
for raw in re.findall(r'(?:https?:)?//[^\s"\'<>]+?\.mp4(?:\?[^\s"\'<>]*)?|[/a-zA-Z0-9_.%-]+\.mp4(?:\?[^\s"\'<>]*)?',txt,re.I):
 add(raw,"regex")
for raw in re.findall(r'(?:https?:)?//[^\s"\'<>]+?\.m3u8(?:\?[^\s"\'<>]*)?',txt,re.I):
 add(raw,"regex_hls")
# Explicitly follow *video* entries via <source> elements; do not invent filenames.
existing={"case-legenden.mp4","case-yokohama.mp4","case-heart-race.mp4","case-bni.mp4","case-efr.mp4"}
(OUT/"discovery.json").write_text(json.dumps({"page":PAGE,"html_bytes":len(txt),"media_links_discovered":sorted(media),"previously_tested":sorted(existing)},indent=2)+"\n")
print("DISCOVERED_MEDIA_URLS",len(media),sorted(media),flush=True)
for i,url in enumerate(sorted(media)):
 name=urlparse(url).path.split("/")[-1]
 if name in existing:
  log.append({"url":url,"status":"EXISTING_V3_OR_REJECTED"});continue
 if ".mp4" not in name.lower():
  log.append({"url":url,"status":"HLS_NOT_DOWNLOADED_YET"});continue
 info={"url":url,"name":name,"status":"NOT_ACQUIRED"}
 try:
  h=S.head(url,timeout=(8,15),allow_redirects=True)
  length=int(h.headers.get("content-length","0") or 0)
  info["publisher_head_status"]=h.status_code;info["publisher_size"]=length
  if length>250_000_000:raise RuntimeError("LARGER_THAN_250MB_PREVIEW_CAP")
  dest=CLIPS/("PRODUCER_"+str(i).zfill(2)+"_"+re.sub(r'[^A-Za-z0-9_.-]','_',name))
  with S.get(url,stream=True,timeout=(8,25)) as response:
   response.raise_for_status();size=0
   with dest.open("wb") as f:
    for chunk in response.iter_content(1024*1024):
     if not chunk:continue
     size+=len(chunk)
     if size>250_000_000:raise RuntimeError("DOWNLOAD_SIZE_CAP")
     f.write(chunk)
  probe=json.loads(exec(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(dest)],30))
  v=next(x for x in probe["streams"] if x["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  if not ((w>=1920 and h>=1080 and w>h) or (w>=1080 and h>=1920 and h>w)):
   raise RuntimeError(f"BELOW_NATIVE_HD_{w}x{h}")
  duration=float(probe["format"]["duration"])
  exec(["ffmpeg","-nostdin","-v","error","-i",str(dest),"-f","null","-"],max(40,min(160,int(duration*3+15))))
  im=Image.new("RGB",(960,615),(15,15,15));d=ImageDraw.Draw(im)
  for k in range(9):
   sec=round(duration*(k+.35)/9,3)
   fn=OUT/("_tmp_"+str(i)+"_"+str(k)+".jpg")
   exec(["ffmpeg","-nostdin","-v","error","-y","-ss",str(sec),"-i",str(dest),"-frames:v","1","-vf","scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2",str(fn)],30)
   with Image.open(fn) as frame:im.paste(frame.convert("RGB"),((k%3)*320,(k//3)*205+23))
   fn.unlink()
   d.text(((k%3)*320+4,(k//3)*205+3),f"{sec}s ({w}x{h})",fill="white")
  sheet=SHEETS/(dest.stem+"_9frame.jpg");im.save(sheet,quality=86)
  info.update({"status":"NATIVE_HD_FULL_DECODED_GT3_IDENTITY_AND_CAMERA_QA_PENDING","file":str(dest.relative_to(OUT)),
               "native_pixels":f"{w}x{h}","duration_s":duration,"sha256":sha(dest),"bytes":dest.stat().st_size,
               "ffprobe":probe,"contact_sheet":str(sheet.relative_to(OUT))})
  print("SUCCESS_ORIGINAL_VIDEO",url,w,h,duration,info["sha256"],flush=True)
 except Exception as ex:
  info.update(status="REJECTED_OR_NOT_DOWNLOADED",error=str(ex)[-300:])
  try:
   if dest.exists():dest.unlink()
  except Exception:pass
  print("REJECTED",url,info.get("error"),flush=True)
 log.append(info)
(OUT/"result.json").write_text(json.dumps({"producer_page":PAGE,"results":log,"qa_gate":"HARD BLOCKED until true Nürburgring GT3 manufacturer identification and distinct moving camera angles confirmed","preexisting_v3":8},ensure_ascii=False,indent=2)+"\n")
