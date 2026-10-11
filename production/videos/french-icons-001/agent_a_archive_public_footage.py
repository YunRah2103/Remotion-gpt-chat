#!/usr/bin/env python3
"""Find original model-specific real footage in Internet Archive movies without fake HD claims."""
import urllib.request,urllib.parse,json,pathlib,time,re
O=pathlib.Path("out/fr-a-archive-motoring");O.mkdir(parents=True,exist_ok=True)
API="https://archive.org/advancedsearch.php"
Q=[
 'title:("Peugeot 205") AND mediatype:movies',
 'description:("Peugeot 205 GTI") AND mediatype:movies',
 'description:("Peugeot 205 T16") AND mediatype:movies',
 'title:("Renault 5 Turbo") AND mediatype:movies',
 'description:("Renault 5 Turbo") AND mediatype:movies',
 'title:("Clio V6") AND mediatype:movies',
 'description:("Clio V6") AND mediatype:movies',
 'description:("Citroen DS") AND mediatype:movies',
 'title:("Peugeot 306") AND mediatype:movies',
 'description:("historic rally") AND mediatype:movies',
 'description:("Group B rally") AND mediatype:movies'
]
H={"User-Agent":"YUNEX/classic-footage-archive-search/1.0"}
def get(u,t=35):
 with urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=t) as f:return json.load(f)
results={}
for q in Q:
 try:
  args=urllib.parse.urlencode([("q",q),("rows","65"),("page","1"),("output","json"),("fl[]","identifier"),("fl[]","title"),("fl[]","mediatype"),("fl[]","description"),("sort[]","downloads desc")])
  j=get(API+"?"+args)
  docs=j.get("response",{}).get("docs",[])
  for doc in docs:
   key=doc.get("identifier")
   if not key:continue
   row=results.setdefault(key,{"identifier":key,"title":doc.get("title",""),"matched":[],"media_files":[]})
   row["matched"].append(q)
  print("QUERY",q,"matches",j.get("response",{}).get("numFound"),"retrieved",len(docs),flush=True)
 except Exception as e:print("QUERY_FAILED",q,str(e)[:170],flush=True)
 time.sleep(.1)
for key,r in list(results.items())[:85]:
 try:
  metadata=get("https://archive.org/metadata/"+urllib.parse.quote(key),25)
  sources=[]
  for f in metadata.get("files",[]):
   name=f.get("name","")
   if name.lower().endswith((".mp4",".m4v",".mov",".webm",".mkv")) and not any(x in name.lower() for x in ("thumb","preview","sample","360p","720p")):
    sources.append({"name":name,"size":f.get("size"),"format":f.get("format"),
      "original":f.get("source")=="original","download":"https://archive.org/download/"+urllib.parse.quote(key)+"/"+urllib.parse.quote(name)})
  r["media_files"]=sorted(sources,key=lambda x:(not x["original"],-(int(x.get("size") or 0))))[:20]
  if sources:print("ARCHIVE_VIDEO",key,"title",str(r["title"])[:110],
     "files",[(x["name"][:80],x["size"],x["original"]) for x in sources[:8]],flush=True)
 except Exception as e:r["metadata_error"]=str(e)[:220]
report=list(results.values())
(O/"manifest.json").write_text(json.dumps({"searches":Q,"count":len(report),"items":report},indent=2,ensure_ascii=False))
print("INTERNET_ARCHIVE_FINAL",json.dumps({"unique":len(report),"with_video":sum(bool(x["media_files"]) for x in report),
   "files":sum(len(x["media_files"]) for x in report)}),flush=True)
