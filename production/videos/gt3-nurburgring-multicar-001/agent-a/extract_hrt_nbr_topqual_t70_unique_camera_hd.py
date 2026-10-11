#!/usr/bin/env python3
"""NBR TOPQ real producer UHD? No: genuine 1920x1080 source at t70-74.

Cut a single additional Nürburgring GT3 trackside angle from authenticated full
original and produce 16 high enough images for independent car/camera inspection.
Not automatically credited to V9 until model/distinctness proven.
"""
import json,hashlib,subprocess,zipfile,io,base64,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
IN=Path("inputs/hrt_full82_real")
OUT=Path("out/gt3-a-hrt-extra70-74-nbr-camera-original")
MOV=OUT/"EDITOR_REVIEW_MOVING_1080";FR=OUT/"REAL_FRAME_PROOFS"
for p in (OUT,MOV,FR):p.mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def run(args,t=65):
 p=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-600:])
 return p.stdout
files=list(IN.rglob("SOURCE_MANIFEST.json"))
assert len(files)==1
ledger=json.loads(files[0].read_text())
assert ledger["status"]=="FULL_NATIVE_1080_MOVIE_FULL_DECODED_INDEPENDENT_RACING_FRAME_REVIEW_PENDING"
orig=files[0].parent/ledger["original_path"]
assert orig.is_file() and sha(orig)==ledger["original_sha256"]
source_meta=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(orig)]))
v=next(x for x in source_meta["streams"] if x["codec_type"]=="video")
assert (int(v["width"]),int(v["height"]))==(1920,1080)
scenes=[
 {"id":"HRT_AMG_GT3_TOPQ_SOURCE_T70p4_T74p5_LONGSHOT","t":70.4,"duration":4.1,"review_rule":"Verify no title card, actual distinct Nürburgring trackside race-car movie; MAY include >1 camera, split as necessary; GT3 real car # check close frame"}
]
rows=[]
for s in scenes:
 out=MOV/(s["id"]+".mp4")
 run(["ffmpeg","-nostdin","-loglevel","error","-y","-ss",str(s["t"]),"-i",str(orig),
  "-t",str(s["duration"]),"-map","0:v:0","-an","-c:v","libx264","-crf","16",
  "-preset","faster","-pix_fmt","yuv420p","-movflags","+faststart",str(out)],105)
 data=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(out)]))
 video=next(x for x in data["streams"] if x["codec_type"]=="video")
 assert (int(video["width"]),int(video["height"]))==(1920,1080)
 run(["ffmpeg","-nostdin","-loglevel","error","-xerror","-i",str(out),"-f","null","-"],50)
 dur=float(data["format"]["duration"])
 board=Image.new("RGB",(4*480,4*296),(6,6,6));draw=ImageDraw.Draw(board)
 tt=[]
 for i in range(16):
  t=min(dur-.02,dur*(i+.47)/16)
  p=FR/(f"tmp_{i:02d}.jpg")
  run(["ffmpeg","-nostdin","-loglevel","error","-y","-ss",f"{t:.3f}",
       "-i",str(out),"-frames:v","1","-vf","scale=480:270","-q:v","3",str(p)],28)
  with Image.open(p) as im:board.paste(im.convert("RGB"),((i%4)*480,(i//4)*296+24))
  draw.text(((i%4)*480+3,(i//4)*296+3),f"NBR orig {s['t']+t:.2f}s",fill="white")
  p.unlink(missing_ok=True)
  tt.append(round(s["t"]+t,3))
 sheet=FR/(s["id"]+"_16_NATIVE_SOURCE_FRAMES.jpg");board.save(sheet,quality=90)
 s.update(status="REAL_NATIVE_1080_GT3_CLASS_AND_CAMERA_VISUAL_REVIEW_PENDING",
     file=str(out.relative_to(OUT)),original_sha256=ledger["original_sha256"],
     native_pixels=[1920,1080],source_seconds=tt,
     video_sha256=sha(out),video_bytes=out.stat().st_size,
     duration_real_s=dur,contact_sheet=str(sheet.relative_to(OUT)),full_decode="PASS")
 rows.append(s)
 preview=ImageOps.contain(board,(1472,925))
 buffer=io.BytesIO();preview.save(buffer,"JPEG",quality=80,optimize=True)
 print("FOCUSED_NBR_16REAL_FRAME_IMAGE_BASE64_START:"+base64.b64encode(buffer.getvalue()).decode()+":FOCUSED_NBR_16REAL_FRAME_IMAGE_BASE64_END",flush=True)
 print("NEW_CANDIDATE_GT3_1080_PHYSICAL_VIDEO",s["id"],s["video_sha256"],out.stat().st_size,flush=True)
(OUT/"SOURCE_MANIFEST.json").write_text(json.dumps({"source_full_original_sha256":ledger["original_sha256"],
 "manufacturer_identification_status":"VISUAL_INDEPENDENT_QA_REQUIRED",
 "GT3_approved_unique_scene_additions":0,"candidate_movies":rows},indent=2))
print("ACTUAL_NATIVE_1080_ADDITIONAL_REVIEW_CLIP_COUNT",len(rows),flush=True)
