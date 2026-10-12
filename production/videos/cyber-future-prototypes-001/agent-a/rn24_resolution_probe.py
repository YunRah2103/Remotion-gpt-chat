#!/usr/bin/env python3
import requests,json,subprocess,os
from pathlib import Path
out=Path("out/agent-a-rn24-resolution");out.mkdir(parents=True,exist_ok=True)
base="https://d338d8ftck8b1o.cloudfront.net/vod/FIL00000000000240802/11086494605c47e68eb2af3e0dc057c2/MP4/11086494605c47e68eb2af3e0dc057c2"
S=requests.Session();S.headers["User-Agent"]="Mozilla/5.0 Chrome/129.0 Safari/537.36"
names=["_2160p.mp4","_4k.mp4","_4K.mp4","_uhd.mp4","_UHD.mp4","_1440p.mp4","_1080p.mp4",".mp4"]
results=[]
for n in names:
 url=base+n
 try:
  r=S.head(url,allow_redirects=True,timeout=(8,16))
  info={"suffix":n,"status":r.status_code,"size":r.headers.get("Content-Length"),"content_type":r.headers.get("Content-Type"),"url":url}
  if r.status_code==200 and n!="_1080p.mp4":
   p=out/"sample_header.bin"
   with S.get(url,headers={"Range":"bytes=0-131071"},timeout=(10,30),stream=True) as resp:
    info["partial_status"]=resp.status_code
    info["range"]=resp.headers.get("Content-Range")
    if resp.status_code==206:
     with p.open("wb") as f:
      for b in resp.iter_content(65536):f.write(b)
  print("PROBE",info,flush=True)
 except Exception as e:info={"suffix":n,"url":url,"error":str(e)};print("FAIL",n,str(e)[:140],flush=True)
 results.append(info)
(out/"results.json").write_text(json.dumps(results,indent=2))
