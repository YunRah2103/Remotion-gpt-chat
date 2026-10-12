#!/usr/bin/env python3
"""Inspect two distinct modern IndyCar helmet-cam broadcasts for native 1080p delivery.
Third-party broadcasts are NOT cleared for publication; keep internal research only."""
from pathlib import Path
import hashlib,json,zipfile,subprocess
from PIL import Image,ImageDraw,ImageChops,ImageStat
BASE=Path("out/indy-d-onboard-probe");RAW=BASE/"raw";CLIPS=BASE/"review_clips";CONTACT=BASE/"contact"
for p in (RAW,CLIPS,CONTACT):p.mkdir(parents=True,exist_ok=True)
SOURCES=[
("2025_palou_helmetcam","https://www.dailymotion.com/video/x9k137e","2025 Alex Palou Indianapolis 500 Carb Day genuine helmet camera"),
("2025_newgarden_helmetcam","https://www.dailymotion.com/video/x9jl9u6","2025 Josef Newgarden Indy500 FP3 genuine helmet camera"),
]
def run(args,timeout=150):
 return subprocess.run(args,capture_output=True,text=True,timeout=timeout)
def probe(p):
 r=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],20)
 if r.returncode:raise RuntimeError(r.stderr[-450:])
 d=json.loads(r.stdout);v=next(s for s in d["streams"] if s["codec_type"]=="video")
 return {"width":v.get("width"),"height":v.get("height"),"codec":v.get("codec_name"),"fps":v.get("avg_frame_rate"),"duration":float(d["format"].get("duration",0))}
def frames(src,id):
 im=Image.new("RGB",(720*3,430*3),(17,17,17));d=ImageDraw.Draw(im);imgs=[]
 inf=probe(src)
 for i in range(9):
  t=.2+(inf["duration"]-.4)*(i+.5)/9
  out=BASE/"single.jpg"
  r=run(["ffmpeg","-hide_banner","-nostdin","-y","-loglevel","error","-ss",str(t),"-i",str(src),"-vf","scale=720:-2","-frames:v","1",str(out)],30)
  if r.returncode:raise RuntimeError(r.stderr[-200:])
  a=Image.open(out).convert("RGB").copy();out.unlink();imgs.append(a)
  x=(i%3)*720;y=(i//3)*430
  a.thumbnail((720,396));im.paste(a,(x,y+26));d.text((x+8,y+4),id+f"  t={t:.2f}",fill=(255,255,255))
 p=CONTACT/(id+".jpg");im.save(p,quality=85)
 return [round(sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3,2) for a,b in zip(imgs[:-1],imgs[1:])]
def main():
 out=[]
 for id,url,desc in SOURCES:
  m={"id":id,"url":url,"desc":desc,"rights":"THIRD-PARTY BROADCAST: internal QA only; licensing from INDYCAR/FOX/rights holder REQUIRED before edit publication"}
  try:
   r=run(["yt-dlp","--no-playlist","--skip-download","--dump-single-json","--socket-timeout","15","--retries","1",url],75)
   if r.returncode:raise RuntimeError("source metadata blocked: "+r.stderr[-500:])
   js=json.loads(r.stdout); m["title"]=js.get("title");m["duration"]=js.get("duration")
   fm=[f for f in js.get("formats",[]) if (f.get("height") or 0)>=1080 and f.get("vcodec") not in (None,"none")]
   m["formats_1080_count"]=len(fm);m["formats_1080"]= [{"height":f.get("height"),"width":f.get("width"),"id":f.get("format_id"),"protocol":f.get("protocol")} for f in fm[:5]]
   if not fm:raise RuntimeError("No native 1080p source format advertised; no fake upscaling.")
   dest=str(RAW/(id+".%(ext)s"))
   cmd=["yt-dlp","--no-playlist","--socket-timeout","15","--retries","1","--fragment-retries","1",
         "--no-part","--format","bv*[height>=1080]+ba/b[height>=1080]",
         "--download-sections","*3-22","--merge-output-format","mp4","--output",dest,url]
   p=run(cmd,200)
   candidates=list(RAW.glob(id+".*"))
   if p.returncode or not candidates:raise RuntimeError("download blocked "+p.stderr[-550:])
   raw=max(candidates,key=lambda p:p.stat().st_size);pr=probe(raw)
   m.update({"source_probe":pr,"downloaded_bytes":raw.stat().st_size})
   if pr["width"]<1920 or pr["height"]<1080:raise RuntimeError("download actually below Full HD; reject")
   output=CLIPS/(id+".mp4")
   q=run(["ffmpeg","-y","-hide_banner","-loglevel","error","-nostdin","-i",str(raw),"-t","5","-map","0:v:0","-an",
          "-c:v","libx264","-crf","19","-preset","veryfast","-movflags","+faststart",str(output)],100)
   if q.returncode:raise RuntimeError(q.stderr[-500:])
   m["delivered_probe"]=probe(output);m["clip"]=str(output.relative_to(BASE));m["sha256"]=hashlib.sha256(output.read_bytes()).hexdigest()
   m["motion_deltas"]=frames(output,id);m["contact"]="contact/"+id+".jpg";m["status"]="SOURCE_ACQUIRED_HUMAN_VISUAL_QA_PENDING_COPYRIGHT_NOT_CLEARED"
  except Exception as e:m["error"]=str(e)[:550];m["status"]="NOT_DELIVERED"
  finally:
   for f in RAW.glob(id+".*"):f.unlink(missing_ok=True)
   out.append(m);print(json.dumps(m)[:1800],flush=True)
 (BASE/"manifest.json").write_text(json.dumps(out,indent=2))
 (BASE/"COPYRIGHT_AND_REUSE.txt").write_text("These are independent possible actual IndyCar helmetcam sources. Their broadcast rights are NOT cleared. Any successfully obtained short clips are PRIVATE REVIEW ONLY, not approved publishing assets. For commercial/social use obtain written permission from rights holders. No DRM bypass, login, cookies, or access controls used.\n")
 zip_path=Path("out/INDY_D_2025_HELMETCAM_REVIEW_ONLY.zip")
 with zipfile.ZipFile(zip_path,"w",compression=zipfile.ZIP_DEFLATED) as z:
  for p in BASE.rglob("*"):
   if p.is_file():z.write(p,p.relative_to(BASE))
 print("ZIP",zip_path,zip_path.stat().st_size,flush=True)
if __name__=="__main__":main()
