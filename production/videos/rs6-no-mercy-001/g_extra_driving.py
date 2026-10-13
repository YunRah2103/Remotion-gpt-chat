#!/usr/bin/env python3
"""Extract two independent C8 RS6 real driving scenes from native Audi UHD.
Owner-only artifact; NOT licensed for public distribution.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,hashlib
URL="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
OUT=Path("rs6-g-new-driving");OUT.mkdir(exist_ok=True)
SPECS=[
 ("G_RS6_C8_COASTAL_REAR_DRIVEAWAY",221.65,2.45,"max(0,min(in_w-out_w,110+810*t))", "same C8 grey on winding coastline road, genuine accelerating rear rolling"),
 ("G_RS6_C8_SIDE_BEND_FORWARD",455.1,2.25,"max(0,min(in_w-out_w,360+510*t))","same C8 grey on low side turn, strong camera-car movement")
]
def run(cmd,timeout):
    p=subprocess.run(cmd,text=True,capture_output=True,timeout=timeout)
    if p.returncode:raise RuntimeError(p.stderr[-2000:])
    return p.stdout
report=[]
for name,start,dur,x,note in SPECS:
    path=OUT/(name+".mp4")
    filt=f"crop=w=960:h=1707:x='{x}':y=205,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p"
    run(["ffmpeg","-nostdin","-hide_banner","-v","error","-rw_timeout","30000000","-ss",str(start),"-i",URL,
         "-t",str(dur),"-an","-vf",filt,"-c:v","libx264","-preset","veryfast","-crf","17",
         "-movflags","+faststart","-y",str(path)],160)
    probe=json.loads(run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames,pix_fmt","-of","json",str(path)],20))
    run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(path),"-f","null","-"],70)
    run(["ffmpeg","-nostdin","-v","error","-y","-i",str(path),"-vf","fps=4,scale=180:320,tile=5x2","-frames:v","1",str(OUT/(name+"_CONTACT.jpg"))],40)
    sha=hashlib.sha256(path.read_bytes()).hexdigest()
    report.append({"name":name,"source_original":"Audi official 3840x2160 / 25 fps","start":start,"duration_requested":dur,"crop":"960x1707 genuine UHD pixels, slight 1.125x enlargement to 1080 portrait","notes":note,"file":str(path),"sha256":sha,"probe":probe,"decode":"PASS","reuse_rights":"NOT CLEARED; owner-only evaluation"})
(OUT/"NEW_SHOTS_QA.json").write_text(json.dumps(report,indent=2))
print(json.dumps({"count":len(report),"sha256":[x["sha256"] for x in report],"decode":"PASS"},indent=2))
