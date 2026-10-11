#!/usr/bin/env python3
"""Inspect genuine 2026 Porsche N24 original UHD documentary for UNUSED GT3 camera angles.
This is a scene scout; movie filename does not establish a GT3 class for each frame.
"""
import requests,subprocess,hashlib,json,io,base64
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
URL="https://newstv.porsche.com/porschevideos/newstv.porsche.com_334111_en.mp4"
R=Path("out/gt3-a-porsche-2026-second-native-film-scan")
R.mkdir(parents=True,exist_ok=True)
SOURCE=R/"Porsche_N24_2026_60cars_original_4K_source.mp4"
def cmd(args,timeout=95):
 s=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
 if s.returncode:raise RuntimeError(s.stderr[-700:])
 return s.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for q in iter(lambda:f.read(1<<20),b""):h.update(q)
 return h.hexdigest()
manifest={"source_url":URL,"status":"BLOCKED_PENDING_ORIGINAL"}
try:
 with requests.get(URL,stream=True,timeout=(8,50),headers={"User-Agent":"Mozilla/5.0"}) as rs:
  rs.raise_for_status();n=0
  with SOURCE.open("wb") as f:
   for data in rs.iter_content(1<<20):
    if data:
     n+=len(data)
     if n>220_000_000:raise RuntimeError("Original over 220MB bounded limit")
     f.write(data)
 meta=json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(SOURCE)],30))
 video=next(s for s in meta["streams"] if s["codec_type"]=="video")
 w,h=int(video["width"]),int(video["height"])
 if w<3840 or h<2160:raise RuntimeError(f"NOT_THE_ORIGINAL_4K_SOURCE_{w}x{h}")
 d=float(meta["format"]["duration"])
 canvas=Image.new("RGB",(6*380,8*246),"#111111");draw=ImageDraw.Draw(canvas)
 for i in range(48):
  ts=d*(i+.4)/48
  path=R/("frame_"+str(i)+".jpg")
  cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(SOURCE),
   "-frames:v","1","-vf","scale=380:214:force_original_aspect_ratio=decrease,pad=380:214:(ow-iw)/2:(oh-ih)/2",
   "-q:v","5",str(path)],35)
  with Image.open(path) as frame:canvas.paste(frame.convert("RGB"),((i%6)*380,(i//6)*246+24))
  path.unlink(missing_ok=True)
  draw.text(((i%6)*380+2,(i//6)*246+3),f"t {ts:.2f}s",fill="white")
 contact=R/"Porsche_2026_NATIVE_4K_48_KEYFRAMES.jpg"
 canvas.save(contact,quality=87,optimize=True)
 manifest.update(status="ACTUAL_4K_NATIVE_DOWNLOADED_48FRAMES_VISUAL_GT3_QA_PENDING",
     width=w,height=h,duration=d,sha256=sha(SOURCE),original_source_bytes=SOURCE.stat().st_size,
     contact_sheet=contact.name,source_ffprobe_video=video)
 print("REAL_2026_SOURCE_4K",w,h,d,n,manifest['sha256'],flush=True)
 # Compact a separate 24-frame time scan down for direct visual QA.
 half=ImageOps.contain(canvas,(1000,1100))
 buf=io.BytesIO();half.save(buf,format="JPEG",quality=74,optimize=True)
 print("PUBLISHED_REAL_4K_KEYFRAME_PREVIEW_BASE64_START:"+base64.b64encode(buf.getvalue()).decode()+":PUBLISHED_REAL_4K_KEYFRAME_PREVIEW_BASE64_END",flush=True)
 print("FRAME_SCENE_PREVIEW_BYTES",len(buf.getvalue()),flush=True)
except Exception as e:manifest.update(status="FAILED_VIDEO_ACQUISITION",error=str(e)[-700:]);print("ERROR",manifest["error"],flush=True)
finally:
 SOURCE.unlink(missing_ok=True)
 (R/"SOURCE_MANIFEST.json").write_text(json.dumps(manifest,indent=2)+"\n")
