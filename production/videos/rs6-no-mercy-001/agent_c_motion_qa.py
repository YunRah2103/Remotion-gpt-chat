#!/usr/bin/env python3
"""Analyze real Audi C8 RS6 footage for scene boundaries and motion; temporary source only."""
import urllib.request, tempfile, pathlib, subprocess, json, re, hashlib
URL="https://audi-mediacenter.pl/data/filmy/48075/o/7405893_content_1280x720.mp4"
with tempfile.TemporaryDirectory() as td:
 p=pathlib.Path(td)/"rs6.mp4"
 with urllib.request.urlopen(urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0"}),timeout=70) as r, p.open("wb") as f:
  while b:=r.read(1<<20): f.write(b)
 print("SOURCE_SHA",hashlib.file_digest(p.open("rb"),"sha256").hexdigest(),flush=True)
 # Scene boundary detection: actual changes, no invented shots.
 proc=subprocess.run(["ffmpeg","-hide_banner","-i",str(p),"-vf","scale=320:-1,select='gt(scene,0.28)',showinfo","-an","-f","null","-"],capture_output=True,text=True,timeout=240)
 times=[]
 for line in proc.stderr.splitlines():
  if "pts_time:" in line and "showinfo" in line:
   m=re.search(r"pts_time:([0-9.]+)",line)
   if m:times.append(round(float(m.group(1)),2))
 print("SCENE_DETECT_RC",proc.returncode,"SCENE_TIMES",json.dumps(times),flush=True)
 # derive 2s intervals as candidates, measure changes in 6 RGB frames around each segment.
 shortlist=[]
 for i,t in enumerate(times[:200]):
  if t<2 or t>635:continue
  cmd=["ffmpeg","-v","error","-ss",str(t),"-i",str(p),"-t","2.0","-vf","fps=3,scale=96:54,format=gray","-f","rawvideo","pipe:1"]
  q=subprocess.run(cmd,capture_output=True,timeout=15)
  n=96*54;frames=[q.stdout[z:z+n] for z in range(0,len(q.stdout),n) if len(q.stdout[z:z+n])==n]
  if len(frames)<3:continue
  motion=sum(sum(abs(a-b) for a,b in zip(frames[k],frames[k+1]))/n for k in range(len(frames)-1))/(len(frames)-1)
  luma=sum(sum(x)/len(x) for x in frames)/len(frames)
  contrast=sum((sum((v-(sum(x)/len(x)))**2 for v in x)/len(x))**.5 for x in frames)/len(frames)
  shortlist.append({"time":t,"motion":round(motion,2),"luma":round(luma,1),"contrast":round(contrast,1)})
 top=sorted([x for x in shortlist if x["luma"]>40],key=lambda x:x["motion"]*min(x["contrast"],80),reverse=True)[:18]
 print("CANDIDATE_COUNT",len(shortlist),"TOP_MOTION_CONTRAST",json.dumps(top),flush=True)
 print("RESULT_NOTE","Numerical scene ranking, not human recognition of headlights/wheels or approval.",flush=True)
