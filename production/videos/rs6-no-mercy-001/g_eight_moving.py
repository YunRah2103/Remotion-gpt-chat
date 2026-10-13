#!/usr/bin/env python3
"""Extract NEW independent dynamic C8 Audi RS6 originals after temporal scene review.
Audi official 4K source only; media remains owner-review, not publication-cleared.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json,hashlib,os,time
URL="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
OUT=Path("rs6-g-motion-extractions");OUT.mkdir(parents=True,exist_ok=True)
# 4K source positions verified with FIVE consecutive real decoded 640x360 frames per source interval.
# x expressions are on the 3840-wide source and retain 1215x2160 actual UHD pixels.
SPECS=[
("G_RS6_C8_031_HILLSIDE_LUNGE",30.95,1.70,"max(0,min(in_w-out_w,180+1280*t))","low head-on mountain corner into near-lens exit"),
("G_RS6_C8_043_ROLLING_DRIVEBY",42.62,1.95,"max(0,min(in_w-out_w,150+1230*t))","fast full-car front-side drive by into rear tracking"),
("G_RS6_C8_085_LOW_CORNER",85.23,1.50,"max(0,min(in_w-out_w,1750+380*t))","low three-quarter over turn"),
("G_RS6_C8_119_FRONTAL_CORNER",118.54,2.00,"1500","constant head-on vehicle coming towards low camera"),
("G_RS6_C8_143_ROAD_REVEAL",142.55,1.85,"max(0,min(in_w-out_w,1700+430*t))","low front-three-quarter mountain road pass"),
("G_RS6_C8_175_GRILLE_SURGE",174.61,1.45,"1080","full RS6 front grille naturally fills frame while rolling"),
("G_RS6_C8_278_COASTAL_REAR",277.73,1.42,"1900","rolling rear three-quarter coastline"),
("G_RS6_C8_436_TAIL_FOLLOW",435.52,1.45,"max(0,min(in_w-out_w,950+400*t))","close rear LED moving-follow accent")
]
def run(cmd,timeout=120):
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 if p.returncode: raise RuntimeError(f"command {cmd[0]} error {p.returncode}\n{p.stderr[-1300:]}")
 return p.stdout
def extract(spec):
 name,start,duration,x,note=spec
 path=OUT/(name+".mp4")
 expr=x.replace(",","\\,")
 filt=f"setpts=PTS-STARTPTS,crop=w=1215:h=2160:x='{expr}':y=0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p"
 run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-rw_timeout","30000000","-ss",str(start),"-i",URL,
 "-t",str(duration),"-an","-vf",filt,"-c:v","libx264","-preset","veryfast","-crf","16",
 "-pix_fmt","yuv420p","-movflags","+faststart","-y",str(path)],160)
 run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(path),"-f","null","-"],50)
 probe=json.loads(run(["ffprobe","-v","error","-show_entries","stream=codec_name,codec_type,width,height,nb_frames,r_frame_rate,pix_fmt:format=duration,size","-of","json",str(path)],20))
 v=next(s for s in probe["streams"] if s.get("codec_type")=="video")
 assert v["width"]==1080 and v["height"]==1920 and v["r_frame_rate"]=="30/1"
 contact=OUT/(name+"_FRAMES.jpg")
 run(["ffmpeg","-nostdin","-v","error","-y","-i",str(path),
      "-vf","fps=5,scale=180:320,tile=6x2","-frames:v","1",str(contact)],40)
 return {"id":name,"start":start,"requested_duration":duration,"actual_duration":float(probe["format"]["duration"]),"source_crop_x":x,"note":note,"ffprobe":probe,"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"full_decode":"PASS","rights":"audi C8 press source, no YUNEX public release permission"}
rows=[]
with ThreadPoolExecutor(max_workers=4) as p:
 fut={p.submit(extract,s):s[0] for s in SPECS}
 for future in as_completed(fut):
  try: rows.append(future.result())
  except Exception as e: rows.append({"id":fut[future],"error":str(e)})
rows.sort(key=lambda x:x["id"])
report={"status":"PASS" if all("full_decode" in r for r in rows) else "PARTIAL_FAIL", "shots":rows, "source_rights":"OWNER-ONLY technical evaluation, NOT licensed for public posting"}
(OUT/"EXTRACTION_QA.json").write_text(json.dumps(report,indent=2))
print(json.dumps([{"id":x["id"],"status":x.get("full_decode","FAILED"),"error":x.get("error")} for x in rows],indent=2))
if report["status"]!="PASS":exit(2)
