#!/usr/bin/env python3
"""Create real 42-cut reproducible video candidate bundle and actual FFmpeg QA."""
import hashlib,io,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps,ImageChops,ImageStat
ROOT=Path("production/videos/bmw-m5-evolution-001/footage")
BOARD=json.loads((ROOT/"provisional-cuts.json").read_text())
TARGET=Path("out/m5-cuts-42");(TARGET/"clips").mkdir(parents=True,exist_ok=True)
STAGED=Path("staging")
videos={p.name:p for p in STAGED.rglob("*") if p.is_file() and p.suffix in (".mp4",".mov")}
def call(cmd,timeout=130):
 return subprocess.run(cmd,check=True,capture_output=True,text=True,timeout=timeout).stdout
def probe(path):
 d=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)]))
 s=next(v for v in d["streams"] if v["codec_type"]=="video")
 return {"width":int(s["width"]),"height":int(s["height"]),"fps":s["avg_frame_rate"],"codec":s["codec_name"]}
def grab(path,t):
 raw=subprocess.run(["ffmpeg","-v","error","-ss",str(t),"-i",str(path),"-frames:v","1","-vf","scale=300:-2","-f","image2pipe","-vcodec","mjpeg","-"],capture_output=True,check=True,timeout=35).stdout
 return Image.open(io.BytesIO(raw)).convert("RGB")
def sha(path):
 h=hashlib.sha256()
 with open(path,"rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
rows=[];thumbs=[]
for cut in BOARD["shots"]:
 idx=cut["slot"];gen=cut["generation"];name=f"{gen.lower()}-{(idx-1)%6+1:02d}"
 source=videos.get(cut["source"])
 if not source:raise RuntimeError(f"Missing genuine source video for {name}: {cut['source']}")
 dest=TARGET/"clips"/(name+".mp4")
 call(["ffmpeg","-hide_banner","-v","error","-y","-ss",str(cut["sourceInSeconds"]),"-i",str(source),"-t","0.80",
     "-an","-c:v","libx264","-preset","medium","-crf","15","-pix_fmt","yuv420p","-movflags","+faststart",str(dest)])
 call(["ffmpeg","-hide_banner","-v","error","-xerror","-i",str(dest),"-f","null","-"])
 meta=probe(dest)
 motion=ImageStat.Stat(ImageChops.difference(grab(dest,.10),grab(dest,.55)).convert("L")).mean[0]
 if motion<2:raise RuntimeError("Static segment: "+name)
 row={**cut,**meta,"clip":str(dest.relative_to(TARGET)),"clipSha256":sha(dest),"sourceSha256":sha(source),
      "clipBytes":dest.stat().st_size,"frameDifferenceMean":round(motion,3),"decodePassed":True}
 rows.append(row)
 thumbs.append((name,grab(dest,.35)))
 print("PASS",name,meta["width"],meta["height"],round(motion,2),flush=True)
if len(rows)!=42:raise RuntimeError("Missing clips")
w,h,g,col=240,135,10,6
sheet=Image.new("RGB",(g+col*(w+g),g+7*(h+28+g)),"#111927");pen=ImageDraw.Draw(sheet)
for i,(name,img) in enumerate(thumbs):
 x=g+(i%col)*(w+g);y=g+(i//col)*(h+28+g)
 sheet.paste(ImageOps.contain(img,(w,h)),(x,y))
 pen.text((x,y+h+5),name,fill="white")
sheet.save(TARGET/"VISUAL-CONTACT.jpg",quality=91)
out={"schemaVersion":1,"status":"42_REAL_VIDEO_CANDIDATES_NOT_RELEASE_APPROVED","count":42,
     "e34MixedGenerationWarning":"E34 candidate views in formation often include E28, E39, and/or E60; NOT uniquely isolated. Reject or reframe before final.",
     "rights":"Unknown for public redistribution; research prototype only","shots":rows}
(TARGET/"manifest.json").write_text(json.dumps(out,indent=2)+"\n")
print("DONE",len(rows),flush=True)
