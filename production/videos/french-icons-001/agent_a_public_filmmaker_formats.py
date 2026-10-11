#!/usr/bin/env python3
"""Public Vimeo embed format probe for genuine French classic-car filmmaker videos.

Only normal unauthenticated Vimeo public player configuration and playlist; no
cookies, passwords, paywall or DRM circumvention. A link or 1080p manifest
is NOT an approved moving shot until original playable video is decoded and seen.
"""
import json, urllib.request,urllib.parse, re, pathlib
OUT=pathlib.Path("out/agent-a-classic-artist-formats");OUT.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("205-gti-scott","Peugeot 205 GTI",445315891),
 ("205-gti-nurburgring","Peugeot 205 GTI",37907949),
 ("205-gti-herman","Peugeot 205 GTI",929214),
 ("205-t16-montlhery","Peugeot 205 Turbo 16",235242860),
 ("renault-r5-turbo","Renault 5 Turbo",329522784),
 ("clio-v6","Renault Clio V6",731296447),
 ("original-alpine-a110","Alpine A110 original 1973",1134649595),
 ("alpine-2023-historic","Alpine A110 original historic",812445061),
 ("2cv-sahara","Citroen 2CV Sahara",173664604),
 ("2cv-riviera","Citroen 2CV",768447211),
 ("citroen-ds-video","Citroen DS (uncertain variant)",1045355575),
 ("alpine-2012-film","Alpine original plus 2012 concept mixed",45074634)
]
h={"User-Agent":"Mozilla/5.0","Referer":"https://vimeo.com/"}
def get(url,n=400000):
 with urllib.request.urlopen(urllib.request.Request(url,headers=h),timeout=22) as f:return f.read(n)
rows=[]
for slug,model,vid in SOURCES:
 r={"slug":slug,"claimed_model":model,"vimeo_id":vid,"status":"NOT_AVAILABLE",
    "original_car_identity_verified":False,"moving_angles_verified":0}
 try:
  c=json.loads(get(f"https://player.vimeo.com/video/{vid}/config",2_500_000))
  v=c.get("video") or {}; files=(c.get("request") or {}).get("files") or {}
  r["video_title"]=v.get("title");r["creator"]=v.get("owner",{}).get("name")
  r["duration"]=v.get("duration")
  p=files.get("progressive") or []
  heights=set(x.get("height") for x in p if x.get("height"))
  for cdn,item in ((files.get("hls") or {}).get("cdns") or {}).items():
   if not item.get("url"):continue
   try:
    master=get(item["url"]).decode("utf-8","replace")
    heights.update(int(m) for m in re.findall(r"RESOLUTION=\d+x(\d+)",master))
   except Exception as e:r.setdefault("hls_errors",[]).append(str(e)[:120])
  r.update({"status":"PUBLIC_EMBED_FORMAT_AVAILABLE" if heights else "NO_PUBLIC_VIDEO_FORMATS",
            "available_heights":sorted(heights),
            "has_native_1080":any(h>=1080 and h<=2160 for h in heights)})
  print("EMBED",slug,model,"title",r["video_title"],"heights",sorted(heights),"creator",r["creator"],flush=True)
 except Exception as e:
  r["error"]=str(e)[:330]
  print("BLOCK",slug,str(e)[:200],flush=True)
 rows.append(r)
 (OUT/"manifest.json").write_text(json.dumps(rows,indent=2,ensure_ascii=False))
print("SCOUT_SUMMARY",json.dumps({"attempted":len(rows),"actual_public_1080_video_leads":
   sum(x.get("has_native_1080",False) for x in rows),"identity_approved":0}),flush=True)
