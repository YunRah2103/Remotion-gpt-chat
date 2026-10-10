#!/usr/bin/env python3
"""Acquire genuine filmmaker-hosted Lamborghini Huracán STO night film MP4 masters.
Only actual verified 1920x1080 or larger originals are deliverable. No forced upscale.
Rights remain with FORMAT67 / Lamborghini Nürnberg; research only until cleared.
"""
from pathlib import Path
import urllib.request,subprocess,json,hashlib,zipfile
from PIL import Image,ImageDraw
ROOT=Path("out/sto-format67");ROOT.mkdir(parents=True,exist_ok=True)
SOURCES=[
("format67_sto_directors_full","https://format67.net/wp-content/uploads/2024/08/STO_FORMAT.mp4"),
("format67_sto_night_loop","https://format67.net/wp-content/uploads/2024/08/sto_loop.mp4")]
def probe(f):
 x=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],
 capture_output=True,text=True,timeout=45)
 if x.returncode:raise RuntimeError("FFprobe failed: "+x.stderr[-150:])
 j=json.loads(x.stdout)
 v=next(z for z in j["streams"] if z["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"fps":v.get("avg_frame_rate"),
 "duration":float(j["format"].get("duration") or 0),"video_codec":v["codec_name"],
 "bitrate":int(j["format"].get("bit_rate") or 0),"bytes":f.stat().st_size,
 "sha256":hashlib.sha256(f.read_bytes()).hexdigest()}
def contact(f,meta,slug):
 dur=meta["duration"];w=4;h=6;out=Image.new("RGB",(960,912),"#08090c");draw=ImageDraw.Draw(out)
 for i in range(w*h):
  time=max(.05,min(dur-.05,dur*(i+.5)/(w*h)))
  t=ROOT/".temp.jpg"
  p=subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-ss",str(time),"-i",str(f),
   "-vf","scale=240:135","-frames:v","1",str(t)],capture_output=True,timeout=42)
  if t.exists():
   with Image.open(t) as im:out.paste(im.convert("RGB"),((i%w)*240,(i//w)*152+17))
   t.unlink()
  draw.text(((i%w)*240+3,(i//w)*152+3),f"{time:.2f}s",fill="white")
 out.save(ROOT/(slug+"_24shot_contact.jpg"),quality=87)
results=[]
for slug,url in SOURCES:
 row={"id":slug,"url":url,"owner":"FORMAT67 / Lamborghini Nürnberg","reuse_license":"NOT_GRANTED","gate":"UNVERIFIED"}
 results.append(row)
 path=ROOT/(slug+".mp4")
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
  with urllib.request.urlopen(req,timeout=25) as resp:
   declared=int(resp.headers.get("Content-Length","0") or 0)
   if declared>450_000_000:raise ValueError("Declared file >450 MB")
   count=0
   with path.open("wb") as f:
    while True:
     chunk=resp.read(1024*1024)
     if not chunk:break
     count+=len(chunk)
     if count>450_000_000:raise ValueError("File >450 MB")
     f.write(chunk)
  info=probe(path);row.update(ffprobe=info)
  if info["width"]<1920 or info["height"]<800 or info["width"]<=info["height"]:
   row["gate"]="REJECT_NOT_USEFUL_LANDSCAPE";path.unlink()
  else:
   contact(path,info,slug)
   row["gate"]=("FULL_HD_1920X1080_CANDIDATE" if info["height"]>=1080
     else "OPTIONAL_1920X810_CINEMASCOPE_DOES_NOT_MEET_1920X1080_NATIVE_REQUIREMENT")
   row["framing_note"]="Original 1920x810 can be letterboxed at 1920x1080 without upscaling; black bars 135px top/bottom. Not a true 1920x1080 source. Agent B may reject."
 except Exception as e:
  row.update(gate="SOURCE_NOT_DOWNLOADED",error=str(e));path.unlink(missing_ok=True)
 (ROOT/"manifest.json").write_text(json.dumps(results,indent=2))
(ROOT/"manifest.json").write_text(json.dumps(results,indent=2))
with zipfile.ZipFile("out/STO_FORMAT67_NIGHT_FILM_MASTERS.zip","w",zipfile.ZIP_STORED,allowZip64=True) as z:
 for f in ROOT.rglob("*"):
  if f.is_file():z.write(f,f.relative_to(ROOT))
for r in results:print(r["id"],r["gate"],r.get("ffprobe",{}).get("width"),r.get("ffprobe",{}).get("height"),r.get("error",""))
