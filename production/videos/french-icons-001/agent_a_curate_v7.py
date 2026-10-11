#!/usr/bin/env python3
"""Agent A V7: 20 native-source, genuine moving French classic shots.

Take the exact V6 GitHub Actions media archive by SHA, never change its 19 prior clips,
and add a fourth truly distinct classic Citroen DS FRONT moving angle (1955-1975 model)
from Stellantis's public 2025 DS parade original. This is an actual cinema/video
extract, not a still, fake upscale, gameplay or modern electric DS.
Public download does not establish social redistribution rights.
"""
from pathlib import Path
import csv,hashlib,io,json,subprocess,zipfile
from fractions import Fraction
from PIL import Image,ImageDraw

BASE=Path("out/source-v6")
ROOT=Path("out/fr-a-v7-20-verified-shots")
OUT=Path("out/FR-LEGENDS-AGENT-A-CLASSICS-V7-20-GENUINE-DRIVING-SHOTS.zip")
BASE_SHA="49b0d976c9f34df2356f33eec68f829ac56b59d21a4cf26029d3fc04a736efc1"
SOURCE_SHA="a7c4bff0f3f945acf88f49b1cfc468e7bd415c2cf0034bad2ef9b27090dc2d19"
SOURCE=ROOT/"originals"/"citroen-ds-2025-paris-night-parade-1080p-original.mp4"
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as inp:
  for b in iter(lambda:inp.read(1<<20),b""):h.update(b)
 return h.hexdigest()
def run(cmd,timeout=140):
 x=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 if x.returncode:raise RuntimeError(x.stderr[-700:])
 return x.stdout
def probe(p):
 d=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],40))
 v=next(x for x in d["streams"] if x["codec_type"]=="video")
 return {"width":int(v["width"]),"height":int(v["height"]),
  "fps":round(float(Fraction(v["avg_frame_rate"])),3),
  "duration":round(float(d["format"]["duration"]),3),
  "codec":v["codec_name"],"audio":any(x["codec_type"]=="audio" for x in d["streams"])}
files=list(BASE.glob("*.zip"))
assert len(files)==1,(BASE,files)
parent=files[0]
assert sha(parent)==BASE_SHA,("INCORRECT_PREVIOUS_ARTIFACT",sha(parent))
print("V7_VERIFIED_PARENT_SHA",sha(parent),flush=True)
ROOT.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(parent) as z:
 assert z.testzip() is None
 z.extractall(ROOT)
man=json.loads((ROOT/"manifest.json").read_text())
assert len(man["clips"])==19 and man["models_count"]==5
old_hashes={c["id"]:c["sha256"] for c in man["clips"]}
for old in man["clips"]:
 p=ROOT/old["clip"]
 assert p.exists() and sha(p)==old["sha256"],old["id"]
assert SOURCE.is_file() and sha(SOURCE)==SOURCE_SHA
source_probe=probe(SOURCE)
assert source_probe["width"]==1920 and source_probe["height"]==1080
assert source_probe["fps"]==24 and source_probe["duration"]>22
print("V7_ACTUAL_SOURCE",SOURCE_SHA,json.dumps(source_probe),flush=True)
START=4.12;DURATION=.74
out=ROOT/"clips"/"ds-1955-rally-front-archway-night-1080p.mp4"
run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(START),
 "-i",str(SOURCE),"-t",str(DURATION),"-map","0:v:0","-map","0:a?",
 "-c:v","libx264","-crf","17","-preset","fast","-pix_fmt","yuv420p",
 "-c:a","aac","-b:a","160k","-movflags","+faststart",str(out)],90)
info=probe(out)
assert (info["width"],info["height"],info["fps"])==(1920,1080,24),info
assert .6<=info["duration"]<=.9,info
run(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(out),
 "-map","0:v:0","-f","null","-"],60)
sheet=ROOT/"contact_sheets"/"ds-1955-front-rally-night-archway-4-frames.jpg"
board=Image.new("RGB",(1450,660),"#13171e")
draw=ImageDraw.Draw(board)
draw.text((9,7),"NEW 20th SHOT: real classic Citroen DS rally car approaches under illuminated arch; 4 actual output frames",fill="white")
for i,f in enumerate((.1,.34,.63,.9)):
 t=info["duration"]*f
 jpg=ROOT/"contact_sheets"/f"__proof-{i}.jpg"
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),
  "-i",str(out),"-frames:v","1","-vf","scale=710:-2",str(jpg)],55)
 with Image.open(jpg) as image:
  im=image.convert("RGB");im.thumbnail((710,295))
  board.paste(im,((i%2)*725+5,(i//2)*313+27))
 jpg.unlink()
board.save(sheet,quality=90)
new={
 "id":"ds-rally-front-under-archway-night",
 "make":"Citroen",
 "model":"historic Citroen DS (rally-livery, black vintage original, NOT electric DS)",
 "source_url":"https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4",
 "creator":"DS Automobiles / Stellantis heritage official public press source",
 "clip":"clips/"+out.name,
 "original":"originals/"+SOURCE.name,
 "sha256":sha(out),
 "original_sha256":SOURCE_SHA,
 "source_in":START,
 "source_out":round(START+DURATION,3),
 "probe":info,
 "contact_sheet":"contact_sheets/"+sheet.name,
 "camera_grade":"premium",
 "actual_car_motion":True,
 "qa_description":"Distinct original classic black DS rally car from frontal three-quarter camera moving forward under lit monument archway, separate from black side/red side/black rear clips already in V6. Approx 0.75 s native 1920x1080 24fps; effective for rapid beat cut.",
 "rights_notes":"Publisher's Oodrive public press Share permits viewing/downloading only; social-media and commercial reuse permission not independently confirmed. Do not publish without rights confirmation."
}
man["clips"].append(new)
man["true_native_video_clips"]=len(man["clips"])
man["models_count"]=5
man["premium_dramatic_shots"]=sum(c.get("camera_grade")=="premium" for c in man["clips"])
man["supporting_real_motion_shots"]=sum(c.get("camera_grade")=="supporting" for c in man["clips"])
man["gate"]="COVERAGE_MINIMUM_MET_RIGHTS_AND_CINEMATIC_REVIEW_PENDING"
man["last_new_video"]="Fourth genuinely distinct DS front three-quarter camera shot in 2025 Paris parade; all 19 V6 exact bytes unchanged."
man["quality_caveat"]="20 total shots across five classic models; multiple DS angles are <1 second and intended for fast cuts; not 20 long-form cinematic takes. Original Peugeot portrait 1080x1920 crops derive from landscape 1920x1080 with upscaling, not native vertical 1080x1920 capture."
man["rights_warning"]="Do not claim commercial/TikTok redistribution licences for press/archive originals without authorisation."
assert len(man["clips"])==20 and len({x["id"] for x in man["clips"]})==20
for old in man["clips"][:-1]:
 assert sha(ROOT/old["clip"])==old_hashes[old["id"]],old["id"]
(ROOT/"manifest.json").write_text(json.dumps(man,indent=2,ensure_ascii=False))
with (ROOT/"manifest.csv").open("w",newline="") as out_csv:
 keys=["id","make","model","source_url","creator","clip","original","sha256",
       "source_in","source_out","camera_grade","actual_car_motion","rights_notes"]
 w=csv.DictWriter(out_csv,fieldnames=keys,extrasaction="ignore")
 w.writeheader();w.writerows(man["clips"])
(ROOT/"README.md").write_text(
 "YUNEX French Legends Agent A - V7 final technical media handoff. 20 genuine real moving shots across "+
 "five vintage French car model families. All nineteen V6 video clip SHA256 values preserved unmodified. "+
 "Adds one distinct original DS rally car frontal night driving shot from the official Stellantis 1080p source. "+
 "Footage coverage target (18 shots, five models) exceeded. Three V6 DS cuts and this new shot are "+
 "roughly 0.7-0.8s each, optimal for rapid beat sync, not extended sequences. "+
 "Other segments vary in visual intensity; editor should choose carefully. "+
 "Landscape footage reframed as portrait is not new native vertical capture. "+
 "Commercial/social-media reuse rights UNVERIFIED for some sources; obtain permission before publishing.\n"
)
for original in man["clips"]:
 assert sha(ROOT/original["clip"])==original["sha256"],original["id"]
OUT.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(OUT,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as archive:
 for p in ROOT.rglob("*"):
  if p.is_file():archive.write(p,p.relative_to(ROOT))
with zipfile.ZipFile(OUT) as z:
 assert z.testzip() is None
 mm=json.loads(z.read("manifest.json"))
 assert len(mm["clips"])==20 and mm["models_count"]==5
print("REAL_FRENCH_LEGENDS_A_V7_DELIVERY",json.dumps({
 "clips":len(man["clips"]),"models":man["models_count"],
 "premium":man["premium_dramatic_shots"],"supporting":man["supporting_real_motion_shots"],
 "new_shot_sha256":new["sha256"],"parent_sha256":BASE_SHA,
 "zip_bytes":OUT.stat().st_size,"zip_sha256":sha(OUT),
 "gate":man["gate"]}),flush=True)
