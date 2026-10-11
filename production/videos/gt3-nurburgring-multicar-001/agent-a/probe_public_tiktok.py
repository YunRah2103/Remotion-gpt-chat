#!/usr/bin/env python3
"""Probe an unauthenticated public TikTok search mirror for individual motorsport posts.

Only attempts publicly returned downloadable media; FFprobe rejects <1080 native. 
No login, cookies, credential bypass, account access or false resolution claims.
"""
import json,hashlib,subprocess,re
from pathlib import Path
import requests
O=Path("out/gt3-tiktok-public");O.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers["User-Agent"]="Mozilla/5.0 (compatible; YUNEX-media/1.0)"
terms=["24h nurburgring gt3","nürburgring gt3 race","bmw porsche nurburgring 24h","24hNBR 2026"]
bases=["https://www.tikwm.com/api/feed/search","https://tikwm.com/api/feed/search"]
recs=[];candidates=[]
for term in terms:
 for url in bases:
  try:
   r=S.get(url,params={"keywords":term,"count":20,"cursor":0},timeout=10)
   data=r.json()
   videos=data.get("data",{}).get("videos",[]) if isinstance(data.get("data"),dict) else []
   recs.append({"search":term,"endpoint":url,"status":r.status_code,"code":data.get("code"),"videos":len(videos),"response_bytes":len(r.content),"message":str(data.get("msg",""))[:250]})
   for v in videos:
    vid=str(v.get("video_id") or v.get("aweme_id") or v.get("id") or "")
    if not vid or vid in {x["id"] for x in candidates}:continue
    author=v.get("author",{}).get("unique_id","") if isinstance(v.get("author"),dict) else str(v.get("author",""))
    desc=str(v.get("title") or v.get("desc") or "")[:350]
    original=f"https://www.tiktok.com/@{author}/video/{vid}" if author else None
    candidates.append({"id":vid,"title":desc,"author":author,"source":original,"media":v.get("hdplay") or v.get("play"),"width":v.get("width"),"height":v.get("height")})
   print("TIKTOK_SEARCH",term,r.status_code,data.get("code"),len(videos),flush=True)
   if videos:break
  except Exception as e:
   recs.append({"search":term,"endpoint":url,"error":str(e)[:250]})
good=[]
# One bounded native resolution sample per unique source to test whether mirror delivers honest 1080p.
for c in candidates[:8]:
 if not c["media"]:continue
 try:
  target=O/(c["id"]+".mp4")
  p=S.get(c["media"],timeout=18,stream=True)
  p.raise_for_status()
  total=0
  with target.open("wb") as f:
   for b in p.iter_content(chunk_size=2**18):
    total+=len(b)
    if total>40*2**20:break
    f.write(b)
  if total>40*2**20: raise ValueError("Source >40MiB capped, not complete")
  sp=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(target)],capture_output=True,text=True,timeout=35)
  if sp.returncode:raise ValueError("Media fails video decode: "+sp.stderr[-150:])
  p=json.loads(sp.stdout)
  v=next(s for s in p["streams"] if s["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  if not ((w>=1920 and h>=1080 and w>h) or (w>=1080 and h>=1920 and h>w)):
   raise ValueError(f"native video {w}x{h} below required full HD")
  c["probe"]={"width":w,"height":h,"sha256":hashlib.sha256(target.read_bytes()).hexdigest(),"size":target.stat().st_size}
  good.append(c)
  print("TIKTOK_NATIVE_HD",c["id"],w,h,flush=True)
 except Exception as e:
  c["rejected"]=str(e)[:260]
  target.unlink(missing_ok=True)
(O/"social_search_report.json").write_text(json.dumps({"search_requests":recs,"individual_tiktok_posts":candidates,"native_hd_samples":good,"gate":"VISUAL_IDENTITY_AND_SHOT_REVIEW_PENDING" if good else "BLOCKED","disclaimer":"Public mirror metadata alone is not video or true-resolution proof."},indent=2)+"\n")
print(json.dumps({"candidate_posts":len(candidates),"actual_native_hd_samples":len(good)},indent=2))
