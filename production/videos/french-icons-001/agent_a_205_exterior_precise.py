#!/usr/bin/env python3
"""Peugeot 205 GTI original Harry's Garage true-native-HD specific EXTERIOR driving shot finder.

Physical 1920x1080 film previously confirmed SHA, clip known to show exterior head-on at
~897s and following car at ~1020s. Need frame-accurate 0.9s motion shots and exact scene
boundaries, reject presenter in-car and copyright watermark in social frame.
Do not auto accept a shot or crop away watermark by silently faking native pixels.
"""
import urllib.request,urllib.parse,zipfile,pathlib,subprocess,json,hashlib,time
from PIL import Image,ImageDraw
from fractions import Fraction
OUT=pathlib.Path("out/fr-a-peugeot205-exterior-scene-qa")
OUT.mkdir(parents=True,exist_ok=True)
SRC=OUT/"205-gti-original.mp4"
NAME="Peugeot 205 GTi 1.9. Is this the best hot-hatch ever .mp4"
IDENT="peugeot-205-gti-1.9.-is-this-the-best-hot-hatch-ever"
URL="https://archive.org/download/"+IDENT+"/"+urllib.parse.quote(NAME)
EXPECTED_SHA="395c0160d86a2595a407b42c0097832be0709f7f1a580c3c579ebc71d75f4d34"
PERIODS=[
 ("front-approach",884,916),
 ("rear-follow",1000,1033)
]
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def command(args,timeout=130):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-650:])
 return p.stdout
def download():
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(URL+("" if attempt%2==0 else "?download=1"),
      headers={"User-Agent":"Mozilla/5.0","Accept":"video/*,*/*"}),timeout=90) as response:
    with SRC.open("wb") as dst:
     size=0
     for b in iter(lambda:response.read(1<<20),b""):
      size+=len(b)
      if size>500_000_000:raise RuntimeError("SOURCE_EXCEEDS_EXPECTED")
      dst.write(b)
   assert sha(SRC)==EXPECTED_SHA,"SOURCE_SHA_DIFFERENT_FROM_VERIFIED_PUBLISHER_FILM"
   return size
  except Exception as e:
   SRC.unlink(missing_ok=True)
   print("SOURCE_RETRY",attempt,str(e)[:180],flush=True)
   if attempt==2:raise
   time.sleep(2+attempt)
def sheet(slug,start,end):
 count=end-start
 for part in range((count+15)//16):
  width,height=1920,1510
  pic=Image.new("RGB",(width,height),"#141820")
  draw=ImageDraw.Draw(pic)
  draw.text((15,12),f"205 GTI real 1920x1080 ORIGINAL film at {slug} range {start}-{end} seconds, grid {part+1}",fill="white")
  for i in range(part*16,min(count,part*16+16)):
   t=start+i+0.5
   jpg=OUT/(f"_temp_{slug}_{i}.jpg")
   command(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),"-i",str(SRC),
       "-frames:v","1","-vf","scale=460:-2",str(jpg)],75)
   with Image.open(jpg) as frame:
    frame=frame.convert("RGB");frame.thumbnail((463,318))
    k=i-part*16;x=k%4*480+6;y=k//4*365+32
    pic.paste(frame,(x,y))
    draw.text((x+3,y+323),f"{t:.1f} sec",fill="white")
   jpg.unlink()
  pic.save(OUT/(slug+f"-source-frames-{part+1}.jpg"),quality=92)
meta={"source_page":"https://archive.org/details/"+IDENT,"url":URL,
      "video_model":"Original Peugeot 205 GTI 1.9","expected_original_sha":EXPECTED_SHA,
      "publisher_logo_visible":True,"final_shots_approved":0,
      "license_for_tiktok_unknown":True}
n=download();meta["real_mp4_downloaded_bytes"]=n
p=json.loads(command(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(SRC)],65))
v=next(x for x in p["streams"] if x["codec_type"]=="video")
meta["probe"]={"width":v["width"],"height":v["height"],"fps":float(Fraction(v["avg_frame_rate"])),
  "duration_sec":float(p["format"]["duration"]),"sha256":sha(SRC)}
assert v["width"]==1920 and v["height"]==1080
for slug,start,end in PERIODS:
 sheet(slug,start,end)
 for center in (start+7,start+20):
  output=OUT/(f"PROOF-{slug}-{center}-3sec.mp4")
  command(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(center),
     "-i",str(SRC),"-t","3","-map","0:v:0","-c:v","libx264","-crf","21",
     "-preset","veryfast","-pix_fmt","yuv420p","-an",str(output)],140)
meta["asset_files"]=[x.name for x in OUT.glob("*.jpg")]+[x.name for x in OUT.glob("*.mp4") if "PROOF" in x.name]
(OUT/"manifest.json").write_text(json.dumps(meta,indent=2))
(OUT/"README.md").write_text("Native 1080 original physical film decoded; watermarked publisher branding in bottom left, so do not count editor-ready clean shots yet. This QA explicitly examines exact exterior follow-car camera segments with second-by-second REAL frames and playable short proofs. Source reuse rights unknown. Original source kept at linked Archive URL and not included to reduce QA ZIP size.\n")
SRC.unlink(missing_ok=True)
with zipfile.ZipFile("out/FR-A-205-GTI-TWO-EXTERIOR-ANGLE-ORIGINAL-REAL-QA.zip","w",zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for f in OUT.rglob("*"):
  if f.is_file():z.write(f,f.relative_to(OUT))
print("PEUGEOT_205_EXTERIOR_DETAIL_QA",json.dumps({"source":meta["source_page"],
 "native_original_sha256":EXPECTED_SHA,"frames_checked":sum(b-a for _,a,b in PERIODS),
 "proofs":len(list(OUT.glob("PROOF*.mp4"))),"status":"HUMAN_QA_REQUIRED","approved":0}),flush=True)
