#!/usr/bin/env python3
"""Public Vimeo source format audit for precise ORIGINAL French classic cars.

Read creator-published player configuration only; no account/session, cookies, or bypass.
MP4 access is verified in subsequent actual media acquisition. Never count as clip from metadata.
"""
import json,re,pathlib,urllib.request,urllib.parse,time
OUT=pathlib.Path("out/fr-a-vimeo-new-discover");OUT.mkdir(parents=True,exist_ok=True)
TARGETS=[
 ("205-gti-new-690432887","Peugeot 205 GTI",690432887),
 ("citroen-ds1958-drive","1958 Citroen DS19",1072615163),
 ("citroen-ds-daylight","Original classic Citroen DS",110140457),
 ("citroen-ds-icone","Original classic Citroen DS",689618896),
 ("citroen-ds-collection","Original classic Citroen DS",197756578),
 ("citroen-ds-macguff","Original classic Citroen DS",62060216),
 ("clio-v6-gallery-aaldering","Original Renault Clio V6",826151212),
 ("renault5-turbo-showreel","Renault 5 Turbo",329522784),
 ("peugeot205-gti-2011","Peugeot 205 GTI",445315891),
 ("peugeot205-gti-2008","Peugeot 205 GTI",929214)
]
result=[]
def req(url,ref):
 with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Referer":ref,
  "Accept":"application/json,*/*"}),timeout=23) as r:return r.read(1800000)
for label,model,vid in TARGETS:
 r={"id":label,"model_target":model,"vimeo":vid,"status":"NOT_AVAILABLE",
    "native1080_verified":False,"visual_verified":False}
 try:
  page="https://vimeo.com/"+str(vid)
  d=json.loads(req("https://player.vimeo.com/video/"+str(vid)+"/config",page))
  files=d.get("request",{}).get("files",{})
  props=d.get("video",{})
  r["title"]=props.get("title");r["duration"]=props.get("duration")
  heights={int(x.get("height")) for x in files.get("progressive",[]) if x.get("height")}
  cdns=(files.get("hls") or {}).get("cdns") or {}
  playlist_count=0
  for name,item in cdns.items():
   try:
    src=item.get("url")
    if not src:continue
    txt=req(src,"https://player.vimeo.com/").decode("utf-8","replace")
    for h in re.findall(r"RESOLUTION=\\d+x(\\d+)",txt):
     heights.add(int(h))
    playlist_count+=1
   except Exception as e:r.setdefault("errors",[]).append(str(e)[:130])
  r.update({"status":"PUBLIC_STREAM_METADATA" if heights else "NO_PUBLIC_VIDEO_FORMATS",
    "available_heights":sorted(heights),"has1080":any(h>=1080 for h in heights),
    "playlist_count":playlist_count})
  print("PUBLIC_FILM",label,"title",r["title"],"heights",sorted(heights),flush=True)
 except Exception as e:
  r["status"]="EMBED_ACCESS_UNAVAILABLE";r["error"]=str(e)[:240]
  print("BLOCKED_FILM",label,str(e)[:160],flush=True)
 result.append(r)
 (OUT/"manifest.json").write_text(json.dumps(result,indent=2,ensure_ascii=False))
print("SUMMARY",json.dumps({"checked":len(result),"public_1080_leads":sum(x.get("has1080",False) for x in result)}),flush=True)
