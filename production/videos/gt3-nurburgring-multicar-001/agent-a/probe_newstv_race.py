#!/usr/bin/env python3
"""Discover exact N24 race-video identifiers in Porsche NewsTV tiles; HEAD-check actual original MP4."""
import json,re,requests
from bs4 import BeautifulSoup
from pathlib import Path
O=Path("out/gt3-porsche-n24-head");O.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers["User-Agent"]="Mozilla/5.0"
s=S.get("https://newstv.porsche.com/en/",timeout=20).text
soup=BeautifulSoup(s,"html.parser")
cards=[]
for node in soup.select("[data-ga-value]"):
  id=node.get("data-ga-value","")
  title=node.get("data-ga-label","")
  if not id.isdigit() or not any(x in title.lower() for x in ["nürburgring","nurburgring","green hell","24-hour race"]):continue
  if id in {x["id"] for x in cards}:continue
  cards.append({"id":id,"title":title,"article":"https://newstv.porsche.com/en/article/"+id+".html"})
print("RACE_TILES",len(cards),cards[:25],flush=True)
for card in cards[:24]:
 id=card["id"]
 stems=[f"newstv.porsche.com_{id}_en.mp4",f"{id}_en_3000000.mp4",f"{id}_en_5000000.mp4",f"{id}_en_8000000.mp4",f"{id}_en_12000000.mp4"]
 good=[]
 for stem in stems:
  url="https://newstv.porsche.com/porschevideos/"+stem
  try:
   r=S.head(url,allow_redirects=True,timeout=5)
   if r.status_code==200 and "video" in r.headers.get("Content-Type",""):
    good.append({"url":url,"content_length":r.headers.get("Content-Length"),"type":r.headers.get("Content-Type")})
  except Exception as e:
   pass
 card["valid_video_urls"]=good
 if good:print("DIRECT_MP4",card["title"],good,flush=True)
(O/"porsche-race-mp4-head-probe.json").write_text(json.dumps({"cards":cards},indent=2)+"\n")
