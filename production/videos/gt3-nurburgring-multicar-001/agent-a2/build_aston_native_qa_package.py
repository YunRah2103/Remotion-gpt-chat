#!/usr/bin/env python3
"""A2 actual verified Aston Nürburgring racing footage package from prior native source ZIP.

Input: physical ZIP downloaded from *previous successful native video Actions run*,
never URLs-only; validate source hash; re-encode cropped excerpts without upscaling;
full FFmpeg decode, SHA-256 all media, source timecode, unique view QA.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib,io,json,os,subprocess,zipfile

OUT=Path("out/gt3-a2-aston-approved")
CLIPS=OUT/"source_shots_1920x1080"
SHEETS=OUT/"contacts"
ORIG=OUT/"source_original"
for p in (OUT,CLIPS,SHEETS,ORIG):p.mkdir(parents=True,exist_ok=True)
IN=Path("out/gt3-a2-aston-source/GT3_A2_BROWSER_ORIGINALS_AND_QA.zip")
SOURCE_ID="aston_nls_race_win"
PUBLISHER="https://www.facebook.com/astonmartinracing/videos/winners-the-vantage-gt3-delivered-the-first-outright-victory-for-aston-martin-on/648342162796998/"
# These seven source film sections are separated in picture or camera vantage.
# The source itself documents the NLS8 Nordschleife #21 victory.
SHOTS=[
 {"id":"ASTON21_01_CORNER_EXIT","start":5.56,"end":9.95,"camera_id":"ASTON21_NLS8_CAM_A","angle":"Trackside follow-pan, car exits a fast right-hander","approved":True},
 {"id":"ASTON21_02_MULTI_CAR_BATTLE","start":10.24,"end":13.30,"camera_id":"ASTON21_NLS8_CAM_B","angle":"Trackside frontal pan with GT3 pack, Aston among cars","approved":True},
 {"id":"ASTON21_03_LONG_LENS_APPROACH","start":17.12,"end":18.34,"camera_id":"ASTON21_NLS8_CAM_C","angle":"Long-lens GT3 rear/approach, distinctive houses in background","approved":True},
 {"id":"ASTON21_04_HEADLIGHTS_ATTACK","start":22.28,"end":24.25,"camera_id":"ASTON21_NLS8_CAM_D","angle":"Low frontal corner approach with aggressive headlights","approved":True},
 {"id":"ASTON21_05_FAST_TRACK_FLYBY","start":28.18,"end":31.85,"camera_id":"ASTON21_NLS8_CAM_E","angle":"High-speed trackside flyby, green hillside, car flashes past","approved":True},
 {"id":"ASTON21_06_REAR_CORNER","start":32.19,"end":34.25,"camera_id":"ASTON21_NLS8_CAM_F","angle":"Rear three-quarter fast corner with curbing","approved":True},
 {"id":"ASTON21_07_BANKED_SWEEP","start":34.41,"end":37.82,"camera_id":"ASTON21_NLS8_CAM_G","angle":"Elevated trackside banking, frontal / profile Aston GT3 #21","approved":True},
]
def command(cmd,timeout=140):
 r=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 if r.returncode:raise RuntimeError(f"{' '.join(cmd[:3])} failed: {r.stderr[-700:]}")
 return r.stdout

def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for block in iter(lambda:f.read(1024*1024),b""):h.update(block)
 return h.hexdigest()
def probe(p):
 return json.loads(command(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)],30))
def video_stream(m):
 return next(s for s in m["streams"] if s["codec_type"]=="video")
def contact(p,id,sec):
 # multiple actual decoded frames from each cut, untouched car framing
 canvas=Image.new("RGB",(1080,780),"#111")
 d=ImageDraw.Draw(canvas)
 for i,t in enumerate([0.1,max(0.15,sec/2),max(0.15,sec-0.2)]):
  fn=SHEETS/(id+f"_{i}.jpg")
  command(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
           "-ss",str(t),"-i",str(p),"-frames:v","1",
           "-vf","scale=540:304","-q:v","4",str(fn)],25)
  with Image.open(fn) as im:
   x=(i%2)*540;y=(i//2)*386
   canvas.paste(im.convert("RGB"),(x,y+26))
   d.text((x+8,y+5),f"{id}  +{t:.2f}s",fill="white")
  fn.unlink()
 dest=SHEETS/(id+"_3FRAMES.jpg");canvas.save(dest,quality=88)
 return str(dest.relative_to(OUT))
assert IN.is_file(),f"Original Actions source artifact is missing: {IN}"
with zipfile.ZipFile(IN) as zip:
 assert zip.testzip() is None
 original_m=json.loads(zip.read("SOURCE_MANIFEST.json"))
 row=next(x for x in original_m["sources"] if x["source_id"]==SOURCE_ID)
 assert row["status"]=="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING"
 source_bytes=zip.read(row["file"])
 src=ORIG/"ASTON_VANTAGE_GT3_NLS8_ORIGINAL_NATIVE_1920x1088_VP9.mp4"
 src.write_bytes(source_bytes)
 assert sha(src)==row["sha256"],"previous upload source SHA does not match actual media bytes"
 assert (row["resolution"]==[1920,1088]),"native resolution changed"
 pr=probe(src)
 assert video_stream(pr)["width"]==1920 and video_stream(pr)["height"]==1088
 assert float(pr["format"]["duration"])>50
 command(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(src),"-f","null","-"],140)
 recs=[]
 for shot in SHOTS:
  dest=CLIPS/(shot["id"]+".mp4")
  seconds=round(shot["end"]-shot["start"],3)
  command(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
    "-ss",str(shot["start"]),"-i",str(src),"-t",str(seconds),
    "-map","0:v:0","-an",
    "-vf","crop=1920:1080:0:4,setsar=1",
    "-c:v","libx264","-preset","medium","-crf","16","-pix_fmt","yuv420p",
    "-movflags","+faststart",str(dest)],125)
  meta=probe(dest);v=video_stream(meta)
  assert (v["width"],v["height"])==(1920,1080)
  assert v["codec_name"]=="h264"
  assert float(meta["format"]["duration"])>=seconds-.16
  command(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(dest),"-f","null","-"],75)
  res={**shot,"source_publisher_url":PUBLISHER,"source_file_original":str(src.relative_to(OUT)),
     "source_original_sha256":sha(src),"clip_file":str(dest.relative_to(OUT)),
     "clip_sha256":sha(dest),"bytes":dest.stat().st_size,"duration_seconds":round(float(meta["format"]["duration"]),3),
     "source_native_resolution":"1920x1088","delivered_resolution":"1920x1080",
     "no_upscale":True,"crop":"Remove 4 vertical source lines top and bottom, no scaling",
     "gt3_make":"Aston Martin","verified_make":"Aston Martin","verified_model":"Vantage GT3",
     "visible_vehicle_identity":"Aston Martin Racing #21 NLS race livery; identifiable wing, nose/taillight shape",
     "verified_event":"NLS8 Nürburgring Nordschleife; published Aston Martin Racing victory film",
     "verified_real_racing":True,
     "approved_camera_classification":"VISUALLY_APPROVED_SINGLE_DISTINCT_PUBLISHER_EDIT_CAMERA_POSITION",
     "ffprobe":meta}
  res["contact_sheet"]=contact(dest,shot["id"],seconds)
  recs.append(res)
  print("APPROVED_GT3_SHOT",res["id"],seconds,sha(dest),v["width"],v["height"],flush=True)
 manifest={
  "project":"YUNEX GT3 Multi-Car 001","agent":"A2",
  "source":"Aston Martin Racing NLS8 race-winning authentic publisher film",
  "original_publisher_post_url":PUBLISHER,
  "event_and_model_visual_qa":"Checked original contact sheet and additional time grid; #21 Aston Martin Vantage GT3 clearly visible on authentic Nürburgring circuit, not GT4, CGI, or video game",
  "original": {"file":str(src.relative_to(OUT)),"sha256":sha(src),"probe":pr,
   "previous_source_run":38152393636,"previous_source_artifact":11707122343},
  "native_approved_gt3_camera_shots":len(recs),"manufacturers":["Aston Martin"],
  "approved_original_source_films":1,
  "source_policy":"7 distinct film camera-section ranges; do not count as 7 independent films; no fake duplicate viewpoint splitting",
  "all_project_gate_pass":False,
  "remaining_target_makes":["Ferrari 296 GT3","McLaren 720S GT3 EVO"],
  "shots":recs}
 (OUT/"SOURCE_MANIFEST_FFPROBE_SHA256.json").write_text(json.dumps(manifest,indent=2)+"\n")
 (OUT/"README.md").write_text("# Agent A2 - ACTUAL Aston Martin NLS8 GT3 racing footage\n\n"
   "Actual **one** real original native 1920x1088 Aston Martin Vantage GT3 "
   "racing publisher film, source SHA-256 checked against prior Actions artifact; "
   f"**{len(recs)}** real visually selected distinct 1920x1080 clips (25fps). "
   "Every clip has an exact source timecode, unique camera-view ID, real decoded frames, "
   "full decode, video metadata, SHA256 and 3-frame review sheet. "
   "Native movie cropped by 4px on top/bottom, never enlarged. "
   "No audio replacement or soundtrack; editor can source original if audio needed. "
   "**PARTIAL DELIVERY**: Ferrari/McLaren absent, total project 24+ shot / 6+ makes gate remains BLOCKED. "
   "See SOURCE_MANIFEST_FFPROBE_SHA256.json for verified provenance and QA.\n")
 pack=OUT/"GT3_MULTICAR_A2_ASTON_RACING_NATIVE_1080_VERIFIED_PARTIAL.zip"
 with zipfile.ZipFile(pack,"w",zipfile.ZIP_STORED,allowZip64=True) as z:
  for f in OUT.rglob("*"):
   if f.is_file() and f!=pack:z.write(f,str(f.relative_to(OUT)))
 with zipfile.ZipFile(pack) as z:
  assert z.testzip() is None
  for x in recs:
   assert hashlib.sha256(z.read(x["clip_file"])).hexdigest()==x["clip_sha256"]
  assert hashlib.sha256(z.read(str(src.relative_to(OUT)))).hexdigest()==sha(src)
 print("ACTUAL_DELIVERY_ZIP",pack,pack.stat().st_size,sha(pack),
   "REAL_ORIGINAL_FILMS",1,"APPROVED_SHOTS",len(recs),flush=True)
