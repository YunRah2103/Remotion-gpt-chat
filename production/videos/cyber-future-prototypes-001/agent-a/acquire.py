#!/usr/bin/env python3
"""Agent A first-pass manufacturer-original footage acquisition and evidence."""
import re,os,json,hashlib,csv,subprocess,sys,html
from pathlib import Path
from urllib.parse import urljoin,urlsplit
import requests
from bs4 import BeautifulSoup
OUT=Path("out/cyber-future-agent-a");(OUT/"clips").mkdir(parents=True,exist_ok=True)
SITES=[
 ("Hyundai N Vision 74 + RN22e","https://www.hyundai.news/eu/articles/press-releases/hyundais-n-brand-unveils-two-rolling-lab-concepts/video.html"),
 ("Hyundai N Vision 74 + RN22e","https://www.hyundai.news/eu/articles/press-releases/hyundai-releases-n-brand-rolling-lab-development-video/video.html"),
 ("Hyundai N Vision 74","https://www.hyundai.news/eu/articles/press-releases/hyundai-n-vision-74-a-ground-breaking-design-50-years-in-the-making/videos.html"),
]
session=requests.Session();session.headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36"
results=[];manifest=[];rejected=[]
def sh(file):
 h=hashlib.sha256()
 with file.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def ffprobe(file):
 q=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(file)],capture_output=True,text=True,timeout=30,check=True)
 d=json.loads(q.stdout);v=next(x for x in d["streams"] if x["codec_type"]=="video")
 meta={"width":v["width"],"height":v["height"],"codec":v["codec_name"],"fps":v.get("avg_frame_rate"),"duration":float(d["format"].get("duration") or 0),"bitrate":d["format"].get("bit_rate"),"audio":any(x["codec_type"]=="audio" for x in d["streams"]),"sha256":sh(file),"bytes":file.stat().st_size}
 assert (v["width"]>=1920 and v["height"]>=1080) or (v["width"]>=1080 and v["height"]>=1920), "below native 1080p"
 q=subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(file),"-t","3","-f","null","-"],capture_output=True,text=True,timeout=60)
 assert q.returncode==0, "decoded video failure "+q.stderr[-250:]
 return meta
def fetch_media(url,file):
 r=session.get(url,stream=True,timeout=(20,85),headers={"Referer":"https://www.hyundai.news/"})
 r.raise_for_status()
 if "text/html" in r.headers.get("Content-Type","").lower():raise ValueError("HTML response, not media")
 total=0
 with file.open("wb") as f:
  for b in r.iter_content(1024*512):
   if not b:continue
   total+=len(b);f.write(b)
   if total>550*1024*1024:raise ValueError("source too big")
 if total<100000:raise ValueError("not full video, only "+str(total)+" bytes")
 if b"ftyp" not in file.open("rb").read(20):raise ValueError("no MP4/MOV signature")
 return r.url
def discover(page,i):
 r=session.get(page,timeout=40);r.raise_for_status();txt=r.text
 (OUT/("html-source-"+str(i)+".html")).write_text(txt)
 soup=BeautifulSoup(txt,"html.parser");found={}
 def add(raw,why):
  if not isinstance(raw,str) or len(raw)>2000:return
  raw=html.unescape(raw).replace("\\/","/")
  if not raw.strip():return
  full=urljoin(page,raw.strip())
  if urlsplit(full).scheme not in ("https","http"):return
  if any(z in full.lower() for z in (".mp4",".mov",".m4v","/download","download?","video-download")):
   found.setdefault(full,set()).add(why)
 for t in soup.find_all(True):
  for attr,v in t.attrs.items():
   if isinstance(v,list):v=" ".join(v)
   if isinstance(v,str) and ("video" in attr or "download" in attr or "file" in attr or ".mp4" in v or ".mov" in v):
    if re.match(r"^(https?://|/|../)",v):add(v,t.name+"."+attr)
 for match in re.findall(r'(?:https?:)?(?:\\/|/){2}[^\\s"\'<>]{6,400}?(?:\\.mp4|\\.mov|\\.m4v)(?:\\?[^\\s"\'<>]{0,200})?',txt,re.I):add(match,"raw_html")
 for match in re.findall(r'[a-z0-9_./-]{4,250}\\.(?:mp4|mov|m4v)(?:\\?[^"\'\\s<>]{0,120})?',txt,re.I):add(match,"relative_html")
 cues=[]
 for term in ["RN22e","N Vision 74","performance film","download","video/mp4","fileUrl"]:
  m=re.search(re.escape(term),txt,re.I)
  if m:cues.append({"term":term,"excerpt":re.sub(r"\s+"," ",txt[max(0,m.start()-140):m.end()+250])})
 urls=[{"url":u,"source":sorted(tags)} for u,tags in found.items()]
 print("PAGE",page,"status",r.status_code,"len",len(txt),"direct_candidates",len(urls),flush=True)
 for v in urls[:15]:print("CANDIDATE",v["url"][:220],flush=True)
 for v in cues[:4]:print("HTML_CUE",v["term"],v["excerpt"][:300],flush=True)
 return {"page":page,"html_length":len(txt),"candidates":urls,"cues":cues}
for i,(model,page) in enumerate(SITES):
 try:
  discovery=discover(page,i);results.append(discovery)
  urls=sorted(discovery["candidates"],key=lambda x:(100 if ".mp4" in x["url"].lower() else 0)+(50 if "hyundai" in x["url"].lower() else 0),reverse=True)
  for j,item in enumerate(urls[:6]):
   file=OUT/"clips"/f"asian_proto_{i+1:02}_{j+1:02}.mp4"
   try:
    source=fetch_media(item["url"],file);meta=ffprobe(file)
    (OUT/"contact_sheets").mkdir(exist_ok=True)
    for k,pct in enumerate([.12,.30,.48,.68,.86]):
     subprocess.run(["ffmpeg","-y","-v","error","-ss",str(max(.1,meta["duration"]*pct)),"-i",str(file),"-frames:v","1","-vf","scale=640:-2",str(OUT/"contact_sheets"/f"{file.stem}_{k}.jpg")],timeout=40)
    entry=dict(meta,file="clips/"+file.name,model_expected=model,model_verified="PENDING_VISUAL_QA",shooting_type="PENDING_VISUAL_QA",source_page=page,source_url=source,credit="Hyundai Motor Company",publication_rights="Unconfirmed; check press terms")
    manifest.append(entry);print("ACQUIRED",file.name,meta,flush=True)
    break
   except Exception as e:
    print("REJECT",item["url"][:160],str(e)[:250],flush=True)
    rejected.append({"url":item["url"],"reason":str(e)[:500]});file.unlink(missing_ok=True)
 except Exception as e:
  print("DISCOVERY_FAILED",page,str(e),flush=True);results.append({"page":page,"error":str(e)})
(OUT/"discovery.json").write_text(json.dumps(results,indent=2))
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2))
(OUT/"rejections.json").write_text(json.dumps(rejected,indent=2))
with (OUT/"manifest.csv").open("w",newline="") as f:
 fields=["file","model_expected","model_verified","width","height","duration","source_page","source_url","sha256"];writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
 for m in manifest:writer.writerow({k:m.get(k) for k in fields})
(OUT/"README_START_HERE.md").write_text("Agent A manufacturer-original acquisition. Real media if under clips/. Model identity and CGI checks PENDING manual inspection. Do not claim final footage PASS based on FFprobe alone.\n")
print("TOTAL VIDEOS ACQUIRED",len(manifest),flush=True)
if not manifest:sys.exit(2)
