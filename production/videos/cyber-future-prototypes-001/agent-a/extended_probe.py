#!/usr/bin/env python3
"""Bounded manufacturer press VIDEO research. No approved shots until manual visual QA."""
import requests,subprocess,json,re,hashlib,time
from urllib.parse import urljoin, urlparse
from pathlib import Path
from bs4 import BeautifulSoup
P=Path("out/agent-a-extended-probe");(P/"candidate_media").mkdir(parents=True,exist_ok=True);(P/"frames").mkdir(exist_ok=True)
S=requests.Session();S.headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
PAGES=[
("Hyundai Prophecy physical concept","https://www.hyundai.news/uk/articles/press-releases/hyundai-motor-unveils-prophecy-concept-ev.html"),
("Hyundai Concept THREE physical IAA concept","https://www.hyundai.news/eu/articles/press-releases/hyundai-debuts-concept-three-at-iaa-mobility-2025.html"),
("Hyundai INSTEROID physical Seoul launch","https://www.hyundai.news/uk/articles/press-releases/rev-up-with-insteroid-hyundai-motors-gaming-inspired-concept-car-debuts-in-seoul.html"),
("Hyundai N Vision 74 design documentary","https://www.hyundai.news/eu/articles/press-releases/hyundai-n-vision-74-a-ground-breaking-design-50-years-in-the-making.html"),
("Hyundai N labs development film","https://www.hyundai.news/eu/articles/press-releases/hyundai-releases-n-brand-rolling-lab-development-video.html"),
("Hyundai N Vision 74 Goodwood debut","https://www.hyundai.news/eu/articles/press-releases/hyundais-ioniq-5-n-debuts-at-goodwood-festival-of-speed.html"),
("Hyundai 2023 Pony Coupe concept physical reveal","https://www.hyundai.news/uk/articles/press-releases/hyundai-pony-coupe-concept-restored-after-50-years.html"),
("Hyundai INSTEROID at gamescom","https://www.hyundai.news/eu/articles/press-releases/hyundai-motor-brings-retro-arcade-fun-with-insteroid-concept-car-to-gamescom-2025.html"),
("Genesis X Gran Berlinetta physical studio film","https://www.genesis.com/us/en/genesis-x-gran-berlinetta-concept"),
("Genesis X Gran Berlinetta press","https://www.genesisnewseurope.com/english/gran-berlinetta"),
("Mazda ICONIC SP official Mazda USA MP4","https://news.mazdausa.com/vehicles-iconic-sp-concept"),
("Mazda ICONIC SP Japan press release","https://newsroom.mazda.com/en/publicity/release/2023/202310/231025a.html"),
]
def check(path):
 j=json.loads(subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],capture_output=True,text=True,check=True,timeout=30).stdout)
 v=next(s for s in j["streams"] if s["codec_type"]=="video");f=j["format"]
 return {"width":v["width"],"height":v["height"],"codec":v["codec_name"],"duration":float(f.get("duration") or 0),"size":int(f.get("size") or 0),"bitrate":f.get("bit_rate"),"fps":v.get("avg_frame_rate"),"sha256":hashlib.sha256(path.read_bytes()).hexdigest()}
def urls(html,base):
 soup=BeautifulSoup(html,"html.parser")
 u=set()
 for t in soup.find_all(True):
  for k,v in t.attrs.items():
   if isinstance(v,list):v=" ".join(v)
   if not isinstance(v,str):continue
   if len(v)>2500:continue
   if k in ("data-video-file","data-id","data-video-src","src","href","data-src","content","poster","data-url","data-video") or "mp4" in v:
    if re.search(r"\.(?:mp4|mov|m4v|webm)(?:[?&#/]|$)",v,re.I):
     u.add(urljoin(base,v.strip()))
 u.update(re.findall(r'https?:[^"\'<>\s\\]{5,300}\.(?:mp4|mov|m4v)(?:\?[^"\'<>\s\\]*)?',html,re.I))
 return sorted(x for x in u if urlparse(x).scheme=="https" and not any(z in x for z in ("youtube","youtu.be")))
def grab(url,stem):
 path=P/"candidate_media"/(stem+".mp4")
 with S.get(url,stream=True,timeout=(16,95)) as r:
  r.raise_for_status();ctype=r.headers.get("Content-Type","")
  if "text/html" in ctype:raise ValueError("html response")
  size=0
  with path.open("wb") as out:
   for b in r.iter_content(1<<20):
    if not b:continue
    size+=len(b)
    if size>260_000_000:raise ValueError("max 260MB")
    out.write(b)
 if size<300000:raise ValueError("tiny/no video")
 m=check(path)
 if m["width"]<1920 or m["height"]<1080:raise ValueError(f"below required resolution: {m['width']}x{m['height']}")
 if not 1<m["duration"]<240:raise ValueError("bad duration")
 for j,frac in enumerate((.06,.16,.28,.42,.58,.73,.86,.95)):
  f=P/"frames"/(stem+f"_F{j:02}.jpg")
  subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(m["duration"]*frac),"-i",str(path),"-frames:v","1","-vf","scale=480:-2",str(f)],capture_output=True,text=True,timeout=30)
 return m
found=[];selected=0;hashes=set()
for i,(label,page) in enumerate(PAGES):
 try:
  r=S.get(page,timeout=(12,30));r.raise_for_status()
  h=r.text
  variants=[(r.url,h)]
  if "hyundai.news" in page:
   for suffix in ("/video.html","/videos.html"):
    target=r.url.split("?")[0].removesuffix(".html")+suffix
    try:
     v=S.get(target,timeout=(10,22))
     if v.status_code==200:variants.append((v.url,v.text))
    except Exception as e:pass
  items=[]
  for src,body in variants:
   for u in urls(body,src):items.append((src,u))
  if "Mazda ICONIC SP official Mazda USA MP4" in label:
   items.insert(0,(page,"https://mmx.prnewswire.com/media/MS1808399/20231024_mazda_360D.mp4?p=download"))
  seen=set();items=[(src,u) for src,u in items if not(u in seen or seen.add(u))]
  print("SCAN",label,r.status_code,"variants",len(variants),"videos",len(items),flush=True)
  record={"label":label,"page":page,"variants":[x[0] for x in variants],"video_urls":[x[1] for x in items],"outcomes":[]}
  for k,(src,u) in enumerate(items[:5]):
   if selected>=7:break
   try:
    stem=f"source_{i:02}_{k:02}"
    m=grab(u,stem)
    if m["sha256"] in hashes:
     (P/"candidate_media"/(stem+".mp4")).unlink()
     record["outcomes"].append({"url":u,"result":"duplicate","sha256":m["sha256"]});continue
    hashes.add(m["sha256"]);selected+=1
    record["outcomes"].append({"url":u,"result":"DOWNLOADED_PENDING_VISUAL_QA","file":stem+".mp4","metadata":m})
    print("VIDEO_OK",label,m,flush=True)
   except Exception as e:
    (P/"candidate_media"/(f"source_{i:02}_{k:02}.mp4")).unlink(missing_ok=True)
    record["outcomes"].append({"url":u,"error":str(e)[:240]})
    print("VIDEO_FAIL",label,str(e)[:200],flush=True)
  found.append(record)
 except Exception as e:
  print("PAGE_FAIL",label,str(e)[:200],flush=True)
  found.append({"page":page,"label":label,"error":str(e)})
(P/"research_report.json").write_text(json.dumps({"selected_candidate_video_count":selected,"sources":found},indent=2))
(P/"README.txt").write_text("PROBE: file presence and resolution are NOT approval. Inspect all frames for live-action physical prototype, footage uniqueness, camera motion and red flags. Do not merge unreviewed clips into final Agent A.\\n")
print("ALL_DISCOVERY_COMPLETE",selected,flush=True)
