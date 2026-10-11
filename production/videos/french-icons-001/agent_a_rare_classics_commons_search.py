#!/usr/bin/env python3
"""Find playable original French classic car footage from Commons media API.
Search title, video mime and categories; no fake AI-generated media, no stills.
"""
import urllib.request,urllib.parse,json, pathlib, time, re
OUT=pathlib.Path("out/fr-legends-a-commons-rare-model");OUT.mkdir(parents=True,exist_ok=True)
API="https://commons.wikimedia.org/w/api.php"
QUERIES=[
 "filetype:video \"Renault 5 Turbo\"","filetype:video \"Renault 5\"",
 "filetype:video \"Peugeot 205\"","filetype:video \"Peugeot\" rally",
 "filetype:video \"Renault Clio\"","filetype:video \"Clio V6\"",
 "filetype:video \"Citroen DS\"","filetype:video \"Citroën DS\"",
 "filetype:video \"306 Maxi\"","filetype:video \"Citroen\" classic",
 "filetype:video \"Alpine A110\"",
 "\"Peugeot 205\" -filetype:image","\"Renault 5 Turbo\" video",
 "incategory:\"Videos of rallies\" Peugeot",
 "incategory:\"Videos of automobiles\" Peugeot",
 "filetype:video \"historic rally\"","filetype:video \"rally car\"",
 "filetype:video \"French classic cars\""
]
h={"User-Agent":"YUNEX-French-Legends-Media-QA/1.0 (https://github.com/YunRah2103/Remotion-gpt-chat)","Accept":"application/json"}
def api(args):
 params=urllib.parse.urlencode({"format":"json",**args})
 req=urllib.request.Request(API+"?"+params,headers=h)
 with urllib.request.urlopen(req,timeout=35) as res:return json.load(res)
rows={};errors=[]
for search in QUERIES:
 try:
  data=api({"action":"query","generator":"search","gsrsearch":search,"gsrnamespace":6,
    "gsrlimit":40,"prop":"imageinfo","iiprop":"url|size|mime|extmetadata"})
  pages=list((data.get("query") or {}).get("pages",{}).values())
  for page in pages:
   title=page.get("title","")
   info=(page.get("imageinfo") or [{}])[0]
   mime=info.get("mime","")
   if mime not in ("video/webm","video/ogg","video/mp4","video/quicktime","video/x-msvideo"):
    continue
   record=rows.setdefault(title,{"title":title,"mime":mime,"width":info.get("width"),
     "height":info.get("height"),"size":info.get("size"),
     "source_url":info.get("url"),"description_url":info.get("descriptionurl"),"search_hits":[]})
   record["search_hits"].append(search)
  print("QUERY",search,"results",len(pages),"videos",sum((p.get("imageinfo") or [{}])[0].get("mime","").startswith("video/") for p in pages),flush=True)
 except Exception as e:
  errors.append({"query":search,"error":str(e)[:160]});print("ERROR",search,str(e)[:130],flush=True)
 time.sleep(.2)
ranked=list(rows.values())
ranked.sort(key=lambda x:(
  -(len(x["search_hits"])),
  -(x["height"] or 0),
  x["title"]))
payload={"total_unique_videos":len(ranked),"records":ranked,"errors":errors,
         "critical_note":"No source identity, on-screen driving motion or codec verified by this metadata search."}
(OUT/"report.json").write_text(json.dumps(payload,indent=2,ensure_ascii=False))
for x in ranked[:70]:
 print("RESULT",x["title"],f'{x["width"]}x{x["height"]}',x["size"],"hits",len(x["search_hits"]),x["description_url"],flush=True)
print("MEDIAWIKI_SEARCH_SUMMARY",json.dumps({"unique":len(ranked),"hd_video_metadata":sum((x["width"] or 0)>=1920 and (x["height"] or 0)>=1080 for x in ranked),"errors":len(errors)}),flush=True)
