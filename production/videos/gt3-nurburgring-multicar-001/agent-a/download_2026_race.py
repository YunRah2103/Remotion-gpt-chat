#!/usr/bin/env python3
"""Download real Porsche NewsTV official 2026 Nürburgring MP4s, independently sample.

Stores only actual native-HD media; this archive is original footage,
NOT 30 unique shots and NOT evidence of six identified GT3 car makes.
"""
import hashlib,json,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw
OUT=Path("out/gt3-porsche-n24-2026")
VID=OUT/"originals";CONTACT=OUT/"contact_sheets"
VID.mkdir(parents=True,exist_ok=True);CONTACT.mkdir(parents=True,exist_ok=True)
SOURCES=[
{"id":"n24_2026_race_review","url":"https://newstv.porsche.com/porschevideos/newstv.porsche.com_334359_en.mp4","title":"2026 24h Nürburgring race review","expected":"Race review, racing images to visually verify"},
{"id":"n24_2026_sixty_porsches","url":"https://newstv.porsche.com/porschevideos/newstv.porsche.com_334111_en.mp4","title":"60 Porsche in the Green Hell","expected":"N24 race preparation and action, mixed classes possible"},
{"id":"n24_2026_fan_event","url":"https://newstv.porsche.com/porschevideos/newstv.porsche.com_334123_en.mp4","title":"Fans of Nürburgring 24-Hour Race","expected":"Fan/event cutaways; may be unusable for GT3 racing shots"}
]
def run(args,timeout=180):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-800:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
results=[]
for src in SOURCES:
 path=VID/(src["id"]+".mp4")
 rec={**src,"file":str(path.relative_to(OUT)),"status":"ERROR"}
 try:
  print("SOURCE",src["title"],"downloading",flush=True)
  run(["curl","-fLsS","--retry","2","--max-time","180","-o",str(path),src["url"]],timeout=190)
  p=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],timeout=25))
  v=next(s for s in p["streams"] if s.get("codec_type")=="video")
  w=int(v["width"]);h=int(v["height"]);duration=float(p["format"]["duration"])
  if w<1920 or h<1080 or w<=h:raise ValueError(f"Reject non-1080 native landscape {w}x{h}")
  if duration<8:raise ValueError(f"Reject short original {duration}")
  rec.update(status="NATIVE_HD_PASS_VISUAL_ID_PENDING",resolution=[w,h],duration=duration,
             fps=v.get("avg_frame_rate"),codec=v.get("codec_name"),
             bytes=path.stat().st_size,sha256=sha(path),audio=any(s.get("codec_type")=="audio" for s in p["streams"]))
  frames=[]
  for j in range(12):
   t=1+(duration-2)*(j+.5)/12
   frame=CONTACT/(src["id"]+f"_{j:02d}.jpg")
   run(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{t:.3f}","-i",str(path),"-frames:v","1","-vf","scale=400:-2",str(frame)],timeout=35)
   if frame.is_file():frames.append((t,frame))
  width=400;height=250
  page=Image.new("RGB",(width*4,height*3),(24,24,24))
  draw=ImageDraw.Draw(page)
  for j,(t,frame) in enumerate(frames):
   with Image.open(frame) as img:
    img=img.convert("RGB");img.thumbnail((width,height-24))
    x=(j%4)*width;y=(j//4)*height
    page.paste(img,(x,y+24))
    draw.text((x+5,y+5),f"{src['id']} {t:.1f}s",fill="white")
   frame.unlink(missing_ok=True)
  sheet=CONTACT/(src["id"]+"_12FRAME.jpg");page.save(sheet,quality=86)
  rec["contact_sheet"]=str(sheet.relative_to(OUT))
  print("NATIVE_HD",src["id"],f"{w}x{h}",f"{duration:.1f}s",f"{path.stat().st_size/1e6:.1f}MB",flush=True)
 except Exception as exc:
  rec["error"]=str(exc)
  path.unlink(missing_ok=True)
  print("REJECTED",src["id"],str(exc)[-250:],flush=True)
 results.append(rec)
report={"report":"YUNEX real original 2026 Nürburgring source film acquisition","sources":results,
        "hd_originals":sum(1 for r in results if r["status"]=="NATIVE_HD_PASS_VISUAL_ID_PENDING"),
        "distinct_verified_gt3_shots":0,
        "distinct_verified_gt3_makes":0,"gate":"NEEDS_HUMAN_RACE_CAR_AND_SHOT_REVIEW"}
(OUT/"manifest.json").write_text(json.dumps(report,indent=2)+"\n")
(OUT/"README.md").write_text("# 2026 Nürburgring official native source originals\n\nActual MP4s downloaded from Porsche NewsTV, full encoded source bytes, SHA256 and FFprobe in manifest. Contact sheets are visual evidence, not final human GT3 identity QA. Race review, 60 Porsche film and fan film may contain different vehicle classes and static footage. Use only actual race frames; do not count these three original films as 30 separate verified GT3 camera angles. Six makes not yet proven.\n")
print(json.dumps({"native_hd_originals":report["hd_originals"],"qualifying_gt3_unique_shots":0,"gate":report["gate"]},indent=2))
