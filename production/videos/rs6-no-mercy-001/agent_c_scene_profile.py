#!/usr/bin/env python3
"""Contact-sheet analysis of genuine RS6 source on ephemeral GitHub runner.
No third-party frame or video upload. Output numerical per-time metrics only.
"""
import urllib.request,tempfile,pathlib,subprocess,json,hashlib,math,statistics
url="https://audi-mediacenter.pl/data/filmy/48075/o/7405893_content_1280x720.mp4"
with tempfile.TemporaryDirectory() as d:
 p=pathlib.Path(d)/"source.mp4"
 with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=50) as r,p.open("wb") as f:
  while True:
   b=r.read(1024*1024)
   if not b:break
   f.write(b)
 print("BYTES",p.stat().st_size,flush=True)
 # Decode scaled thumbnail at each 10 sec interval, measure luma/color differences and visual complexity.
 samples=[]
 for sec in range(5,635,10):
  cmd=["ffmpeg","-loglevel","error","-ss",str(sec),"-i",str(p),"-frames:v","1","-vf","scale=128:72,format=rgb24","-f","rawvideo","pipe:1"]
  q=subprocess.run(cmd,capture_output=True,timeout=15)
  if q.returncode!=0 or len(q.stdout)!=128*72*3:continue
  raw=q.stdout
  lum=[(raw[i]*77+raw[i+1]*150+raw[i+2]*29)>>8 for i in range(0,len(raw),3)]
  mean=sum(lum)/len(lum)
  contrast=(sum((v-mean)**2 for v in lum)/len(lum))**.5
  color=sum(abs(raw[i]-raw[i+1])+abs(raw[i+1]-raw[i+2]) for i in range(0,len(raw),3))/len(lum)
  samples.append({"second":sec,"brightness":round(mean,1),"contrast":round(contrast,1),"colorfulness":round(color,1),"fingerprint":hashlib.sha256(raw).hexdigest()[:12]})
 print("SAMPLES",json.dumps(samples),flush=True)
 # Deliberately no captured third-party frames emitted to GitHub logs or artifacts.
