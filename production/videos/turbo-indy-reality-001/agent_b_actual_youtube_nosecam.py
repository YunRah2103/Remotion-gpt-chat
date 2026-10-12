#!/usr/bin/env python3
"""Direct YouTube/INDYCAR original-camera footage acquisition, technical and frame QA.
Never bypass authentication/DRM, upsample 720p or use simulator content.
Research preview only; unrelated editorial redistribution clearance is not claimed.
"""
import pathlib, json, subprocess, hashlib, zipfile, traceback, sys, time
from PIL import Image,ImageDraw,ImageChops,ImageStat
OUT=pathlib.Path("out/agent-b-nosecam-research"); OUT.mkdir(parents=True,exist_ok=True)
VIDEOS=OUT/"clips"; QA=OUT/"contact_sheets"; WORK=OUT/"source"
for x in (VIDEOS,QA,WORK):x.mkdir(exist_ok=True)
SRC=[
 dict(key="B_NOSECAM_2018_HINCHCLIFFE",url="https://www.youtube.com/watch?v=OeyJzU9NV6c",label="Original official INDYCAR nose cam, St Petersburg 2018",start=8,length=8),
 dict(key="B_INDYCAR_NOSECAM_EMBED",url="https://www.indycar.com/Videos/2018/03/03-14-Hinchcliffe-nose-cam-St-Pete",label="Official alternate player for same 2018 nose cam",start=8,length=8),
 dict(key="B_2026_PATOWARD_INDY500",url="https://www.youtube.com/watch?v=KmAIynVrKQg",label="2026 Indy 500 Pato O'Ward final laps external/in-car, oval",start=210,length=8),
]
def cmd(args,timeout=100):
 p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError(f'exit={p.returncode}: '+p.stderr[-700:])
 return p.stdout
def hashfile(f):
 sha=hashlib.sha256()
 with open(f,"rb") as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b""):sha.update(chunk)
 return sha.hexdigest()
def probe(f):
 d=json.loads(cmd(["ffprobe","-v","error","-of","json","-show_streams","-show_format",str(f)]))
 v=next(a for a in d["streams"] if a["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"codec":v.get("codec_name"),"fps":v.get("avg_frame_rate"),
         "duration":float(d["format"]["duration"])}
results=[]
for lead in SRC:
 record={k:lead[k] for k in ("key","url","label","start","length")}
 print("BEGIN",record["key"],flush=True)
 try:
  # First record availability/format claims, then attempt actual source bytes.
  info=cmd(["yt-dlp","--no-playlist","--skip-download","--dump-single-json","--socket-timeout","9","--retries","0",lead["url"]],35)
  j=json.loads(info)
  eligible=[x for x in j.get("formats",[]) if isinstance(x.get("height"),int) and x["height"]>=1080 and x.get("vcodec") not in ("none",None)]
  record.update(source_title=j.get("title"),formats_count=len(j.get("formats",[])),max_source_height=max((x.get("height") or 0 for x in j.get("formats",[])),default=0), native_1080_formats=len(eligible))
  print("METADATA",lead["key"],record["source_title"],record["max_source_height"],flush=True)
  if not eligible:raise RuntimeError("No native 1080p stream; reject instead of upscaling")
  path=str(WORK/(lead["key"]+".%(ext)s"))
  cmd(["yt-dlp","--no-playlist","--socket-timeout","12","--retries","1","--fragment-retries","1",
       "--download-sections",f'*{lead["start"]}-{lead["start"]+lead["length"]}',
       "--force-keyframes-at-cuts","-f","bv*[height>=1080]+ba/b[height>=1080]","--merge-output-format","mp4",
       "-o",path,lead["url"]],95)
  candidates=list(WORK.glob(lead["key"]+".*"))
  if not candidates:raise RuntimeError("Downloader did not produce real video")
  raw=max(candidates,key=lambda p:p.stat().st_size)
  p=probe(raw)
  if min(p["width"],p["height"])<1080 or p["duration"]<2:raise RuntimeError("actual local native resolution/duration rejected")
  dest=VIDEOS/(lead["key"]+".mp4")
  cmd(["ffmpeg","-nostdin","-y","-v","error","-i",str(raw),"-map","0:v:0","-an","-c:v","libx264","-pix_fmt","yuv420p","-crf","21","-preset","veryfast",str(dest)],85)
  final=probe(dest)
  cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(dest),"-f","null","-"],80)
  frames=[]
  for i in range(8):
   t=.2+(.7*i)
   f=WORK/"frame.jpg"
   cmd(["ffmpeg","-nostdin","-y","-v","error","-ss",str(t),"-i",str(dest),"-frames:v","1","-vf","scale=512:-2","-q:v","4",str(f)],30)
   frames.append(Image.open(f).convert("RGB").copy());f.unlink()
  sheet=Image.new("RGB",(1024,8*310//2),(15,15,15));dr=ImageDraw.Draw(sheet)
  for i,im in enumerate(frames):
   x=i%2*512;y=i//2*310;sheet.paste(im,(x,y+28));dr.text((x+9,y+5),f'{lead["key"]} +{.2+.7*i:.1f}s',fill="white")
  sheetpath=QA/(lead["key"]+"_contact.jpg");sheet.save(sheetpath,quality=85)
  record.update(status="PASS_REAL_VIDEO",source_file_metadata=p,delivered=final,file=str(dest.relative_to(OUT)),
      sha256=hashfile(dest),bytes=dest.stat().st_size,contact_sheet=str(sheetpath.relative_to(OUT)))
  print("VIDEO_PASS",lead["key"],final,record["sha256"],flush=True)
 except Exception as e:
  record.update(status="FAILED_NO_REAL_VIDEO",error=str(e)[:850])
  print("VIDEO_FAILED",lead["key"],str(e)[:400],flush=True)
 finally:
  for f in WORK.glob(lead["key"]+".*"):f.unlink()
 results.append(record)
(OUT/"manifest.json").write_text(json.dumps(results,indent=2))
(OUT/"README.md").write_text("# YUNEX Agent B — external IndyCar camera source research\n\nReal clips only if status PASS_REAL_VIDEO. Zero files if YouTube anti-bot blocks. This is research only; no copyright licence claimed. No phone V4 allowlist modified.\n")
archive=pathlib.Path("out/agent-b-nosecam-research.zip")
with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=2) as z:
 for f in OUT.rglob("*"):
  if f.is_file():z.write(f,f.relative_to(OUT))
print("SUMMARY",sum(r["status"]=="PASS_REAL_VIDEO" for r in results),"real videos; archive",archive,archive.stat().st_size,flush=True)
if not any(r["status"]=="PASS_REAL_VIDEO" for r in results):sys.exit(2)
