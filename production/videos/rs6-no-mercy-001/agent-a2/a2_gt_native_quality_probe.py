#!/usr/bin/env python3
"""Probe exact real Audi 2024 C8 RS6 Avant GT video rendition quality.
No upscaling; only genuine >=1080 will be eligible for 1080p deliverable.
"""
from pathlib import Path
import requests,subprocess,json,time,hashlib
BASE="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:854b7597-7aa0-4506-85cc-5aa63b5e331e/renditions/video_{q}.mp4/as/audi-rs-6-avant-gt-creators-experience-drive-footage-on-location_{q}.mp4?accept-experimental=1"
OUT=Path("a2_gt_1080_probe");OUT.mkdir(exist_ok=True)
qset=["2160p","1080p","0720p"]
res={"origin":"Audi RS6 Avant GT Creators Experience Drive","page":"https://www.audi.com/en/videos/video/audi-rs-6-avant-gt-creators-experience-drive-footage-on-location-7236",
"rs6_variant":"C8 RS 6 Avant GT (a distinctive bodykit, not the Daytona Grey ordinary RS6)",
"source_rights":"AUDI AG reuse NOT independently authorised for public video release",
"qualities":[]}
for q in qset:
 url=BASE.format(q=q);row={"label":q,"media_url":url};res["qualities"].append(row)
 try:
  r=requests.get(url,headers={"Range":"bytes=0-127","User-Agent":"Mozilla/5.0"},stream=True,timeout=(15,30))
  payload=next(r.iter_content(128),b"")
  row["http_status"]=r.status_code;row["content_range"]=r.headers.get("Content-Range")
  row["mp4_header_valid"]=b"ftyp" in payload
  r.close()
  if r.status_code!=206 or not row["mp4_header_valid"]:continue
  p=subprocess.run(["ffprobe","-v","error","-rw_timeout","24000000",
    "-show_entries","stream=codec_type,codec_name,width,height,avg_frame_rate:format=duration,size",
    "-of","json",url],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=55)
  row["ffprobe_exit"]=p.returncode
  if not p.returncode:
    obj=json.loads(p.stdout);row["native_probe"]=obj
    try: v=next(s for s in obj["streams"] if s.get("codec_type")=="video")
    except: v={}
    row["meets_1080_native"]=min(v.get("width",0),v.get("height",0))>=1080
  else:row["error"]=p.stderr[-250:]
 except Exception as e:row["error"]=repr(e)
(OUT/"report.json").write_text(json.dumps(res,indent=2))
print(json.dumps([{k:x.get(k) for k in ("label","http_status","content_range","native_probe","error")} for x in res["qualities"]],indent=2))
