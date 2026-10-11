#!/usr/bin/env python3
"""Extract ACTUAL publisher-linked MP4 original candidates and physical media + full QA."""
import requests,re,html,json,hashlib,subprocess,time
from pathlib import Path
from urllib.parse import urljoin
from PIL import Image,ImageDraw

OUT=Path("out/gt3-a-format67-original-execution")
MEDIA=OUT/"media"; CONTACT=OUT/"contact"
for p in (OUT,MEDIA,CONTACT):p.mkdir(parents=True,exist_ok=True)
PAGES=[
 {"name":"format67_perfect_lap","url":"https://format67.net/portfolio/falken-the-perfect-lap-nuerburgring-nordschleife/"},
 {"name":"tiremag_falken2024","url":"https://thetiremagazine.com/2024/07/12/the-new-falken-24h-race-film-is-online-why-we-race/"}
]
session=requests.Session();session.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/127 Safari/537.36","Accept":"text/html,video/mp4;q=0.9,*/*;q=0.5"})
def checksum(f):
 h=hashlib.sha256()
 with f.open("rb") as src:
  for block in iter(lambda:src.read(1048576),b""):h.update(block)
 return h.hexdigest()
def shell(cmd,timeout=45):
 z=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 if z.returncode:raise RuntimeError(z.stderr[-450:])
 return z.stdout
def media_links(url):
 p=session.get(url,timeout=(8,18));p.raise_for_status()
 source=html.unescape(p.text.replace("\\/","/"))
 # Literal source video links in live publisher markup, not guessed URLs.
 result=[]
 for bit in re.split(r'[\s"<>]+',source):
  bit=bit.strip("()';,")
  if ".mp4" not in bit.lower():continue
  if bit.startswith("//"):bit="https:"+bit
  if bit.startswith("https://") or bit.startswith("/"):
   link=urljoin(url,bit)
   link=link.split("&quot;")[0].split("&amp;")[0]
   if "mp4" in link.lower() and len(link)<450 and link.startswith("https://"):result.append(link)
 return sorted(set(result)),len(source)

ledger=[];allurls={}
for src in PAGES:
 entry={"page":src["url"],"name":src["name"],"status":"OK"}
 try:
  links,n=media_links(src["url"]);entry.update(html_chars=n,video_links=links)
  for u in links:
   if u not in allurls:allurls[u]=src["name"]
  print("DISCOVERY",src["name"],len(links),flush=True)
  for u in links:print("DIRECT_URL",src["name"],u[:350],flush=True)
 except Exception as e:entry.update(status="PAGE_FAILED",error=str(e)[-500:])
 ledger.append(entry)
videos=[]
for i,(url,origin) in enumerate(list(allurls.items())[:10]):
 row={"url":url,"origin_page":origin,"status":"NOT_DOWNLOADED"}
 tag="real_publisher_"+str(i).zfill(2)
 p=MEDIA/(tag+".mp4")
 try:
  h=session.head(url,timeout=(8,15),allow_redirects=True)
  row.update(http_head_status=h.status_code,reported_size=h.headers.get("Content-Length"),content_type=h.headers.get("Content-Type"))
  length=int(h.headers.get("content-length") or 0)
  if length>180000000:raise RuntimeError("OVER_180MB_CAP")
  with session.get(url,timeout=(8,50),stream=True,headers={"Referer":"https://format67.net/"}) as response:
   response.raise_for_status();size=0
   with p.open("wb") as fd:
    for block in response.iter_content(chunk_size=1048576):
     if not block:continue
     size+=len(block)
     if size>180000000:raise RuntimeError("ORIGINAL_MORE_THAN_180MB")
     fd.write(block)
  if size<200000:raise RuntimeError("ORIGINAL_TOO_SMALL")
  raw=json.loads(shell(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],45))
  v=next(s for s in raw["streams"] if s["codec_type"]=="video")
  width,height=int(v["width"]),int(v["height"])
  row.update(native_width=width,native_height=height,bytes=size,sha256=checksum(p),fps=v.get("avg_frame_rate"))
  if width<1920 or height<1080 or width<=height:raise RuntimeError("NATIVE_BELOW_LANDSCAPE_FHD")
  duration=float(raw["format"].get("duration") or 0)
  if duration<3:raise RuntimeError("NO_REAL_FILM_DURATION")
  shell(["ffmpeg","-nostdin","-v","error","-i",str(p),"-f","null","-"],timeout=max(100,min(400,int(duration*2.2))))
  sheet=Image.new("RGB",(1600,900),(6,6,6));d=ImageDraw.Draw(sheet)
  for j in range(16):
   t=duration*(j+.4)/16
   temp=CONTACT/(tag+"_"+str(j)+".jpg")
   try:
    shell(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(p),"-frames:v","1","-vf","scale=400:203:force_original_aspect_ratio=decrease,pad=400:203:(ow-iw)/2:(oh-ih)/2","-q:v","4",str(temp)],30)
    with Image.open(temp) as im:sheet.paste(im.convert("RGB"),((j%4)*400,(j//4)*225+20))
   except Exception as e:print("FRAME_FAILED",tag,j,str(e)[-110:],flush=True)
   temp.unlink(missing_ok=True)
   d.text(((j%4)*400+5,(j//4)*225+4),f"{t:.1f}s",fill="white")
  contact=CONTACT/(tag+"_16FRAME.jpg");sheet.save(contact,quality=90)
  row.update(status="ACTUAL_LANDSCAPE_HD_FULLY_DECODED_MODEL_QA_PENDING",file=str(p.relative_to(OUT)),duration_seconds=duration,contact_sheet=str(contact.relative_to(OUT)))
  print("NATIVE_REAL_ORIGINAL",origin,url,width,height,size,checksum(p),flush=True)
 except Exception as e:
  row.update(status="REJECTED_OR_BLOCKED",reason=str(e)[-550:])
  p.unlink(missing_ok=True)
  print("NOT_QUALIFIED",origin,url,row["reason"],flush=True)
 videos.append(row)
(OUT/"MANIFEST.json").write_text(json.dumps({"gate":"PENDING_INDEPENDENT_FRAME_MAKE_AND_DISTINCT_ANGLE_REVIEW","discovered_pages":ledger,"original_video_attempts":videos},indent=2,ensure_ascii=False)+"\n")
print("ACTUAL_HD_VIDEO_ORIGINALS",sum(x["status"].startswith("ACTUAL_LANDSCAPE_HD") for x in videos),flush=True)
