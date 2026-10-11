#!/usr/bin/env python3
"""Falken direct MP4 N24 sources: remote full-res prove and 6-second source samples.

Avoid downloading >1 GB before sampling. Original network URL MP4 is probed
and FFmpeg range-seeked; generated clips are stream-copied, not upscaled.
"""
import json,subprocess,hashlib
from pathlib import Path
import requests
from PIL import Image,ImageDraw
D=Path("out/gt3-falken-original-direct");D.mkdir(parents=True,exist_ok=True)
SOURCES=[
{"id":"falken2018_4k_hdr","title":"Official 2018 Nürburgring 24h Falken HDR Directors Cut","url":"https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4","starts":[8,34,85,150],"make_candidate":"Porsche (other makes only when visibly identified)"},
{"id":"falken2024_why_we_race","title":"Falken Why We Race 2024 TheTireMagazine mirrored MP4","url":"https://thetiremagazine.com/wp-content/uploads/2024/07/Falken-Tyres-Why-We-Race-24h-Race-Nurburgring-2024.mp4","starts":[10,45,95,150],"make_candidate":"Porsche (other makes only when visibly identified)"}
]
def run(args,timeout=75):
 try:p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 except Exception as e:raise ValueError(str(e))
 if p.returncode:raise ValueError((p.stderr or p.stdout)[-450:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
results=[]
for source in SOURCES:
 out={**source,"http":None,"samples":[]}
 try:
  response=requests.head(source["url"],allow_redirects=True,timeout=18,headers={"User-Agent":"Mozilla/5.0"})
  out["http"]=response.status_code
  out["headers"]={"content-length":response.headers.get("Content-Length"),"content-type":response.headers.get("Content-Type"),"accept-ranges":response.headers.get("Accept-Ranges")}
  print("FALKEN_HEAD",source["id"],out["http"],out["headers"],flush=True)
  if response.status_code not in (200,206):raise ValueError("Publisher URL not accessible")
  # HTTP range-seeking ffprobe does not download whole media if moov header is accessible.
  probe=run(["ffprobe","-v","error","-show_entries","stream=width,height,codec_name,avg_frame_rate","-of","json",source["url"]],timeout=60)
  data=json.loads(probe)
  v=next(x for x in data["streams"] if x.get("width"))
  w,h=int(v["width"]),int(v["height"])
  out["source_native_probe"]={"width":w,"height":h,"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name")}
  if w<1920 or h<1080 or w<=h: raise ValueError(f"Native original below 1080p or non-landscape: {w}x{h}")
  for index,start in enumerate(source["starts"]):
   name=f"{source['id']}_{index+1:02d}"
   path=D/(name+".mkv")
   sample={"id":name,"start_seconds":start}
   try:
    run(["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y",
         "-ss",str(start),"-i",source["url"],"-t","6","-map","0:v:0",
         "-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(path)],timeout=85)
    decoded=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],timeout=24))
    v=next(x for x in decoded["streams"] if x["codec_type"]=="video")
    sw,sh=int(v["width"]),int(v["height"])
    if sw<1920 or sh<1080 or float(decoded["format"]["duration"])<3:raise ValueError("Sample not full-quality or too short")
    thumb=D/(name+".jpg")
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss","1",
         "-i",str(path),"-frames:v","1","-vf","scale=600:-2",str(thumb)],timeout=35)
    sample.update(status="NATIVE_HD_DECODED_PENDING_VISUAL_GT3_ID",path=path.name,frame=thumb.name,
                  sha256=sha(path),bytes=path.stat().st_size,resolution=[sw,sh],duration=decoded["format"]["duration"])
    print("FALKEN_MP4_ACQUIRED",name,sw,sh,sample["bytes"],flush=True)
   except Exception as e:
    path.unlink(missing_ok=True);sample.update(status="REJECTED",error=str(e))
    print("FALKEN_SAMPLE_FAILED",name,str(e)[-180:],flush=True)
   out["samples"].append(sample)
 except Exception as e:out["error"]=str(e);print("FALKEN_SOURCE_ERROR",source["id"],str(e)[-400:],flush=True)
 results.append(out)
(O:=D/"report.json").write_text(json.dumps({"sources":results,"readme":"Real original MP4 sources, no watermarks fabricated. Verify GT3 and Nürburgring shots individually. Stream-copy clip excerpts, no upscale; repeated same-film positions are not automatically unique camera angles."},indent=2)+"\n")
