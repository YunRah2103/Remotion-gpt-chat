#!/usr/bin/env python3
"""Download real native 1080x1920 public Lamborghini ABT 2026 N24 race video.

The landscape release does not qualify from a portrait 1080-wide video;
this original is FOR SECONDARY VERTICAL / media-library review only.
"""
import subprocess,json,hashlib,sys,zipfile
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path("out/gt3-a-lambo-2026-genuine-1080-portrait")
M=ROOT/"native_original_video";PREVIEW=ROOT/"contact_sheets"
for p in (ROOT,M,PREVIEW):p.mkdir(parents=True,exist_ok=True)
URL="https://www.facebook.com/INMotorsport/videos/-abt-red-bull-lamborghini-gt3-on-24h-n%C3%BCrburgring-2026-full-speed-motorsport-abt-/980033981487442/"
def cmd(args,t=100):
 r=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if r.returncode:raise RuntimeError((r.stderr or r.stdout)[-900:])
 return r.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
entry={"url":URL,"race_context":"2026 Nürburgring 24 Hours ABT Lamborghini GT3 public original video","status":"UNVERIFIED","landscape_edit_eligible":False}
try:
 info=json.loads(cmd([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--dump-single-json","--skip-download","--socket-timeout","15","--retries","0",URL],50))
 formats=[x for x in info.get("formats",[]) if (x.get("width") or 0)>=1080 and (x.get("height") or 0)>=1920 and x.get("vcodec")!="none"]
 if not formats:raise RuntimeError("NO_1080_NATIVE_PORTRAIT_VIDEO_RENDITION")
 formats.sort(key=lambda x:(x.get("height") or 0,x.get("tbr") or 0),reverse=True)
 entry["available_true_native_portrait_formats"]=[{k:x.get(k) for k in ("format_id","width","height","tbr","protocol")} for x in formats]
 f=formats[0]
 print("SOURCE_NATIVE_FORMAT",f.get('format_id'),f.get('width'),f.get('height'),flush=True)
 target=str(M/"LAMBORGHINI_ABT_2026_REAL_NURBURGRING_%(ext)s")
 cmd([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings",
 "--socket-timeout","18","--retries","1","--fragment-retries","0","--max-filesize","150M",
 "-f",f["format_id"],"-o",target,URL],120)
 files=[x for x in M.iterdir() if x.is_file() and x.stat().st_size>100000]
 if not files:raise RuntimeError("DID_NOT_DOWNLOAD_ACTUAL_VIDEO")
 p=max(files,key=lambda x:x.stat().st_size)
 meta=json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],30))
 video=next(x for x in meta["streams"] if x["codec_type"]=="video")
 w,h=int(video["width"]),int(video["height"]);duration=float(meta["format"].get("duration") or 0)
 if w<1080 or h<1920 or w>=h:raise RuntimeError(f"VIDEO_NOT_ACTUAL_NATIVE_1080x1920_{w}x{h}")
 if duration<2:raise RuntimeError("NO_MOVING_VIDEO")
 cmd(["ffmpeg","-v","error","-nostdin","-xerror","-i",str(p),"-map","0:v:0","-f","null","-"],min(200,max(45,int(duration*4))))
 canvas=Image.new("RGB",(5*240,4*445),"#090909");draw=ImageDraw.Draw(canvas)
 for i in range(20):
  t=duration*(i+.4)/20
  tmp=PREVIEW/f"frame_{i:02d}.jpg"
  cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(p),"-frames:v","1",
       "-vf","scale=222:394,pad=230:409:(ow-iw)/2:(oh-ih)/2",str(tmp)],30)
  with Image.open(tmp) as im:canvas.paste(im.convert("RGB"),((i%5)*240,(i//5)*445+22))
  tmp.unlink(missing_ok=True)
  draw.text(((i%5)*240+3,(i//5)*445+3),f"{t:.1f}s",fill="white")
 contact=PREVIEW/"LAMBORGHINI_2026_N24_ABT_20_FRAME_NATIVE_PORTRAIT.jpg"
 canvas.save(contact,quality=87)
 entry.update(status="ACTUAL_1080_NATIVE_PORTRAIT_VIDEO_FULL_DECODED_VISUAL_CAR_QA_PENDING",
  sha256=sha(p),bytes=p.stat().st_size,native_resolution=[w,h],duration=duration,
  original_file=str(p.relative_to(ROOT)),frame_contact_sheet=str(contact.relative_to(ROOT)),
  ffprobe=meta,qualified_landscape_1920x1080_camera_shots=0,qualified_landscape_makes_added=0,
  source_usage="PORTRAIT_ONLY_NOT_1920x1080_LANDSCAPE")
 print("REAL_2026_ABT_LAMBO_PORTRAIT_VIDEO",w,h,duration,p.stat().st_size,sha(p),flush=True)
except Exception as e:
 entry.update(status="FAILED_DOWNLOAD_OR_QA",error=str(e)[-650:])
 for f in M.glob("*"):f.unlink(missing_ok=True)
 print("REAL_LAMBO_SOURCE_REJECTED",entry["error"],flush=True)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps(entry,indent=2)+"\n")
(ROOT/"README.md").write_text("# Lamborghini ABT 2026 Nürburgring public source\nThis physical video if successfully downloaded is 1080x1920 native PORTRAIT. Do not count it as a 1920x1080 landscape edit original; 16:9 cropping would need upscaling. Car model and frame contents need an independent human contact-sheet audit. All source and FFprobe data in SOURCE_MANIFEST.json.\n")
zipout=ROOT/"LAMBORGHINI_GT3_2026_PUBLIC_PORTRAIT_ORIGINAL_REVIEW.zip"
with zipfile.ZipFile(zipout,"w",zipfile.ZIP_STORED,allowZip64=True) as z:
 for f in ROOT.rglob("*"):
  if f.is_file() and f!=zipout:z.write(f,f.relative_to(ROOT))
print("PACKAGE_SHA",sha(zipout),"BYTES",zipout.stat().st_size,flush=True)
