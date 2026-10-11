#!/usr/bin/env python3
"""Visually audit ALL 2026 4K square racing film frames for possible sixth GT3 manufacturer.
Consumes existing actual native original bytes, SHA hard guard, no new model claims before human visual review.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json,subprocess,zipfile
ROOT=Path("out/gt3-a-2026-4k-make-survey");ROOT.mkdir(parents=True,exist_ok=True)
SOURCE=Path("inputs/2026-video")
ORIGINAL_SHA="f7beed35af45dcc81bdbef31d734ea98ddf68f0e7588540b322fd8c2a6873b4c"
def dig(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for v in iter(lambda:f.read(1<<20),b""):h.update(v)
 return h.hexdigest()
def sh(a,t=60):
 p=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-500:])
 return p.stdout
candidates=[p for p in SOURCE.rglob("*") if p.is_file() and p.suffix.lower() in (".mp4",".mov",".mkv") and p.stat().st_size>=190_000_000]
original=None
for p in candidates:
 if dig(p)==ORIGINAL_SHA:original=p;break
assert original is not None,"No byte-verified 2026 3840x3840 producer original in prior media artifact"
raw=json.loads(sh(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(original)]))
v=next(x for x in raw["streams"] if x["codec_type"]=="video")
assert (int(v["width"]),int(v["height"]))==(3840,3840)
duration=float(raw["format"]["duration"]);assert 58<duration<65
print("VERIFIED_2026_PORSCHE_NEWSROOM_ORIGINAL_4K_SQUARE",original,original.stat().st_size,dig(original),duration,flush=True)
entries=[]
for panel in range(4):
 sheet=Image.new("RGB",(6*300,5*220),(7,7,7));d=ImageDraw.Draw(sheet)
 for i in range(25):
  index=panel*25+i
  t=duration*(index+.45)/100
  temp=ROOT/("TMP_"+str(index)+".jpg")
  try:
   sh(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{t:.3f}","-i",str(original),
      "-frames:v","1","-vf","crop=3840:2160:0:840,scale=300:169","-q:v","5",str(temp)],45)
   with Image.open(temp) as frame:
    c=index%25;sheet.paste(frame.convert("RGB"),((c%6)*300,(c//6)*220+25))
   entries.append({"timestamp_seconds":round(t,3),"panel":panel+1,"success":True})
  except Exception as e:
   entries.append({"timestamp_seconds":round(t,3),"panel":panel+1,"success":False,"error":str(e)[-120:]})
  temp.unlink(missing_ok=True)
  d.text(((i%6)*300+4,(i//6)*220+4),f"{t:.1f}s",fill="white")
 path=ROOT/(f"PANEL_{panel+1:02d}_25FRAMES_PORSCHE_2026.jpg")
 sheet.save(path,quality=90)
 print("ACTUAL_2026_RACING_CONTACT_BOARD",path,flush=True)
(ROOT/"MANIFEST.json").write_text(json.dumps({"native_producer_original_sha256":ORIGINAL_SHA,"original_file_not_reuploaded":True,
 "frames":entries,"status":"INDEPENDENT_CAR_MANUFACTURER_VISUAL_REVIEW_PENDING", "model_safety":"Do not count Mercedes/Audi/BMW/Porsche/Lamborghini from 300px tiles alone if identity uncertain"},indent=2))
print("MANUAL_SOURCE_CAR_QA_READY",len(entries),"frames",flush=True)
