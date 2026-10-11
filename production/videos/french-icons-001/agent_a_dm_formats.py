#!/usr/bin/env python3
"""One-pass, rate-limited source-format assessment; NOT a claim of acquired footage."""
import subprocess,json,sys,pathlib
P=pathlib.Path("out/fr-legends-a-dm-formats");P.mkdir(parents=True,exist_ok=True)
S=[
("peugeot-205-gti-review-2023","Peugeot 205 GTI","https://www.dailymotion.com/video/x8lb74e"),
("peugeot-205-gti-review-old","Peugeot 205 GTI","https://www.dailymotion.com/video/x4jmxlq"),
("renault-5-turbo2-driving","Renault 5 Turbo 2","https://www.dailymotion.com/video/x3od5ha"),
("peugeot-306-maxi-rally","Peugeot 306 Maxi","https://www.dailymotion.com/video/x6s3w43"),
("renault-clio-v6-show","Renault Clio V6","https://www.dailymotion.com/video/x9yuybc"),
("citroen-ds-review","Citroën DS 23","https://www.dailymotion.com/video/x8l2lrr"),
("citroen-ds-2025","Citroën DS","https://www.dailymotion.com/video/x9se8pm"),
("alpine-1973-auction","Alpine A110 original 1973","https://www.dailymotion.com/video/x72um2g")
]
d=[]
for name,model,url in S:
 try:
  z=subprocess.run([sys.executable,"-m","yt_dlp","--no-playlist","--skip-download",
      "--no-warnings","--socket-timeout","15","--retries","0","--dump-single-json",url],
      capture_output=True,text=True,timeout=45)
  if z.returncode:raise RuntimeError(z.stderr[-500:])
  p=json.loads(z.stdout);f=[x for x in p.get("formats",[]) if x.get("height") and (x.get("vcodec") or "none")!="none"]
  best=max(f,key=lambda x:(x.get("height",0),x.get("width",0))) if f else {}
  row={"id":name,"model":model,"page":url,"status":"FORMAT_ONLY_NOT_DOWNLOADED",
       "highest_height":best.get("height"),"highest_width":best.get("width"),
       "highest_format":best.get("format_id"),"possible_hd":(best.get("height") or 0)>=1080,
       "format_samples":sorted(set((x.get("width"),x.get("height")) for x in f if x.get("height")))[:20]}
  print("FORMAT",name,row["highest_width"],row["highest_height"],row["highest_format"],flush=True)
 except Exception as e:
  row={"id":name,"model":model,"page":url,"status":"EXTRACTION_FAILED","error":str(e)[:550]}
  print("FAILED",name,row["error"],flush=True)
 d.append(row)
 (P/"report.json").write_text(json.dumps(d,indent=2,ensure_ascii=False))
print("SUMMARY",json.dumps({"total":len(d),"at_least_1080_leads":sum(x.get("possible_hd") for x in d)}),flush=True)
