#!/usr/bin/env python3
"""Experiment 02: real-footage automotive motion graphics. Do not replace sources with stills."""
from __future__ import annotations
import json, math, os, pathlib, shutil, subprocess, sys, wave
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT=pathlib.Path(__file__).resolve().parent
SRC=ROOT/"sources"
TMP=ROOT/"work"
OUT=ROOT/"output"
W,H,FPS=1080,1920,30
N=300
RED=(242,70,68)
CLIPS=[
 {"id":"f430","title":"Ferrari F430 Spider filmed by FPV drone","page":"https://commons.wikimedia.org/wiki/File:Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","url":"https://upload.wikimedia.org/wikipedia/commons/a/aa/Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","creator":"SE FPV","license":"CC BY 3.0","start":34.4,"seconds":2.0,"frames":60,"scene":"ENTRY"},
 {"id":"f430","title":"Ferrari F430 Spider filmed by FPV drone","page":"https://commons.wikimedia.org/wiki/File:Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","url":"https://upload.wikimedia.org/wikipedia/commons/a/aa/Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","creator":"SE FPV","license":"CC BY 3.0","start":27.0,"seconds":3.0,"frames":90,"scene":"TRACK"},
 {"id":"f430","title":"Ferrari F430 Spider filmed by FPV drone","page":"https://commons.wikimedia.org/wiki/File:Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","url":"https://upload.wikimedia.org/wikipedia/commons/a/aa/Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","creator":"SE FPV","license":"CC BY 3.0","start":31.0,"seconds":3.0,"frames":90,"scene":"DETAIL"},
 {"id":"f430","title":"Ferrari F430 Spider filmed by FPV drone","page":"https://commons.wikimedia.org/wiki/File:Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","url":"https://upload.wikimedia.org/wikipedia/commons/a/aa/Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm","creator":"SE FPV","license":"CC BY 3.0","start":38.0,"seconds":2.0,"frames":60,"scene":"HERO"}
]
def sh(args, **kw):
 print("+", " ".join(map(str,args)), flush=True)
 return subprocess.run(list(map(str,args)),check=True,**kw)
def probe(path):
 return json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],text=True))
def asset(c):
 return SRC/(c["id"]+".mp4")
def fetch_footage():
 import urllib.request
 SRC.mkdir(parents=True,exist_ok=True)
 for c in CLIPS:
  p=asset(c)
  if p.exists() and p.stat().st_size>200000: continue
  print("Downloading author-licensed real footage:",c["url"],flush=True)
  try:
   req=urllib.request.Request(c["url"],headers={"User-Agent":"AutomotiveMotionLab/1.0 (educational video production; referer Commons file page)"})
   with urllib.request.urlopen(req,timeout=90) as r,open(str(p)+".partial","wb") as f:
    shutil.copyfileobj(r,f)
   os.replace(str(p)+".partial",p)
   meta=probe(p)
   v=next(z for z in meta["streams"] if z["codec_type"]=="video")
   duration=float(meta["format"]["duration"])
   if duration<c["start"]+c["seconds"] or int(v["width"])<1000:
    raise RuntimeError("Source resolution/duration unacceptable")
   print("VERIFIED REAL VIDEO SOURCE:",p.stat().st_size,"bytes, duration",duration,flush=True)
  except Exception as e:
   if p.exists():p.unlink()
   if pathlib.Path(str(p)+".partial").exists():pathlib.Path(str(p)+".partial").unlink()
   raise RuntimeError("FOOTAGE_UNAVAILABLE: Commons rights-cleared video not downloadable "+c["page"]+": "+str(e))
def prepare():
 TMP.mkdir(parents=True,exist_ok=True)
 for i,c in enumerate(CLIPS):
  p=TMP/f"shot_{i}.mp4"
  # Preserve actual temporal movement and actual photographs; no freeze/loop.
  sh(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(c["start"]),"-i",asset(c),
   "-an","-vf","fps=30,scale=1440:810:force_original_aspect_ratio=increase,crop=1440:810,eq=contrast=1.12:saturation=1.06:brightness=-0.035,unsharp=3:3:0.5",
   "-frames:v",c["frames"],"-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p",p])
 concat=TMP/"list.txt"
 concat.write_text("".join("file '"+str((TMP/f"shot_{i}.mp4").resolve())+"'\n" for i in range(4)))
 sh(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",concat,
     "-an","-c","copy",TMP/"shots.mp4"])
 info=probe(TMP/"shots.mp4")
 assert int(info["streams"][0]["nb_frames"])==300, "Expected exactly 300 frames"
def font(size,mono=False,bold=False):
 paths=(["/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"] if mono else
       ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if bold else
       ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"])
 return ImageFont.truetype(next((p for p in paths if os.path.exists(p)),paths[0]),size)
def ease(x):
 x=np.clip(x,0,1)
 return float(x*x*(3-2*x))
def alpha_color(rgb,a): return tuple(rgb)+(int(max(0,min(255,a))),)
def lines(d,pts,fill,width=2):
 if len(pts)>1:d.line(pts,fill=fill,width=width,joint="curve")
def text(d,xy,s,size,col=(240,244,250),mono=False,bold=False):
 d.text(xy,s,font=font(size,mono,bold),fill=col,stroke_width=0)
def draw_frame(src, idx, state):
 t=idx/FPS
 shot=0 if idx<60 else 1 if idx<150 else 2 if idx<240 else 3
 scene=CLIPS[shot]["scene"]
 ih,iw=src.shape[:2]
 # Full-screen vertical reframing of genuine moving video. No synthetic background
 # and no paused frames. Camera follows the measured position of the red Ferrari.
 hsv=cv2.cvtColor(src,cv2.COLOR_BGR2HSV)
 mask=cv2.bitwise_or(cv2.inRange(hsv,(0,76,58),(13,255,255)),
                    cv2.inRange(hsv,(169,76,58),(179,255,255)))
 mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
 n,labels,stats,centroids=cv2.connectedComponentsWithStats(mask)
 target=[(stats[j,cv2.CC_STAT_AREA],centroids[j,0]) for j in range(1,n)
         if stats[j,cv2.CC_STAT_AREA]>230 and 130<centroids[j,1]<760]
 # Follow car at a natural camera rate to preserve movement (not pin car motionless).
 desired=float(max(target)[1]) if target else iw*.54
 if state.get("shot")!=shot:
  state["cx"]=desired
  state["shot"]=shot
 else:
  state["cx"]=.93*state["cx"]+.07*desired
 cropw=456
 x0=int(max(0,min(iw-cropw,state["cx"]-cropw/2)))
 region=src[:,x0:x0+cropw]
 frame=cv2.resize(region,(W,H),interpolation=cv2.INTER_CUBIC)
 # Cinematic grade with subtle vignette and graphic readability.
 frame=cv2.convertScaleAbs(frame,alpha=1.07,beta=-9)
 yy,xx=np.mgrid[0:H,0:W]
 vig=np.clip(1-0.30*((xx-W/2)/(W/2))**2-0.18*((yy-H/2)/(H/2))**2,.5,1)
 frame=np.uint8(np.clip(frame.astype(np.float32)*vig[:,:,None],0,255))
 pic=Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)).convert("RGBA")
 overlay=Image.new("RGBA",(W,H),(0,0,0,0))
 # Fade overlays, not the source video. Keep moving Ferrari visually dominant.
 glow=Image.new("RGBA",(W,H),(0,0,0,0))
 glowArr=np.zeros((H,W,4),dtype=np.uint8)
 ys=np.arange(H)
 top=np.clip((610-ys)/610,0,1)**1.1
 bot=np.clip((ys-1310)/610,0,1)**1.1
 glowArr[:,:,3]=(np.maximum(top*.85,bot*.80)*210).astype(np.uint8)[:,None]
 overlay=Image.fromarray(glowArr,"RGBA")
 d=ImageDraw.Draw(overlay)
 # Bespoke restrained editorial graphics, no generic fake speed HUD.
 d.rectangle((52,87,61,119),fill=(*RED,255))
 text(d,(83,85),"Y U N E X",37,(255,255,255),bold=True)
 text(d,(86,137),"MOTION LAB   /   02",21,(210,217,224),mono=True)
 d.line((57,198,1025,198),fill=(240,245,247,100),width=2)
 text(d,(63,257),"FERRARI  F430",45,(255,251,249),bold=True)
 text(d,(65,319),"S P I D E R   /   F P V",25,(237,237,238),mono=True)
 text(d,(65,370),"REAL-WORLD FOOTAGE  /  30 FPS",18,(214,225,228),mono=True)
 d.line((62,1582,1018,1582),fill=(225,232,235,95),width=2)
 d.line((62,1582,62+int(956*(idx+1)/N),1582),fill=(*RED,255),width=6)
 text(d,(67,1626),["01  /  PURSUIT","02  /  ROAD SPEED","03  /  CORNERING","04  /  FINAL CHASE"][shot],
      29,(250,247,245),mono=True)
 text(d,(69,1711),"LIVE BODY TRACK",27,(244,110,101),mono=True)
 text(d,(69,1769),"VISUAL MOTION / NOT VEHICLE TELEMETRY",19,(213,222,227),mono=True)
 text(d,(68,1850),"00:"+f"{t:04.1f}"+"     /     10.0",20,(220,220,226),mono=True)
 # Live chromatic outline, only when red vehicle is clearly observed in this frame.
 rgba=overlay
 cropMask=mask[:,x0:x0+cropw]
 contours,_=cv2.findContours(cropMask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 valid=[c for c in contours if cv2.contourArea(c)>500]
 if valid:
  car=max(valid,key=cv2.contourArea)
  epsilon=cv2.arcLength(car,True)*.013
  vertices=cv2.approxPolyDP(car,epsilon,True).reshape(-1,2)
  xy=[(int(pt[0]*W/cropw),int(pt[1]*H/ih)) for pt in vertices]
  if 4<=len(xy)<150:
   d.line(xy+[xy[0]],fill=(*RED,135),width=3,joint="curve")
   bx,by,bw,bh=cv2.boundingRect(car)
   px=int(min(W-77,max(65,(bx+bw/2)*W/cropw)))
   py=int(min(1430,max(545,(by+bh/2)*H/ih)))
   d.ellipse((px-15,py-15,px+15,py+15),outline=(255,110,102,220),width=3)
   lines(d,[(px+15,py),(px+65,py-45),(min(px+200,W-20),py-45)],(255,120,110,155),2)
 # 2-frame masked red flash at 4 cut points; no black video gaps.
 if idx in [0,60,150,240]:
  d.rectangle((0,0,W,H),fill=(245,76,67,18))
 return cv2.cvtColor(np.asarray(Image.alpha_composite(pic,rgba).convert("RGB")),
                      cv2.COLOR_RGB2BGR)
def synth():
 sr=48000
 n=10*sr
 t=np.arange(n,dtype=np.float64)/sr
 freq=54+86*(t/10.0)**1.1
 phase=2*np.pi*np.cumsum(freq)/sr
 sig=.18*np.sin(phase)+.068*np.sin(2.002*phase)+.035*np.sin(3.02*phase)
 # Harmonic throttle swells and restrained rhythmic low-end.
 sig*=.55+.43*np.sin(2*np.pi*.23*t)**2
 rng=np.random.default_rng(20261026)
 noise=rng.normal(0,1,n)
 noise=np.convolve(noise,np.ones(15)/15,mode="same")
 sig+=.04*noise
 for at in [0,1.04,2,3.03,4.04,5,6.15,7.07,8,9.05]:
  dt=t-at
  sel=(dt>=0)&(dt<.24)
  sig[sel]+=.27*np.exp(-dt[sel]*25)*np.sin(2*np.pi*(75-20*dt[sel])*dt[sel])
 for at in [2,5,8]:
  dt=t-at
  sel=(dt>=0)&(dt<.12)
  sig[sel]+=.13*rng.normal(0,1,sel.sum())*np.exp(-dt[sel]*36)
 sig*=np.minimum(1,t/.09)*np.minimum(1,(10-t)/.11)
 sig/=max(1,np.max(abs(sig))/.78)
 pcm=(sig*32767).astype("<i2")
 with wave.open(str(TMP/"original_sound_design.wav"),"wb") as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(pcm.tobytes())
def render():
 TMP.mkdir(exist_ok=True)
 OUT.mkdir(exist_ok=True)
 cap=cv2.VideoCapture(str(TMP/"shots.mp4"))
 cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pixel_format","bgr24",
      "-video_size",f"{W}x{H}","-framerate",str(FPS),"-i","pipe:0","-i",str(TMP/"original_sound_design.wav"),
      "-map","0:v","-map","1:a","-frames:v",str(N),"-c:v","libx264","-preset","veryfast","-crf","19",
      "-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-ar","48000","-t","10","-movflags","+faststart",
      str(OUT/"EXPERIMENT_02_LIVE_ACTION_1080x1920.mp4")]
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 state={}
 for i in range(N):
  ok,frame=cap.read()
  if not ok: raise RuntimeError(f"Source ended early at frame {i}")
  pic=draw_frame(frame,i,state)
  try:proc.stdin.write(pic.tobytes())
  except BrokenPipeError:raise RuntimeError("FFmpeg writer stopped; see encoder logs")
  if i%30==0:print("compositing frame",i,"/",N,flush=True)
 cap.release();proc.stdin.close()
 rc=proc.wait()
 if rc:raise RuntimeError("FFmpeg video mastering failed "+str(rc))
def qa():
 video=OUT/"EXPERIMENT_02_LIVE_ACTION_1080x1920.mp4"
 info=probe(video)
 streams=info["streams"];v=next(s for s in streams if s["codec_type"]=="video")
 a=next(s for s in streams if s["codec_type"]=="audio")
 assert int(v["width"])==1080 and int(v["height"])==1920
 assert v["avg_frame_rate"]=="30/1" and int(v["nb_frames"])==300
 assert 9.98<=float(info["format"]["duration"])<=10.06
 assert a["codec_name"]=="aac"
 sh(["ffmpeg","-v","error","-xerror","-i",video,"-f","null","-"])
 for s in (0.3,2.7,5.8,8.8):
  sh(["ffmpeg","-loglevel","error","-y","-ss",str(s),"-i",video,"-frames:v","1",OUT/f"proof_{str(s).replace('.','_')}.jpg"])
 from PIL import Image
 ims=[]
 for p in sorted(OUT.glob("proof_*.jpg")):
  im=Image.open(p).convert("RGB");im.thumbnail((270,480));ims.append(im)
 sheet=Image.new("RGB",(270*len(ims),480),(9,13,18))
 for i,im in enumerate(ims):sheet.paste(im,(270*i,0))
 sheet.save(OUT/"contact_sheet.jpg",quality=90)
 credits={"title":"Experiment 02 — Live-action Automotive Motion Graphics",
          "source_platform":"Wikimedia Commons",
          "license":"Creative Commons Attribution 3.0 Unported",
          "license_url":"https://creativecommons.org/licenses/by/3.0/",
          "checked":"2026-10-26",
          "attribution":"Ferrari F430 Spider driving as viewed from FPV drone.webm by SE FPV, CC BY 3.0 via Wikimedia Commons, source originally published on YouTube (ouCi0FfEOx0). Cropped, trimmed, colour graded, overlaid original motion graphics, with original sound design. CC BY 3.0 attribution; no endorsement is implied. Source Commons notes review pending.",
          "source":"https://commons.wikimedia.org/wiki/File:Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm",
          "notes":"Real FPV driving footage; no still-image replacement. Illustrated telemetry is not measured speed.",
          "segments":[{"source_start":c["start"],"seconds":c["seconds"],"scene":c["scene"]} for c in CLIPS],
          "technical":{"width":1080,"height":1920,"fps":30,"frames":300,"duration":10.0,"audio":"original synthesised score"}}
 (OUT/"FOOTAGE_CREDITS.json").write_text(json.dumps(credits,indent=2))
 (OUT/"FOOTAGE_CREDITS.md").write_text("# Footage attribution and licence\n\n[**Ferrari F430 Spider driving as viewed from FPV drone.webm**](https://commons.wikimedia.org/wiki/File:Ferrari_F430_Spider_driving_as_viewed_from_FPV_drone.webm) by **SE FPV**, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Original source: [SE FPV on YouTube](https://www.youtube.com/watch?v=ouCi0FfEOx0).\n\nAdaptations: four edited segments, colour grade, portrait reframing, dynamic overlays, original audio. This version credits the author without implying endorsement. Licence review of Wikimedia source is marked pending; verify before unrestricted distribution.\n\nVisual telemetry is illustrative, not measured real-vehicle performance.\n")
 (OUT/"verify.json").write_text(json.dumps({"status":"PASS","format":info["format"],"video":v,"audio":a},indent=2))
 print("QA PASS",json.dumps({"frames":v["nb_frames"],"fps":v["avg_frame_rate"],"duration":info["format"]["duration"],"size":video.stat().st_size}))
if __name__=="__main__":
 try:
  fetch_footage();prepare();synth();render();qa()
 except Exception as e:
  OUT.mkdir(parents=True,exist_ok=True)
  (OUT/"BLOCKER.txt").write_text(str(e)+"\n")
  print("EXPERIMENT FAILED (NO FAKE FOOTAGE):",e,file=sys.stderr)
  raise
