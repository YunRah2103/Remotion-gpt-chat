#!/usr/bin/env python3
"""Generate *low-resolution review contact sheets*, never source MP4s or source audio.
Film-still examples for internal criticism only. Audi AG rights remain reserved.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, time, json, hashlib, io

ROOT=Path("c2_uhd_detail_scan");ROOT.mkdir(exist_ok=True)
URL="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
TIMES=[355.0,359.0,363.0,367.0,371.0,375.0,379.0,383.0,387.0,391.0,395.0,399.0,403.0,407.0]
W,H=480,270
def frames(t):
 cmd=["ffmpeg","-hide_banner","-nostdin","-v","error","-rw_timeout","30000000",
      "-ss",str(max(0,t-0.15)),"-i",URL,"-t","1.65","-vf",f"fps=2,scale={W}:{H}:flags=fast_bilinear",
      "-an","-sn","-pix_fmt","rgb24","-f","rawvideo","-"]
 p=subprocess.run(cmd,capture_output=True,timeout=90)
 unit=W*H*3
 if p.returncode!=0 or len(p.stdout)<unit:raise RuntimeError(p.stderr.decode(errors="replace")[-450:])
 count=min(3,len(p.stdout)//unit)
 return [Image.frombytes("RGB",(W,H),p.stdout[i*unit:(i+1)*unit]) for i in range(count)]
def labeled(im,label,cell_w,cell_h):
 tile=Image.new("RGB",(cell_w,cell_h),(12,15,20))
 x=(cell_w-im.width)//2;y=26
 tile.paste(im,(x,y))
 d=ImageDraw.Draw(tile);d.text((6,6),label,fill=(240,240,235))
 return tile
full=Image.new("RGB",(W*3,(H+28)*len(TIMES)),(6,8,12))
# 9:16 center crop is scouting-only. Final edit crop requires intentional repositioning.
crop_w=int(H*9/16)
portrait=Image.new("RGB",(crop_w*3,(H+28)*len(TIMES)),(6,8,12))
log=[]
for idx,t in enumerate(TIMES):
 result={"rank":idx+1,"time_s":t,"source":"verified official native 2160p"}
 try:
  images=frames(t)
  result["decoded_frames"]=len(images)
  for k,img in enumerate(images):
   lab=f"{idx+1}: {t:.2f}s  | sample {k+1}/3"
   full.paste(labeled(img,lab,W,H+28),(k*W,idx*(H+28)))
   cx=(W-crop_w)//2
   vertical=img.crop((cx,0,cx+crop_w,H))
   portrait.paste(labeled(vertical,str(idx+1)+" / "+str(k+1),crop_w,H+28),
                  (k*crop_w,idx*(H+28)))
  result["status"]="decoded_original_UHD_to_low_res_review_frames"
 except Exception as exc:
  result["error"]=repr(exc)
 log.append(result)
for name,im in (("full-frame-QA.jpg",full),("center-9x16-crop-QA.jpg",portrait)):
 p=ROOT/name
 im.save(p,quality=77,optimize=True,subsampling=1)
logfile=ROOT/"metadata.json"
logfile.write_text(json.dumps({"rights":"Audi rights reserved; contact JPEGs for source QA only; do not redistribute original footage",
     "source_page":"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874",
     "source_master_native":[3840,2160],"qa_preview":[480,270],"review":log,"generated_utc":time.strftime("%FT%TZ",time.gmtime())},indent=2))
print(json.dumps({"decoded_times":len([x for x in log if x.get("decoded_frames")]),
 "errors":[x for x in log if x.get("error")],"files":[{"name":x.name,"bytes":x.stat().st_size,"sha256":hashlib.sha256(x.read_bytes()).hexdigest()} for x in ROOT.iterdir()]},indent=2))
