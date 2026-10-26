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
 {"id":"5017","slug":"classic-red-sports-car","title":"Classic red sports car","page":"https://mixkit.co/free-stock-video/classic-red-sports-car-5017/","start":0.15,"seconds":2.0,"frames":60,"scene":"ENTRY"},
 {"id":"52427","slug":"a-red-sports-car-traveling-along-a-curvy-asphalt-road","title":"A red sports car traveling along a curvy asphalt road at dawn","page":"https://mixkit.co/free-stock-video/a-red-sports-car-traveling-along-a-curvy-asphalt-road-52427/","start":0.3,"seconds":3.0,"frames":90,"scene":"TRACK"},
 {"id":"63","slug":"close-up-of-red-sports-car","title":"Close up of red sports car","page":"https://mixkit.co/free-stock-video/close-up-of-red-sports-car-63/","start":2.4,"seconds":3.0,"frames":90,"scene":"DETAIL"},
 {"id":"5017","slug":"classic-red-sports-car","title":"Classic red sports car","page":"https://mixkit.co/free-stock-video/classic-red-sports-car-5017/","start":4.65,"seconds":2.0,"frames":60,"scene":"HERO"}
]
def sh(args, **kw):
 print("+", " ".join(map(str,args)), flush=True)
 return subprocess.run(list(map(str,args)),check=True,**kw)
def probe(path):
 return json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],text=True))
def asset(c):
 return SRC/(c["id"]+".mp4")
def fetch_footage():
 import urllib.request, urllib.error
 SRC.mkdir(parents=True,exist_ok=True)
 for c in CLIPS:
  p=asset(c)
  if p.exists() and p.stat().st_size>200000: continue
  # Mixkit's specific item page explicitly labels this clip "Stock Video Free License".
  # Do not download from unrestricted search results or use any image as a proxy.
  fetched=False
  for quality in ("large","medium"):
   url="https://assets.mixkit.co/videos/preview/mixkit-"+c["slug"]+"-"+c["id"]+"-"+quality+".mp4"
   print("Downloading licensed source:",url,flush=True)
   try:
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; YUNEX-licensed-footage-experiment/1.0)"})
    with urllib.request.urlopen(req,timeout=50) as r,open(str(p)+".partial","wb") as f:
     shutil.copyfileobj(r,f)
    os.replace(str(p)+".partial",p)
    meta=probe(p)
    v=next(s for s in meta["streams"] if s.get("codec_type")=="video")
    secs=float(meta["format"]["duration"])
    if secs<c["start"]+c["seconds"]-.1 or int(v["width"])<1000: raise RuntimeError("Source short or too low-res")
    print("VERIFIED REAL SOURCE",p.stat().st_size,secs,v["width"],v["height"],flush=True)
    fetched=True;break
   except Exception as e:
    print("Source candidate failed:",e,flush=True)
    if p.exists():p.unlink()
    if pathlib.Path(str(p)+".partial").exists(): pathlib.Path(str(p)+".partial").unlink()
  if not fetched: raise RuntimeError("FOOTAGE_UNAVAILABLE: licensed source "+c["page"]+" cannot be acquired; no substitute images will be used.")
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
 which=0 if idx<60 else 1 if idx<150 else 2 if idx<240 else 3
 local=(idx-[0,60,150,240][which])/FPS
 scene=CLIPS[which]["scene"]
 ih,iw=src.shape[:2]
 # Rich atmospheric fill: heavily defocused light from the actual source video.
 ambient=cv2.resize(src,(540,960),interpolation=cv2.INTER_AREA)
 ambient=cv2.GaussianBlur(ambient,(81,81),0)
 ambient=cv2.resize(ambient,(W,H),interpolation=cv2.INTER_LINEAR).astype(np.float32)
 yy,xx=np.mgrid[0:H,0:W]
 shade=(1.0-0.45*np.abs(yy-H*.52)/(H*.52)).clip(.35,1)
 ambient=ambient*.23*shade[:,:,None]+np.array([12,10,10],dtype=np.float32)
 ambient=np.uint8(np.clip(ambient,0,255))
 # Motion-aware horizontal crop: center tracks the red vehicle rather than random scenery.
 hsv=cv2.cvtColor(src,cv2.COLOR_BGR2HSV)
 m1=cv2.inRange(hsv,(0,75,65),(14,255,255))
 m2=cv2.inRange(hsv,(168,75,65),(179,255,255))
 redmask=cv2.bitwise_or(m1,m2)
 redmask=cv2.morphologyEx(redmask,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
 count,lab,stats,centers=cv2.connectedComponentsWithStats(redmask)
 hits=[(stats[j,4],centers[j,0]) for j in range(1,count) if stats[j,4]>350]
 desired=float(max(hits)[1]) if hits else iw/2
 desired=max(505,min(iw-505,desired))
 state["cx"]=0.78*state.get("cx",desired)+0.22*desired if state.get("scene")==scene else desired
 state["scene"]=scene
 cx=int(state["cx"])
 # Car occupies a large sharp portrait stage, while the full-width surroundings remain alive.
 cropw=995
 x0=max(0,min(iw-cropw,cx-cropw//2))
 crop=src[:,x0:x0+cropw]
 fh=879
 crop=cv2.resize(crop,(W,fh),interpolation=cv2.INTER_CUBIC)
 base=cv2.cvtColor(ambient,cv2.COLOR_BGR2RGB)
 y0=472
 base[y0:y0+fh,:,:]=cv2.cvtColor(crop,cv2.COLOR_BGR2RGB)
 img=Image.fromarray(base)
 o=Image.new("RGBA",(W,H),(0,0,0,0))
 d=ImageDraw.Draw(o)
 # Film-edge treatments, sharp graphic design instead of a generic full-screen HUD.
 d.rectangle([0,y0-4,W,y0+1],fill=(229,66,66,255))
 d.line([(0,y0+fh),(W,y0+fh)],fill=(226,72,69,160),width=3)
 # Optical car-body trace (derived each frame from actual changing red pixels).
 if scene in ("TRACK","DETAIL","HERO") and len(hits)>0:
  hsv2=cv2.cvtColor(crop,cv2.COLOR_BGR2HSV)
  rm=cv2.bitwise_or(cv2.inRange(hsv2,(0,95,65),(13,255,255)),cv2.inRange(hsv2,(168,95,65),(179,255,255)))
  rm=cv2.morphologyEx(rm,cv2.MORPH_CLOSE,np.ones((11,11),np.uint8))
  cs,_=cv2.findContours(rm,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
  candidates=[c for c in cs if cv2.contourArea(c)>700 and cv2.arcLength(c,True)>150]
  if candidates:
   contour=max(candidates,key=cv2.contourArea)
   epsilon=0.005*cv2.arcLength(contour,True)
   pts=cv2.approxPolyDP(contour,epsilon,True).reshape(-1,2)
   if 3<len(pts)<180:
    pix=[(int(p[0]),int(p[1])+y0) for p in pts]
    glow=Image.new("RGBA",(W,H),(0,0,0,0))
    gd=ImageDraw.Draw(glow)
    gd.line(pix+[pix[0]],fill=(*RED,125),width=6,joint="curve")
    glow=glow.filter(ImageFilter.GaussianBlur(9))
    o.alpha_composite(glow)
    d=ImageDraw.Draw(o)
    d.line(pix+[pix[0]],fill=(*RED,150),width=2,joint="curve")
    xx0,yy0,ww,hh=cv2.boundingRect(contour)
    # Reticle explicitly moves with measured chromatic target.
    px=min(W-98,max(95,xx0+ww))
    py=min(y0+fh-100,max(y0+90,y0+yy0+hh/2))
    d.ellipse((px-11,py-11,px+11,py+11),outline=(252,96,88,220),width=2)
    lines(d,[(px+11,py),(px+44,py-28),(px+125,py-28)],(255,111,105,190),2)
    text(d,(px+49,py-58),"BODY TRACK",17,(240,198,198),mono=True)
 # Elegant fixed graphic language, large legible clear-space typography.
 d.rectangle((54,71,65,95),fill=(*RED,255))
 text(d,(85,63),"Y U N E X",31,(248,247,250),bold=True)
 text(d,(85,108),"AUTOMOTIVE / MOTION LAB",18,(177,189,201),mono=True)
 text(d,(810,76),"EXPERIMENT 02",19,(211,218,228),mono=True)
 d.line((62,152,W-62,152),fill=(152,168,185,110),width=2)
 text(d,(68,189),"REAL FOOTAGE.",58,(247,244,243),bold=True)
 text(d,(70,267),"REAL MOMENTUM.",58,(247,244,243),bold=True)
 text(d,(71,356),"CAMERA-TRACKED GRAPHICS  /  30 FPS",20,(203,209,217),mono=True)
 # Technical corner ticks frame subject with edge-safe anchors.
 p=40
 for x,sx in ((p,1),(W-p,-1)):
  for y,sy in ((y0+35,1),(y0+fh-35,-1)):
   lines(d,[(x,y+sy*38),(x,y),(x+sx*47,y)],(238,239,242,175),3)
 # narrow progress rail above footer
 rail=1405
 d.line((70,rail,W-70,rail),fill=(139,154,170,86),width=2)
 d.line((70,rail,70+int((W-140)*((idx+1)/N)),rail),fill=(*RED,245),width=5)
 for mark in (60,150,240):
  x=70+(W-140)*(mark/N)
  d.line((x,rail-7,x,rail+7),fill=(222,230,235,150),width=2)
 text(d,(69,1450),"SEQUENCE / "+scene,22,(247,250,250),mono=True)
 right=f"{t:04.1f}  /  10.0"
 text(d,(815,1450),right,22,(201,208,214),mono=True)
 # Modular clean engine-motion readout; a visualisation, not a claim of measured speed.
 energy=0.29+0.70*ease((t+.25)/9.4)
 for k in range(22):
  x=72+k*41
  hh0=21+int((9+16*math.sin((t*13)+k*.68)**2)*energy)
  d.rounded_rectangle((x,1559-hh0,x+15,1559),radius=2,fill=(235,74,71,220) if k<19*energy else (114,130,150,66))
 text(d,(69,1587),"ENGINE RESPONSE  •  MOTION STUDY",20,(216,224,229),mono=True)
 text(d,(69,1642),"TRACKED IN FRAME",47,(251,246,245),bold=True)
 scene_labels={"ENTRY":"HARD CUT / OPEN","TRACK":"TRAJECTORY / LIVE","DETAIL":"SURFACE / DETAIL","HERO":"VELOCITY / FINALE"}
 text(d,(72,1719),scene_labels[scene],26,(235,112,103),mono=True)
 d.line((70,1805,W-70,1805),fill=(150,164,179,95),width=2)
 text(d,(71,1837),"VISUAL TELEMETRY  /  NOT MEASURED VEHICLE DATA",16,(166,184,197),mono=True)
 # Deliberate 2-frame warm cut glow, not a blackout.
 for boundary in (60,150,240):
  delta=abs(idx-boundary)
  if delta<3:
   d.rectangle((0,y0,W,y0+fh),fill=(250,81,60,int(23*(3-delta)/3)))
 img=Image.alpha_composite(img.convert("RGBA"),o)
 return cv2.cvtColor(np.array(img.convert("RGB")),cv2.COLOR_RGB2BGR)
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
          "source_platform":"Mixkit",
          "license":"Mixkit Stock Video Free License",
          "license_url":"https://mixkit.co/license/modal/videoFree/",
          "checked":"2026-10-26",
          "notes":"Commercial use and modification permitted by the cited item pages. Attribution not required. Do not imply brand endorsement. Technical overlays are original motion graphics. Engine response display is illustrative and not a measurement.",
          "sources":[{"title":c["title"],"page":c["page"],"timestamp":f'{c["start"]:.2f}s for {c["seconds"]:.1f}s',"credit":"Mixkit"} for c in CLIPS],
          "technical":{"width":1080,"height":1920,"fps":30,"frames":300,"duration":10.0,"audio":"original synthesised score and rhythmic throttle layers"}}
 (OUT/"FOOTAGE_CREDITS.json").write_text(json.dumps(credits,indent=2))
 (OUT/"FOOTAGE_CREDITS.md").write_text("# Footage and licence\n\nMixkit Stock Video Free License: https://mixkit.co/license/modal/videoFree/\n\n"+"\n".join(f'- [{c["title"]}]({c["page"]}) — Mixkit (Free License)' for c in CLIPS)+"\n\nEdited, graded, tracked and composited into an original film. Telemetry is illustrative, not measured.\n")
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
