#!/usr/bin/env python3
"""Probe real archived motorsport HD source resolutions without downloading SD.
Potential originals from Davide Cironi R5 Turbo2 and Duke Rally 306 Maxi.
"""
import subprocess,json,pathlib
OUT=pathlib.Path("out/fr-a-missing-rally-film-probe");OUT.mkdir(parents=True,exist_ok=True)
targets=[
("r5-turbo2-davide-cironi","x3od5ha","Renault 5 Turbo2"),
("peugeot-306-maxi-duke","x6s3w43","Peugeot 306 Maxi"),
("peugeot-306-maxi-vald-ance","xs7e4m","Peugeot 306 Maxi"),
]
rows=[]
for key,vid,model in targets:
 item={"id":key,"model":model,"url":"https://www.dailymotion.com/video/"+vid,"status":"UNAVAILABLE","approved_motion_clips":0}
 try:
  result=subprocess.run(["yt-dlp","--no-warnings","--no-playlist","--socket-timeout","12",
    "-J","https://www.dailymotion.com/video/"+vid],capture_output=True,text=True,timeout=55)
  if result.returncode:raise RuntimeError(result.stderr[-350:])
  d=json.loads(result.stdout)
  formats=[{"w":x.get("width"),"h":x.get("height"),"id":x.get("format_id"),"ext":x.get("ext")} for x in d.get("formats",[]) if x.get("width") and x.get("height")]
  item.update({"title":d.get("title"),"max_native_height":max([x["h"] for x in formats],default=0),
    "formats":formats,"status":"POTENTIAL_NATIVE_1080" if any(x["w"]>=1920 and x["h"]>=1080 for x in formats) else "REJECT_BELOW_NATIVE_1080"})
  print("VIDEO_REAL_FORMATS",key,item["max_native_height"],formats[:12],flush=True)
 except Exception as e:
  item["error"]=str(e)[:400]
  print("VIDEO_ACCESS_UNAVAILABLE",key,item["error"],flush=True)
 rows.append(item);(OUT/"manifest.json").write_text(json.dumps(rows,indent=2))
print("HD_GATE_SUMMARY",json.dumps({"potential_native_1080":sum(x["status"]=="POTENTIAL_NATIVE_1080" for x in rows),
    "sources":len(rows)}),flush=True)
