#!/usr/bin/env python3
"""Agent D: source-specific proof for REAL Indy 500 helmet cameras.
Copyrighted FOX/INDYCAR broadcast: strictly internal technical review, NOT cleared for reuse.
Only downloadable >= 1080p original is shipped as review preview; no simulated frames or upscaling.
"""
import hashlib,json,subprocess,zipfile,sys,re
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat,ImageChops
ROOT=Path("out/indy-d-helmetcam-research")
MEDIA=ROOT/"clips";CONTACT=ROOT/"contacts";ORIG=ROOT/"originals"
for p in (ROOT,MEDIA,CONTACT,ORIG):p.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {"id":"newgarden_fp3_2025","url":"https://www.dailymotion.com/video/x9jl9u6","title":"Indy 500 2025 FP3 Newgarden Onboard Helmet Cam", "samples":[(4.0,3.5),(20,3.5)]},
 {"id":"palou_carbday_2025","url":"https://www.dailymotion.com/video/x9k137e","title":"Indy 500 2025 Carb Day Palou Onboard Helmet Cam","samples":[(5.0,3.5),(33.0,3.5)]},
 {"id":"pato_nashville_2023","url":"https://www.dailymotion.com/video/x8n14y0","title":"IndyCar 2023 Nashville FP Pato O'Ward Onboard","samples":[(8.0,3.5)]},
]
RIGHTS="UNLICENSED INDYCAR BROADCAST / Dailymotion repost. Technical internal proof only; no permission to publish or commercially redistribute."
def run(cmd,timeout=75):
 return subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
def probe(path):
 p=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],30)
 if p.returncode:raise RuntimeError("ffprobe: "+p.stderr[-220:])
 d=json.loads(p.stdout);v=next(x for x in d.get("streams",[]) if x.get("codec_type")=="video")
 return {"width":v["width"],"height":v["height"],"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),"duration":float(d["format"].get("duration",0))}
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  while (b:=f.read(1<<20)):h.update(b)
 return h.hexdigest()
def get_frame(path,time,target):
 x=run(["ffmpeg","-y","-hide_banner","-nostdin","-loglevel","error","-ss",str(time),"-i",str(path),"-frames:v","1","-vf","scale=680:-2",str(target)],30)
 if x.returncode or not target.exists():raise RuntimeError("failed frame at "+str(time))
 return Image.open(target).convert("RGB")
manifest={"agent":"D","license_state":RIGHTS,"sources":[],"clips":[],"failed":[]}
for source in SOURCES:
 row={"id":source["id"],"source_url":source["url"],"title":source["title"],"rights":RIGHTS}
 try:
  info=run(["yt-dlp","--dump-single-json","--skip-download","--no-playlist","--socket-timeout","15","--retries","1",source["url"]],70)
  if info.returncode:raise RuntimeError("info extraction "+info.stderr[-620:])
  d=json.loads(info.stdout);fm=d.get("formats",[])
  widths=[{"format_id":f.get("format_id"),"w":f.get("width"),"h":f.get("height"),"vcodec":f.get("vcodec"),"tbr":f.get("tbr")} for f in fm if f.get("vcodec") not in ("none",None)]
  row["formats"]=sorted(widths,key=lambda f:f["h"] or 0,reverse=True)[:12]
  bestheight=max((f["h"] or 0 for f in widths),default=0)
  row["best_advertised_height"]=bestheight
  if bestheight<1080:raise RuntimeError("NO_NATIVE_FULL_HD_FORMAT: max "+str(bestheight))
  target=str(ORIG/(source["id"]+".%(ext)s"))
  cmd=["yt-dlp","--no-playlist","--socket-timeout","15","--retries","1","--fragment-retries","1",
   "-f","bv*[height>=1080]+ba/b[height>=1080]/best[height>=1080]","--merge-output-format","mp4",
   "-o",target,source["url"]]
  x=run(cmd,190)
  files=list(ORIG.glob(source["id"]+".*"))
  if x.returncode or not files:raise RuntimeError("download failed "+x.stderr[-500:])
  original=max(files,key=lambda f:f.stat().st_size);meta=probe(original);row["downloaded_original"]=meta
  if meta["width"]<1920 or meta["height"]<1080:raise RuntimeError("downloaded format not native 1080p")
  row["source_sha256"]=sha(original)
  for idx,(start,dur) in enumerate(source["samples"]):
   if start+dur>meta["duration"]:continue
   name=f"{source['id']}_review_{idx:02d}"
   dst=MEDIA/(name+".mp4")
   p=run(["ffmpeg","-y","-nostdin","-hide_banner","-loglevel","error","-ss",str(start),"-i",str(original),"-t",str(dur),"-map","0:v:0","-an",
    "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p","-movflags","+faststart",str(dst)],120)
   if p.returncode:raise RuntimeError("cut failed "+p.stderr[-240:])
   delivered=probe(dst)
   if delivered["height"]<1080:dst.unlink();raise RuntimeError("deliverable resolution below 1080")
   frames=[]
   for j,t in enumerate([.2,.8,1.6,2.4,3.2]):
    file=ROOT/(name+f"_tmp_{j}.jpg")
    frames.append(get_frame(dst,min(t,dur-.15),file).copy());file.unlink()
   canvas=Image.new("RGB",(680,5*410),(17,17,17));drawer=ImageDraw.Draw(canvas)
   deltas=[]
   for j,im in enumerate(frames):
    im.thumbnail((680,370))
    canvas.paste(im,(0,j*410+23));drawer.text((10,j*410+5),f"{name}: +{[.2,.8,1.6,2.4,3.2][j]:.1f}s",fill="white")
    if j: deltas.append(round(sum(ImageStat.Stat(ImageChops.difference(frames[j-1],im)).mean)/3,2))
   sheet=CONTACT/(name+".jpg");canvas.save(sheet,quality=88)
   clip={"id":name,"path":str(dst.relative_to(ROOT)),"contact":str(sheet.relative_to(ROOT)),"source":source["url"],
    "timecode_start_s":start,"duration":dur,"quality":delivered,"sha256":sha(dst),"motion_differences":deltas,
    "rights":RIGHTS,"status":"TECHNICAL_QA_ONLY_RIGHTS_NOT_CLEARED_HUMAN_VISUAL_QA_REQUIRED"}
   manifest["clips"].append(clip);print("VIDEO_PROVED",name,delivered,flush=True)
  row["result"]="NATIVE_1080P_OR_ABOVE_PLAYABLE_REVIEW_VIDEO"
 except Exception as e:
  row["result"]="NOT_DELIVERED";row["failure"]=str(e)[:1000];manifest["failed"].append(row["id"])
  print("NOT_DELIVERED",row["id"],row["failure"],flush=True)
 finally:
  for f in ORIG.glob(source["id"]+".*"):f.unlink(missing_ok=True)
  manifest["sources"].append(row)
(ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2))
(ROOT/"REUSE_RESTRICTIONS.md").write_text("INDYCAR/FOX race broadcast footage included ONLY IF technically accessible, for private technical QA, NO publication/reuse rights asserted. Rights permission must be obtained before further distribution or actual public YUNEX film. https://www.indycar.com/-/media/Files/2026/Imagen-Only/INDYCAR-Photo-Video-Policy-2026.pdf")
archive=Path("out/YUNEX_INDY_AGENT_D_HELMET_REVIEW.zip")
with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=2) as z:
 for f in ROOT.rglob("*"):
  if f.is_file() and ORIG not in f.parents:z.write(f,f.relative_to(ROOT))
print("SUMMARY",len(manifest["clips"]),"FILE",str(archive),"SIZE",archive.stat().st_size,flush=True)
