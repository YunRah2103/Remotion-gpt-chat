#!/usr/bin/env python3
"""Discover *direct* published HD media, avoiding auth-gated Vimeo and YouTube.
Discovery doesn't imply a playable download or permission to reuse.
"""
import json,re,urllib.parse,urllib.request,html
from pathlib import Path
O=Path("out/fr-legends-a-direct-discovery");O.mkdir(parents=True,exist_ok=True)
UA={"User-Agent":"YUNEXFrenchClassicsFootageResearch/1.0 (video-source provenance assessment)"}
def get(url,timeout=25):
 req=urllib.request.Request(url,headers=UA)
 with urllib.request.urlopen(req,timeout=timeout) as r:
  return r.read(3_000_000).decode("utf-8","replace"),r.geturl()
def search_commons(query):
 params={"action":"query","generator":"search","gsrsearch":query+" filetype:video",
         "gsrnamespace":"6","gsrlimit":"50","prop":"imageinfo",
         "iiprop":"url|size|mime|extmetadata","format":"json"}
 u="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode(params)
 raw,_=get(u,45)
 data=json.loads(raw)
 arr=[]
 for pg in (data.get("query",{}).get("pages") or {}).values():
  v=pg.get("imageinfo",[{}])[0];t=pg.get("title","")
  if not v.get("mime","").startswith("video/") and not t.lower().endswith((".webm",".ogv",".mp4",".mov")):continue
  raw_meta=v.get("extmetadata") or {}
  arr.append({"title":t,"url":v.get("url"),"page":v.get("descriptionurl"),
       "width":v.get("width"),"height":v.get("height"),"size":v.get("size"),
       "mime":v.get("mime"),"license":raw_meta.get("LicenseShortName",{}).get("value"),
       "artist_text":re.sub("<[^>]*>","",raw_meta.get("Artist",{}).get("value",""))[:300],
       "height_ok":(v.get("height") or 0)>=1080})
 return arr
searches=["Citroën DS", "Citroen 2CV", "Renault 5 Turbo","Peugeot 205 GTI",
          "Peugeot 205 T16", "Peugeot 306 Maxi", "Renault Clio V6","Alpine A110"]
press=[
 ("alpine-official-historic","https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/"),
 ("renault-clio-v6-press","https://presse.renault.de/82/?lang=deu"),
 ("renault-5-turbo-press","https://media.renault.it/alla-scoperta-delle-origini-di-renault-5-turbo-e-turbo-2-1-parte/?lang=ita"),
 ("peugeot-205-classic","https://www.media.stellantis.com/uk-en/peugeot/press/10-reasons-why-the-peugeot-205-gti-is-the-greatest-hot-hatch-ever")
]
report={"commons":{},"press":{}}
for q in searches:
 try:
  a=search_commons(q); report["commons"][q]={"count":len(a),"1080_candidates":sum(x["height_ok"] for x in a),"items":a}
  print("COMMONS",q,"video_count",len(a),"hd",sum(x["height_ok"] for x in a),flush=True)
 except Exception as ex:
  report["commons"][q]={"error":str(ex)};print("COMMONS_FAILED",q,str(ex),flush=True)
for name,url in press:
 try:
  body,final=get(url)
  # Source discovery only: do not parse site URLs as proof of usable MP4s.
  direct=list(dict.fromkeys(re.findall(r"https?[^\"'<>\s\\]+?\.(?:mp4|webm|mov|m3u8)(?:\?[^\"'<>\s]*)?",html.unescape(body),re.I)))[:100]
  rel=list(dict.fromkeys(re.findall(r'(?i)(?:src|href)\s*=\s*["\x27]([^"\x27]*\.(?:mp4|webm|mov|m3u8)(?:\?[^"\x27]*)?)',body)))[:100]
  rx=list(dict.fromkeys(re.findall(r"(?i)(?:download|video|media|asset)[^<>\n]{0,150}",body)))[:25]
  report["press"][name]={"url":url,"http_url":final,"html_chars":len(body),"direct_links":direct,"relative_links":rel,"asset_markers":rx}
  print("PRESS",name,"bytes",len(body),"direct",len(direct),"relative",len(rel),flush=True)
 except Exception as ex:
  report["press"][name]={"url":url,"error":str(ex)}
  print("PRESS_FAILED",name,str(ex),flush=True)
(O/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
with (O/"README.md").open("w") as f:
 f.write("# Agent A direct-media discovery\n")
 f.write("This report is for source selection only; zero media bytes are implied.\n")
 f.write("Wikimedia Commons links need model/framing checks and licence attribution. Source sites need media downloads and FFprobe checks.\n")
print("DONE",flush=True)
