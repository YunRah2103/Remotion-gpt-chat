#!/usr/bin/env python3
"""Inspect every ~0.8s from independently SHA-verified genuine 2018 Audi Sport N24 original.

This cannot grant manufacturer diversity but may uncover additional real different
Audi GT3 camera views; independent video frame QA and distinct viewpoint required.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,zipfile,json,subprocess,shutil,math
ROOT=Path("out/gt3-a-2018-audi-original-70-frame-camera-survey")
ROOT.mkdir(parents=True,exist_ok=True)
INPUT=Path("inputs/audi2018_actual")
EXPECTED="53818cf233d04e0ecf354925131b38362015d1338cff9799e1f02680feaff2f0"
def h(f):
 a=hashlib.sha256()
 with f.open("rb") as fd:
  for k in iter(lambda:fd.read(1048576),b""):a.update(k)
 return a.hexdigest()
def call(a,t=40):
 p=subprocess.run(a,timeout=t,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[-300:])
 return p.stdout
original=None
for p in INPUT.rglob("*"):
 if p.is_file() and p.suffix.lower() in (".mp4",".mkv",".mov") and h(p)==EXPECTED:
  original=p;break
if original is None:
 for zfile in INPUT.rglob("*.zip"):
  with zipfile.ZipFile(zfile) as z:
   assert z.testzip() is None
   for member in z.infolist():
    if member.filename.lower().endswith((".mp4",".mov",".mkv")):
     dest=ROOT/"original_temp_2018_audi.mp4"
     with z.open(member) as src,dest.open("wb") as dst:shutil.copyfileobj(src,dst)
     if h(dest)==EXPECTED:original=dest;break
     dest.unlink()
  if original:break
assert original is not None,"The exact original Audi film byte SHA not found in earlier source media artifact"
j=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(original)],30))
v=next(i for i in j["streams"] if i["codec_type"]=="video")
assert (int(v["width"]),int(v["height"]))==(1920,1080)
duration=float(j["format"].get("duration") or 0)
assert 50<duration<54
call(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(original),"-f","null","-"],120)
frames=[]
for panel in range(3):
 sheet=Image.new("RGB",(6*360,4*236),(9,9,9));d=ImageDraw.Draw(sheet)
 for slot in range(24):
  idx=panel*24+slot
  ts=duration*(idx+.40)/72
  if ts>=duration:continue
  temp=ROOT/f"temporary_{idx}.jpg"
  try:
   call(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(original),
   "-frames:v","1","-vf","scale=360:203","-q:v","4",str(temp)],25)
   with Image.open(temp) as im:sheet.paste(im.convert("RGB"),((slot%6)*360,(slot//6)*236+26))
   frames.append({"frame_index":idx,"original_t":round(ts,3),"status":"REAL_DECODED_1080_FRAME","panel":panel+1})
  except Exception as e:frames.append({"frame_index":idx,"original_t":round(ts,3),"status":"FAILED","error":str(e)[-110:]})
  temp.unlink(missing_ok=True)
  d.text(((slot%6)*360+3,(slot//6)*236+2),f"Audi 2018 t={ts:.1f}s",fill="white")
 sheet.save(ROOT/(f"AUDI_2018_PANEL_{panel+1}_24_REAL_SOURCE_FRAMES.jpg"),quality=92)
 print("SHEET_SAVED",panel+1,flush=True)
print("FULL_REAL_SOURCE_SHA",h(original),"SAMPLED_FRAMES",len(frames),flush=True)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps({
 "original_source_url":"https://player.vimeo.com/video/277958760?app_id=122963",
 "actual_native_pixels":[1920,1080],"original_expected_SHA256":EXPECTED,
 "original_actual_SHA256":h(original),"video_full_decode":"PASS",
 "frames":frames,"GT3_angles_automatically_approved":0,
 "note":"Review panel thumbnails, check Audi R8 LMS GT3 identity in enlarged actual source frames and independent camera positions. Do not count interviews, roadcars, blurry night, or duplicate camera angles."},indent=2))
if original.is_relative_to(ROOT):original.unlink(missing_ok=True)
