#!/usr/bin/env python3
"""Fetch original Nürburgring 2024 publisher-hosted film, verify native pixels and distinct shots."""
import json,subprocess,hashlib,requests
from pathlib import Path
from PIL import Image,ImageDraw
URL="https://thetiremagazine.com/wp-content/uploads/2024/07/Falken-Tyres-Why-We-Race-24h-Race-Nurburgring-2024.mp4"
R=Path("out/gt3-a-publisher-falken2024");M=R/"native_video";C=R/"contact"
for p in (R,M,C):p.mkdir(parents=True,exist_ok=True)
rec={"url":URL,"publisher":"The Tire Magazine/Falken 2024 N24","status":"NOT_ACQUIRED"}
def run(args,timeout=90):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-400:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for t in iter(lambda:f.read(1024*1024),b""):h.update(t)
 return h.hexdigest()
try:
 path=M/"Falken_2024_Why_We_Race_original.mp4"
 s=requests.Session();s.headers.update({"User-Agent":"Mozilla/5.0","Accept":"*/*"})
 with s.get(URL,timeout=(10,65),stream=True) as resp:
  resp.raise_for_status();rec["content_type"]=resp.headers.get("content-type")
  rec["content_length"]=resp.headers.get("content-length")
  size=0
  with path.open("wb") as f:
   for chunk in resp.iter_content(1024*1024):
    if chunk:
     size+=len(chunk)
     if size>150_000_000:raise RuntimeError("Source over 150MB cap")
     f.write(chunk)
 rec["retrieved_bytes"]=size
 if size<100_000:raise RuntimeError("Server returned non-media/empty")
 j=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],40))
 v=next(k for k in j["streams"] if k["codec_type"]=="video")
 w,h=int(v["width"]),int(v["height"])
 rec.update(width=w,height=h,sha256=sha(path),frame_rate=v.get("r_frame_rate"),ffprobe=j)
 if w<1920 or h<1080 or w<=h:raise RuntimeError(f"Native not 1920x1080 landscape: {w}x{h}")
 dur=float(j["format"].get("duration") or 0)
 if dur<4:raise RuntimeError("Short/invalid original")
 rec["duration"]=dur
 run(["ffmpeg","-nostdin","-v","error","-i",str(path),"-f","null","-"],min(360,max(90,int(dur*2))))
 rec["decoded_all_frames"]=True
 sheet=Image.new("RGB",(6*400,5*258),"#161616");d=ImageDraw.Draw(sheet)
 frames=[]
 for i in range(30):
  sec=dur*(i+.45)/30;temp=C/f"frame_{i:02d}.jpg"
  try:
   run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(sec),"-i",str(path),"-frames:v","1","-vf","scale=400:225","-q:v","4",str(temp)],25)
   with Image.open(temp) as im:sheet.paste(im.convert("RGB"),((i%6)*400,(i//6)*258+23))
   frames.append({"sec":round(sec,2),"ok":True})
  except Exception as e:frames.append({"sec":round(sec,2),"error":str(e)[-130:]})
  d.text(((i%6)*400+4,(i//6)*258+3),f"Original {sec:.1f}s",fill="white")
  temp.unlink(missing_ok=True)
 sheet.save(C/"Falken_2024_30_FRAME_ORIGINAL.jpg",quality=91)
 rec.update(status="REAL_NATIVE_HD_FULL_DECODE_RACE_GT3_VISUAL_REVIEW_PENDING",contact_sheet="contact/Falken_2024_30_FRAME_ORIGINAL.jpg",time_samples=frames)
 print("REAL ORIGINAL VERIFIED",w,h,size,dur,rec['sha256'],flush=True)
except Exception as e:
 rec.update(status="FAIL_SOURCE_REJECTED",error=str(e)[-600:])
 for f in M.glob("*"):f.unlink(missing_ok=True)
 print("REAL ORIGINAL NOT ACCEPTED",rec["error"],flush=True)
(R/"SOURCE_MANIFEST.json").write_text(json.dumps(rec,indent=2,ensure_ascii=False)+"\n")
(R/"README.txt").write_text("Manufacturer or distinct 24-shot quota credit requires independent camera frame review. This is real original media only if accepted and native. Do not treat successful GitHub Action as success by itself.\n")
