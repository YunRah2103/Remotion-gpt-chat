#!/usr/bin/env python3
"""Private animated->real match-cut proof; copyrighted frames never published to public artifacts."""
import os, json, hashlib, subprocess, math, pathlib
import cv2, numpy as np

ROOT=pathlib.Path("work/cars-transition"); ROOT.mkdir(parents=True,exist_ok=True)
animated=pathlib.Path(os.environ["CARS_SOURCE"])
real={
 "red_night":ROOT/"red_night.mp4",
 "night_impact":ROOT/"night_impact.mp4",
}
expected={
 "red_night":("https://videos.pexels.com/video-files/18447538/18447538-hd_1920_1080_60fps.mp4","fb6cf9b16199e40a329537c8d3f1236bf8384a2b9d393721ade59e3e9c51b1c6"),
 "night_impact":("https://videos.pexels.com/video-files/18447537/18447537-hd_1920_1080_60fps.mp4","311be2dc9ba27c3f4cf9c7f2513ba47082ce2ba55be1291c983d6f9c5cdba2c9"),
}
def cmd(args,check=True):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 if check and p.returncode: raise RuntimeError(f"command failed: {args[0]}: {p.stderr[-1200:]}")
 return p
def digest(path):
 s=hashlib.sha256()
 with open(path,"rb") as f:
  for c in iter(lambda:f.read(1024*1024),b""):s.update(c)
 return s.hexdigest()
assert digest(animated)=="752c6f1feedd973baa10a2c071d2ebef4b84f2d70f4ce020f36eb4603d378bd2","Disney private source SHA mismatch"
for name,path in real.items():
 import urllib.request
 url,sha=expected[name]
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (YUNEX private transition QA)"})
 with urllib.request.urlopen(req,timeout=90) as r,open(path,"wb") as f:
  while c:=r.read(1024*1024):f.write(c)
 assert digest(path)==sha,f"{name} original source SHA mismatch"
def probe(path):
 return json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]).stdout)
for name,path in [("pixar",animated)]+list(real.items()):
 p=probe(path)
 stream=next(s for s in p["streams"] if s["codec_type"]=="video")
 print("SOURCE_QA",name,stream["width"],stream["height"],stream["r_frame_rate"],p["format"]["duration"],digest(path),flush=True)
 cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(path),"-map","0:v:0","-f","null","-"])
 
def frame(path,t):
 cap=cv2.VideoCapture(str(path))
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000)
 ok,fr=cap.read()
 cap.release()
 if not ok or fr is None:raise RuntimeError(f"frame read failed at {path.name} {t}")
 H,W=fr.shape[:2]
 cw=round(H*9/16)
 x=(W-cw)//2
 crop=fr[:,x:x+cw]
 small=cv2.resize(crop,(180,320),interpolation=cv2.INTER_AREA)
 return small
def feature(f):
 hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV)
 # HSV saturation gates for truly red pixels; remove sky, track wall and upper half.
 lo=cv2.inRange(hsv,np.array([0,85,48]),np.array([12,255,255]))
 hi=cv2.inRange(hsv,np.array([170,85,48]),np.array([179,255,255]))
 mask=cv2.bitwise_or(lo,hi)
 mask[:int(mask.shape[0]*0.21),:]=0
 n=int(cv2.countNonZero(mask)); h,w=mask.shape
 if n>80:
  m=cv2.moments(mask,binaryImage=True);x=m["m10"]/m["m00"]/w;y=m["m01"]/m["m00"]/h
  inds=cv2.findNonZero(mask);bx,by,bw,bh=cv2.boundingRect(inds)
  bounds=[round(v,3) for v in (bx/w,by/h,bw/w,bh/h)]
 else:x,y,bounds=.5,.55,[0,0,0,0]
 lab=cv2.cvtColor(f,cv2.COLOR_BGR2LAB)
 lum=float(lab[:,:,0].mean()/255)
 return dict(red_fraction=round(n/(w*h),4),red_cx=round(x,3),red_cy=round(y,3),red_box=bounds,luma=round(lum,4))
def delta(path,t):
 a=feature(frame(path,t-.18));b=feature(frame(path,t))
 return round(b["red_cx"]-a["red_cx"],3)
A=[round(t,2) for t in np.arange(7.5,10.01,0.1)]
B={
 "red_night":[round(t,2) for t in np.arange(1.2,2.26,.1)],
 "night_impact":[round(t,2) for t in np.arange(4.3,5.61,.1)]
}
cache={}
for t in A:cache[("pixar",t)]=feature(frame(animated,t))
for name,ts in B.items():
 for t in ts:cache[(name,t)]=feature(frame(real[name],t))
def score(a,b):
 if a["red_fraction"]<.008 or b["red_fraction"]<.008:return 100
 # Scale and placement of actual red foreground car; brightness only a modest contribution.
 return (abs(a["red_cx"]-b["red_cx"])*2.0+
         abs(a["red_cy"]-b["red_cy"])*1.5+
         abs(math.log((a["red_fraction"]+.005)/(b["red_fraction"]+.005)))*.6+
         abs(a["luma"]-b["luma"])*.35)
results={}
for name,ts in B.items():
 candidates=[]
 for ta in A:
  for tb in ts:
   s=score(cache[("pixar",ta)],cache[(name,tb)])
   candidates.append((s,ta,tb))
 candidates.sort()
 best=candidates[:8]
 # Preserve the story setup: put last 0.7s of real A into each test, then 1.4s of B.
 s,ta,tb=best[0]
 af=cache[("pixar",ta)]
 bf=cache[(name,tb)]
 # Real perspective mismatch can be more important than numeric color alignment.
 out=ROOT/("cars_vs_"+name+".mp4")
 filter_graph="[0:v]fps=30,crop=608:1080:(iw-608)/2:0,scale=720:1280:flags=lanczos,setsar=1,format=yuv420p[a];[1:v]fps=30,crop=608:1080:(iw-608)/2:0,scale=720:1280:flags=lanczos,setsar=1,format=yuv420p[b];[a][b]concat=n=2:v=1:a=0[out]"
 # Source ranges chosen using real source times, allowing A incoming motion for 0.7s.
 cmd(["ffmpeg","-hide_banner","-loglevel","error","-y",
  "-ss",str(ta-.7),"-t","0.7","-i",str(animated),
  "-ss",str(tb),"-t","1.4","-i",str(real[name]),
  "-filter_complex",filter_graph,"-map","[out]",
  "-c:v","libx264","-preset","medium","-crf","19","-movflags","+faststart","-r","30","-an",str(out)])
 full=cmd(["ffmpeg","-hide_banner","-v","error","-xerror","-i",str(out),"-f","null","-"])
 op=probe(out)
 st=next(s for s in op["streams"] if s["codec_type"]=="video")
 results[name]=dict(
  recommended_cut_end_pixar_offset=ta,
  recommended_cut_start_real_offset=tb,
  source_pixar_upload_time=round(624+ta,2),
  pixar_pre_cut_range=[round(ta-.7,2),ta],
  real_post_cut_range=[tb,round(tb+1.4,2)],
  metrics=dict(red_car_frame_similarity_cost=round(s,3),
      animated_last_frame=af,real_first_frame=bf,
      animated_horizontal_red_movement_delta=delta(animated,ta),
      real_horizontal_red_movement_delta=delta(real[name],tb)),
  other_candidate_points=[{"a":a,"b":b,"score":round(sc,3)} for sc,a,b in best[1:5]],
  technical_preview=dict(filename=out.name,width=st["width"],height=st["height"],fps=st["avg_frame_rate"],duration=float(op["format"]["duration"]),bytes=out.stat().st_size,sha256=digest(out),full_decode="PASS"),
  frame_accuracy_note="Frame sampling via OpenCV; exact cut on 30fps test timeline, underlying 25/59.94 FPS sources converted. Test is NOT the final film."
 )
 summary={
 "test":"YUNEX Cars animated to real stock-car transition frame geometry",
 "pixar_source_issue":79,
 "rights":"Pixar private owner-only draft, do not publish frames/preview in public GitHub artifacts",
 "source_match":"Original real NASCAR sanction for red #15 NOT verified; authentic short-track stock car video",
 "crop":"true centered 9:16 horizontal crop from 1920x1080; upscaled from native ~608x1080",
 "results":results,
 "caveats":["Numeric red-region matching is a heuristic, not proof of visual seamlessness","Nose orientation and camera parallax must still be visually judged","No soundtrack used; user has not chosen music"]
 }
# Only public metrics output; DO NOT commit or upload private movie footage, source frame previews.
pub=pathlib.Path("production/research/cars-transition-private-test-20261014")
pub.mkdir(parents=True,exist_ok=True)
(pub/"report.json").write_text(json.dumps(summary,indent=2)+"\n")
print("RESULTS_JSON",json.dumps(results,sort_keys=True),flush=True)
print("QA_PRIVATE_PREVIEWS",[(x.name,x.stat().st_size) for x in ROOT.glob("cars_vs_*.mp4")],flush=True)
