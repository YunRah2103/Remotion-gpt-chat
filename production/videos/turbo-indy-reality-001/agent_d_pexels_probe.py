#!/usr/bin/env python3
"""Test real Pexels video download, verify native size and generate human-review contact sheets.
Do not label automotive footage as IndyCar based on tags alone."""
from pathlib import Path
import subprocess,requests,json,hashlib,os,re,sys,urllib.parse,zipfile
from PIL import Image,ImageOps,ImageDraw,ImageStat,ImageChops
OUT=Path("out/indy-d-pexels-proof"); (OUT/"clips").mkdir(parents=True,exist_ok=True); (OUT/"contacts").mkdir(parents=True,exist_ok=True)
SOURCES=[
("indy_pit_wheel_change","9823146","https://www.pexels.com/video/close-up-on-change-of-tyre-in-racing-car-9823146/","pit wheel change - series unverified"),
("pit_crew_wheel_replacement","9737948","https://www.pexels.com/video/crew-replacing-tires-of-race-car-9737948/","pit crew - series unverified"),
("start_grid_4k","9737952","https://www.pexels.com/video/large-group-of-race-cars-on-starting-line-9737952/","Indy grid candidate - series unverified"),
]
s=requests.Session();s.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"})
log=[];clips=[]
def run(args,timeout=30):
 return subprocess.run(args,capture_output=True,text=True,timeout=timeout)
def probe(p):
 r=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],timeout=20)
 if r.returncode:raise RuntimeError("ffprobe failed "+r.stderr[-200:])
 d=json.loads(r.stdout);v=next(x for x in d["streams"] if x["codec_type"]=="video")
 return dict(width=v["width"],height=v["height"],fps=v.get("avg_frame_rate"),codec=v["codec_name"],duration=float(d["format"]["duration"]))
def sample(src,dst):
 r=run(["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y","-i",str(src),"-t","5","-map","0:v:0","-an","-c:v","libx264","-crf","20","-preset","veryfast","-movflags","+faststart","-pix_fmt","yuv420p",str(dst)],timeout=120)
 if r.returncode:raise RuntimeError("cut "+r.stderr[-500:])
def sheet(src,path):
 inf=probe(src);tmax=min(4.6,inf["duration"]-0.1)
 frames=[];deltas=[]
 for i in range(12):
  img=OUT/"sample.jpg"
  t=round(tmax*(i+.5)/12,3)
  r=run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(t),"-i",str(src),"-vf","scale=360:-2","-frames:v","1",str(img)],timeout=30)
  if r.returncode==0 and img.exists():
   frames.append(Image.open(img).convert("RGB").copy());img.unlink()
 if len(frames)<10:raise RuntimeError("insufficient decodable frames")
 w=360*4;h=230*3;canvas=Image.new("RGB",(w,h),(15,15,18));d=ImageDraw.Draw(canvas)
 for i,im in enumerate(frames):
  im.thumbnail((360,205));x=(i%4)*360;y=(i//4)*230
  canvas.paste(im,(x,y+22));d.text((x+8,y+4),f"frame {i:02d}",fill="white")
 path.parent.mkdir(parents=True,exist_ok=True);canvas.save(path,quality=88)
 for a,b in zip(frames[:-1],frames[1:]):
  deltas.append(round(sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3,2))
 return deltas
def download(url,path):
 r=s.get(url,stream=True,timeout=(12,40),allow_redirects=True)
 if r.status_code>=400:raise RuntimeError(f"HTTP_{r.status_code}: "+str(r.url))
 ct=r.headers.get("Content-Type","")
 if "text/html" in ct or "application/json" in ct:raise RuntimeError("non-video: "+ct)
 n=0
 with path.open("wb") as f:
  for b in r.iter_content(1024*1024):
   if not b:continue
   n+=len(b)
   if n>180*1024*1024:raise RuntimeError("source exceeds 180 MB")
   f.write(b)
 if n<100000:raise RuntimeError("file too small")
 return {"size":n,"content_type":ct,"final_url":r.url}
for ident,id,url,role in SOURCES:
 obj={"id":id,"role":role,"page_url":url,"license":"Pexels license, subject to terms and any third-party trademarks"}
 try:
  # Try pexels HTML parser/extractor first, then known public CDN naming variants
  result=run(["yt-dlp","--skip-download","--dump-single-json","--socket-timeout","10","--retries","0",url],timeout=35)
  if result.returncode==0 and result.stdout.strip():
   info=json.loads(result.stdout)
   obj["extractor"]=info.get("extractor");obj["title"]=info.get("title")
   formats=[x for x in info.get("formats",[]) if x.get("vcodec")!="none" and x.get("height",0)>=1080 and x.get("url")]
   formats.sort(key=lambda x:(x.get("height") or 0,x.get("tbr") or 0),reverse=True)
   obj["formats"]=[{"height":x.get("height"),"width":x.get("width"),"format_id":x.get("format_id")} for x in formats[:4]]
  else:obj["extractor_error"]=result.stderr[-340:]
  destinations=[]
  # Modern Pexels video CDN direct links commonly use this pattern.
  for hz in (24,25,30,50,60):
   for res in ("hd_1920_1080","uhd_3840_2160"):
    destinations.append(f"https://videos.pexels.com/video-files/{id}/{id}-{res}_{hz}fps.mp4")
  destinations.append(f"https://www.pexels.com/video/{id}/download/")
  # HEAD probe may return 403 but GET can work; prefer byte-range first.
  found=[]
  for u in destinations:
   try:
    z=s.get(u,headers={"Range":"bytes=0-4095"},stream=True,timeout=(4,9),allow_redirects=True)
    ct=z.headers.get("content-type","")
    if z.status_code in (200,206) and (ct.startswith("video/") or "octet-stream" in ct):
     found.append({"url":u,"status":z.status_code,"content_type":ct,"content_range":z.headers.get("content-range"),"length":z.headers.get("content-length")})
     break
   except Exception:pass
  obj["probe_candidates"]=found
  if not found:
   raise RuntimeError("No tested public video CDN responded with video bytes")
  local=OUT/(ident+".raw.mp4")
  meta=download(found[0]["url"],local)
  p=probe(local);obj["original_probe"]=p;obj["download_meta"]=meta
  if p["width"]<1920 or p["height"]<1080:raise RuntimeError("source below native 1080p")
  dst=OUT/"clips"/(ident+".mp4");sample(local,dst)
  v=probe(dst)
  contact=OUT/"contacts"/(ident+".jpg");motion=sheet(dst,contact)
  obj.update({"status":"REAL_PLAYABLE_NATIVE_HD_NEEDS_HUMAN_INDY_IDENTITY_QA","clip":str(dst.relative_to(OUT)),"contact":str(contact.relative_to(OUT)),
   "clip_ffprobe":v,"clip_sha256":hashlib.sha256(dst.read_bytes()).hexdigest(),"frame_motion_deltas":motion})
  clips.append(obj)
 except Exception as e:
  obj.update({"status":"NOT_DELIVERED","error":str(e)[:550]})
 finally:
  for f in OUT.glob(ident+".raw.*"):f.unlink(missing_ok=True)
  log.append(obj)
  print(json.dumps(obj)[:6000],flush=True)
(OUT/"manifest.json").write_text(json.dumps(log,indent=2))
(OUT/"rights_and_qa.txt").write_text("Pexels search/tags are not proof of IndyCar identity. Human review 12-frame contact sheets before inclusion in INDYCAR project. Generic GT or NASCAR shots must be rejected. Licence https://www.pexels.com/license/ ; third-party logos/cars may have separate rights.\n")
with zipfile.ZipFile("out/YUNEX_INDY_D_PEXELS_VERIFICATION.zip","w",compression=zipfile.ZIP_DEFLATED) as z:
 for p in OUT.rglob("*"):
  if p.is_file():z.write(p,p.relative_to(OUT))
print("CLIPS",len(clips),"OUTPUT_ZIP",Path("out/YUNEX_INDY_D_PEXELS_VERIFICATION.zip").stat().st_size,flush=True)
