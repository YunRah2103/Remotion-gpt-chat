#!/usr/bin/env python3
"""Temporal 4K source scout: original Audi Daytona Grey C8 RS6 continuous drive footage.
Frame-only owner QA. Does not publish or package third-party source video.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,time,hashlib
URL="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
OUT=Path("rs6-g-audi-motion-scout");OUT.mkdir(parents=True,exist_ok=True)
WINDOWS=[
("EARLY_CORNER_031",30.6,2.5),("SIDE_CROSS_043",42.6,2.5),
("LOW_CORNER_067",66.6,2.5),("FRONT_ROLL_085",84.6,2.5),
("FRONT_119",118.4,2.5),("REVEAL_143",142.6,2.5),
("COAST_151",150.6,2.5),("FRONT_175",174.6,2.5),
("DRIVE_214",213.3,2.5),("FULL_CAR_278",276.7,2.5),
("REAR_436",435.2,2.5)]
FW,FH=640,360
def scout(key,start,duration):
    cmd=["ffmpeg","-nostdin","-v","error","-rw_timeout","30000000",
         "-ss",str(start),"-i",URL,"-t",str(duration),
         "-vf",f"fps=2,scale={FW}:{FH}:flags=fast_bilinear",
         "-an","-sn","-pix_fmt","rgb24","-f","rawvideo","-"]
    p=subprocess.run(cmd,capture_output=True,timeout=105)
    unit=FW*FH*3
    if p.returncode!=0 or len(p.stdout)<unit*2:
        raise RuntimeError(key+": "+p.stderr.decode(errors="replace")[-500:])
    frames=min(5,len(p.stdout)//unit)
    images=[Image.frombytes("RGB",(FW,FH),p.stdout[j*unit:(j+1)*unit]) for j in range(frames)]
    wide=Image.new("RGB",(FW*frames,FH+34),"#101318")
    pen=ImageDraw.Draw(wide)
    portrait_w=int(FH*9/16)
    vertical=Image.new("RGB",(portrait_w*frames,FH+34),"#101318")
    ppen=ImageDraw.Draw(vertical)
    for j,im in enumerate(images):
        wide.paste(im,(FW*j,34)); pen.text((FW*j+4,6),f"{key} {start+j*0.5:.2f}s",fill="white")
        v=im.crop(((FW-portrait_w)//2,0,(FW+portrait_w)//2,FH))
        vertical.paste(v,(j*portrait_w,34)); ppen.text((j*portrait_w+4,6),f"{start+j*0.5:.2f}s",fill="white")
    wide.save(OUT/(key+"_WIDE.jpg"),quality=87)
    vertical.save(OUT/(key+"_CENTER_9x16.jpg"),quality=87)
    return {"id":key,"start":start,"sample_count":frames,"status":"SOURCE_DECODE_PASS"}
rows=[]
with ThreadPoolExecutor(max_workers=4) as pool:
    futures={pool.submit(scout,*x):x[0] for x in WINDOWS}
    for f in as_completed(futures):
        try: rows.append(f.result())
        except Exception as e:rows.append({"id":futures[f],"status":"FAILED","error":str(e)})
rows.sort(key=lambda x:x["id"])
(OUT/"SCOUT_STATUS.json").write_text(json.dumps({"source":"Audi official C8 RS6 on location 4K","rights":"UNAPPROVED public redistribution; these QA images owner-only", "windows":rows},indent=2))
print(json.dumps(rows,indent=2))
