#!/usr/bin/env python3
"""Check publicly embedded media references on already identified STO pages.
Accept only listed HTTPS MP4s from recognized social video delivery domains.
Do not generate forged signatures, probe account APIs or scrape hidden sessions.
"""
from pathlib import Path
import re,html,json,subprocess,hashlib,urllib.parse,urllib.request,zipfile
from PIL import Image,ImageDraw
ROOT=Path("out/sto-social-embed"); ROOT.mkdir(parents=True,exist_ok=True)
LINKS=[
 ("urlebird-sto-video","https://urlebird.com/video/steady-lamborghini-hurac%C3%A1n-sto-ig-7407202646785920287/"),
 ("urlebird-sto-snap","https://urlebird.com/snap/?u=7407202646785920287"),
 ("pictame-sto-index","https://pictame.com/en/discover/hashtag/lamborghinihuracansto"),
 ("instagram-sto","https://www.instagram.com/reel/CwsgJPbMhBL/"),
]
HOST_SUFFIXES=("tiktokcdn.com","tiktokv.com","tiktokcdn-us.com","cdninstagram.com",
               "fbcdn.net","cdninstagram.com","urlebird.com","axod.net",
               "pictame.com","instagram.com")
def host_allowed(u):
 try:
  p=urllib.parse.urlparse(u)
  return p.scheme=="https" and any(p.hostname==h or p.hostname.endswith("."+h) for h in HOST_SUFFIXES)
 except Exception:return False
def clean(x):
 return html.unescape(x.replace("\\/","/").replace("\\u0026","&").replace("\\u002F","/").replace("&amp;","&")).strip(" \t\n\r\"'")
def find_links(raw):
 raw=clean(raw)
 links=set()
 for x in re.findall(r'''https?://[^\s<>"']{8,1800}''',raw):
  value=clean(x)
  if ".mp4" in value.lower():
   value=value.split("\\",1)[0]
   if host_allowed(value):links.add(value)
 for x in re.findall(r'''(?:og:video|contentUrl|videoUrl|playUrl|playAddr)[^\n]{0,1500}''',raw,re.I):
  for u in re.findall(r'''https?://[^\s<>"']+''',x):
   u=clean(u)
   if host_allowed(u) and (".mp4" in u.lower() or "play" in u.lower()):links.add(u)
 return sorted(links)
def download(url,path,cap=170_000_000):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=25) as r:
  if int(r.headers.get("Content-Length") or 0)>cap:raise RuntimeError("oversize")
  n=0
  with path.open("wb") as w:
   while True:
    data=r.read(1024*1024)
    if not data:break
    n+=len(data)
    if n>cap:raise RuntimeError("oversize")
    w.write(data)
def ffprobe(path):
 p=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],
       capture_output=True,text=True,timeout=25,check=True)
 j=json.loads(p.stdout);v=next(x for x in j["streams"] if x["codec_type"]=="video")
 return dict(width=v["width"],height=v["height"],duration=float(j["format"]["duration"]),
             sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size)
def contact(path,meta,filename):
 img=Image.new("RGB",(960,4*155),"#101015");draw=ImageDraw.Draw(img);dur=meta["duration"]
 for i in range(16):
  t=max(.05,min(dur-.05,dur*(i+.5)/16))
  f=ROOT/".tmp.jpg"
  subprocess.run(["ffmpeg","-v","error","-y","-nostdin","-ss",str(t),"-i",str(path),"-vf","scale=240:135","-frames:v","1",str(f)],capture_output=True,timeout=30)
  if f.exists():
   with Image.open(f) as im:img.paste(im.convert("RGB"),((i%4)*240,(i//4)*155+17))
   f.unlink()
  draw.text(((i%4)*240+3,(i//4)*155+3),str(round(t,1)),fill="white")
 img.save(filename,quality=85)
def main():
 rec={"pages":[],"direct_candidates":[],"real_downloaded":[],"native_1920x1080_landscape":0}
 items=[]
 for label,u in LINKS:
  o={"label":label,"page_url":u,"state":"UNKNOWN"}
  rec["pages"].append(o)
  try:
   with urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=16) as response:
    body=response.read(3_000_000).decode("utf-8","replace")
   media=find_links(body)
   o.update(state="FETCHED",direct_mp4_urls=len(media))
   for m in media:
    items.append((label,m))
  except Exception as e:o.update(state="FETCH_FAILED",error=str(e)[:150])
 seen=set()
 for label,u in items:
  if u in seen:continue
  seen.add(u)
  rec["direct_candidates"].append({"source_page":label,"cdn_host":urllib.parse.urlparse(u).hostname,
                                  "url_redacted":"public candidate url hidden if signed/expiring"})
  if rec["native_1920x1080_landscape"]>=3:break
  out=ROOT/("social_"+str(len(rec["real_downloaded"]))+".mp4")
  status={"source_page":label,"state":"NOT_DOWNLOADED"}
  rec["real_downloaded"].append(status)
  try:
   download(u,out)
   info=ffprobe(out);status["ffprobe"]=info
   if info["width"]<1920 or info["height"]<1080 or info["width"]<=info["height"]:
    status["state"]="REJECT_BELOW_NATIVE_1920X1080";out.unlink()
   else:
    status["state"]="REAL_NATIVE_FHD_PENDING_VISUAL_STO_WATERMARK_REVIEW"
    status["filename"]=out.name
    rec["native_1920x1080_landscape"]+=1
    contact(out,info,ROOT/(out.stem+"_contact.jpg"))
  except Exception as e:status.update(state="DOWNLOAD_FAILED",error=str(e)[:150]);out.unlink(missing_ok=True)
 (ROOT/"manifest.json").write_text(json.dumps(rec,indent=2))
 with zipfile.ZipFile("out/STO_SOCIAL_EMBEDDED_ORIGINALS.zip","w",zipfile.ZIP_STORED,allowZip64=True) as z:
  for p in ROOT.rglob("*"):
   if p.is_file():z.write(p,p.relative_to(ROOT))
 print("SOCIAL_EMBED_RESULTS",json.dumps({"sources":rec["pages"],"direct_mp4_links":len(seen),"native_fhd_downloads":rec["native_1920x1080_landscape"]}))
if __name__=="__main__":main()
