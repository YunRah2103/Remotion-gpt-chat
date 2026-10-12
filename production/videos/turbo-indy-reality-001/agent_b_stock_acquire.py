#!/usr/bin/env python3
"""Agent B actual original-file stock footage search; fail closed if none genuine/decodable.
Candidate contents require manual IndyCar identity and camera QA before promotion.
"""
import os,urllib.parse,urllib.request,hashlib,subprocess,json,pathlib,zipfile,base64
O=pathlib.Path("out/agent-b-stock");Q=O/"qa";Q.mkdir(parents=True,exist_ok=True)
def req(url,headers=None):
 return urllib.request.urlopen(urllib.request.Request(url,headers=headers or {"User-Agent":"YUNEX/1.0"}),timeout=45)
def get_json(url,headers=None):
 with req(url,headers) as r:return json.load(r)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for part in iter(lambda:f.read(1024*1024),b""):h.update(part)
 return h.hexdigest()
def ff(*args):
 p=subprocess.run(args,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr[-1000:])
 return p.stdout
def dl(url,path):
 with req(url) as resp,path.open("wb") as dst:
  if resp.status!=200:raise RuntimeError("HTTP "+str(resp.status))
  if resp.headers.get("Content-Type","").lower().startswith("text/"):raise RuntimeError("text response, not video")
  while True:
   b=resp.read(1024*1024)
   if not b:break
   dst.write(b)
   if dst.tell()>95000000:raise RuntimeError("Clip too large")
 if path.stat().st_size<120000:raise RuntimeError("Too few actual media bytes")
report={"clips":[],"failures":[],"searches":[],"constraints":"Actual sports events only; do NOT promote clips to matched IndyCar without visual inspection"}
candidates=[]
pexels=os.getenv("PEXELS_API_KEY","").strip()
pix=os.getenv("PIXABAY_API_KEY","").strip()
print("API_KEY_AVAILABILITY","PEXELS",bool(pexels),"PIXABAY",bool(pix),flush=True)
if pexels:
 for query in ("indycar race","indy car","indianapolis 500"):
  try:
   data=get_json("https://api.pexels.com/videos/search?"+urllib.parse.urlencode({"query":query,"per_page":25,"orientation":"landscape"}),{"Authorization":pexels,"User-Agent":"YUNEX/1.0"})
   vids=data.get("videos",[]);report["searches"].append({"provider":"pexels","query":query,"count":len(vids)})
   for v in vids:
    arr=[f for f in v.get("video_files",[]) if int(f.get("width") or 0)>=1920 and int(f.get("height") or 0)>=1080 and (f.get("file_type","").startswith("video/mp4"))]
    arr.sort(key=lambda f:((f.get("width") or 0),int(f.get("height") or 0)),reverse=True)
    if arr:
     candidates.append({"id":"PEX-"+str(v["id"]),"provider":"pexels","page":v.get("url"),"query":query,"author":v.get("user",{}).get("name"),"url":arr[-1].get("link"),"rights":"Pexels content license; verify footage rights and third-party sports trademarks/organizer clearance","meta_width":arr[-1].get("width"),"meta_height":arr[-1].get("height")})
  except Exception as ex:report["failures"].append({"provider":"pexels","query":query,"error":str(ex)})
if pix:
 for query in ("indycar","indy 500"):
  try:
   data=get_json("https://pixabay.com/api/videos/?"+urllib.parse.urlencode({"key":pix,"q":query,"per_page":30,"safesearch":"true"}))
   vids=data.get("hits",[]);report["searches"].append({"provider":"pixabay","query":query,"count":len(vids)})
   for v in vids:
    full=v.get("videos",{}).get("large") or v.get("videos",{}).get("medium") or {}
    if full.get("width",0)>=1920 and full.get("height",0)>=1080:
     candidates.append({"id":"PIX-"+str(v["id"]),"provider":"pixabay","page":v.get("pageURL"),"query":query,"author":v.get("user"),"url":full["url"],"rights":"Pixabay content license; license excludes standalone resale and may not clear depicted event rights","meta_width":full["width"],"meta_height":full["height"],"tags":v.get("tags")})
  except Exception as ex:report["failures"].append({"provider":"pixabay","query":query,"error":str(ex)})
# All sources below should actually be 1080p, real footage, verified by decoded frames.
seen=set();selected=[]
for v in candidates:
 if v["id"] not in seen:
  seen.add(v["id"]);selected.append(v)
(Q/"candidate_catalog.json").write_text(json.dumps(selected,indent=2))
print("CATALOG_SIZE",len(selected),"SEARCHES",json.dumps(report["searches"]),flush=True)
for item in selected[:8]:
 p=O/(item["id"]+".mp4")
 try:
  dl(item["url"],p)
  data=json.loads(ff("ffprobe","-v","error","-of","json","-show_streams","-show_format",str(p)))
  v=next(s for s in data["streams"] if s["codec_type"]=="video")
  if v["width"]<1920 or v["height"]<1080:raise RuntimeError("Non1080 native. Reject, do not upscale")
  sec=float(data["format"]["duration"])
  ff("ffmpeg","-v","error","-i",str(p),"-vf","fps=1/4,scale=320:-2","-f","null","-")
  sheet=Q/(item["id"]+"-contact.jpg")
  ff("ffmpeg","-nostdin","-y","-v","error","-i",str(p),"-vf","fps=1/4,scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2,tile=4x3:padding=5","-frames:v","1","-q:v","5",str(sheet))
  # logs show composite for human identity inspection.
  tiny=Q/(item["id"]+"-tiny.jpg")
  ff("ffmpeg","-nostdin","-y","-v","error","-i",str(sheet),"-vf","scale=900:-2","-frames:v","1","-q:v","10",str(tiny))
  print("CONTACT_"+item["id"]+"="+base64.b64encode(tiny.read_bytes()).decode(),flush=True)
  it=dict(item,actual_width=v["width"],actual_height=v["height"],fps=v.get("avg_frame_rate"),codec=v.get("codec_name"),seconds=sec,sha256=sha(p),bytes=p.stat().st_size,status="actual downloaded and FFmpeg decoded; IndyCar identity NOT YET VISUALLY APPROVED")
  report["clips"].append(it)
  print("PASS_CANDIDATE",item["id"],it["actual_width"],it["actual_height"],round(sec,2),flush=True)
 except Exception as ex:
  print("FAIL_CANDIDATE",item["id"],str(ex),flush=True)
  report["failures"].append({"source":item["id"],"error":str(ex)})
  if p.exists():p.unlink()
(Q/"manifest.json").write_text(json.dumps(report,indent=2))
with zipfile.ZipFile("out/agent-b-stock-originals.zip","w",zipfile.ZIP_STORED) as z:
 for p in O.rglob("*"):
  if p.is_file():z.write(p,p.relative_to(O))
print("DOWNLOAD_COUNTS",len(report["clips"]),"CATALOG",len(selected),flush=True)
if not report["clips"]:raise SystemExit("No actual HD clips acquired (or APIs unavailable)")
