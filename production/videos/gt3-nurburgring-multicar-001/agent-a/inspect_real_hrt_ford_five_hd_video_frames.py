#!/usr/bin/env python3
"""Hard-audit five REAL 1920x1080 HRT videos by FFprobe/hash/actual 18-frame contact images.
Originals are read from artifact via CRC-confirmed inner ZIP. Publish proof to GitHub runner logs
for independent human/class make/frame evaluation, NEVER automatically grant GT3 views.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import zipfile,io,json,hashlib,subprocess,base64,os
ROOT=Path("out/gt3-hrt-five-video-actual-frame-qa"); ROOT.mkdir(parents=True,exist_ok=True)
ARCHIVES=list(Path("inputs/hrt-real-media").rglob("*.zip"))
assert len(ARCHIVES)>=1,"Missing actual GitHub artifact ZIP from source run"
ARCHIVE=None
for a in ARCHIVES:
 with zipfile.ZipFile(a) as z:
  if "SOURCE_MANIFEST.json" in z.namelist():
   ARCHIVE=a;break
assert ARCHIVE,[(a.name,a.stat().st_size) for a in ARCHIVES]
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as o:
  for c in iter(lambda:o.read(1<<20),b""):h.update(c)
 return h.hexdigest()
def cmd(x,t=35):
 p=subprocess.run(x,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-500:])
 return p.stdout
approved=[]
with zipfile.ZipFile(ARCHIVE) as z:
 assert z.testzip() is None
 manifest=json.loads(z.read("SOURCE_MANIFEST.json"))
 print("ORIGINAL_ACTUAL_HD_VIDEO_COUNT",manifest["native_hd_media_file_count"],flush=True)
 for src in manifest["sources"]:
  if src.get('status')!="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING":
   print("NOT_A_REAL_HD_SOURCE",src["source_id"],src.get("errors",[])[:2],flush=True)
   continue
  assert src["resolution"]==[1920,1080],src["source_id"]
  dest=ROOT/(src["source_id"]+".mp4")
  with z.open(src["file"]) as i,dest.open("wb") as o:
   for p in iter(lambda:i.read(1<<20),b""):o.write(p)
  assert sha(dest)==src["sha256"],src["source_id"]
  j=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(dest)]))
  v=next(q for q in j["streams"] if q["codec_type"]=="video")
  assert (int(v["width"]),int(v["height"]))==(1920,1080)
  duration=float(j["format"]["duration"]);assert duration>=2
  cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(dest),"-f","null","-"],120)
  width=420; height=236; cols=4; rows=4
  contact=Image.new("RGB",(cols*width,rows*(height+25)),(9,9,9))
  draw=ImageDraw.Draw(contact)
  frames=[]
  for k in range(cols*rows):
   ts=max(.03,duration*(k+.42)/(cols*rows))
   tmp=ROOT/("temp_"+str(k)+".jpg")
   cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{ts:.3f}","-i",str(dest),"-frames:v","1",
    "-vf","scale=420:236:force_original_aspect_ratio=decrease,pad=420:236:(ow-iw)/2:(oh-ih)/2","-q:v","3",str(tmp)],32)
   with Image.open(tmp) as image:contact.paste(image.convert("RGB"),((k%cols)*width,(k//cols)*(height+25)+25))
   tmp.unlink()
   draw.text(((k%cols)*width+6,(k//cols)*(height+25)+4),f"{src['source_id'][:25]} {ts:.2f}s",fill="white")
   frames.append(round(ts,3))
  photo=ROOT/(src["source_id"]+"_16_REAL_1080_SOURCE_FRAMES.jpg")
  contact.save(photo,quality=90,optimize=True)
  thumb=io.BytesIO();contact.resize((1440,895)).save(thumb,"JPEG",quality=79,optimize=True)
  print("HRT_REAL_CONTACT_"+src["source_id"]+"_BASE64_START:"+base64.b64encode(thumb.getvalue()).decode()+":HRT_REAL_CONTACT_"+src["source_id"]+"_BASE64_END",flush=True)
  row={"id":src["source_id"],"original_video_sha":sha(dest),"bytes":dest.stat().st_size,
   "native_pixels":[1920,1080],"duration":duration,"source":src["publisher_page"],
   "contact_sheet":str(photo.relative_to(ROOT)),
   "frames":frames,"editor_pass":"INDEPENDENT_VISUAL_GT3_ID_AND_RACE_SCENE_QA_PENDING","approved_views_added":0}
  approved.append(row)
  dest.unlink(missing_ok=True)
  print("HRT_ACTUAL_ORIGINAL_MEDIA_VERIFIED",src["source_id"],duration,src["sha256"],flush=True)
(ROOT/"QA_RESULTS.json").write_text(json.dumps({"verified_source_count":len(approved),
 "new_approved_cameras":0,"new_verified_makes":0,"sources":approved,
 "rule":"Do NOT approve unless actual frame contains Ford Mustang GT3, visually documented Nürburgring circuit and full bleed native landscape."},indent=2))
