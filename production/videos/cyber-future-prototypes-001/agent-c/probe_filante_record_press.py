#!/usr/bin/env python3
"""Investigate OFFICIAL Renault Swiss press site's Dec-2025 Filante track film.
Real original bytes and 1080p decode required before editorial acceptance.
Use only public URLs; refuse access restricted or lower native resolution.
"""
import hashlib, html, json, re, subprocess, time, urllib.parse
from pathlib import Path
import requests
from bs4 import BeautifulSoup

ROOT=Path("out/filante_record_press"); ROOT.mkdir(parents=True,exist_ok=True)
SITES=[
 "https://media.renault.ch/de/101/article/22079",
 "https://media.renault.ch/fr/101/article/22079",
]
VIDEO_EXT=(".mp4",".mov",".m3u8",".webm",".m4v")
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
session=requests.Session()
session.headers.update({"User-Agent":UA,"Accept-Language":"en-US,en;q=0.8"})
def sha(f):
 h=hashlib.sha256()
 with open(f,"rb") as handle:
  for block in iter(lambda:handle.read(1048576),b""):h.update(block)
 return h.hexdigest()
def grab(url,timeout=35):
 r=session.get(url,timeout=timeout)
 r.raise_for_status()
 return r
def extract_urls(page,body):
 soup=BeautifulSoup(body,"html.parser");found=set()
 for el in soup.find_all(True):
  for key in ("href","src","data-src","data-url","data-file","data-video","data-download","poster"):
   val=el.get(key)
   if val and isinstance(val,str) and not val.startswith(("javascript:","#","data:")):
    url=urllib.parse.urljoin(page,html.unescape(val))
    if url.startswith("https://"):found.add(url)
 for a in re.findall(r"https?:[^\\\"'<>\\s]{7,700}",body):
  a=html.unescape(a).replace("\\/","/")
  if a.startswith("https://"):found.add(a)
 for a in re.findall(r'(?i)(?:src|href)\\s*[:=]\\s*[\\\"\\\']([^\\\"\\\']+)',body):
  if not a.startswith(("javascript:","#","data:")):found.add(urllib.parse.urljoin(page,html.unescape(a)))
 return sorted(found)
def inspect_candidate(url):
 out={"url":url}
 try:
  h=session.head(url,allow_redirects=True,timeout=15)
  out.update({"status":h.status_code,"content_type":h.headers.get("content-type"),
    "content_length":h.headers.get("content-length"),"resolved":h.url})
  if h.status_code not in (200,206):return out
  # Never blindly fetch huge or inappropriate URLs.
  clen=int(h.headers.get("content-length") or 0)
  typ=h.headers.get("content-type","").lower()
  if not (url.lower().split("?")[0].endswith((".mp4",".mov",".m4v")) or "video/" in typ):return out
  if clen>240*1024*1024:return out
  destination=ROOT/"FILANTE_RECORD_2025_UNREVIEWED_ORIGINAL.mp4"
  with session.get(url,stream=True,timeout=35) as r:
   r.raise_for_status();n=0
   with destination.open("wb") as f:
    for block in r.iter_content(1048576):
     n+=len(block)
     if n>240*1024*1024:raise RuntimeError("Exceeded 240MB max")
     f.write(block)
  cmd=["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(destination)]
  p=subprocess.run(cmd,capture_output=True,text=True,timeout=25)
  if p.returncode:raise RuntimeError("FFprobe:"+p.stderr[-150:])
  meta=json.loads(p.stdout);v=next(x for x in meta["streams"] if x.get("codec_type")=="video")
  out["ffprobe"]={"w":v["width"],"h":v["height"],"fps":v.get("avg_frame_rate"),
                  "duration":float(meta["format"]["duration"]),"bytes":n,"sha256":sha(destination)}
  if v["width"]<1920 or v["height"]<1080:
   out["REJECT"]="native resolution below contract";destination.unlink();return out
  duration=out["ffprobe"]["duration"]
  p=subprocess.run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(destination),"-map","0:v:0","-f","null","-"],timeout=min(230,max(90,round(duration*4))),capture_output=True,text=True)
  if p.returncode:out["REJECT"]="decoder error:"+p.stderr[-200:];return out
  for i,fraction in enumerate((.1,.25,.4,.55,.7,.85),1):
   subprocess.run(["ffmpeg","-nostdin","-v","error","-ss",str(round(duration*fraction,2)),
     "-i",str(destination),"-frames:v","1","-vf","scale=960:-2","-y",str(ROOT/f"filante_frame{i}.jpg")],timeout=30,check=True)
  out["candidate_ready_for_human_visual_review"]=True
 except Exception as e:
  out["error"]=str(e)[:280]
 return out
def main():
 report={"timestamp_utc":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
   "sources":SITES,"page_inspection":[],"candidate_results":[],
   "acceptance":"NONE until photo authenticity/motion independently visually checked"}
 candidates=set()
 for page in SITES:
  info={"url":page}
  try:
   r=grab(page);info["status"]=r.status_code;info["page_bytes"]=len(r.content)
   (ROOT/("page_"+str(len(report["page_inspection"])+1)+".html")).write_text(r.text[:300000])
   links=extract_urls(page,r.text)
   urls=[x for x in links if any(k in x.lower() for k in ("video","download","media","filante",".mp4",".mov",".m3u8"))]
   info["relevant_links"]=urls[:120]
   # Search explanatory HTML around clues rather than assume all links are video.
   keywords=[m.start() for m in re.finditer(r"(?i)download|mp4|video|filante",r.text)]
   info["snippets"]=[r.text[max(0,i-160):i+220] for i in keywords[-40:]]
   for link in urls:
    if any(ext in link.lower().split("?")[0] for ext in VIDEO_EXT):candidates.add(link)
  except Exception as e:info["error"]=str(e)[:300]
  report["page_inspection"].append(info)
 for candidate in sorted(candidates)[:6]:
  result=inspect_candidate(candidate);report["candidate_results"].append(result)
  if result.get("candidate_ready_for_human_visual_review"):break
 (ROOT/"PRESS_AUDIT.json").write_text(json.dumps(report,indent=2))
 (ROOT/"README.md").write_text(
 "# Renault Filante Record 2025 / second model PUBLIC SOURCE probe\n\n"+
 "Official Renault Swiss press report confirms physical 2025 on-track endurance record, but this folder is DIAGNOSTIC ONLY. "+
 "No candidate is approved until native >=1920x1080, complete FFmpeg decoder QA, actual frames and photographed real-car motion are verified. "+
 "Publisher media copying/derivative/publication permission cannot be assumed.\n")
 print("FILANTE_PRESS_RESULT",json.dumps({"pages":len(report["page_inspection"]),
    "direct_candidates":len(candidates),"downloaded_hd":any(x.get("candidate_ready_for_human_visual_review") for x in report["candidate_results"]),
    "links_found":[len(x.get("relevant_links",[])) for x in report["page_inspection"]],
    "errors":[x.get("error") for x in report["page_inspection"]]}),flush=True)
if __name__=="__main__":main()
