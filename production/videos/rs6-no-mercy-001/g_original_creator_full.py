#!/usr/bin/env python3
"""Retrieve creator's own publicly embedded HD C8 RS6 film, original resolution, owner-only.
The film is also uploaded to YouTube as FUBopyqaXds. This fetch is from the creator's site, NOT the S25 and NOT youtube's network.
"""
from pathlib import Path
import requests,subprocess,html,re,json,hashlib
out=Path("rs6-original-film-private");out.mkdir(exist_ok=True)
page="https://www.the-lowdown.com/audi-rs6/"
s=requests.Session();s.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0 Safari/537.36","Referer":"https://www.the-lowdown.com/"})
rep={"creator_page":page,"youtube_original":"https://www.youtube.com/watch?v=FUBopyqaXds","source_from":"Creator Vimeo external embedded MP4, not YouTube or S25","rights":"USER PRIVATE REVIEW ONLY; not publicly cleared"}
try:
 r=s.get(page,timeout=30);r.raise_for_status();t=html.unescape(r.text).replace("\\/","/")
 links=list(dict.fromkeys(re.findall(r'''https?://[^\s"'<>\\]+\.mp4(?:\?[^\s"'<>\\]+)?''',t,re.I)))
 links=[l for l in links if "player.vimeo.com/external/" in l]
 print("ORIGINAL_HTML",r.status_code,len(r.content),"EMBEDDED_MP4",len(links),flush=True)
 if not links:
  try:
   r=s.get("https://player.vimeo.com/video/450095160/config",timeout=25,headers={"Referer":page})
   r.raise_for_status();j=r.json();srcs=j.get("request",{}).get("files",{}).get("progressive",[])
   srcs.sort(key=lambda z:z.get("height",0),reverse=True)
   links=[x["url"] for x in srcs if x.get("url") and x.get("height",0)>=1080]
   print("VIMEO_EMBED_CONFIG",len(links),flush=True)
  except Exception as e:rep["vimeo_config_error"]=str(e)[-250:]
 if not links:raise RuntimeError("NO_CREATOR_DIRECT_MP4_URL")
 candidate=links[0]
 mp4=out/"THE_LOWDOWN_RS6_C8_ORIGINAL_1080P.mp4"
 rs=s.get(candidate,stream=True,timeout=(15,100));rs.raise_for_status()
 if "video" not in rs.headers.get("Content-Type","") and "octet" not in rs.headers.get("Content-Type",""):raise RuntimeError("not MP4 "+str(rs.headers.get("Content-Type")))
 total=0
 with mp4.open("wb") as f:
  for chunk in rs.iter_content(1024*1024):
   if chunk:f.write(chunk);total+=len(chunk)
   if total>125*1024*1024:raise RuntimeError("source over private 125MiB cap")
 print("ORIGINAL_SOURCE_BYTES",total,flush=True)
 p=subprocess.run(["ffprobe","-v","error","-show_entries","stream=codec_type,codec_name,width,height,avg_frame_rate:format=duration,size","-of","json",str(mp4)],capture_output=True,text=True,timeout=30)
 if p.returncode:raise RuntimeError("ffprobe "+p.stderr[-250:])
 info=json.loads(p.stdout);v=next(z for z in info["streams"] if z["codec_type"]=="video")
 if v["width"]<1920 or v["height"]<1080 or float(info["format"].get("duration",0))<20:raise RuntimeError("original source resolution/duration inadequate")
 p=subprocess.run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(mp4),"-f","null","-"],capture_output=True,text=True,timeout=100)
 if p.returncode:raise RuntimeError("full decode "+p.stderr[-250:])
 rep.update(status="REAL_ORIGINAL_MP4_FULL_DECODE_PASS",source_resolution=f"{v['width']}x{v['height']}",source_duration=info["format"]["duration"],codec=v["codec_name"],bytes=total,sha256=hashlib.sha256(mp4.read_bytes()).hexdigest())
 import PIL.Image as Image,PIL.ImageDraw as ImageDraw
 from io import BytesIO
 tile=Image.new("RGB",(6*320,2*(180+22)),"#090b10");pen=ImageDraw.Draw(tile)
 for k in range(12):
  at=float(rep["source_duration"])*(k+.5)/12
  q=subprocess.run(["ffmpeg","-nostdin","-v","error","-ss",str(at),"-i",str(mp4),"-frames:v","1","-vf","scale=320:180","-f","image2pipe","-vcodec","mjpeg","-"],capture_output=True,timeout=20)
  if q.returncode or not q.stdout:continue
  im=Image.open(BytesIO(q.stdout));xx=(k%6)*320;yy=(k//6)*(180+22)
  tile.paste(im,(xx,yy+22));pen.text((xx+5,yy+3),f"{at:.1f}s",fill="white")
 tile.save(out/"FULL_ORIGINAL_12_FRAME_QA.jpg",quality=87)
 print("REAL_MP4_PASS",json.dumps(rep),flush=True)
except Exception as e:
 rep.update(status="NO_NEW_ORIGINAL_MP4",error=str(e)[-350:])
 for file in out.glob("*.mp4"):file.unlink(missing_ok=True)
 print("MP4_FAIL",rep["error"],flush=True)
(out/"RESULT.json").write_text(json.dumps(rep,indent=2))
