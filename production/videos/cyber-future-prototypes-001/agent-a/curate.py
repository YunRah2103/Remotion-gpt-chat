#!/usr/bin/env python3
"""Curate actual observed live-action Hyundai source film into independent edit handles.

These segments were selected from a manually reviewed contact storyboard.
Do not count shortened duplicate viewpoints as independent shots.
"""
import csv,hashlib,json,subprocess,sys
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
ROOT=Path("out/cyber-future-agent-a")
source=ROOT/"clips/asian_proto_01_01.mp4"
if not source.exists():raise SystemExit("SOURCE VIDEO MISSING")
MAN=json.loads((ROOT/"manifest.json").read_text())
source_entry=next((m for m in MAN if m.get("file")=="clips/asian_proto_01_01.mp4"),None)
if source_entry is None:raise SystemExit("SOURCE MANIFEST MISSING")
ORIG=ROOT/"originals";ORIG.mkdir(exist_ok=True)
SRC=ORIG/"hyundai_n_rn22e_vision74_source.mp4";source.rename(SRC)
# Quarantine additional downloads until exact vehicle, live-action content, and frame setup are inspected.
UNREVIEWED=ORIG/"unreviewed";UNREVIEWED.mkdir(exist_ok=True)
for extra in (ROOT/"clips").glob("*.mp4"):
 extra.rename(UNREVIEWED/extra.name)
 print("UNREVIEWED_ADDITIONAL_SOURCE",extra.name,flush=True)
PHOTO=ROOT/"contact_sheets";PHOTO.mkdir(exist_ok=True)
# Distinct camera/view setups; time boundaries verified against actual original contact storyboard.
SCENES=[
 ("A01_RN22e_front_tracking",0.04,1.29,"Hyundai RN22e","approaching camera, low frontal"),
 ("A02_RN22e_drone_corner",1.39,2.94,"Hyundai RN22e","high drone, racetrack corner"),
 ("A03_RN22e_drifting_rear",3.06,5.54,"Hyundai RN22e","low rolling rear 3/4 drift with smoke"),
 ("A04_RN22e_pitlane_flyby",5.70,6.54,"Hyundai RN22e","trackside static camera, fast departing"),
 ("A05_RN22e_track_approach",10.87,11.93,"Hyundai RN22e","distant low viewpoint, approaching"),
 ("A06_NVision74_rear_track",12.05,12.31,"Hyundai N Vision 74","rear following camera, ultrashort"),
 ("A07_NVision74_sunset_follow",13.08,20.16,"Hyundai N Vision 74","single sunset travelling front 3/4 follow, one setup"),
 ("A08_NVision74_detail_rear",20.25,20.79,"Hyundai N Vision 74","rear diffuser/LED short macro"),
 ("A09_NVision74_drone_corner",20.86,22.42,"Hyundai N Vision 74","drone looking down at racing corner"),
]
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for block in iter(lambda:f.read(1048576),b""):h.update(block)
 return h.hexdigest()
def ffmeta(path):
 d=json.loads(subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],text=True,capture_output=True,check=True).stdout)
 v=next(s for s in d["streams"] if s["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"fps":v.get("avg_frame_rate"),"codec":v["codec_name"],"seconds":float(d["format"]["duration"]),"has_audio":any(s["codec_type"]=="audio" for s in d["streams"]),"sha256":sha(path),"size_bytes":path.stat().st_size}
clips=[];failures=[]
for title,start,end,model,camera in SCENES:
 dest=ROOT/"clips"/(title+".mp4")
 # Accuracy matters: non-keyframe in/out cuts are re-encoded once at CRF 15 and high profile.
 cmd=["ffmpeg","-nostdin","-y","-hide_banner","-loglevel","error","-ss",str(start),"-i",str(SRC),"-t",str(round(end-start,3)),"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","medium","-crf","15","-pix_fmt","yuv420p","-c:a","aac","-b:a","224k","-movflags","+faststart",str(dest)]
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=180)
 if p.returncode:failures.append({"shot":title,"error":p.stderr[-500:]});continue
 meta=ffmeta(dest)
 p=subprocess.run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(dest),"-f","null","-"],capture_output=True,text=True,timeout=120)
 if p.returncode or meta["width"]!=1920 or meta["height"]!=1080:
  failures.append({"shot":title,"error":"decode or native size failed", "ffmpeg":p.stderr[-300:]});dest.unlink(missing_ok=True);continue
 frames=[]
 for i,fract in enumerate((.18,.42,.66,.85)):
  sec=min(meta["seconds"]*.95,max(.04,meta["seconds"]*fract))
  snap=PHOTO/(title+f"_t{i}.jpg")
  p=subprocess.run(["ffmpeg","-y","-v","error","-ss",str(sec),"-i",str(dest),"-frames:v","1","-vf","scale=640:360",str(snap)],capture_output=True,text=True,timeout=35)
  if p.returncode==0 and snap.exists():
   with Image.open(snap) as image:frames.append(image.convert("RGB").copy())
 if frames:
  sheet=Image.new("RGB",(640*2,360*2+52),(12,16,22))
  for i,im in enumerate(frames):sheet.paste(im,((i%2)*640,(i//2)*360))
  ImageDraw.Draw(sheet).text((20,722),f"{model}: {camera} | original {start:.2f}-{end:.2f}s",fill="white")
  sheet.save(PHOTO/(title+".jpg"),quality=92)
 entry={
 "clip_file":"clips/"+dest.name,"shot_id":title,"model":model,
 "physically_real":True,"model_evidence":"Hyundai manufacturer original and visual storyboard inspection",
 "filming_type":"real driving" if "detail" not in title else "real moving camera/vehicle close-up",
 "view_angle":camera,"source_file":"originals/"+SRC.name,
 "source_file_sha256":source_entry["sha256"],
 "source_url":source_entry["source_url"],
 "source_page":source_entry["source_page"],"credit":"Hyundai Motor Company",
 "source_in_seconds":start,"source_out_seconds":end,
 "portrait_crop_feasible":"editor to frame-check; 1920 landscape lacks native 1080 portrait crop",
 "known_reuse_rights":"not independently confirmed",
 "original_audio_preserved":"AAC transcode from original soundtrack when available",
 "editor_quality_note":"very short transitional handle" if meta["seconds"]<.8 else ("single continuous 7sec golden-hour follow camera setup" if title.startswith("A07") else "candidate"),
 **meta}
 clips.append(entry)
 print("CURATED",title,meta["seconds"],meta["width"],meta["height"],flush=True)
(ROOT/"curated_manifest.json").write_text(json.dumps({"gate":"PENDING HUMAN FINAL QA","source_count":1,"observed_models":["Hyundai RN22e","Hyundai N Vision 74"],"unique_camera_setups":len(clips),"actual_clips":clips,"failures":failures},indent=2))
with (ROOT/"curated_manifest.csv").open("w",newline="") as f:
 if clips:
  fields=list(clips[0]);w=csv.DictWriter(f,fields);w.writeheader();w.writerows(clips)
(ROOT/"README_START_HERE.md").write_text(
 "# YUNEX CYBER FUTURE Agent A curated video\n\n"+
 f"Contains {len(clips)} technically validated independent camera/viewpoint handles from official Hyundai footage of TWO real running prototypes. "+
 "A06/A08 are intentionally short transitional details; A07 is ONE camera setup despite its length. "+
 "Native 1920x1080 original, original audio sourced; cuts encoded CRF15 for accurate in/out; original MP4 is preserved in originals/. "+
 "Examine contact_sheets/*.jpg and curated_manifest.json. Physical-film authenticity reviewed on manufacturer original storyboard, no CGI in selected scenes. "+
 "Landscape source cannot yield true native 1080x1920 when tightly portrait-cropped. "+
 "Reuse/publication rights not independently confirmed. Agent gate is PARTIAL until cinematic review and independent second parent source.\n")
print("CURATED_OUTPUT_COUNT",len(clips),"FAIL",len(failures),flush=True)
if len(clips)<5:sys.exit(3)
