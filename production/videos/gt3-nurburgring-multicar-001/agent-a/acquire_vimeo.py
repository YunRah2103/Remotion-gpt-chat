#!/usr/bin/env python3
"""GT3 non-YouTube Vimeo source acquisition and true 1080p gate."""
import json,subprocess,sys,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
O=Path("out/gt3-vimeo-actual");V=O/"clips";V.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {"id":"vimeo_team75_2018","url":"https://vimeo.com/374029404","event":"2018 Nürburgring 24h","identity":"Porsche Team75 Bernhard aftermovie","make_hint":"Porsche"},
 {"id":"vimeo_highlight_2016","url":"https://vimeo.com/326596303","event":"2016 Nürburgring 24h","identity":"KIEFERWORX multi-car highlight film","make_hint":"MULTI_GT3_UNVERIFIED"},
 {"id":"vimeo_giti_2025","url":"https://vimeo.com/1178201469","event":"2025 Nürburgring 24h","identity":"Giti Rennsport / VS Racing","make_hint":"UNVERIFIED"},
 {"id":"vimeo_pirelli_n24","url":"https://vimeo.com/1074240368","event":"Nürburgring 24h","identity":"Pirelli official event edit","make_hint":"MULTI_GT3_UNVERIFIED"},
 {"id":"vimeo_redbull_drift","url":"https://vimeo.com/455315028","event":"2020 Nürburgring","identity":"Red Bull Driftbrothers - NOT GT3; diagnostic reject","make_hint":"NOT_GT3_EXCLUDE"}
]
def cmd(args,t=160):
 p=subprocess.run(args,capture_output=True,text=True,timeout=t)
 return p
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
results=[]
for src in SOURCES:
 info={**src,"status":"NOT_ACQUIRED"}
 fmt=cmd([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","-J","--skip-download",
          "--socket-timeout","12","--retries","1",src["url"]],65)
 if fmt.returncode:
  info["error"]=fmt.stderr[-800:]
  print("REJECTED metadata",src["id"],info["error"][-180:],flush=True)
 else:
  try:
   j=json.loads(fmt.stdout)
   listed=[{"format_id":x.get("format_id"),"height":x.get("height"),"width":x.get("width"),
            "ext":x.get("ext"),"tbr":x.get("tbr")} for x in j.get("formats",[]) if x.get("height")]
   info["available_native_formats"]=listed
   best=max((x.get("height",0) for x in listed),default=0)
   info["best_listed_height"]=best
   print("FORMAT",src["id"],best,flush=True)
   if best<1080:raise ValueError("Source does not publish 1080p native format")
   if src["make_hint"]=="NOT_GT3_EXCLUDE":raise ValueError("Not GT3 racing; excluded")
   template=str(V/(src["id"]+".%(ext)s"))
   d=cmd([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
          "--no-progress","--no-warnings","--socket-timeout","12","--retries","1",
          "--format","bv*[height>=1080]+ba/b[height>=1080]",
          "--merge-output-format","mp4","--download-sections","*2-12",
          "--output",template,src["url"]],210)
   files=list(V.glob(src["id"]+".*"))
   if d.returncode or not files:raise ValueError("Download failed: "+d.stderr[-500:])
   path=max(files,key=lambda x:x.stat().st_size)
   p=cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],30)
   if p.returncode:raise ValueError("ffprobe rejected bytes: "+p.stderr[-200:])
   j=json.loads(p.stdout)
   v=next(x for x in j["streams"] if x["codec_type"]=="video")
   w=int(v["width"]);h=int(v["height"])
   if not ((w>=1920 and h>=1080 and w>h) or (w>=1080 and h>=1920 and h>w)):raise ValueError(f"Native less than landscape 1080p: {w}x{h}")
   frame=O/(src["id"]+"_contact.jpg")
   f=cmd(["ffmpeg","-v","error","-y","-ss","3","-i",str(path),"-frames:v","1","-vf","scale=720:-2",str(frame)],30)
   if f.returncode:raise ValueError("Frame decode failed: "+f.stderr[-200:])
   info.update(status="NATIVE_HD_SAMPLE_DOWNLOADED_VISUAL_QA_PENDING",bytes=path.stat().st_size,
      sha256=sha(path),probe={"width":w,"height":h,"duration":j["format"].get("duration"),
      "fps":v.get("avg_frame_rate")},file=str(path.relative_to(O)),frame=frame.name)
   print("ACQUIRED",src["id"],w,h,info["bytes"],flush=True)
  except Exception as e:
   info["status"]="REJECTED";info["error"]=str(e)
   print("REJECTED",src["id"],str(e)[-220:],flush=True)
 results.append(info)
(O/"manifest.json").write_text(json.dumps({"sources":results,"gate":"VISUAL_REVIEW_REQUIRED","note":"Vimeo sample clips are provisional source candidates; verify GT3 race cars, camera uniqueness, watermark before qualifying."},indent=2)+"\n")
(O/"README.md").write_text("# Vimeo native GT3 Nurburgring source samples\n\nOnly actual files passing FFprobe native 1080p are bundled. Film IDs are true unique original films, not 30 independent camera angles. Models must be visually verified before editing.\n")
