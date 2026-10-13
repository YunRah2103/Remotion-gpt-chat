#!/usr/bin/env python3
"""A2 source-specific *ephemeral* technical acquisition audit.
Never uploads a third-party MP4 or source frames; source rights remain press-only.
"""
import hashlib, json, os, re, subprocess, time, traceback
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

OUT=Path("a2_audit"); OUT.mkdir(exist_ok=True)
SOURCES=[
 {"key":"audi_mythos_black_2023",
  "page":"https://audi-mediacenter.pl/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html",
  "rights":"AUDI AG — journalist use only; NO public redistribution or YUNEX commercial rights established",
  "expect":"genuine C8 RS 6 Avant performance, Mythos Black; may be press footage"},
 {"key":"audi_rs6_emotions",
  "page":"https://audi-mediacenter.pl/modele,audi-a6,audi-rs-6-avant.html",
  "rights":"AUDI AG — no YUNEX commercial or public GitHub redistribution permission",
  "expect":"press-page discovery only; may contain multiple car generations"},
]
HEADERS={"User-Agent":"Mozilla/5.0 (compatible; YUNEX-A2-TechnicalReview/1.0)","Accept":"text/html,video/mp4,*/*"}
def exe(*cmd,timeout=240):
 p=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
 return {"returncode":p.returncode,"stdout":p.stdout[-15000:],"stderr":p.stderr[-1800:]}
def get_sources(page):
 r=requests.get(page,headers=HEADERS,timeout=25)
 r.raise_for_status()
 soup=BeautifulSoup(r.text,"html.parser")
 anchors=[]
 for a in soup.find_all("a",href=True):
  h=a.get("href","").strip()
  label=" ".join(a.stripped_strings)
  if not h or h.startswith(("javascript:","#","mailto:")): continue
  u=urljoin(r.url,h)
  if label.strip().upper().startswith("MP4") or re.search(r"\.(mp4|mov)(\?|$)",u,re.I) or ("download" in u and "film" in u):
   anchors.append({"label":label[:130],"url":u})
 # explicit source video tags
 for v in soup.find_all(["video","source"]):
  if v.get("src"): anchors.append({"label":"video src","url":urljoin(r.url,v["src"])})
 return r, list({a["url"]:a for a in anchors}.values())
def download(u,path):
 start=time.time(); last=""
 with requests.get(u,headers=HEADERS,stream=True,allow_redirects=True,timeout=(15,55)) as r:
  r.raise_for_status()
  ct=r.headers.get("Content-Type","")
  lim=160*1024*1024
  n=0
  with open(path,"wb") as f:
   for chunk in r.iter_content(chunk_size=256*1024):
    if not chunk: continue
    n+=len(chunk)
    if n>lim: raise ValueError("max 160MiB safety cap")
    if time.time()-start>160: raise TimeoutError("max 160s safety cap")
    f.write(chunk)
  return {"content_type":ct,"bytes":n,"final_url":r.url}
report={"agent":"A2","run":"ephemeral_in_runner_no_media_upload","starts_utc":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"sources":[]}
for src in SOURCES:
 d=dict(src); report["sources"].append(d)
 try:
  res,anchors=get_sources(src["page"])
  d["page_http"]=res.status_code; d["page_title"]=BeautifulSoup(res.text,"html.parser").title.get_text(" ",strip=True)[:120] if BeautifulSoup(res.text,"html.parser").title else None
  d["candidate_links"]=anchors[:12]
  if src["key"]!="audi_mythos_black_2023":
   d["outcome"]="discovery_only_no_download"; continue
  for i,a in enumerate(anchors[:4]):
   f=OUT/("ephemeral_%d.mp4"%i)
   attempt={"source_link":a}
   d.setdefault("attempts",[]).append(attempt)
   try:
    met=download(a["url"],f)
    attempt.update(met)
    if f.stat().st_size<1000000 or b"ftyp" not in f.open("rb").read(48): 
     attempt["rejected"]="not an actual MP4 or <1MiB"; f.unlink(missing_ok=True); continue
    attempt["sha256"]=hashlib.sha256(f.read_bytes()).hexdigest()
    probe=exe("ffprobe","-v","error","-show_entries","format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate","-of","json",str(f),timeout=50)
    attempt["ffprobe_exit"]=probe["returncode"]; attempt["ffprobe"]=json.loads(probe["stdout"]) if probe["returncode"]==0 else probe["stderr"]
    if probe["returncode"]==0:
     dec=exe("ffmpeg","-hide_banner","-v","error","-i",str(f),"-map","0:v:0","-f","null","-",timeout=240)
     attempt["full_video_decode_exit"]=dec["returncode"]; attempt["full_decode_stderr_tail"]=dec["stderr"][-800:]
     try:
      info=attempt["ffprobe"]; video=next(s for s in info["streams"] if s.get("codec_type")=="video")
      if video.get("width",0)>=1920 and video.get("height",0)>=1080: attempt["native_HD_gate"]="passes"
      else: attempt["native_HD_gate"]="reject_sub_1080p"
      dur=float(info.get("format",{}).get("duration",0))
      for j,t in enumerate([max(0,dur*x) for x in (0.13,0.47,0.81)]):
       sample=OUT/("private_frame_%d_%d.jpg"%(i,j))
       cap=exe("ffmpeg","-loglevel","error","-ss","%.2f"%t,"-i",str(f),"-frames:v","1","-vf","scale=512:-2",str(sample),"-y",timeout=30)
       attempt.setdefault("ephemeral_visual_qa",[]).append({"at_second":round(t,2),"decoded":cap["returncode"]==0})
       sample.unlink(missing_ok=True)
     except Exception as e: attempt["frame_qa_error"]=str(e)
    d["outcome"]="downloaded_and_audited_ephemeral"; f.unlink(missing_ok=True); break
   except Exception as e:
    attempt["error"]=repr(e); f.unlink(missing_ok=True)
  if "outcome" not in d: d["outcome"]="no_playable_mp4_acquired"
 except Exception as e:
  d["error"]=repr(e);d["traceback_tail"]=traceback.format_exc()[-800:]
report["finishes_utc"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
(OUT/"report.json").write_text(json.dumps(report,indent=2))
(OUT/"RIGHTS_AND_LIMITS.txt").write_text(
 "A2 acquisition QA only. Press footage on Audi Poland is free solely for journalistic uses.\n"
 "No footage, derived source frames or sound are released to GitHub artifacts.\n"
 "A successful download here is NOT editor-deliverable or redistribution authorisation.\n"
 "Need a separate cleared source and manual visual QA before final accept.\n")
print(json.dumps(report,indent=2))
