#!/usr/bin/env python3
"""Inspect manufacturer heritage-press pages for publicly available embedded moving-video sources.
This is discovery; no footage counted until actual MP4 is retrieved, decoded and visually reviewed.
"""
import json,html,re,urllib.request,urllib.parse,pathlib
P=pathlib.Path("out/fr-legends-a-official-heritage");P.mkdir(parents=True,exist_ok=True)
URLS={
 "renault-clio-v6-in-parade":"https://media.renault.com/the-all-new-renault-clio-e-tech-full-hybrid-shows-off-its-modernity-alongside-iconic-previous-models/?lang=eng",
 "renault-r5-turbo-history-1":"https://media.renault.it/alla-scoperta-delle-origini-di-renault-5-turbo-e-turbo-2-1-parte/?lang=ita",
 "renault-r5-turbo-history-2":"https://media.renault.it/alla-scoperta-delle-origini-di-renault-5-turbo-e-turbo-2-2-parte/?lang=ita",
 "renault-r5-turbo-history-4":"https://media.renault.it/alla-scoperta-delle-origini-di-renault-5-turbo-e-turbo-2-4-parte/?lang=ita",
 "peugeot-210years-videos":"https://www.media.stellantis.com/es-es/peugeot/press/peugeot-210-anos-de-existencia-y-13-videos-para-revivirlos",
 "peugeot-205-gti-40years":"https://www.media.stellantis.com/it-it/peugeot/press/peugeot-205-gti-40-anni-di-une-sacree-gti",
 "renault-clio-v6-museum":"https://theoriginals.renault.com/en/clio-v6",
 "renault-r5-turbo-historic":"https://presse.renault.de/40-jahre-turbo-saga-bei-renault/?lang=deu"
}
OUT=[]
headers={"User-Agent":"Mozilla/5.0","Accept":"text/html"}
for key,url in URLS.items():
 item={"id":key,"source_url":url,"status":"FAILED","clips_downloaded":0}
 try:
  req=urllib.request.Request(url,headers=headers)
  with urllib.request.urlopen(req,timeout=23) as f:
   raw=f.read(4_000_000).decode("utf-8","replace")
   item["final_url"]=f.geturl()
  un=html.unescape(raw)
  vimeo_ids=list(dict.fromkeys(re.findall(r'(?:player\.vimeo\.com/video/|vimeo\.com/)(\d{6,12})',un)))
  youtube_ids=list(dict.fromkeys(re.findall(r'(?:youtube\.com/(?:watch\?v=|embed/)|youtu\.be/)([\w-]{11})',un)))
  videos=list(dict.fromkeys(re.findall(r'(?:(?:https?:)?//|/)[^\s"<>]+\.(?:mp4|webm|m3u8)(?:\?[^\s"<>]*)?',un,re.I)))
  iframes=list(dict.fromkeys(re.findall(r'<iframe[^>]+src=["\x27]([^"\x27]+)',un,re.I)))
  actual_links=list(dict.fromkeys(re.findall(r'(?:data-video-url|data-video-id|videoUrl|video-url|video_id|assetId|mediaId|videoId)[^\n]{0,220}',un,re.I)))[:30]
  item.update({"status":"PAGE_READ","page_bytes":len(raw),"vimeo_ids":vimeo_ids[:40],
    "youtube_ids":youtube_ids[:30],"direct_media_links":videos[:40],"iframes":iframes[:25],
    "video_attribute_samples":actual_links[:30]})
  print("PAGE",key,"len",len(raw),"vimeo",vimeo_ids[:15],"youtube",youtube_ids[:8],"media",len(videos),"iframe",iframes[:5],flush=True)
  for x in videos[:5]:print("DIRECT_MEDIA",key,x[:240],flush=True)
 except Exception as e:
  item["error"]=str(e)[:400]
  print("PAGE_REJECT",key,item["error"],flush=True)
 OUT.append(item);(P/"manifest.json").write_text(json.dumps(OUT,indent=2,ensure_ascii=False))
print("OFFICIAL_SOURCE_RESEARCH_DONE",json.dumps({"pages":len(OUT),"with_vimeo_ids":sum(bool(x.get("vimeo_ids")) for x in OUT),"with_direct":sum(bool(x.get("direct_media_links")) for x in OUT)}),flush=True)
