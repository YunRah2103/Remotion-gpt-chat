#!/usr/bin/env python3
"""A2 discover DIFFERENT actual manufacturer-authored C8 RS6 footage originals.

Explores only official Audi source pages, extracts AEM identifiers and publicly
embedded renditions, validates remote MP4 HTTP byte-range and dimensions when
found. No unlicensed media is saved or re-uploaded.
"""
import re, json, subprocess, requests, time, html, urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
OUT=Path("a2_other_audi_originals");OUT.mkdir(exist_ok=True)
SOURCES={
 "daytona_known":"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874",
 "dew_silver_performance":"https://www.audi.com/en/videos/video/audi-rs-6-avant-performance-dew-silver-matt-footage-on-location-6557",
 "gt_creators_west_coast":"https://www.audi.com/en/videos/video/audi-rs-6-avant-gt-creators-experience-drive-footage-on-location-7236",
 "rs6_model_archive":"https://www.audi.com/en/fourth-generation-audi-rs-6-avant-11975",
 "audi_rs6_gt_west_coast_release":"https://www.audi.com/en/press-releases/the-audi-rs-6-avant-gt-makes-its-appearance-on-the-west-coast-of-the-usa-16088",
}
UHD="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:{id}/renditions/video_2160p.mp4/as/{stem}_2160p.mp4?accept-experimental=1"
UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"}
def ffprobe(url):
 try:
  p=subprocess.run(["ffprobe","-v","error","-rw_timeout","14000000",
       "-show_entries","format=duration:stream=codec_type,width,height,avg_frame_rate","-of","json",url],
       stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=28)
  if p.returncode==0:
   return json.loads(p.stdout)
  return {"error":p.stderr[-180:]}
 except Exception as e:return {"error":repr(e)}
results=[]
for key,url in SOURCES.items():
 row={"key":key,"source_page":url,"status":"unexamined"}
 results.append(row)
 try:
  r=requests.get(url,timeout=23,headers=UA)
  row["http"]=r.status_code;row["html_size"]=len(r.content)
  if not r.ok:continue
  raw=html.unescape(r.text).replace("\\/","/")
  soup=BeautifulSoup(raw,"html.parser")
  row["page_title"]=(soup.title.get_text(strip=True) if soup.title else "")[:130]
  ids=list(dict.fromkeys(re.findall(r"(?:urn:aaid:aem:|urn%3Aaaid%3Aaem%3A)([0-9a-f-]{36})",raw,re.I)))
  row["aem_ids"]=ids[:20]
  row["direct_video_candidates"]=list(dict.fromkeys(
    u.strip(' "\'\n\\')[:280] for u in re.findall(r"https?://[^\s\"'<>\\]{5,500}(?:\.mp4|\.m3u8)(?:\?[^\s\"'<>\\]{0,100})?",raw,re.I)))[:12]
  row["video_tags"]=[{"src":tag.get("src"),"data-src":tag.get("data-src"),"poster":tag.get("poster")}
    for tag in soup.select("video, source")][:6]
  row["embedded_video_hints"]=[v.strip()[:150] for v in list(dict.fromkeys(
     re.findall(r'.{0,65}(?:aem:|video_2160p|renditions/video|assetId|asset_id|streamingUrl).{0,100}',raw,re.I)))[:12]]
  row["status"]="page_inspected"
  for candidate in row["direct_video_candidates"][:4]:
   if ".mp4" in candidate and ("audi" in candidate or "adobeaemcloud" in candidate):
    row.setdefault("direct_probe",[]).append({"url":candidate[:190],"media":ffprobe(candidate)})
 except Exception as e:row.update(status="page_error",error=repr(e))
(OUT/"report.json").write_text(json.dumps(results,indent=2))
print(json.dumps([{k:v.get(k) for k in ("key","http","html_size","aem_ids","status","direct_video_candidates","embedded_video_hints")} for v in results],indent=2))
