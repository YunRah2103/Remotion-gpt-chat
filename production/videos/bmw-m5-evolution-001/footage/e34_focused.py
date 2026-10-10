#!/usr/bin/env python3
"""Private evaluation: genuine E34 M5 driving candidate extractions from BMW 2005 source.
No public rights granted; no assertion of six independently approved camera setups.
"""
import hashlib,io,json,subprocess,urllib.request
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageChops,ImageStat
ROOT=Path("out/m5-e34-focused");ROOT.mkdir(parents=True,exist_ok=True)
URL="https://mediapool.bmwgroup.com/download/edown/tvFootageDownload?filmSceneFileId=7909&actEvent=tvFootageSceneHD&attachment=1"
ORIGINAL=Path("/tmp/e34_mixed_original.mov")
TIMES=[211.9,243.7,263.4,340.4,378.7,423.0]
DESCRIPTORS=[
"Dark E34 in approaching four-car rolling formation; several other generations visible",
"Dark E34 rear in rolling formation; other cars visible",
"Dark E34 in side-rolling formation; other cars partially visible",
"Dark E34 front three-quarter close rolling pass, distinct moving shot",
"Dark E34 wet-runway dynamic slalom close approach",
"Dark E34 later wet-runway slalom pass; camera style partially repeated"
]
def cmd(args,timeout=130):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout).stdout
def h(path):
 v=hashlib.sha256()
 with open(path,'rb') as f:
  for b in iter(lambda:f.read(2**20),b''):v.update(b)
 return v.hexdigest()
def capture(path,seconds):
 b=subprocess.run(["ffmpeg","-v","error","-ss",str(seconds),"-i",str(path),"-frames:v","1","-vf","scale=350:-2","-vcodec","mjpeg","-f","image2pipe","-"],capture_output=True,check=True,timeout=50).stdout
 return Image.open(io.BytesIO(b)).convert("RGB")
def probe(p):
 d=json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
 s=next(x for x in d["streams"] if x["codec_type"]=="video")
 return {"width":int(s["width"]),"height":int(s["height"]),"duration":float(d["format"]["duration"]),
 "fps":s["avg_frame_rate"],"codec":s["codec_name"]}
with urllib.request.urlopen(urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0"}),timeout=60) as stream,ORIGINAL.open("wb") as f:
 if int(stream.headers.get("Content-Length","0"))>1_100_000_000:raise RuntimeError("Unexpectedly large archival download")
 while True:
  b=stream.read(2**20)
  if not b:break
  f.write(b)
origin=probe(ORIGINAL)
if origin["width"]!=720 or origin["height"]!=576:raise RuntimeError("Unexpected native archive dimensions")
data={"project":"bmw-m5-evolution-001","status":"E34_SIX_REAL_CANDIDATES_REVIEW_REQUIRED","originalSourceUrl":URL,
 "origin":origin,"originalSha256":h(ORIGINAL),"footageApproved":False,
 "E34Warning":"BMW press scene #9 contains all E28/E34/E39/E60. First three cuts show additional cars; later wet slalom cuts have related camera view; do not mark 6 fully distinct.","shots":[]}
sheet=Image.new("RGB",(3*350+4*16,2*(205+34)+3*16),"#131924")
pen=ImageDraw.Draw(sheet)
for i,t in enumerate(TIMES):
 p=ROOT/f"e34-{i+1:02d}.mp4"
 cmd(["ffmpeg","-hide_banner","-v","error","-y","-ss",str(t),"-i",str(ORIGINAL),"-t","0.88",
 "-an","-c:v","libx264","-preset","slow","-crf","14","-pix_fmt","yuv420p","-movflags","+faststart",str(p)],timeout=160)
 cmd(["ffmpeg","-v","error","-xerror","-i",str(p),"-f","null","-"],timeout=100)
 before=capture(p,.12);after=capture(p,.65)
 motion=ImageStat.Stat(ImageChops.difference(before,after).convert("L")).mean[0]
 if motion<=1.6:raise RuntimeError("Lacks measurable moving footage: "+str(i+1))
 item={"slot":i+7,"sourceInSeconds":t,"sourceDurationSeconds":.88,
       "description":DESCRIPTORS[i],"width":720,"height":576,"fps":"25/1",
       "path":str(p),"sha256":h(p),"bytes":p.stat().st_size,"motionMean":round(motion,2),
       "actualDecodeAndMotionPassed":True,"independentCameraAndE34VisualApproval":False}
 data["shots"].append(item)
 x=16+(i%3)*366;y=16+(i//3)*255
 sheet.paste(ImageOps.contain(capture(p,.36),(350,205)),(x,y))
 pen.text((x,y+211),f"Shot {i+7} source {t}s",fill="#ffffff")
 sheet.save(ROOT/"E34-CONTACT.jpg",quality=94)
 (ROOT/"manifest.json").write_text(json.dumps(data,indent=2)+"\n")
 print("PASS",p.name,item["motionMean"],flush=True)
ORIGINAL.unlink()
print("E34 six clips provisionally prepared, each visually needs signoff",flush=True)
