#!/usr/bin/env python3
"""YUNEX Cars V3: privately test physical continuity from a banked movie shot
to preserved real track footage. No protected frames/derivatives in public artifacts."""
from pathlib import Path
import os, subprocess, urllib.request, hashlib, math, json
import cv2, numpy as np

WD=Path("work/cars_v3"); WD.mkdir(parents=True,exist_ok=True)
MOVIE=Path(os.environ["CARS_SOURCE"])
REAL=WD/"red_night_original.mp4"
URL="https://videos.pexels.com/video-files/18447538/18447538-hd_1920_1080_60fps.mp4"
SHAS={"animated":"752c6f1feedd973baa10a2c071d2ebef4b84f2d70f4ce020f36eb4603d378bd2",
      "real":"fb6cf9b16199e40a329537c8d3f1236bf8384a2b9d393721ade59e3e9c51b1c6"}
def digest(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
assert MOVIE.exists() and digest(MOVIE)==SHAS["animated"],"Private Disney input mismatched"
with urllib.request.urlopen(urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0"}),timeout=90) as r,open(REAL,"wb") as f:
 while b:=r.read(1<<20): f.write(b)
assert digest(REAL)==SHAS["real"],"Original real source SHA256 mismatched"

def probe(p):
 return json.loads(subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)],capture_output=True,text=True,check=True).stdout)
def clip_frames(path,t0,t1):
 cap=cv2.VideoCapture(str(path))
 cap.set(cv2.CAP_PROP_POS_MSEC,t0*1000)
 fps=cap.get(cv2.CAP_PROP_FPS)
 result=[]
 n=int(math.ceil((t1-t0)*fps))+8
 for _ in range(n):
  t=cap.get(cv2.CAP_PROP_POS_MSEC)/1000
  ok,frame=cap.read()
  if not ok:break
  if t>=t0-0.05 and t<=t1+.07:
   result.append((t,frame))
 cap.release()
 if len(result)<15:raise RuntimeError(f"Missing frames {path}: {len(result)}")
 return result

# Keep user's chosen banked McQueen scene & real footage unchanged.
# A full movie segment includes >1 built-in camera view; choose its coherent final action
# and preserve preceding 1.6-2.1s of visible banking rather than cut to an unrelated opening.
A=clip_frames(MOVIE,11.58,14.12)
B=clip_frames(REAL,1.16,3.98)
def frame_at(seq,t):
 return min(seq,key=lambda v:abs(v[0]-t))[1]
W,H=720,1280
def crop_at(src,dx=0):
 ih,iw=src.shape[:2]
 target=int(round(ih*W/H))
 x=int(max(0,min(iw-target,(iw-target)/2+dx)))
 f=src[:,x:x+target]
 return cv2.resize(f,(W,H),interpolation=cv2.INTER_AREA)
def red_info(img):
 sm=cv2.resize(img,(180,320),interpolation=cv2.INTER_AREA)
 hsv=cv2.cvtColor(sm,cv2.COLOR_BGR2HSV)
 mask=cv2.inRange(hsv,np.array([0,90,52]),np.array([12,255,255]))
 mask=cv2.bitwise_or(mask,cv2.inRange(hsv,np.array([170,90,52]),np.array([179,255,255])))
 # True bodywork is in central/lower part of portrait image (avoid red spectators)
 mask[:65]=0
 if cv2.countNonZero(mask)<100:
  return dict(cx=.5,cy=.55,area=0.0,wide=0.,height=0.)
 points=cv2.findNonZero(mask)
 x,y,w,h=cv2.boundingRect(points)
 mm=cv2.moments(mask)
 return dict(cx=mm["m10"]/mm["m00"]/180,cy=mm["m01"]/mm["m00"]/320,
  area=cv2.countNonZero(mask)/(180*320),wide=w/180,height=h/320)
def frame_energy(src,t):
 f1=cv2.cvtColor(cv2.resize(crop_at(frame_at(src,t-.12)),(180,320)),cv2.COLOR_BGR2GRAY)
 f2=cv2.cvtColor(cv2.resize(crop_at(frame_at(src,t)),(180,320)),cv2.COLOR_BGR2GRAY)
 return float(np.mean(cv2.absdiff(f1,f2))/255)
def energy_and_motion(src,t):
 f1=cv2.cvtColor(cv2.resize(crop_at(frame_at(src,t-.10)),(180,320)),cv2.COLOR_BGR2GRAY)
 f2=cv2.cvtColor(cv2.resize(crop_at(frame_at(src,t)),(180,320)),cv2.COLOR_BGR2GRAY)
 flow=cv2.calcOpticalFlowFarneback(f1,f2,None,.5,3,21,3,5,1.1,0)
 return np.median(flow[65:270,:,0]),np.median(flow[65:270,:,1])

# Cut evaluation is deliberately restricted to final moving section of banked clip,
# not the original near-static front-on frame at 8.2s.
candidates=[]
for ta in np.arange(12.93,13.96,.13):
 fa=crop_at(frame_at(A,float(ta)))
 ma=red_info(fa)
 for tb in np.arange(1.24,2.90,.12):
  fb=crop_at(frame_at(B,float(tb)))
  mb=red_info(fb)
  if ma["area"]<.012 or mb["area"]<.015:continue
  vx1,vy1=energy_and_motion(A,float(ta))
  vx2,vy2=energy_and_motion(B,float(tb))
  # Compare size, vertical and horizontal centroid and background pan in source native order.
  # Penalize opposite camera movement (not simply color similarity).
  pan_error=min(3.5,abs(vx1-vx2)/2)
  area_error=abs(math.log((ma["area"]+.015)/(mb["area"]+.015)))
  score=(abs(ma["cx"]-mb["cx"])*3.0+
   abs(ma["cy"]-mb["cy"])*1.4+area_error*1.3+
   pan_error*.35 + abs(vy1-vy2)*.08)
  candidates.append((score,round(float(ta),3),round(float(tb),3),ma,mb,round(float(vx1),3),round(float(vx2),3)))
if not candidates:raise RuntimeError("No source-matched moving red car cut")
candidates.sort(key=lambda x:x[0])
best=candidates[0]
_,CUT_A,CUT_B,ra,rb,vxa,vxb=best
print("MATCH_CANDIDATES",json.dumps([
 {"score":round(float(z[0]),3),"pixar_end":z[1],"real_start":z[2],"pixar_motion_x":z[5],"real_motion_x":z[6],"pixar_red_area":round(z[3]["area"],3),"real_red_area":round(z[4]["area"],3)}
 for z in candidates[:9]]),flush=True)

# Preserve visible banking as a ~2s build, then carry the real-car approach to its flyby.
START_A=11.63
END_B=3.82
MOVIE_N=int(round((CUT_A-START_A)*30))
REAL_N=int(round((END_B-CUT_B)*30))
if MOVIE_N<22 or REAL_N<24:raise RuntimeError("Resulting shot would be too short")
# dynamic reframe real shot so vehicle is in nearly same location immediately on cut
# clamp to screen / no fake geometry, and ease back to untouched camera over 0.9s
pixel_shift=(rb["cx"]-ra["cx"])*608
shift_real=max(-110,min(110,pixel_shift))
A_last=crop_at(frame_at(A,CUT_A))
B_first=crop_at(frame_at(B,CUT_B),dx=shift_real)
# Derived per-channel contrast/luma correction ONLY for first few frames after cut
def mean_bgr(img):
 x=cv2.resize(img,(100,180))
 return np.mean(x.reshape(-1,3),axis=0)
target=mean_bgr(A_last)
origin=mean_bgr(B_first)
correction=np.clip(target-origin,-15,15)
# Rendering two options: (1) 2-frame softened camera cut, (2) 0.1s motivated leftward high-speed whip.
report={"transition":"banked Pixar race footage -> original red #15 real short-track footage",
 "source_movie":"owner-only Pixar issue 79 (1920x1080)",
 "real_source":"Pexels #18447538 original 1920x1080 ~59.94fps, unchanged footage identity",
 "cut_animated_offset":CUT_A,"cut_real_offset":CUT_B,
 "movie_start_offset":START_A,"real_end_offset":END_B,
 "animated_red":ra,"real_red":rb,"camera_pan_x":[vxa,vxb],
 "alignment_shift_original_pixels":round(shift_real,2),
 "mean_luma_correction_bgr":[round(float(z),2) for z in correction],
 "match_cost":round(float(best[0]),4),
 "results":[],"privacy":"All MP4s stay private GitHub DRAFT release; metrics only committed",
 "qualifications":"Camera match is not a true continuous take. No 3D morph, no fake car footage, no soundtrack."}
# For frame image generation use direct source frames to avoid resampling jerks.
def produce(kind):
 filename=WD/f"cars_banked_connected_{kind}.mp4"
 codec=cv2.VideoWriter_fourcc(*"mp4v")
 tmp=WD/f"intermediate_{kind}.mp4"
 writer=cv2.VideoWriter(str(tmp),codec,30,(W,H))
 if not writer.isOpened():raise RuntimeError("Cannot open video writer")
 prev=None
 for i in range(MOVIE_N):
  p=i/max(1,MOVIE_N-1)
  t=START_A+(CUT_A-START_A)*p
  # Smooth slight acceleration only in final 12 frames, max 1.2x
  if i>=MOVIE_N-12:
   q=(i-(MOVIE_N-12))/12
   t+=.055*q*q
  frame=crop_at(frame_at(A,min(CUT_A,t)))
  # keep camera motion untouched, mild pan blur only near transition in whip variant
  if kind=="whip" and i>=MOVIE_N-2:
   frame=cv2.GaussianBlur(frame,(17,3),3.3)
  writer.write(frame);prev=frame
 for i in range(REAL_N):
  p=i/max(1,REAL_N-1)
  t=CUT_B+(END_B-CUT_B)*p
  fade=max(0,1-i/27)
  # smooth x crop and light up; do not mirror genuine race car markings
  fr=crop_at(frame_at(B,t),dx=shift_real*fade)
  if fade>.001: fr=np.clip(fr.astype(np.float32)+correction[None,None,:]*fade,0,255).astype(np.uint8)
  if kind=="soft" and i<2:
   # 1-2 frame (<0.07s) blend, no obvious slideshow dissolve
   mix=[.70,.24][i]
   fr=cv2.addWeighted(fr,1-mix,prev,mix,0)
  if kind=="whip" and i<3:
   # Very short pan-speed transition, not a wipe or fake morph
   sig=[5.0,3.0,1.0][i]
   fr=cv2.GaussianBlur(fr,(21,3),sig)
  writer.write(fr)
 writer.release()
 cmd=["ffmpeg","-y","-hide_banner","-loglevel","error","-i",str(tmp),"-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-r","30","-movflags","+faststart","-an",str(filename)]
 p=subprocess.run(cmd,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[-800:])
 p=subprocess.run(["ffmpeg","-hide_banner","-v","error","-xerror","-i",str(filename),"-f","null","-"],capture_output=True,text=True)
 if p.returncode:raise RuntimeError("Decode fail: "+p.stderr[-800:])
 m=probe(filename)
 video=next(z for z in m["streams"] if z["codec_type"]=="video")
 report["results"].append({"variant":kind,"filename":filename.name,"bytes":filename.stat().st_size,
  "sha256":digest(filename),"duration":round(float(m["format"]["duration"]),3),
  "resolution":[video["width"],video["height"]],"fps":video["avg_frame_rate"],"full_decode":"PASS"})
 tmp.unlink()
for mode in ("soft","whip"):produce(mode)
out=Path("production/research/cars-banked-motion-v3-20261014");out.mkdir(parents=True,exist_ok=True)
(out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print("FINAL_MATCH",json.dumps(report),flush=True)
