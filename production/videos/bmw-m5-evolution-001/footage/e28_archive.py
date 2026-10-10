#!/usr/bin/env python3
"""Research E28 official milestone HD original and prepare frame proofs."""
import urllib.request,urllib.parse,html,re,json,hashlib,subprocess,io
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
R=Path("out/m5-e28-hd");R.mkdir(parents=True,exist_ok=True)
page="https://www.press.bmwgroup.com/global/tv-footage/detail/PF0004717/bmw-group-milestones-milestone-28%3A-bmw-m5?forceSitePreference=DESKTOP"
s=urllib.request.urlopen(urllib.request.Request(page,headers={"User-Agent":"Mozilla/5.0"}),timeout=50).read().decode("utf8","replace")
links=[html.unescape(urllib.parse.urljoin(page,x)) for x in re.findall(r'href=["\']([^"\']*tvFootageDownload[^"\']*)["\']',s,re.I)]
d={"project":"m5-e28-hd","status":"RESEARCH_NOT_REVIEWED","sourcePage":page,"videoSources":[]}
for kind in ("tvFootageSceneHD","tvFootageScenePreviewH264"):
 selected=[];ids=set()
 for x in links:
  if kind not in x:continue
  q=urllib.parse.parse_qs(urllib.parse.urlsplit(x).query);key=(q.get("filmSceneFileId") or q.get("filmSceneId") or [""])[0]
  if key and key not in ids:ids.add(key);selected.append(x)
 print(kind,"SCENES",len(selected),flush=True)
 if len(selected)<2:continue
 url=selected[1];p=R/("e28-driving-hd.mov" if kind=="tvFootageSceneHD" else "e28-driving-low.mp4")
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=45) as src,p.open("wb") as f:
   length=int(src.headers.get("Content-Length","0"));print("LENGTH",length,"TYPE",src.headers.get("Content-Type"),flush=True)
   cap=400*1024*1024 if kind=="tvFootageSceneHD" else 100*1024*1024
   if length>cap:raise ValueError("source exceeds cap")
   n=0
   while True:
    b=src.read(2**20)
    if not b:break
    n+=len(b)
    if n>cap:raise ValueError("exceeded cap")
    f.write(b)
  probe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
  v=next(x for x in probe["streams"] if x["codec_type"]=="video")
  dur=float(probe["format"]["duration"])
  item={"url":url,"file":str(p),"sha256":hashlib.sha256(p.read_bytes()).hexdigest(),"codec":v["codec_name"],"width":v["width"],"height":v["height"],"fps":v["avg_frame_rate"],"duration":dur,"bytes":p.stat().st_size}
  frames=[]
  for i in range(30):
   t=(i+.5)*dur/30
   data=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(p),"-frames:v","1","-vf","scale=400:-2","-f","image2pipe","-vcodec","mjpeg","-"],capture_output=True,check=True,timeout=50).stdout
   frames.append((t,Image.open(io.BytesIO(data)).convert("RGB")))
  w,h,g,cols=240,150,10,6
  sheet=Image.new("RGB",(cols*(w+g)+g,5*(h+30+g)+g),"#101820");pen=ImageDraw.Draw(sheet)
  for i,(t,img) in enumerate(frames):
   x=g+(i%cols)*(w+g);y=g+(i//cols)*(h+30+g)
   sheet.paste(ImageOps.contain(img,(w,h)),(x,y));pen.text((x,y+h+5),f"BMW M5 {t:.1f}s",fill="white")
  sheet.save(R/(p.stem+"-contacts.jpg"),quality=92)
  item["contact"]=str(R/(p.stem+"-contacts.jpg"));d["videoSources"].append(item)
  d["status"]="ACQUIRED_NOT_IDENTITY_VERIFIED"
  print("OK",item["width"],item["height"],item["duration"],flush=True)
  break
 except Exception as e:
  print("FAIL",repr(e),flush=True)
  if p.exists():p.unlink()
(R/"manifest.json").write_text(json.dumps(d,indent=2)+"\n")
