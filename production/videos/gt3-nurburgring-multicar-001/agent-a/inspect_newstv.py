#!/usr/bin/env python3
"""Inspect official NewsTV listing structure and derive candidate video detail URLs.

Handles JavaScript data attributes / SPAs as well as HTML anchors; candidate URLs must
still be verified via actual native source download and visual race review.
"""
import json,re,html
from pathlib import Path
import requests
from bs4 import BeautifulSoup

OUT=Path("out/gt3-newstv-inspect");OUT.mkdir(parents=True,exist_ok=True)
sess=requests.Session();sess.headers["User-Agent"]="Mozilla/5.0"
urls=["https://newstv.porsche.com/en/","https://newstv.porsche.com/en/article/322821.html"]
terms=["24-hour race Nürburgring - review","60 Porsche in the","Nürburgring 24 Hours: Fighting until the end","newstv.porsche.com_322821_en"]
results=[]
for url in urls:
 try:
  r=sess.get(url,timeout=20)
  text=r.text
  soup=BeautifulSoup(text,"html.parser")
  data={"url":url,"http":r.status_code,"length":len(text),"scripts":[{"src":s.get("src"),"size":len(s.get_text())} for s in soup.find_all("script")][:40],"contexts":[],"links":[]}
  for term in terms:
    for m in list(re.finditer(re.escape(term),text,re.I))[:5]:
     data["contexts"].append({"term":term,"at":m.start(),"fragment":text[max(0,m.start()-1700):m.end()+1700]})
  # Extract candidate CDN video identifiers and API data.
  data["links"]=list(dict.fromkeys(re.findall(r'https?://[^\s"<>]{0,200}(?:\.mp4|\.m3u8|/article/\d+\.html)',text)))[:100]
  results.append(data)
  print("SITE",r.status_code,len(text),"contexts",len(data["contexts"]),"videos",len(data["links"]),flush=True)
 except Exception as e: results.append({"url":url,"error":str(e)})
(OUT/"structure.json").write_text(json.dumps(results,indent=2))
for result in results:
 for c in result.get("contexts",[]):
  print("\n=="+c["term"]+"==\n",re.sub(r'\s+',' ',html.unescape(c["fragment"]))[:2500],flush=True)
