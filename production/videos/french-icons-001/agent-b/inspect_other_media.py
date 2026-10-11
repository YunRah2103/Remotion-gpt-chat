#!/usr/bin/env python3
import requests,re,json,html
from bs4 import BeautifulSoup
from urllib.parse import urljoin,urlparse,unquote
urls=[
"https://www.peugeot.co.uk/models/categories/sport/peugeot-9x8.html",
"https://www.peugeot.com/en/brand/peugeot-sport/",
"https://www.peugeot-sport.com/2026/09/peugeot-9x8-hypercar/",
"https://newsroom.bugatti.com/en/models/bolide",
"https://newsroom.bugatti.com/en/models/chiron-pur-sport",
"https://newsroom.bugatti.com/en/press-releases/feeling-the-track-bugatti-bolide-owners-take-on-circuit-paul-ricard",
"https://newsroom.bugatti.com/en/press-releases/video-release-bugatti-chiron-pur-sport-driving-in-the-hajar-mountains",
"https://www.peugeot-sport.com/",
"https://www.media.stellantis.com/em-en/peugeot-sport",
"https://www.fiawec.com/en/manufacturer/peugeot/15",
"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=Bugatti%20Chiron%20filetype%3Avideo&gsrnamespace=6&gsrlimit=25&prop=imageinfo&iiprop=url%7Csize%7Cmime&format=json"
]
s=requests.Session();s.headers.update({"User-Agent":"Mozilla/5.0 (compatible; YUNEX-footage-research/1.0; source-discovery; no credential automation)"})
for url in urls:
 print("PAGE",url,flush=True)
 try:
  r=s.get(url,timeout=24);print("STATUS",r.status_code,"LENGTH",len(r.content),"TYPE",r.headers.get("content-type",""),flush=True)
  if "application/json" in r.headers.get("content-type",""):print("JSON",r.text[:4000]);continue
  soup=BeautifulSoup(r.text,"html.parser")
  mp4list={}
  for m in re.finditer(r"(?:(?:https?:)?\\?/\\?/[^\"'<>\s]{3,}?|/[^\"'<>\s]{3,}?)(?:\.mp4|\.m3u8|\.webm)(?:\?[^\"'<>\s\\]{0,100})?",r.text,re.I):
   st=m.group().replace("\\/","/").replace("&amp;","&");st=html.unescape(st).split('"')[0].split("'")[0]
   # Skip unrelated background repeated links, retain ~all and relevant context
   context=re.sub(r"<[^>]+>"," ",r.text[max(0,m.start()-100):min(len(r.text),m.end()+100)])
   key=unquote(urlparse(urljoin(url,st)).path).lower()
   if key not in mp4list:mp4list[key]=(urljoin(url,st),context[:180])
  print("MP4_TOTAL",len(mp4list))
  for k,(u,c) in list(mp4list.items())[:95]:
   print("MEDIA",u[:260],"CONTEXT",c[:130])
  for node in soup.find_all(["iframe","video","source"]):
   print("NODE",node.name,dict(node.attrs).__str__()[:350])
  for key in ["__NEXT_DATA__","__NUXT__","_next/static","api/","video"]:
   print("STRING_COUNT",key,r.text.lower().count(key.lower()))
 except Exception as e:print("ERR",repr(e))
