#!/usr/bin/env python3
"""Reproduce Agent A French Legends 19 shots on GitHub Actions.

Inputs are existing Actions artifacts for 17 reviewed classic clips and two exact
FULL NATIVE HD 1920x1080 source excerpts of original 205 GTI. Explicitly label
portrait edits as upscaled *crops* of native landscape; never imply native portrait.
Preserves original source excerpts and byte-for-byte verifies all 17 base clips.
Rights to reuse public press / archived creator footage remain UNVERIFIED.
"""
import csv,hashlib,json,subprocess,shutil,zipfile,io,pathlib
from fractions import Fraction
from PIL import Image,ImageDraw

ROOT=pathlib.Path("out/fr-legends-a-v6-19")
IN=pathlib.Path("out/v6-imports")
V5=IN/"v5"/"FR-LEGENDS-AGENT-A-CLASSICS-17-REAL-MOVING-SHOTS.zip"
QA=IN/"peugeot"/"FR-A-PEUGEOT-205-REAL-1080-EXTERIOR-RANGE-QA.zip"
FINAL=pathlib.Path("out/FR-LEGENDS-AGENT-A-CLASSICS-V6-19-REAL-DRIVING-SHOTS.zip")
V5_SHA="db931a263a3fa0bc506a8d3400df6491cb9a4f48d4497ca307ec7290ba132ad7"
FILM_SHA="395c0160d86a2595a407b42c0097832be0709f7f1a580c3c579ebc71d75f4d34"
SOURCE_SHA={
 "front-205-oncoming":"2d5888db3782ea9738a201fbc59e197224844ec9d335fc2fce77d2dae107ef71",
 "rear-205-tracking":"05f8b82204dc076ae76dfac1f5264c174bf0b1f907222f6afcee22750e396d15",
}
def sha(path):
 h=hashlib.sha256()
 with open(path,"rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def checkcmd(args,limit=130):
 p=subprocess.run(args,text=True,capture_output=True,timeout=limit)
 if p.returncode:raise RuntimeError(str(args)[:100]+" "+p.stderr[-600:])
 return p.stdout
def probe(p):
 meta=json.loads(checkcmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],35))
 v=next(x for x in meta["streams"] if x["codec_type"]=="video")
 return {"width":int(v["width"]),"height":int(v["height"]),
   "fps":round(float(Fraction(v["avg_frame_rate"])),3),
   "duration":round(float(meta["format"]["duration"]),3),
   "bitrate":int(meta["format"].get("bit_rate") or 0),
   "codec":v["codec_name"],
   "audio":any(x["codec_type"]=="audio" for x in meta["streams"])}
assert V5.is_file() and QA.is_file(),(V5,QA)
assert sha(V5)==V5_SHA, "17-clip source does NOT have expected verified full-zip checksum"
for d in ("clips","originals","contact_sheets"):(ROOT/d).mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(V5) as z:
 assert z.testzip() is None
 z.extractall(ROOT)
m=json.loads((ROOT/"manifest.json").read_text())
assert len(m["clips"])==17 and m["models_count"]==4
for item in m["clips"]:
 assert sha(ROOT/item["clip"])==item["sha256"],item["id"]
print("PRESERVE_BASE_17_INDEPENDENT_SHA_PASSED",flush=True)
with zipfile.ZipFile(QA) as z:
 assert z.testzip() is None
 for slug,want in SOURCE_SHA.items():
  data=z.read(slug+".mp4")
  src=ROOT/"originals"/("peugeot-205-gti-"+slug+"-source-1920x1080.mp4")
  src.write_bytes(data)
  assert sha(src)==want,(slug,sha(src),want)
  p=probe(src)
  assert p["width"]==1920 and p["height"]==1080 and p["fps"]==25 and 8.95<=p["duration"]<=9.05,p
  a=1 if slug.startswith("front") else 2
  length=4.6 if slug.startswith("front") else 5.7
  grade="premium" if slug.startswith("front") else "supporting"
  fname="peugeot-205-gti-"+slug.replace("205-","")+"-portrait-1080x1920.mp4"
  dst=ROOT/"clips"/fname
  vf=("crop=608:1080:x='min(1312,1112+28*t)':y=0,scale=1080:1920:flags=lanczos,setsar=1"
      if slug.startswith("front") else
      "crop=608:1080:656:0,scale=1080:1920:flags=lanczos,setsar=1")
  checkcmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(a),
      "-i",str(src),"-t",str(length),"-vf",vf,
      "-c:v","libx264","-crf","18","-preset","fast","-pix_fmt","yuv420p",
      "-an","-movflags","+faststart",str(dst)],160)
  out=probe(dst)
  assert (out["width"],out["height"],out["fps"])==(1080,1920,25),out
  assert abs(out["duration"]-length)<0.1,out
  checkcmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror",
            "-i",str(dst),"-map","0:v:0","-f","null","-"],85)
  sheet=Image.new("RGB",(1195,890),"#14171c")
  draw=ImageDraw.Draw(sheet)
  draw.text((8,5),slug+" 4 real fully decoded final output portrait frames",fill="white")
  for i,f in enumerate((.07,.30,.58,.86)):
   thumb=ROOT/"contact_sheets"/(slug+"-temp-"+str(i)+".jpg")
   checkcmd(["ffmpeg","-hide_banner","-loglevel","error","-y",
    "-ss",str(f*out["duration"]),"-i",str(dst),
    "-frames:v","1","-vf","scale=270:-2",str(thumb)],65)
   with Image.open(thumb) as picture:
    sheet.paste(picture.convert("RGB"),(i*295+6,25))
   thumb.unlink()
  name="peugeot-205-gti-"+slug+"-actual-four-frames.jpg"
  sheet.save(ROOT/"contact_sheets"/name,quality=89)
  row={"id":"peugeot-205-gti-"+slug.replace("205-",""),
     "make":"Peugeot","model":"original Peugeot 205 GTI 1.9",
     "source_url":"https://archive.org/details/peugeot-205-gti-1.9.-is-this-the-best-hot-hatch-ever",
     "creator":"Harry's Garage (original 205 GTI road-test film)",
     "original_full_film_sha256":FILM_SHA,
     "clip":"clips/"+fname,"original":"originals/"+src.name,
     "sha256":sha(dst),"original_sha256":want,
     "source_in":(991 if slug.startswith("front") else 1113.5)+a,
     "source_out":(991 if slug.startswith("front") else 1113.5)+a+length,
     "probe":out,"original_probe":p,
     "contact_sheet":"contact_sheets/"+name,
     "camera_grade":grade,"actual_car_motion":True,
     "qa_description":("Original 205 GTI approaching moving camera, close front tracking" if slug.startswith("front") else
       "Original 205 GTI retreating around countryside bends, moving rear-follow view"),
     "source_native_dimensions":[1920,1080],
     "portrait_output_upscaled_from_native_landscape_crop":True,
     "technical_notes":"Original untouched native 1920x1080 source available inside ZIP. Clean vertical presentation reframed by cropping to 608x1080 then scaled to 1080x1920. This is not a native 1080x1920 original camera capture; don't claim so. Source landscape video has Harry's Garage logo, final crop excludes it.",
     "rights_notes":"Harry's Garage reuse permission for social publication unconfirmed. Original archive listing is not a social/video reuse licence."}
  m["clips"].append(row)
  print("NEW_205_GTI_REAL_VERIFIED",row["id"],json.dumps(out),"source_sha",want,flush=True)
assert len(m["clips"])==19
m.update({"models":["Citroen 2CV","original Alpine A110","Renault 5 Turbo 2","classic Citroen DS","original Peugeot 205 GTI"],
 "models_count":5,"true_native_video_clips":19,
 "gate":"COVERAGE_MINIMUM_MET_RIGHTS_NOT_CLEARED",
 "contract_min_shots":18,"contract_min_models":5,
 "premium_dramatic_shots":sum(x["camera_grade"]=="premium" for x in m["clips"]),
 "supporting_real_motion_shots":sum(x["camera_grade"]=="supporting" for x in m["clips"]),
 "rights_warning":"Publisher/creator reuse rights unverified. Technical footage counts are not permission to post.",
 "vertical_reframe_note":"The two new 205 GTI portrait clips are scaled from native-HD landscape crops, not native portrait originals."})
(ROOT/"manifest.json").write_text(json.dumps(m,indent=2,ensure_ascii=False))
with (ROOT/"manifest.csv").open("w",newline="") as f:
 keys=["id","make","model","source_url","creator","clip","original","sha256",
 "source_in","source_out","camera_grade","actual_car_motion","rights_notes"]
 w=csv.DictWriter(f,fieldnames=keys,extrasaction="ignore")
 w.writeheader();w.writerows(m["clips"])
(ROOT/"README.md").write_text("YUNEX French Legends Agent A Classics: 19 real independently decoded moving video clips across 5 real classic model families. Every one of the prior 17 clips preserved bit for bit. New Peugeot 205 GTI source files are native 1920x1080. Their clean editor-facing 1080x1920 portrait crops have been scaled from 608x1080 native image slices, which MUST NOT be described as originally recorded native-vertical 1080. Three extremely short Citroen DS 0.7-0.8 second shots are from adjacent edits in the same Paris film; editor should assess aesthetic independence. Nominal coverage threshold 18 clips/5 models met; strong distinct cinematic angles fewer, and publisher/creator social-use rights NOT CLEARED. Obtain permissions prior to public posting.\n")
FINAL.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(FINAL,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=1,allowZip64=True) as z:
 for p in ROOT.rglob("*"):
  if p.is_file():z.write(p,p.relative_to(ROOT))
with zipfile.ZipFile(FINAL) as z:
 assert z.testzip() is None
 for row in m["clips"]:
  assert hashlib.sha256(z.read(row["clip"])).hexdigest()==row["sha256"],row["id"]
print("REAL_AGENT_A_V6_19_SHOTS",json.dumps({"clip_count":19,"models":5,"zip_bytes":FINAL.stat().st_size,"sha256":sha(FINAL),"gate":m["gate"]}),flush=True)
