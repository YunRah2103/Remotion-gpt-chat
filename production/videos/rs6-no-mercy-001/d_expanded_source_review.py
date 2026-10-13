#!/usr/bin/env python3
"""Private director contact review of ALL EXISTING A2/B2/C2 RS6 assets.
For in-house editorial shot selection; do not publish sources.
"""
from pathlib import Path
import json,subprocess,hashlib,math,io
from PIL import Image,ImageDraw
root=Path("rs6-d-expanded")
out=Path("rs6-d-expanded-review");out.mkdir(exist_ok=True)
files=[p for p in sorted(root.glob("*/*.mp4")) if not any(s in p.name for s in ("PROOF","YUNEX_","TRANSITION"))]
report=[]
W,H=200,360
columns=5
rows=math.ceil(len(files)/columns)
sheet=Image.new("RGB",(W*columns, (H+30)*rows),"#121315")
draw=ImageDraw.Draw(sheet)
for i,path in enumerate(files):
 info=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration,size:stream=width,height,codec_type","-of","json",str(path)],text=True))
 dur=float(info["format"]["duration"])
 pcts=[.13,.37,.62,.88]
 ims=[]
 for k,q in enumerate(pcts):
  t=min(dur-.04,max(0,dur*q))
  cmd=["ffmpeg","-nostdin","-loglevel","error","-ss",f"{t:.4f}","-i",str(path),"-frames:v","1","-vf","scale=200:360:flags=lanczos","-f","image2pipe","-vcodec","mjpeg","-"]
  p=subprocess.run(cmd,capture_output=True,timeout=14)
  if p.returncode==0:
   try:ims.append(Image.open(io.BytesIO(p.stdout)).convert("RGB"))
   except Exception:pass
 x=(i%columns)*W;y=(i//columns)*(H+30)
 if ims:
  tile=Image.new("RGB",(W,H))
  for n,im in enumerate(ims):
   tile.paste(im.resize((W//2,H//2)),((n%2)*W//2,(n//2)*H//2))
  sheet.paste(tile,(x,y+30))
 draw.text((x+3,y+3),f"{i+1:02d} {path.parent.name} {path.name[:17]}",fill="white")
 s=hashlib.sha256(path.read_bytes()).hexdigest()
 report.append({"index":i+1,"source":path.parent.name,"name":path.name,"duration":dur,"bytes":path.stat().st_size,"sha256":s})
sheet.save(out/"ALL_SOURCE_MOTION_CONTACT.jpg",quality=87,optimize=True)
(out/"ALL_SOURCE_MANIFEST.json").write_text(json.dumps({"count":len(files),"sources":report},indent=2))
print(json.dumps({"source_count":len(files),"sources":[x["name"] for x in report]},indent=2))
