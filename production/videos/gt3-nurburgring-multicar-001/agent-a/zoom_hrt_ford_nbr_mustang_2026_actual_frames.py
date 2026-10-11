#!/usr/bin/env python3
"""Actual HRT Ford 84.12s native HD zoom review to confirm 2026 Ford Mustang N24 Nordschleife
at original t26–28s and t73–77s, not film-title based inference.
"""
from pathlib import Path
import json,zipfile,shutil,hashlib,subprocess,io,base64
from PIL import Image,ImageDraw
R=Path("out/gt3-a-hrt-ford-original-precise-nordschleife-identification");R.mkdir(parents=True,exist_ok=True)
Z=next(x for x in Path("inputs/hrt-2026-full-original").rglob("*.zip") if x.stat().st_size>20_000_000)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as fd:
  for b in iter(lambda:fd.read(1<<20),b""):h.update(b)
 return h.hexdigest()
def cmd(args,t=35):
 v=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if v.returncode:raise RuntimeError(v.stderr[-500:])
 return v.stdout
with zipfile.ZipFile(Z) as archive:
 assert archive.testzip() is None
 j=json.loads(archive.read("SOURCE_MANIFEST.json"))
 item=next(x for x in j["sources"] if x["source_id"]=="hrt_ford_2026_entire_original")
 f=R/"_original.mp4"
 with archive.open(item["file"]) as a,f.open("wb") as b:shutil.copyfileobj(a,b)
 assert sha(f)==item["sha256"]
 times=[26.62,26.78,26.96,27.12,27.28,27.44,27.60,27.78,28.02,28.20,
       72.93,73.17,73.42,73.67,73.93,74.15,75.16,75.66,76.04,76.42,
       61.30,61.70,62.05,62.45,62.78,63.11]
 boards=[]
 for bi in range(3):
  group=times[bi*10:(bi+1)*10]
  im=Image.new("RGB",(3*900,4*560),(5,5,5));d=ImageDraw.Draw(im)
  for n,t in enumerate(group):
   frame=R/(f"real_frame_{bi:02d}_{n:02d}.jpg")
   cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{t:.3f}","-i",str(f),
     "-frames:v","1","-vf","scale=900:506","-q:v","2",str(frame)])
   with Image.open(frame) as source:im.paste(source.convert("RGB"),((n%3)*900,(n//3)*560+30))
   d.text(((n%3)*900+8,(n//3)*560+6),f"REAL ORIGINAL {t:.3f}s",fill="white")
   frame.unlink()
  dst=R/(f"HRT_FORD_NBR_CAR_ORIGINAL_PANEL_{bi+1}.jpg");im.save(dst,quality=91)
  buf=io.BytesIO();im.resize((1890,1568)).save(buf,"JPEG",quality=82,optimize=True)
  print(f"HRT_NBR_MAKE_ZOOM_PANEL_{bi+1}_BASE64_START:"+base64.b64encode(buf.getvalue()).decode()+f":HRT_NBR_MAKE_ZOOM_PANEL_{bi+1}_BASE64_END",flush=True)
  boards.append(str(dst))
 (R/"MANIFEST.json").write_text(json.dumps({
  "original_source_sha256":item["sha256"],"original_native_pixels":[1920,1080],
  "actual_zoom_review_timestamps_seconds":times,
  "publisher":"Haupt Racing Team highlights 2025-2026",
  "boards":boards,"source_video_original_checked":True,
  "no_new_angle_credits_until_number_and_livery_plus_circuit_confirmed":True
 },indent=2))
 f.unlink()
