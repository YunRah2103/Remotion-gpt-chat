#!/usr/bin/env python3
"""Recheck authentic FORMAT67 2026 Nürburgring MP4 resolution: keep large square originals."""
import subprocess,json,hashlib,requests
from pathlib import Path
from PIL import Image,ImageDraw
urls=[
"https://format67.net/wp-content/uploads/2026/07/FALKEN____THE_PERFECT_LAP____Nurburgring_24h_2026.mp4",
"https://format67.net/wp-content/uploads/2026/07/THE-PERFECT-LAP-TEASER-_-ENDING-1.mp4",
"https://format67.net/wp-content/uploads/2026/07/falkensquare.mp4"]
ROOT=Path("out/gt3-format67-square-recheck");SRC=ROOT/"accepted_originals";PRE=ROOT/"preview"
for p in (ROOT,SRC,PRE):p.mkdir(parents=True,exist_ok=True)
def run(args,t=100):
 z=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if z.returncode:raise RuntimeError(z.stderr[-250:])
 return z.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1048576),b""):h.update(c)
 return h.hexdigest()
manifest=[]
for i,url in enumerate(urls):
 f=SRC/f"format67_original_{i:02d}.mp4";entry={"url":url}
 try:
  with requests.get(url,timeout=(9,40),stream=True,headers={"User-Agent":"Mozilla/5.0"}) as r:
   r.raise_for_status()
   with f.open("wb") as w:
    size=0
    for piece in r.iter_content(1<<20):
     if piece:
      size+=len(piece)
      if size>195_000_000:raise ValueError("CAP_EXCEEDED")
      w.write(piece)
  j=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)]))
  v=next(k for k in j["streams"] if k["codec_type"]=="video");W,H=int(v["width"]),int(v["height"])
  entry.update(width=W,height=H,original_bytes=f.stat().st_size,original_sha256=sha(f),duration=float(j["format"].get("duration") or 0))
  print("REAL FORMAT67 DOWNLOAD",i,"SOURCE PIXELS",W,H,"BYTES",size,"DURATION",entry["duration"],flush=True)
  if W<1920 or H<1080:raise RuntimeError(f"NATIVE_CROP_CANNOT_OUTPUT_FULLHD_{W}x{H}")
  run(["ffmpeg","-nostdin","-v","error","-i",str(f),"-f","null","-"],160)
  sheet=Image.new("RGB",(3*480,2*290),(12,12,12));d=ImageDraw.Draw(sheet)
  for k in range(6):
   sec=entry["duration"]*(k+.5)/6;t=PRE/f"{i}_{k}.jpg"
   run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(sec),"-i",str(f),"-frames:v","1",
        "-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",str(t)],30)
   with Image.open(t) as im:sheet.paste(im.convert("RGB"),((k%3)*480,(k//3)*290+20))
   t.unlink(missing_ok=True)
   d.text(((k%3)*480+4,(k//3)*290+3),f"{sec:.1f}s",fill="white")
  sheetpath=PRE/f"format67_{i:02d}_6FRAME.jpg";sheet.save(sheetpath,quality=90)
  entry.update(status="ACTUAL_NATIVE_1920_WIDTH_AT_LEAST_CAN_CROP_16_9_QA_PENDING",preview=str(sheetpath.relative_to(ROOT)),original_file=str(f.relative_to(ROOT)),full_decode=True)
  print("POSSIBLE QUALIFYING 16-9 CROPPABLE",i,flush=True)
 except Exception as e:
  entry.update(status="REJECTED_NATIVE_RESOLUTION_OR_DOWNLOAD",failure=str(e)[-250:])
  f.unlink(missing_ok=True)
  print("REJECTED NATIVE",i,entry["failure"],flush=True)
 manifest.append(entry)
(ROOT/"manifest.json").write_text(json.dumps({"status":"MODEL_IDENTITY_AND_CAMERA_QA_PENDING","items":manifest},indent=2)+"\n")
