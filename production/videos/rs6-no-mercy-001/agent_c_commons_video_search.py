#!/usr/bin/env python3
"""Search Wikimedia Commons for redistributable genuine RS6 C8 video."""
import urllib.request,urllib.parse,json,pathlib,re,html
ROOT="https://commons.wikimedia.org/w/api.php"
OUT=pathlib.Path("agent-c-commons-audit")
OUT.mkdir(exist_ok=True)
hits={}
for term in ["Audi RS6 filetype:video","RS6 Avant filetype:video","Audi RS6 webm"]:
 query=urllib.parse.urlencode({"action":"query","format":"json","formatversion":2,"generator":"search","gsrsearch":term,"gsrnamespace":6,"gsrlimit":30,"prop":"imageinfo","iiprop":"url|size|mime|extmetadata"})
 try:
  req=urllib.request.Request(ROOT+"?"+query,headers={"User-Agent":"YUNEX-RS6-research/1.0 (Commons CC attribution audit)"})
  with urllib.request.urlopen(req,timeout=35) as response: data=json.load(response)
  for page in data.get("query",{}).get("pages",[]):
   if not page.get("imageinfo"):continue
   info=page["imageinfo"][0]
   if not info.get("mime","").startswith("video/"):continue
   meta=info.get("extmetadata",{})
   lic=meta.get("LicenseShortName",{}).get("value","")
   hits[page["title"]]={"title":page["title"],"mime":info["mime"],"width":info.get("width"),"height":info.get("height"),"size":info.get("size"),"license":re.sub("<[^>]+>","",html.unescape(lic)),"url":info.get("url")}
  print("SEARCH",term,"total_videos",len(hits),flush=True)
 except Exception as e:print("SEARCH_ERROR",term,repr(e),flush=True)
(OUT/"c8_video_search.json").write_text(json.dumps(list(hits.values()),indent=2))
print("RESULTS",json.dumps(list(hits.values())),flush=True)
