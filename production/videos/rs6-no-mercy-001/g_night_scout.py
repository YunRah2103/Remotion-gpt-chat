#!/usr/bin/env python3
"""Actual Audi C8 RS6 dark-footage source scout. Review frames only, no redistribution of masters."""
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from PIL import Image,ImageDraw
import requests,subprocess,json,re,html
out=Path("rs6-g-new-night-scout");out.mkdir(exist_ok=True)
pages={
 "audi_black":"https://audi-mediacenter.pl/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html",
 "filmmaker":"https://141-productionz.com/case-studies/perform-car-rent",
 "audi_silver":"https://www.audi.com/en/videos/video/audi-rs-6-avant-performance-dew-silver-matt-footage-on-location-6557"
}
s=requests.Session();s.headers.update({"User-Agent":"Mozilla/5.0"})
source={};candidates=[]
for name,url in pages.items():
 try:
  r=s.get(url,timeout=30);r.raise_for_status();soup=BeautifulSoup(r.text,"html.parser")
  links=[]
  for x in soup.find_all(["video","source","a","iframe"]):
   src=x.get("src") or x.get("href") or x.get("data-src") or ""
   if not src:continue
   link=urljoin(url,src);title=x.get_text(" ",strip=True)[:120]
   if re.search(r"mp4|video|footage|download|vimeo|player",link+" "+title,re.I):
    links.append({"url":link,"title":title})
    if (name=="audi_black" and ("MP4" in title or ".mp4" in link or "download" in link)) or (name=="filmmaker" and ".mp4" in link):
     candidates.append((name,link))
  source[name]={"page":url,"links":links[:50],"html_length":len(r.content)}
  print("PAGE",name,len(links),links[:7],flush=True)
 except Exception as e:
  source[name]={"page":url,"error":str(e)};print("ERR",name,str(e),flush=True)
(out/"SOURCES.json").write_text(json.dumps(source,indent=2))
print("CANDIDATES",json.dumps(candidates),flush=True)
result=[]
for name,url in list(dict.fromkeys(candidates))[:9]:
 if "youtube.com" in url or "vimeo.com" in url:continue
 try:
  r=s.get(url,timeout=100,stream=True)
  ct=r.headers.get("Content-Type","");length=int(r.headers.get("Content-Length") or 0)
  if not r.ok or "text/html" in ct or length>180000000:raise RuntimeError(f"HTTP {r.status_code} {ct} len={length}")
  fn=out/(f"tmp_{name}_{len(result)}.mp4");total=0
  with fn.open("wb") as f:
   for ch in r.iter_content(1048576):
    if ch:f.write(ch);total+=len(ch)
    if total>180000000:raise RuntimeError("size cap")
  if total<500000:raise RuntimeError(f"tiny {total} bytes")
  p=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(fn)],capture_output=True,text=True,timeout=20)
  if p.returncode:raise RuntimeError("ffprobe "+p.stderr[-200:])
  info=json.loads(p.stdout);v=next(x for x in info["streams"] if x["codec_type"]=="video")
  meta={"source":url,"bytes":total,"width":v["width"],"height":v["height"],"codec":v["codec_name"],"duration":info["format"].get("duration")}
  thumb=out/(f"thumb_{name}_{len(result)}");thumb.mkdir(exist_ok=True)
  p=subprocess.run(["ffmpeg","-nostdin","-v","error","-i",str(fn),"-vf","fps=1/16,scale=640:360","-frames:v","36","-q:v","4",str(thumb/"f_%03d.jpg")],capture_output=True,text=True,timeout=180)
  if p.returncode:raise RuntimeError("ffmpeg "+p.stderr[-260:])
  files=sorted(thumb.glob("f_*.jpg"));sw,sh=216,384;cols=9;rows=(len(files)+cols-1)//cols
  im=Image.new("RGB",(sw*cols,(sh+26)*rows),"#0e1219");d=ImageDraw.Draw(im)
  for j,file in enumerate(files):
   frame=Image.open(file).convert("RGB");x=(640-202)//2
   frame=frame.crop((x,0,x+202,360)).resize((sw,sh))
   px=(j%cols)*sw;py=(j//cols)*(sh+26)
   im.paste(frame,(px,py+26));d.text((px+3,py+2),f"{name} t={j*16}s",fill="#eaeaea")
  im.save(out/f"{name}_{len(result)}_PORTRAIT.jpg",quality=84)
  meta["frames_scanned"]=len(files);meta["status"]="PASS"
  print("SUCCESS",meta,flush=True);result.append(meta)
 except Exception as e:result.append({"source":url,"status":"FAIL","error":str(e)});print("FAIL",name,str(e),flush=True)
 for tmp in out.glob("tmp_*.mp4"):tmp.unlink(missing_ok=True)
(out/"RESULTS.json").write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
