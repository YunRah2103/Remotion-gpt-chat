#!/usr/bin/env python3
"""Acquire real Nürburgring 24H film source from GuapoFilm filmmaker Vimeo.

Reject simulator films (Apex Racing Academy hotlaps are iRacing, NOT GT3 real).
"""
import json,subprocess,sys,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
R=Path("out/gt3-guapofilm-originals");M=R/"native_media";S=R/"contact_sheets"
for p in (R,M,S):p.mkdir(parents=True,exist_ok=True)
SOURCES=[
 dict(id="guapofilm_n24_racing_film",url="https://vimeo.com/330247118",title="GT Nürburgring 24H RACE",publisher="GuapoFilm",models="UNVERIFIED"),
 dict(id="glickenhaus_n24_2018_director",url="https://vimeo.com/253101737",title="24H Nürburgring Felipe Fernandez Laser Scuderia Glickenhaus",publisher="Sebastian Kubatz",models="Glickenhaus race car SPX, NOT GT3; atmosphere only"),
]
def run(args,t=180):
 try:return subprocess.run(args,capture_output=True,text=True,timeout=t)
 except Exception as e:return subprocess.CompletedProcess(args,125,"",repr(e))
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for x in iter(lambda:f.read(1048576),b""):h.update(x)
 return h.hexdigest()
for src in SOURCES:
 src["status"]="NOT_ACQUIRED"
 j=run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings","--socket-timeout","15","--retries","1","-J",src['url']],75)
 if j.returncode:
  src.update(status="METADATA_BLOCKED",reason=j.stderr[-500:]);print("META BLOCKED",src['id'],src['reason'][-160:],flush=True);continue
 try:
  data=json.loads(j.stdout);fmts=[f for f in data.get("formats",[]) if ((f.get('height') or 0)>=1080 and (f.get('width') or 0)>=1920)]
  src.update(actual_title=data.get('title'),duration_advertised=data.get('duration'),available_native_formats=[{k:f.get(k) for k in ('format_id','width','height','ext','protocol')} for f in fmts][:30])
  if not fmts:src['status']="BELOW_NATIVE_HD";continue
  target=str(M/(src['id']+".%(ext)s"))
  d=run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings","--socket-timeout","15","--retries","1",
    "-f","bv*[height>=1080]/b[height>=1080]","--download-sections","*0-22","--merge-output-format","mp4",
    "-o",target,src['url']],200)
  files=[p for p in M.glob(src['id']+".*") if p.stat().st_size>100000]
  if d.returncode or not files:raise ValueError("Download failure "+d.stderr[-600:])
  f=max(files,key=lambda p:p.stat().st_size)
  prob=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],40)
  if prob.returncode:raise ValueError("ffprobe fail "+prob.stderr[-400:])
  jj=json.loads(prob.stdout);v=next(x for x in jj['streams'] if x['codec_type']=='video')
  w,h=int(v['width']),int(v['height'])
  assert w>=1920 and h>=1080
  full=run(["ffmpeg","-v","error","-i",str(f),"-f","null","-"],130)
  if full.returncode:raise ValueError('Full decode failed '+full.stderr[-400:])
  duration=float(jj['format'].get('duration') or 0)
  board=Image.new("RGB",(1440,590),(0,0,0));draw=ImageDraw.Draw(board)
  for i in range(6):
   sec=duration*(i+.4)/6
   temp=S/(src['id']+"_"+str(i)+".jpg")
   z=run(["ffmpeg","-v","error","-y","-ss",str(sec),"-i",str(f),"-frames:v","1","-vf","scale=480:270",str(temp)],35)
   if z.returncode==0 and temp.exists():
    with Image.open(temp) as im:board.paste(im.convert('RGB'),((i%3)*480,(i//3)*295+22))
    temp.unlink()
   draw.text(((i%3)*480,(i//3)*295),f"{sec:.1f}s",fill="white")
  sheet=S/(src['id']+"_6FRAME.jpg");board.save(sheet,quality=90)
  src.update(status="REAL_NATIVE_HD_ACQUIRED_MODEL_RACE_VISUAL_QA_PENDING",sha256=sha(f),file=str(f.relative_to(R)),bytes=f.stat().st_size,width=w,height=h,contact_sheet=str(sheet.relative_to(R)),ffprobe=jj)
  print("FILM PHYSICALLY ACQUIRED",src['id'],w,h,f.stat().st_size,flush=True)
 except Exception as e:src.update(status="FAILED",reason=str(e)[-500:])
(R/"manifest.json").write_text(json.dumps(dict(gate="BLOCKED_PENDING_INDEPENDENT_GT3_MAKE_IDENTITY_AND_DISTINCT_ANGLE_QA",sources=SOURCES),indent=2))
print("SUCCESSFUL SOURCES",sum(x['status'].startswith('REAL') for x in SOURCES))
