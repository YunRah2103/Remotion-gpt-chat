#!/usr/bin/env python3
"""Research-only scan of camera-filmed Freedom 250 IndyCar event; NOT equivalent to Indianapolis oval.
Actual public unencrypted streams, native media probe, timestamp contact sheets, no source uploads until identity QA.
"""
import subprocess,sys,hashlib,zipfile,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops,ImageStat
BASE=Path("out/agent-b-freedom250-scans"); BASE.mkdir(parents=True,exist_ok=True)
SRCDIR=BASE/"orig";SRCDIR.mkdir(exist_ok=True)
LEADS=[
 ("DC26_A","https://www.dvidshub.net/video/1020305/jtf-dc-national-guardsmen-assist-with-freedom-250-grand-prix"),
 ("DC26_B","https://www.dvidshub.net/video/1020299/jtf-dc-national-guardsmen-assist-with-freedom-250-grand-prix"),
 ("DC26_C","https://www.dvidshub.net/video/1020304/jtf-dc-national-guardsmen-assist-with-freedom-250-grand-prix")
]
def run(args,timeout=90):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-750:])
 return p.stdout
report=[]
for name,url in LEADS:
 row={"name":name,"source_url":url,"match_status":"UNREVIEWED; DC street course is NOT Indianapolis banked oval"}
 try:
  run(["yt-dlp","--no-playlist","--socket-timeout","12","--retries","1","--fragment-retries","1","-f","best","-o",str(SRCDIR/(name+".%(ext)s")),url],110)
  vids=list(SRCDIR.glob(name+".*"))
  if not vids:raise RuntimeError("no actual video bytes")
  f=max(vids,key=lambda x:x.stat().st_size)
  obj=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)]))
  v=next(x for x in obj["streams"] if x["codec_type"]=="video")
  duration=float(obj["format"]["duration"])
  row.update(width=v["width"],height=v["height"],fps=v["avg_frame_rate"],duration=duration,source_size=f.stat().st_size)
  if v["width"]<1920 or v["height"]<1080:raise RuntimeError("native source under 1080p")
  # sample across ENTIRE sequence, each frame decoded from actual downloaded video
  times=[round(t*duration/10,2) for t in range(1,10)]
  frames=[]
  for i,t in enumerate(times):
   path=SRCDIR/"frame.jpg"
   run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(t),"-i",str(f),"-vf","scale=440:248:force_original_aspect_ratio=decrease,pad=440:248:(ow-iw)/2:(oh-ih)/2","-frames:v","1","-q:v","4",str(path)],30)
   frames.append((t,Image.open(path).convert("RGB").copy()));path.unlink()
  sheet=Image.new("RGB",(440*3,282*3),(10,10,10));d=ImageDraw.Draw(sheet)
  for i,(t,im) in enumerate(frames):
   x=i%3*440;y=i//3*282
   sheet.paste(im,(x,y+28));d.text((x+8,y+6),f'{name} source {t:.2f}s',fill=(255,255,255))
  ss=BASE/(name+"_contact.jpg");sheet.save(ss,quality=88)
  row.update(status="SOURCE_REALLY_DOWNLOADED_AND_FRAME_SCANNED",contact_sheet=ss.name,source_sha256=hashlib.sha256(f.read_bytes()).hexdigest())
  print("SCAN_SUCCESS",name,v["width"],v["height"],duration,flush=True)
 except Exception as e:
  row.update(status="FAILED_OR_LOW_RES",error=str(e)[:500]);print("SCAN_FAILED",name,str(e)[:400],flush=True)
 finally:
  for v in SRCDIR.glob(name+".*"):v.unlink()
 report.append(row)
(BASE/"manifest.json").write_text(json.dumps(report,indent=2))
with zipfile.ZipFile("out/YUNEX_AGENT_B_FREEDOM250_PROBE.zip","w",zipfile.ZIP_DEFLATED) as z:
 for f in BASE.rglob("*"):
  if f.is_file():z.write(f,f.relative_to(BASE))
if not any(x.get("status")=="SOURCE_REALLY_DOWNLOADED_AND_FRAME_SCANNED" for x in report):sys.exit("No qualifying 1080+ frames")
