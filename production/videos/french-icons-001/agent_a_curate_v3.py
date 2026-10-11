#!/usr/bin/env python3
"""Curate genuine 1080/4K French classics; real reviewed shots only; Gate A blocked."""
import csv,hashlib,json,subprocess,zipfile,shutil
from pathlib import Path
from fractions import Fraction
from PIL import Image,ImageDraw
ROOT=Path("out/fr-legends-agent-a-v3")
Z2=Path("out/v2/FR-LEGENDS-A-CLASSICS-SUPPORTING-FOOTAGE-V2.zip")
ZA=Path("out/alpine/FR-LEGENDS-A-ALPINE-HISTORIC-REAL-1080.zip")
FINAL=Path("out/FR-LEGENDS-AGENT-A-CLASSICS-13-REAL-MOVING-SHOTS.zip")
for d in ["clips","originals","contact_sheets"]:(ROOT/d).mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1<<20),b""):h.update(c)
 return h.hexdigest()
def cmd(args,t=200):
 p=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-450:])
 return p.stdout
def probe(path):
 d=json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)]))
 v=next(s for s in d["streams"] if s["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],
  "fps":round(float(Fraction(v["avg_frame_rate"])),3),
  "duration":round(float(d["format"].get("duration") or 0),3),
  "codec":v["codec_name"],"audio":any(s["codec_type"]=="audio" for s in d["streams"])}
def extract(z,archive_path):
 p=ROOT/archive_path;p.parent.mkdir(parents=True,exist_ok=True)
 with z.open(archive_path) as src,p.open("wb") as dst:shutil.copyfileobj(src,dst,1<<20)
 return p
def sheet(clip,name,sec):
 canvas=Image.new("RGB",(1430,590),"#131720");draw=ImageDraw.Draw(canvas)
 draw.text((12,9),name+": actual decoded frames from delivered MP4",fill="white")
 for i,f in enumerate([.06,.3,.6,.9]):
  jpeg=ROOT/"contact_sheets"/("_"+name+str(i)+".jpg")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(sec*f),"-i",str(clip),
       "-frames:v","1","-vf","scale=700:-2",str(jpeg)],70)
  with Image.open(jpeg) as im:
   im=im.convert("RGB");im.thumbnail((700,275))
   canvas.paste(im,((i%2)*713+4,(i//2)*284+23))
  jpeg.unlink()
 path=ROOT/"contact_sheets"/(name+".jpg");canvas.save(path,quality=89)
 return str(path.relative_to(ROOT))
assert Z2.exists() and ZA.exists(),"missing original Actions video artifacts"
with zipfile.ZipFile(Z2) as z:
 old=json.loads(z.read("manifest.json"))
 for v in old["files"]:
  a=extract(z,v["file_path"])
  assert sha(a)==v["clip_sha256"]
  raw=ROOT/v["source_path"]
  if not raw.exists():extract(z,v["source_path"])
  assert sha(raw)==v["original_sha256"]
  extract(z,v["contact_sheet"])
rows=[]
for v in old["files"]:
 rows.append({"id":v["id"],"make":v["make"],"model":v["model"],
  "source_url":v["source_page"],"creator":v["creator"],
  "clip":v["file_path"],"original":v["source_path"],"sha256":v["clip_sha256"],
  "original_sha256":v["original_sha256"],"source_in":v["source_in"],"source_out":v["source_out"],
  "probe":probe(ROOT/v["file_path"]),"contact_sheet":v["contact_sheet"],
  "camera_grade":"supporting","actual_car_motion":True,
  "rights_notes":v["license"]})
alpine=ROOT/"originals"/"alpine-a110-2013-rally-original-1080p.mp4"
with zipfile.ZipFile(ZA) as z:
 meta=json.loads(z.read("manifest.json"))
 assert meta["real_1080_decoded"]
 with z.open("clips/alpine-a110-historic-rally-1080p.mp4") as src,alpine.open("wb") as dst:shutil.copyfileobj(src,dst,1<<20)
 assert sha(alpine)=="4929c124d47966d38e96df7c35451baec6aae50ecfc5e79e18f98df3c1a4ab2a"
m=probe(alpine)
assert (m["width"],m["height"])==(1920,1080) and m["fps"]==25.0 and m["duration"]>90,m
# Real 1080p exact segments inspected in local 10-scene storyboard.
# The opening 'city-launch' shot contains subtitles, so is excluded.
shots=[
 ("a110-city-crowd-overhead",36.5,39.2,"supporting","Blue classic Alpine A110 drives through crowd at Reims start, overhead camera."),
 ("a110-city-rollout",40.2,42.4,"premium","Blue classic Alpine A110 drives into cheering city crowds, night low front tracking."),
 ("a110-mountain-front-bend",51.5,53.65,"premium","Blue original Alpine A110 attacks sunny mountain road bend, front three-quarter."),
 ("a110-mountain-head-on",53.75,55.75,"premium","Blue original Alpine A110 accelerates toward camera, then passes side."),
 ("a110-mountain-rear",55.9,57.7,"supporting","Blue original Alpine A110 leaves a mountain corner, rear view."),
 ("a110-fender-driving",67.85,69.7,"supporting","Original Alpine A110 left-front mounted driving perspective followed by forward corner."),
 ("a110-snow-hairpin",69.9,71.6,"premium","Blue original Alpine A110 steers through tight snowy hairpin, side/rear camera."),
 ("a110-snow-acceleration",83.7,87.2,"premium","Blue classic Alpine A110 accelerates uphill into the snowy trees; snow spray."),
 ("a110-rally-village",89.7,91.6,"supporting","Blue original Alpine A110 drives into St-Bonnet-le-Froid snowy rally village.")
]
for slug,a,b,tier,desc in shots:
 path=ROOT/"clips"/(slug+".mp4")
 cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(a),"-i",str(alpine),
      "-t",str(b-a),"-map","0:v:0","-c:v","libx264","-preset","fast","-crf","18",
      "-pix_fmt","yuv420p","-an","-movflags","+faststart",str(path)],200)
 p=probe(path)
 assert (p["width"],p["height"])==(1920,1080) and abs(p["fps"]-25)<0.01 and p["duration"]>=1.5
 cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(path),"-map","0:v:0","-f","null","-"],110)
 proof=sheet(path,slug,p["duration"])
 rows.append({"id":slug,"make":"Alpine (Renault)","model":"original 1960s-1970s Alpine A110",
     "source_url":meta["page"],"creator":"Alpine/Renault Classic publisher film",
     "clip":str(path.relative_to(ROOT)),"original":str(alpine.relative_to(ROOT)),
     "sha256":sha(path),"original_sha256":sha(alpine),"source_in":a,"source_out":b,
     "probe":p,"contact_sheet":proof,"camera_grade":tier,"actual_car_motion":True,
     "qa_description":desc,"rights_notes":"Renault/Alpine press-published video; public playback but redistribution/TikTok publication permission NOT established."})
assert len(rows)==13,len(rows)
report={"project":"FR Legends 001","agent":"A Classics",
 "gate":"BLOCKED_PARTIAL","true_native_video_clips":len(rows),
 "premium_dramatic_shots":sum(x["camera_grade"]=="premium" for x in rows),
 "supporting_real_motion_shots":sum(x["camera_grade"]=="supporting" for x in rows),
 "models":["Citroen 2CV","original Alpine A110"],"models_count":2,
 "contract_min_shots":18,"contract_min_models":5,
 "provenance":"Original full-HD/4K video files are in originals folder, with SHA256 and original source URLs.",
 "licence_warning":"2CV Wikimedia Commons CC BY/CC BY-SA credit required; Alpine publisher authorization for social reuse unverified.",
 "ffmpeg_visual_verification":"Each selected clip independently decoded; sampled review storyboard before clipping; no still-photo animations or artificially upscaled originals.",
 "clips":rows}
(ROOT/"manifest.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
with (ROOT/"manifest.csv").open("w",newline="") as f:
 keys=["id","make","model","source_url","creator","clip","original","sha256","source_in","source_out","camera_grade","actual_car_motion","rights_notes"]
 w=csv.DictWriter(f,fieldnames=keys,extrasaction="ignore");w.writeheader();w.writerows(rows)
(ROOT/"README.md").write_text(
 "YUNEX FR Legends Agent A: 13 real native-resolution clips over 2 classic French models.\n"+
 "9 different original Alpine A110 historic rally driving angles (1080p 25fps) plus four moving 2CV clips (1 4K, 3 1080p).\n"+
 "Some are premium driving sequences; some are supporting event B-roll. No upscaling, fake video or misidentified newer Renault Alpine.\n"+
 "Alpine historic source has no audio. Citroen original source includes event audio.\n"+
 "RIGHTS: Commons CC attribution applies; Alpine press film publication rights unverified. Do not publish Alpine without permission review.\n"+
 "GATE A BLOCKED: need 18 high quality distinct shots and 5 classic car models. Still missing Peugeot 205/306, Renault 5 Turbo/Clio V6 and driving DS.\n")
with zipfile.ZipFile(FINAL,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as archive:
 for p in ROOT.rglob("*"):
  if p.is_file():archive.write(p,p.relative_to(ROOT))
print("REAL_FRENCH_CLASSICS_V3",json.dumps({"real_clips":len(rows),"distinct_models":2,
      "premium":report["premium_dramatic_shots"],"supporting":report["supporting_real_motion_shots"],
      "zip_bytes":FINAL.stat().st_size,"zip_sha256":sha(FINAL),"gate":"BLOCKED"}),flush=True)
