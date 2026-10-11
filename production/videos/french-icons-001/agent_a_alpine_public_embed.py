#!/usr/bin/env python3
"""Try public Alpine PRESS EMBED metadata for the legacy A110 full-HD movie.
Only the first-party official embedded player ID is used; no login/cookies/challenge bypass.
Never claim a media asset absent decoded video bytes.
"""
import json,urllib.request,urllib.parse,re,pathlib,hashlib,zipfile,subprocess
from fractions import Fraction
from PIL import Image,ImageDraw
ROOT=pathlib.Path("out/alpine-press-player-a110");SRC=ROOT/"originals";QA=ROOT/"contact_sheets"
for p in [SRC,QA]:p.mkdir(parents=True,exist_ok=True)
ORIGIN="https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/?lang=deu"
VIMEO_ID="825657442"
def hashfile(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
def cmd(a,seconds=120):
 r=subprocess.run(a,timeout=seconds,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-500:])
 return r.stdout
def probe(p):
 d=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
 s=next(x for x in d["streams"] if x["codec_type"]=="video")
 f=s.get("avg_frame_rate","0/1")
 return {"width":int(s["width"]),"height":int(s["height"]),"fps":float(Fraction(f)) if f!="0/0" else 0,
         "duration":float(d["format"].get("duration") or 0),"codec":s.get("codec_name"),"bytes":p.stat().st_size,
         "bitrate":int(d["format"].get("bit_rate") or 0)}
H={"User-Agent":"Mozilla/5.0","Referer":ORIGIN,"Origin":"https://presse.alpinecars.de","Accept":"application/json,text/html,*/*"}
status={"embedded_video_id":VIMEO_ID,"official_press_page":ORIGIN,"status":"PENDING","verified_original_full_hd":False}
try:
 req=urllib.request.Request("https://player.vimeo.com/video/"+VIMEO_ID+"/config",headers=H)
 with urllib.request.urlopen(req,timeout=35) as res:
  raw=res.read(3_000_000);ct=res.headers.get("Content-Type");url=res.geturl()
 print("CONFIG_HTTP",res.status,"content-type",ct,"bytes",len(raw),"resolved_url",url,flush=True)
 data=json.loads(raw)
 progress=data.get("request",{}).get("files",{}).get("progressive",[]) or []
 variants=[{"width":v.get("width"),"height":v.get("height"),"fps":v.get("fps"),"quality":v.get("quality"),"mime":v.get("mime")} for v in progress]
 print("PUBLIC_PROGRESSIVE_FORMATS",variants,flush=True)
 options=[v for v in progress if v.get("height",0)>=1080 and v.get("width",0)>=1920 and v.get("height",0)<=2160 and v.get("url")]
 status["available_formats"]=variants
 if not options:raise RuntimeError("PUBLIC_EMBED_NO_NATIVE_1080_PROGRESSIVE")
 sel=max(options,key=lambda x:(x["height"],x["width"]))
 source=SRC/"original-alpine-a110-monte-carlo-2013.mp4"
 with urllib.request.urlopen(urllib.request.Request(sel["url"],headers={"User-Agent":"Mozilla/5.0","Referer":"https://player.vimeo.com/"}),timeout=90) as res:
  if int(res.headers.get("Content-Length") or 0)>420_000_000:raise RuntimeError("OVER_CAP")
  n=0
  with source.open("wb") as f:
   while True:
    block=res.read(1<<20)
    if not block:break
    n+=len(block)
    if n>420_000_000:raise RuntimeError("OVER_CAP")
    f.write(block)
 info=probe(source)
 if info["width"]<1920 or info["height"]<1080:raise RuntimeError("FFPROBE_NATIVE_REJECT")
 cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(source),"-map","0:v:0","-f","null","-"],300)
 sheet=Image.new("RGB",(1470,1090),"#141516");draw=ImageDraw.Draw(sheet)
 draw.text((10,10),"Original Alpine historic full source / 10 frames",fill="white")
 for idx in range(10):
  t=(idx+.5)/10*info["duration"]
  file=QA/(str(idx)+".jpg")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),"-i",str(source),"-frames:v","1","-vf","scale=720:-2",str(file)],120)
  with Image.open(file) as im:
   im=im.convert("RGB");im.thumbnail((708,200));sheet.paste(im,((idx%2)*731+5,(idx//2)*213+28))
  file.unlink(missing_ok=True)
 sheet.save(QA/"all-ten-frames.jpg",quality=86)
 status.update({"status":"DOWNLOADED_NATIVE_FFMPEG_PASS_HUMAN_CAR_AND_ANGLE_QA_PENDING",
   "verified_original_full_hd":True,"probe":info,"sha256":hashfile(source)})
 print("EXACT_ORIGINAL_MEDIA_SHA",hashfile(source),flush=True)
except Exception as e:
 status.update({"status":"NOT_AVAILABLE_OR_REJECTED","error":str(e)[:1000]})
 print("SOURCE_FAILED",status["error"],flush=True)
(ROOT/"manifest.json").write_text(json.dumps(status,indent=2))
(ROOT/"README.md").write_text("Officially embedded public Alpine original A110 2013 documentary investigation. Gate PASS requires actual auto scene QA and >=18 distinct shots across 5 cars. No login or access restriction bypass attempted. Rights not verified.\n")
z=pathlib.Path("out/fr-legends-agent-a-official-alpine-public-embed.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_STORED) as arc:
 for p in ROOT.rglob("*"):
  if p.is_file():arc.write(p,p.relative_to(ROOT))
print("ALPINE_PLAYER_FINAL",json.dumps({"status":status["status"],"actual_hd":status["verified_original_full_hd"],"zip_bytes":z.stat().st_size}),flush=True)
