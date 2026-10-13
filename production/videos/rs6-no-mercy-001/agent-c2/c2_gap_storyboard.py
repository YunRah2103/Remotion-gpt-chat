#!/usr/bin/env python3
"""C2 fine source-macro search. Dense original 4K frame audit not a 4K file download.
Deliberately sample unclaimed detailed beauty footage, not A2's selected driving windows.
No source video or source audio in QA artifacts. Reject scenery-only and duplicate angles.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from PIL import Image,ImageDraw
import subprocess,io,time,json,hashlib,math
OUT=Path("c2_gap_storyboard");OUT.mkdir(exist_ok=True)
URL="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
# 3.5min windows selected independently from prior motion-biased scan.
# Use 24 uniform scenes sampled across entire runtime (not just high-scoring scenery).
TIMES=([int(t) for t in range(8,90,6)] +
       [int(t) for t in range(104,192,8)] +
       [int(t) for t in range(215,348,9)] +
       [int(t) for t in range(416,632,10)])
W,H=480,270
def inspect(t):
 try:
  p=subprocess.run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error",
    "-rw_timeout","25000000","-ss",str(t),"-i",URL,"-frames:v","1",
    "-vf",f"scale={W}:{H}:flags=fast_bilinear","-q:v","5","-vcodec","mjpeg","-f","image2pipe","-"],
    capture_output=True,timeout=42)
  if p.returncode!=0 or len(p.stdout)<400:raise RuntimeError(str(p.returncode)+": "+p.stderr.decode(errors="replace")[-220:])
  img=Image.open(io.BytesIO(p.stdout)).convert("RGB");img.load()
  return t,img,None
 except Exception as e:return t,None,repr(e)
start=time.monotonic();data=[];imgs={}
with ThreadPoolExecutor(max_workers=6) as pool:
 futures=[pool.submit(inspect,t) for t in TIMES]
 for f in as_completed(futures):
  t,img,err=f.result()
  data.append({"second":t,"decoded":img is not None,"error":err})
  if img is not None:imgs[t]=img
# Group twelve samples on each source-time-ordered contact page.
for part in range(math.ceil(len(TIMES)/12)):
 times=TIMES[part*12:(part+1)*12]
 sheet=Image.new("RGB",(W*3,(H+32)*4),(12,15,20))
 d=ImageDraw.Draw(sheet)
 for i,t in enumerate(times):
  x=(i%3)*W;y=(i//3)*(H+32)
  d.text((x+8,y+7),f"Audi C8 RS6 original 4K   {t//60:02d}:{t%60:02d}",fill=(245,245,242))
  if t in imgs:sheet.paste(imgs[t],(x,y+31))
  else:d.text((x+10,y+40),"decode failed",fill=(235,180,165))
 sheet.save(OUT/f"contact_{part+1:02d}.jpg",quality=82,optimize=True)
report={"source":URL,"source_page":"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874",
 "native_original":"3840x2160 25fps established by prior 4k source probe",
 "evaluated":"dense actual original UHD frames in A2-unclaimed sections","no_source_video_uploaded":True,
 "source_rights":"Audi media terms; re-edit/public release permission NOT cleared",
 "decoded_count":len(imgs),"requested_count":len(TIMES),
 "duration_sec":round(time.monotonic()-start,2),"times":sorted(data,key=lambda a:a["second"])}
(OUT/"report.json").write_text(json.dumps(report,indent=2))
print(json.dumps({"requested":len(TIMES),"decoded":len(imgs),"errors":report["times"] if len(imgs)<len(TIMES) else [],
 "elapsed":report["duration_sec"]},indent=2))
