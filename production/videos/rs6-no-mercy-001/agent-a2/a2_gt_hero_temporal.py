#!/usr/bin/env python3
"""Real Audi C8 RS6 4K five-shot temporal hero inspection; ephemeral source.
Inspect camera/car motion across each candidate, 9:16 center crop and full wide frames.
No original media published. Source still requires reuse authorization.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from PIL import Image,ImageDraw,ImageEnhance
import subprocess,io,json,time,hashlib
OUT=Path("a2_gt_hero_temporal");OUT.mkdir(exist_ok=True)
URL="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:854b7597-7aa0-4506-85cc-5aa63b5e331e/renditions/video_2160p.mp4/as/audi-rs-6-avant-gt-creators-experience-drive-footage-on-location_2160p.mp4?accept-experimental=1"
# Each chosen from human-inspected 24-window true 4K contact sheets.
WINDOWS=[
 ("GT-C8-LOW-REAR",117.35,2.45,"white C8 RS6 GT rolling low rear 3/4 shot"),
 ("GT-C8-LOW-FRONT",216.10,2.45,"white C8 RS6 GT moving low front/side chase camera"),
 ("GT-C8-FRONT-ROAD",267.45,2.45,"RS6 GT frontal tracking down road"),
 ("GT-C8-REAR-TRACK",166.20,2.45,"high fidelity GT rear 3/4 wheel motion"),
 ("GT-C8-SIDE-PASS",83.30,2.45,"fast GT full side pass motion"),
 ("GT-C8-EARLY-FRONT",5.00,2.45,"first C8 GT moving approaching road camera"),
]
FW,FH=480,270
def sample(key,t,d,desc):
    # 5 unique decoded frames of the actual media; FFmpeg source seek never stores source bytes.
    p=subprocess.run(["ffmpeg","-hide_banner","-nostdin","-v","error","-rw_timeout","25000000",
      "-ss",str(t),"-i",URL,"-t",str(d),"-vf",f"fps=2,scale={FW}:{FH}:flags=fast_bilinear",
      "-an","-sn","-pix_fmt","rgb24","-f","rawvideo","-"],
      capture_output=True,timeout=95)
    unit=FW*FH*3
    if p.returncode!=0 or len(p.stdout)<unit*2:
      raise RuntimeError(f"{key}: {p.returncode}: {p.stderr.decode(errors='replace')[-500:]}")
    n=min(5,len(p.stdout)//unit)
    imgs=[Image.frombytes("RGB",(FW,FH),p.stdout[i*unit:(i+1)*unit]) for i in range(n)]
    # JPEG artifacts for internal visual review only, 5 rows x 480x270.
    S=Image.new("RGB",(FW*5,FH+44),(9,11,16))
    d1=ImageDraw.Draw(S)
    for i,img in enumerate(imgs):
        x=i*FW;S.paste(img,(x,43));d1.text((x+6,6),f"{key} {t + i/2:.2f}s",fill=(248,248,245))
    S.save(OUT/f"{key}_wide_frames.jpg",quality=80,optimize=True)
    cw=round(FH*9/16)
    V=Image.new("RGB",(cw*5,FH+43),(9,11,16))
    vd=ImageDraw.Draw(V)
    for i,img in enumerate(imgs):
        x=i*cw
        left=(FW-cw)//2
        V.paste(img.crop((left,0,left+cw,FH)),(x,43))
        vd.text((x+4,6),f"{t + i/2:.2f}s",fill=(248,248,245))
    V.save(OUT/f"{key}_center_crop.jpg",quality=80,optimize=True)
    import numpy as np
    a=np.array(imgs).astype("float32")
    central=a[:,:,FW//3:2*FW//3]
    diff=np.abs(central[1:]-central[:-1]).mean(axis=(1,2,3)).tolist()
    return {"key":key,"source_start_sec":t,"duration_decoded_span_s":(n-1)/2,
       "frames_decoded":n,"half_second_central_frame_difference":diff,
       "motion_score":float(sum(diff)/len(diff)),
       "notes":"Difference may be camera pan or scene change; human QA required",
       "label":desc}
report={"source":URL,"native_source":"3840x2160 / 25fps C8 RS6 GT 2024 white/red livery",
 "rights":"AUDI AG source material; public source/video redistribution not approved",
 "runs":[],"started_utc":time.strftime("%FT%TZ",time.gmtime())}
with ThreadPoolExecutor(max_workers=3) as p:
 jobs={p.submit(sample,*x):x[0] for x in WINDOWS}
 for future in as_completed(jobs):
  try:report["runs"].append(future.result())
  except Exception as e:report["runs"].append({"key":jobs[future],"error":repr(e)})
report["runs"].sort(key=lambda x:x["key"])
(OUT/"report.json").write_text(json.dumps(report,indent=2))
print(json.dumps([{k:r.get(k) for k in ("key","frames_decoded","motion_score","error")} for r in report["runs"]],indent=2))
