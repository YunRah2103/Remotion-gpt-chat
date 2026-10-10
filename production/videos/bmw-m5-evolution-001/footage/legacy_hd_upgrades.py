#!/usr/bin/env python3
"""Native archival upgrade: fetch genuine highest-res BMW PressClub MOVs, extract only reviewed segment candidates."""
import hashlib,html,io,json,re,subprocess,urllib.parse,urllib.request
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
ROOT=Path("out/m5-legacy-hd");ROOT.mkdir(parents=True,exist_ok=True)
WORK=Path("/tmp/m5hi");WORK.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {"generation":"E34","scene":9,"id":"e34-hd-formation","page":"https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2",
  "seconds":[262.1,266.5,275.0,310.5,346.2,393.4]},
 {"generation":"E39","scene":10,"id":"e39-hd-nurburgring","page":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0003267/der-neue-bmw-m5?language=en",
  "seconds":[8.5,26.6,98.1,294.5,366.1,419.5]},
 {"generation":"E60","scene":3,"id":"e60-hd-tracking","page":"https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2",
  "seconds":[14.0,210.5,266.5,490.5,575.5,631.5]}
]
report={"status":"HIGHER_NATIVE_RESOLUTION_CANDIDATES_UNVERIFIED_VISUALLY","sources":[]}
def call(args,timeout=180):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout).stdout
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(2**20),b""):h.update(b)
 return h.hexdigest()
def link(page,scene):
 req=urllib.request.Request(page,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=50) as r:txt=r.read(4_000_000).decode("utf8","replace")
 urls=[html.unescape(urllib.parse.urljoin(page,u)) for u in re.findall(r'href=["\']([^"\']*tvFootageDownload[^"\']*)["\']',txt,re.I)]
 seen=set();ordered=[]
 for u in urls:
  if "tvFootageSceneHD" not in u:continue
  q=urllib.parse.parse_qs(urllib.parse.urlsplit(u).query)
  k=(q.get("filmSceneFileId") or [""])[0]
  if k and k not in seen:ordered.append(u);seen.add(k)
 if len(ordered)<scene:raise RuntimeError("HighRes scene not found: "+str(scene)+"/"+str(len(ordered)))
 return ordered[scene-1]
def download(url,p,limit=1_800_000_000):
 n=0
 with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=50) as r,p.open("wb") as f:
  if "text/html" in r.headers.get("Content-Type",""):raise RuntimeError("HTML rather than video")
  if int(r.headers.get("Content-Length",0))>limit:raise RuntimeError("File larger than per-source cap")
  while True:
   b=r.read(2**20)
   if not b:break
   n+=len(b)
   if n>limit:raise RuntimeError("Exceeded byte cap")
   f.write(b)
 if n<100000:raise RuntimeError("No media")
def meta(p):
 d=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
 v=next(s for s in d["streams"] if s["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"fps":v["avg_frame_rate"],"duration":float(d["format"]["duration"])}
def frame(p,t):
 b=subprocess.run(["ffmpeg","-v","error","-ss",str(t),"-i",str(p),"-frames:v","1","-vf","scale=350:-2","-vcodec","mjpeg","-f","image2pipe","-"],capture_output=True,check=True,timeout=60).stdout
 return Image.open(io.BytesIO(b)).convert("RGB")
for spec in SOURCES:
 entry={"id":spec["id"],"generation":spec["generation"],"sourcePage":spec["page"],"status":"FAILED"}
 original=WORK/(spec["id"]+".mov")
 try:
  url=link(spec["page"],spec["scene"])
  entry["download"]=url
  print("GET",spec["id"],url,flush=True)
  download(url,original)
  info=meta(original);entry.update(info);entry["originalSHA256"]=sha(original)
  # Preserve genuinely reported original native dimensions, never upsample low-resolution masters.
  clips=[]
  for i,t in enumerate(spec["seconds"],1):
   p=ROOT/(spec["generation"].lower()+"-"+str(i).zfill(2)+".mp4")
   call(["ffmpeg","-hide_banner","-v","error","-y","-ss",str(t),"-i",str(original),
          "-t","0.82","-an","-c:v","libx264","-preset","medium","-crf","14",
          "-pix_fmt","yuv420p","-movflags","+faststart",str(p)],timeout=130)
   call(["ffmpeg","-v","error","-xerror","-i",str(p),"-f","null","-"],timeout=90)
   clips.append({"file":str(p),"sourceInSeconds":t,"sha256":sha(p),"bytes":p.stat().st_size})
  w,h,g=280,158,10;sheet=Image.new("RGB",(3*(w+g)+g,2*(h+30+g)+g),"#0c131d");d=ImageDraw.Draw(sheet)
  for i,x in enumerate(clips):
   im=frame(Path(x["file"]),.35)
   a=g+(i%3)*(w+g);b=g+(i//3)*(h+30+g)
   sheet.paste(ImageOps.contain(im,(w,h)),(a,b));d.text((a,b+h+5),spec["generation"]+"-"+str(i+1),fill="white")
  sheet.save(ROOT/(spec["id"]+"-contact.jpg"),quality=92)
  entry["clips"]=clips;entry["status"]="SIX_ACTUAL_NATIVE_HIGHRES_EXCERPTS_READY_FOR_VISUAL_REVIEW"
  print("DONE",spec["id"],info["width"],info["height"],flush=True)
 except Exception as e:
  entry["error"]=repr(e)[:500];print("FAILED",spec["id"],entry["error"],flush=True)
 finally:
  if original.exists():original.unlink()
 report["sources"].append(entry);(ROOT/"manifest.json").write_text(json.dumps(report,indent=2)+"\n")
