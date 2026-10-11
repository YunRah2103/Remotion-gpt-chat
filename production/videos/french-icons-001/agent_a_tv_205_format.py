#!/usr/bin/env python3
"""Real Dailymotion SOURCE checks for recent TV footage of classic Peugeot 205 GTI.
Only truly fetched, decoded native 1080p original motion can pass.
"""
from pathlib import Path
import json,subprocess
OUT=Path("out/fr-a-dm-peugeot-205-television");OUT.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("205-gti-france-tv-2017","https://www.dailymotion.com/video/x6asnfx","Peugeot 205 GTI French championship rally film"),
 ("205-gti-loeb-test","https://www.dailymotion.com/video/x64n6b9","Sébastien Loeb 205 GTI test film"),
 ("205-gti-hillclimb-2024","https://www.dailymotion.com/video/x9499o6","French hillclimb 2024; Peugeot 205 GTI at around 13:00"),
 ("clio-v6-caradisiac-2026","https://www.dailymotion.com/video/x9yuybc","Caradisiac Clio V6 2026 motor-show footage; likely stationary only")
]
report=[]
for name,url,desc in SOURCES:
 row={"id":name,"url":url,"description":desc,"status":"UNKNOWN","actual_native_hd_movie":False}
 try:
  p=subprocess.run(["yt-dlp","--no-playlist","--list-formats","--no-warnings",url],
    capture_output=True,text=True,timeout=75)
  forms=[]
  data=subprocess.run(["yt-dlp","-J","--no-playlist","--no-warnings",url],
    capture_output=True,text=True,timeout=75)
  if data.returncode:raise RuntimeError("YTDLP_INFO: "+data.stderr[-250:])
  info=json.loads(data.stdout)
  for f in info.get("formats",[]):
   w=int(f.get("width") or 0);h=int(f.get("height") or 0)
   if w and h:
    forms.append({"id":f.get("format_id"),"width":w,"height":h,"fps":f.get("fps"),"tbr":f.get("tbr"),
        "protocol":f.get("protocol"),"ext":f.get("ext")})
  forms.sort(key=lambda x:(-x["height"],-x["width"]))
  row.update({"title":info.get("title"),"uploader":info.get("uploader"),"duration":info.get("duration"),
    "formats":forms[:40],"max_height":max([x["height"] for x in forms],default=0)})
  if row["max_height"]>=1080:row["status"]="NATIVE_1080_VARIANT_ADVERTISED_ACQUISITION_NEEDED"
  else:row["status"]="NATIVE_HD_GATE_FAIL_UNDER_1080"
  print("VIDEO_FORMAT",name,row["max_height"],"title",row["title"],"top",forms[:9],flush=True)
 except Exception as e:
  row.update({"status":"ACCESS_FAILED","error":str(e)[:450]})
  print("VIDEO_FAIL",name,row["error"],flush=True)
 report.append(row);(OUT/"manifest.json").write_text(json.dumps(report,indent=2))
print("FRENCH_205_FILM_GATE",json.dumps({"1080p_leads":sum(x["status"].startswith("NATIVE_1080") for x in report),
    "checked":len(report)}),flush=True)
