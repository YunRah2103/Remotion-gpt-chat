#!/usr/bin/env python3
"""Fast native 1080 Peugeot 205 GTI remote-byte-range shot acquisition experiment.
Ask FFmpeg's remote range-seeking reader for 3s scenes, without re-downloading 483MB.
Physical downloaded fragments are independently decoded and visually QA.
No licence inferred, source Harry's Garage branding remains on full landscape shots.
"""
import pathlib,subprocess,zipfile,json,hashlib
from fractions import Fraction
from PIL import Image,ImageDraw
import urllib.parse
ROOT=pathlib.Path("out/fr-a-peugeot205-fast-range")
ROOT.mkdir(parents=True,exist_ok=True)
IDENT="peugeot-205-gti-1.9.-is-this-the-best-hot-hatch-ever"
FILENAME="Peugeot 205 GTi 1.9. Is this the best hot-hatch ever .mp4"
URL="https://archive.org/download/"+IDENT+"/"+urllib.parse.quote(FILENAME)
TIMES=[("front-205-oncoming",991.0,9.0),("rear-205-tracking",1113.5,9.0)]
def cmd(a,t=115):
 p=subprocess.run(a,text=True,capture_output=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-650:])
 return p.stdout
def probe(path):
 m=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],40))
 v=next(x for x in m["streams"] if x.get("codec_type")=="video")
 return {"width":v["width"],"height":v["height"],"fps":float(Fraction(v.get("avg_frame_rate","0/1"))),
   "duration":float(m["format"].get("duration") or 0),"codec":v.get("codec_name"),"bytes":path.stat().st_size}
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
rows=[]
for slug,start,duration in TIMES:
 r={"id":slug,"source_url":URL,"source_time":start,"duration_target":duration,"status":"RANGE_DOWNLOAD_FAILED",
    "model_car_shot_human_approved":False,"copyright_reuse_verified":False}
 target=ROOT/(slug+".mp4")
 try:
  print("ATTEMPT_REMOTE_RANGE",slug,start,flush=True)
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-rw_timeout","40000000",
       "-ss",str(start),"-i",URL,"-t",str(duration),"-map","0:v:0","-map","0:a?",
       "-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",
       "-c:a","aac","-b:a","128k","-movflags","+faststart",str(target)],120)
  info=probe(target)
  if info["width"]<1920 or info["height"]<1080 or info["duration"]<2.7:raise RuntimeError("REJECT_NOT_ACTUAL_NATIVE_HD")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(target),"-map","0:v:0","-f","null","-"],60)
  im=Image.new("RGB",(1450,700),"#14161a")
  dr=ImageDraw.Draw(im);dr.text((8,8),slug+" full decoded 1080 original camera shot, 4 timestamps",fill="white")
  for j,fraction in enumerate((.08,.32,.55,.85)):
   frame=ROOT/("_"+slug+str(j)+".jpg")
   cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(info["duration"]*fraction),
      "-i",str(target),"-frames:v","1","-vf","scale=700:-2",str(frame)],50)
   with Image.open(frame) as pic:
    pic=pic.convert("RGB");pic.thumbnail((700,310))
    im.paste(pic,((j%2)*725+5,(j//2)*330+25))
   frame.unlink()
  im.save(ROOT/(slug+"-contact.jpg"),quality=88)
  r.update({"status":"REAL_NATIVE_HD_RANGE_DOWNLOADED_SOURCE_QA_PENDING","probe":info,
     "sha256":sha(target),"clip":target.name,"contact_sheet":slug+"-contact.jpg",
     "source_lower_left_publisher_logo_present":True,
     "center_9_16_crop_could_hide_corner_logo":True})
  print("REAL_FAST_205_VIDEO",slug,json.dumps(info),"sha",r["sha256"],flush=True)
 except Exception as exc:
  target.unlink(missing_ok=True)
  r["error"]=str(exc)[:450]
  print("SOURCE_RANGE_REJECT",slug,r["error"],flush=True)
 rows.append(r);(ROOT/"manifest.json").write_text(json.dumps(rows,indent=2))
(ROOT/"README.md").write_text("Original physical 1920x1080 Peugeot 205 GTI frame segments from Harry's Garage Archive source. Visual car/motion review pending. The original video contains a small bottom-left broadcaster logo; ordinary final portrait central reframing may exclude the logo, but full landscape remains branded. Source copyright/reuse permission not verified. Do not treat the original branding as absent or falsely approve gate.\n")
Z=pathlib.Path("out/FR-A-PEUGEOT-205-REAL-1080-EXTERIOR-RANGE-QA.zip")
with zipfile.ZipFile(Z,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for f in ROOT.rglob("*"):
  if f.is_file():z.write(f,f.relative_to(ROOT))
print("PEUGEOT_REAL_RANGE_FINAL",json.dumps({"true_hd_clips_downloaded":sum(x["status"].startswith("REAL_NATIVE") for x in rows),
 "bytes":Z.stat().st_size,"gate":"VISUAL_AND_SOURCE_RIGHTS_REVIEW_PENDING"}),flush=True)
