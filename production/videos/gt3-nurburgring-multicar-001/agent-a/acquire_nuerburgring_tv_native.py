#!/usr/bin/env python3
"""Acquire physically tested native 1080p direct MP4s from Nürburgring.tv.

Producer's N24, heart-race, Yokohama and related work page. Only downloaded,
fully decoded, visually inspected on-track GT3 shots may count toward gate.
"""
import requests,json,hashlib,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
O=Path("out/gt3-nurburgring-tv-real-1080");D=O/"native_original_mp4";P=O/"contact_sheets"
for x in (O,D,P):x.mkdir(parents=True,exist_ok=True)
BASE="https://nbrtv-website.fsn1.your-objectstorage.com/media/"
SOURCES=[
 {"id":"n24_legenden","url":BASE+"case-legenden.mp4","make_hint":"Multiple, actual visual verify","context":"ADAC 24h Nuerburgring highlight / racing portfolio preview"},
 {"id":"nuerburgring_heart_race","url":BASE+"case-heart-race.mp4","make_hint":"Multiple, actual visual verify","context":"Nuerburgring racing original brand film"},
 {"id":"yokohama_24h_nuerburgring","url":BASE+"case-yokohama.mp4","make_hint":"Multiple, actual visual verify","context":"Yokohama 24h Nuerburgring sponsor film"},
 {"id":"bni_producer_showreel","url":BASE+"case-bni.mp4","make_hint":"Multiple GT3 scenes possible, not assumed","context":"Producer mixed motorsport showreel, likely scenes off Nürburgring"},
 {"id":"efr_racing","url":BASE+"case-efr.mp4","make_hint":"Unknown - DTM likely; not N24 by default","context":"EFR workshop/DTM film; inspect before decision"}
]
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def p(args,timeout=160):
 z=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 if z.returncode:raise ValueError(z.stderr[-600:])
 return z.stdout
for s in SOURCES:
 s["status"]="NOT_ACQUIRED"
 try:
  path=D/(s["id"]+".mp4")
  with requests.get(s["url"],timeout=(15,80),stream=True,headers={"User-Agent":"Mozilla/5.0"}) as r:
   r.raise_for_status()
   with path.open("wb") as f:
    for chunk in r.iter_content(2**20):
     if chunk:f.write(chunk)
  data=json.loads(p(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],35))
  v=next(x for x in data['streams'] if x['codec_type']=="video")
  w,h=int(v['width']),int(v['height'])
  assert w>=1920 and h>=1080 and w>h,(w,h)
  p(["ffmpeg","-v","error","-i",str(path),"-f","null","-"],90)
  duration=float(data['format'].get('duration') or 0)
  canvas=Image.new("RGB",(640*4,390*3),(8,8,8));drawer=ImageDraw.Draw(canvas)
  times=[]
  for k in range(12):
   secs=round(duration*(k+.45)/12,2);times.append(secs)
   thumb=P/(s["id"]+"_tmp_"+str(k)+".jpg")
   p(["ffmpeg","-v","error","-y","-ss",str(secs),"-i",str(path),"-frames:v","1",
      "-vf","scale=640:360",str(thumb)],35)
   with Image.open(thumb) as im:canvas.paste(im.convert('RGB'),((k%4)*640,(k//4)*390+24))
   thumb.unlink()
   drawer.text(((k%4)*640+3,(k//4)*390+4),f"source t={secs:.2f}s; {w}x{h}",fill="white")
  photo=P/(s["id"]+"_12FRAME.jpg");canvas.save(photo,quality=89)
  s.update(status="NATIVE_1080P_FULLY_DECODED_VISUAL_GT3_QA_REQUIRED",width=w,height=h,duration_seconds=duration,
      sha256=sha(path),bytes=path.stat().st_size,ffprobe=data,contact_sheet=str(photo.relative_to(O)),
      sampled_times=times,relative_file=str(path.relative_to(O)))
  print("REAL NATIVE NURBURGRING MEDIA",s["id"],w,h,s['bytes'],duration,s['sha256'],flush=True)
 except Exception as exc:
  s["status"]="REJECTED";s["error"]=str(exc)[-550:];print("SOURCE ERROR",s['id'],s['error'],flush=True)
(O/"source_manifest.json").write_text(json.dumps({"source_producer":"Nuerburgring.tv film portfolio","source_page":"https://www.nuerburgring.tv/en/work","race_scene_gate":"PENDING_INDEPENDENT_VISUAL_MODEL_AND_RACE_CHECK", "originals":SOURCES,"note":"Native 1080p source clip may include non-GT3 vehicles, B-roll or other tracks. Each source file contains 12 actual decoded frames as proof."},indent=2)+"\n")
(O/"README_FIRST.md").write_text("# Nürburgring.tv producer originals, ACTUAL native 1080p MP4s\nSee contact sheets, SHA and FFprobe in source_manifest.json. Article page https://www.nuerburgring.tv/en/work . Film previews are ~20s, not whole 16min editorial master. No source GT3 maker/angle quota is claimed without video frame review. No upscale, real downloaded files.\n")
