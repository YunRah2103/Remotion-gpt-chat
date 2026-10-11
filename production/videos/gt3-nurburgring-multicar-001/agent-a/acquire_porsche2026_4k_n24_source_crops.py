#!/usr/bin/env python3
"""Recover real 3840x2160 Nürburgring racing crop shots from Porsche 2026 native 3840x3840 original.
Square-source center crop uses source pixels only, NEVER upscales 720p or stretches.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,requests,subprocess
URL="https://newstv.porsche.com/porschevideos/newstv.porsche.com_334359_en.mp4"
R=Path("out/gt3-a-porsche2026-4k-square-native-crops");ORIGINAL=R/"original_square";CUT=R/"true_native_3840x2160_crops";PROOF=R/"contact_sheets"
for x in (R,ORIGINAL,CUT,PROOF):x.mkdir(parents=True,exist_ok=True)
SOURCE=ORIGINAL/"PORSCHE_N24_2026_PUBLISHER_ORIGINAL_3840_SQUARE.mp4"
WINDOWS=[("N24_2026_RACE_02s",1.2,3.4),("N24_2026_RACE_09s",8,3.5),("N24_2026_RACE_13s",12.5,3.5),("N24_2026_RACE_17s",16.0,3.5),("N24_2026_RACE_51s",49.5,3.4)]
def run(a,timeout=120):
 p=subprocess.run(a,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-450:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for bit in iter(lambda:f.read(2**20),b""):h.update(bit)
 return h.hexdigest()
manifest={"publisher":"Porsche NewsTV 2026 Nürburgring","source":URL,"state":"NO_MEDIA","crops":[],"approval":"Crop geometry QA first. Only visually approved actual GT3 racing shots eligible."}
try:
 session=requests.Session()
 with session.get(URL,timeout=(13,50),stream=True,headers={"User-Agent":"Mozilla/5.0"}) as resp:
  resp.raise_for_status()
  total=0
  with SOURCE.open("wb") as f:
   for chunk in resp.iter_content(1<<20):
    if chunk:
     total+=len(chunk)
     if total>230_000_000:raise RuntimeError("ORIGINAL_SOURCE_230MB_CAP")
     f.write(chunk)
 j=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(SOURCE)],30))
 v=next(s for s in j["streams"] if s["codec_type"]=="video")
 if (int(v["width"]),int(v["height"]))!=(3840,3840):raise RuntimeError(f"Expected genuine 3840 square, found {v['width']}x{v['height']}")
 dur=float(j["format"].get("duration") or 0)
 manifest.update(original_size=total,source_sha256=sha(SOURCE),native_dimensions=[3840,3840],duration=dur,ffprobe=j,state="TRUE_3840_SQUARE_VIDEO_ACQUIRED")
 print("TRUE_ORIGINAL_2026_NURBURGRING_SQUARE",total,dur,manifest["source_sha256"],flush=True)
 for name,t,span in WINDOWS:
  row={"id":name,"time_source_sec":t,"span_sec":span,"status":"REVIEW"}
  out=CUT/(name+"_3840x2160.mp4")
  try:
   if t>=dur-1:raise RuntimeError("TIME_OUTSIDE_ORIGINAL")
   span=min(span,dur-t-0.1)
   run(["ffmpeg","-nostdin","-loglevel","error","-y","-ss",str(t),"-i",str(SOURCE),"-t",str(span),
     "-an","-vf","crop=3840:2160:0:840,format=yuv420p","-c:v","libx264","-preset","fast","-crf","17","-movflags","+faststart",str(out)],160)
   probe=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(out)],30))
   stream=next(x for x in probe["streams"] if x["codec_type"]=="video")
   if (int(stream["width"]),int(stream["height"]))!=(3840,2160):raise RuntimeError("Crop native 4K failed")
   run(["ffmpeg","-nostdin","-loglevel","error","-i",str(out),"-f","null","-"],80)
   board=Image.new("RGB",(1200,260),(8,8,8));draw=ImageDraw.Draw(board)
   for k in range(3):
    ts=(k+.5)*span/3
    tmp=PROOF/(name+"_"+str(k)+".jpg")
    run(["ffmpeg","-nostdin","-loglevel","error","-y","-ss",str(ts),"-i",str(out),"-frames:v","1","-vf","scale=400:225",str(tmp)],30)
    with Image.open(tmp) as im:board.paste(im.convert("RGB"),(k*400,25))
    draw.text((k*400+4,3),f"original {t+ts:.1f}s | crop native 4K",fill="white")
    tmp.unlink()
   board.save(PROOF/(name+"_3FRAME.jpg"),quality=90)
   row.update(status="ACTUAL_NATIVE_3840x2160_CROP_DECODED_MODEL_AND_RACE_QA_PENDING",bytes=out.stat().st_size,
              sha256=sha(out),cut_file=str(out.relative_to(R)),frame_sheet=str((PROOF/(name+"_3FRAME.jpg")).relative_to(R)),probe=probe)
   print("NATIVE_CROPPED_4K_SOURCE",name,t,span,out.stat().st_size,flush=True)
  except Exception as e:
   out.unlink(missing_ok=True);row.update(status="REJECTED",error=str(e)[-300:])
   print("CROP_REJECTED",name,str(e)[-200:],flush=True)
  manifest["crops"].append(row)
except Exception as e:
 manifest.update(state="NO_ACCEPTED_ORIGINAL",error=str(e)[-500:])
 SOURCE.unlink(missing_ok=True)
 print("SOURCE_REJECTED",str(e)[-350:],flush=True)
(R/"MANIFEST.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")
print("PHYSICAL_4K_CROP_COUNT",sum(x["status"].startswith("ACTUAL_NATIVE") for x in manifest["crops"]),flush=True)
