#!/usr/bin/env python3
"""Fetch actual public Stellantis DS70 anniversary historic DS parade press video sources.

Extract direct published video URLs or public share manifest via read-only HTTP.
Do not bypass login/password, nor claim media acquired based on html filenames.
"""
import json,urllib.request,urllib.parse,pathlib,re,html,time
O=pathlib.Path("out/fr-a-citroen-ds70-press")
O.mkdir(parents=True,exist_ok=True)
LINKS=[
 ("ds70-club-paris-200-classic-cars","https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4"),
 ("ds70-stellantis-press-kit","https://sharing.oodrive.com/share-access/sharings/35sZY6sv.9qqSq9zw"),
 ("citroen-ds-paris-night-driving","https://www.caradisiac.com/une-chevauchee-fantastique-en-citroen-ds-a-travers-paris-en-video-213752.htm"),
 ("citroen-ds-70th-celebration-press","https://www.media.stellantis.com/uk-en/ds/press/ds-automobiles-and-l-aventure-ds-join-club-parids-to-celebrate-the-70th-anniversary-of-the-ds-an-icon-of-design-and-technology")
]
h={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36","Accept":"text/html,application/json,*/*"}
def fetch(url):
 r=urllib.request.Request(url,headers=h)
 with urllib.request.urlopen(r,timeout=38) as response:
  return response.status,response.url,response.headers.get("Content-Type"),response.read(5_000_000).decode("utf-8","replace")
rows=[]
for label,url in LINKS:
 row={"id":label,"url":url,"downloaded_true_video":False,"status":"NOT_AVAILABLE"}
 try:
  code,loc,ct,body=fetch(url)
  row.update({"code":code,"resolved":loc,"type":ct,"html_bytes":len(body),"status":"PAGE_FETCHED"})
  lower=body.lower()
  urls=set()
  for match in re.findall(r'https?[^"<>\\s]{15,300}',html.unescape(body)):
   clean=match.split("'")[0].split('"')[0]
   if any(x in clean.lower() for x in (".mp4",".m3u8",".mov",".webm",".json","api.","/download","/files/")):
    urls.add(clean[:350])
  row["potential_video_media_urls"]=sorted(urls)[:60]
  row["video_keyword_counts"]={keyword:lower.count(keyword) for keyword in (".mp4",".m3u8",".webm","application/json","share-access","preview","download","video","citro","ds","parade")}
  row["scripts"]=[html.unescape(x)[:200] for x in re.findall(r'<script[^>]+src=["\\']([^"\\']+)',body)][:14]
  row["data_context_samples"]=[m.group(0)[:290] for m in list(re.finditer(r".{0,90}(?:api/|share-access|sharingId|fileId|contentId|downloadUrl|\\.mp4).{0,125}",body,re.I))[:12]]
  print("SOURCE_PAGE",label,"code",code,"type",ct,"bytes",len(body),"media",len(urls),"keywords",row["video_keyword_counts"],flush=True)
  for u in row["potential_video_media_urls"][:6]:print("POSSIBLE_ASSET",label,u[:220],flush=True)
 except Exception as e:
  row.update({"status":"FETCH_FAILED","error":str(e)[:250]})
  print("PAGE_FAILED",label,row["error"],flush=True)
 rows.append(row)
 (O/"manifest.json").write_text(json.dumps(rows,indent=2,ensure_ascii=False))
print("CITROEN_PRESS_FINAL",json.dumps({"pages_fetched":sum(x["status"]=="PAGE_FETCHED" for x in rows),
    "media_urls_exposed":sum(len(x.get("potential_video_media_urls",[])) for x in rows),
    "actual_1080_films":0,"gate":"NOT_PASSED"}),flush=True)
