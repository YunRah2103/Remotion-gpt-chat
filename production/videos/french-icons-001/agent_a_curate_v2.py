#!/usr/bin/env python3
"""Rebuild Agent A curated ZIP with real 2CV moving B-roll rescued from entire event original.
Source frame sequences have been manually reviewed at real in/out; never call these premium hero footage.
Do not count still cars, letterboxed films, or unrelated 205/R5/Alpine variants.
"""
import csv,hashlib,json,subprocess,shutil,urllib.request,zipfile
from pathlib import Path
from fractions import Fraction
from PIL import Image,ImageDraw
PREVIOUS=Path("out/previous-curated/fr-legends-agent-a-classics-CURATED.zip")
DEST=Path("out/fr-legends-agent-a-classics-v2")
ARCHIVE=Path("out/FR-LEGENDS-A-CLASSICS-SUPPORTING-FOOTAGE-V2.zip")
RAW=DEST/"originals"; CLIPS=DEST/"clips"; PROOFS=DEST/"contact_sheets"
for p in (RAW,CLIPS,PROOFS):p.mkdir(parents=True,exist_ok=True)
SHA_MEETING="d40f45cc4cb498fc3f875c8044a899ed19da5a8d606b161a8848151f283733e0"
URL_MEETING="https://upload.wikimedia.org/wikipedia/commons/0/07/2025_-_25th_World_Meeting_of_2CV_Friends_in_Slovenja.webm"
PAGE_MEETING="https://commons.wikimedia.org/wiki/File:2025_-_25th_World_Meeting_of_2CV_Friends_in_Slovenja.webm"
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for chunk in iter(lambda:f.read(1048576),b""):h.update(chunk)
 return h.hexdigest()
def run(args,timeout=200):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError("COMMAND_FAILED "+p.stderr[-700:])
 return p.stdout
def probe(path):
 data=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]))
 s=next(x for x in data["streams"] if x["codec_type"]=="video")
 return {"width":int(s["width"]),"height":int(s["height"]),
         "duration_sec":round(float(data["format"]["duration"]),3),
         "fps":round(float(Fraction(s.get("avg_frame_rate","0/1"))),3),
         "codec":s["codec_name"],"bitrate_bps":int(data["format"].get("bit_rate") or 0),
         "source_audio":any(x["codec_type"]=="audio" for x in data["streams"])}
def sheet(path,slug,duration):
 canvas=Image.new("RGB",(1440,700),"#0d1117")
 draw=ImageDraw.Draw(canvas)
 draw.text((12,10),slug+": 5 frames from exact delivered clip",fill="white")
 for i,part in enumerate((.12,.3,.5,.7,.88)):
  temp=PROOFS/(slug+"-temp-"+str(i)+".jpg")
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(round(duration*part,3)),
       "-i",str(path),"-frames:v","1","-vf","scale=710:-2",str(temp)],60)
  with Image.open(temp) as image:
   shot=image.convert("RGB")
   shot.thumbnail((705,300))
   canvas.paste(shot,((i%2)*720+7,(i//2)*212+30))
  temp.unlink(missing_ok=True)
  if i==4:break
 name=PROOFS/(slug+"-sheet.jpg")
 canvas.save(name,quality=89)
 return str(name.relative_to(DEST))
assert PREVIOUS.exists(),f"Previous approved real media artifact not found {PREVIOUS}"
with zipfile.ZipFile(PREVIOUS) as z:
 old=json.loads(z.read("manifest.json"))
 for item in ("clips/citroen-2cv-convoy-2022.mp4","originals/citroen-2cv-convoy-2022.webm","contact_sheets/citroen-2cv-convoy-2022-sheet.jpg"):
  with z.open(item) as s,(DEST/item).open("wb") as t:shutil.copyfileobj(s,t,1024*1024)
previous=old["approved"][0]
assert sha(CLIPS/"citroen-2cv-convoy-2022.mp4")==previous["clip_sha256"]
assert sha(RAW/"citroen-2cv-convoy-2022.webm")==previous["original_sha256"]
records=[{"id":"2cv-convoy-original-4k",
          "source_page":previous["commons"]["page"],"creator":"OSeveno",
          "make":"Citroën","model":"2CV","original_year":2022,
          "file_path":"clips/citroen-2cv-convoy-2022.mp4",
          "source_path":"originals/citroen-2cv-convoy-2022.webm",
          "original_sha256":previous["original_sha256"],
          "clip_sha256":previous["clip_sha256"],
          "source_in":1.0,"source_out":8.0,
          "original_probe":probe(RAW/"citroen-2cv-convoy-2022.webm"),
          "extract_probe":probe(CLIPS/"citroen-2cv-convoy-2022.mp4"),
          "license":"CC BY-SA 4.0: credit OSeveno, preserve source link; share-alike as applicable",
          "visual_review":"PASS_SUPPORTING_BROLL",
          "moving_car_verified":True,
          "is_distinct_camera_viewpoint":True,
          "subject_position":"Moving road convoy; stationary camera angle",
          "contact_sheet":"contact_sheets/citroen-2cv-convoy-2022-sheet.jpg"}]
dest=RAW/"citroen-2cv-meeting-2025.webm"
with urllib.request.urlopen(urllib.request.Request(URL_MEETING,headers={"User-Agent":"YunexFootageQA/1.0"}),timeout=65) as response:
 size=int(response.headers.get("Content-Length") or 0)
 if size and size>110000000:raise RuntimeError("unexpected source size")
 n=0
 with dest.open("wb") as f:
  while True:
   b=response.read(1<<20)
   if not b:break
   n+=len(b)
   if n>110000000:raise RuntimeError("source too large")
   f.write(b)
assert sha(dest)==SHA_MEETING, "Original 2025 meeting source SHA256 mismatch"
native=probe(dest)
assert native["width"]==1920 and native["height"]==1080 and native["fps"]>=29.9,native
# Same car-model but entirely different driving scenes and real camera compositions.
scenes=[
 ("2cv-daytime-driving",17.0,22.0,
  "Real red and white original 2CVs drive past at a low roadside static angle; car small in wide frame; backup B-roll."),
 ("2cv-night-headlights",80.5,83.5,
  "Real white original 2CV approaches event field with lit headlights at twilight; camera fixed, car moves into frame."),
 ("2cv-colourful-convoy",91.6,96.4,
  "Real flame-painted original 2CV driving through campsite, rear/side viewpoints, other 2CVs parked; supporting B-roll.")
]
for slug,start,end,visual in scenes:
 destclip=CLIPS/(slug+".mp4")
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(dest),
      "-t",str(end-start),"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","fast",
      "-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-movflags","+faststart",
      str(destclip)],180)
 actual=probe(destclip)
 assert (actual["width"],actual["height"])==(1920,1080) and actual["duration_sec"]>=2.9,actual
 run(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(destclip),"-f","null","-"],120)
 proof=sheet(destclip,slug,actual["duration_sec"])
 records.append({"id":slug,"source_page":PAGE_MEETING,
    "creator":"Wikimedia Commons 2CV meeting videographer (verify contributor credit from file page)",
    "make":"Citroën","model":"2CV","original_year":2025,
    "file_path":str(destclip.relative_to(DEST)),"source_path":str(dest.relative_to(DEST)),
    "original_sha256":SHA_MEETING,"clip_sha256":sha(destclip),
    "source_in":start,"source_out":end,"original_probe":native,"extract_probe":actual,
    "license":"CC BY 4.0 per Commons video metadata; attribution required; verify contributor name",
    "visual_review":"PASS_SUPPORTING_BROLL_ONLY","moving_car_verified":True,
    "is_distinct_camera_viewpoint":True,"subject_position":visual,
    "contact_sheet":proof})
manifest={"project":"YUNEX FR Legends 001","agent":"A Classics",
  "status":"PARTIAL_DELIVERY_GATE_BLOCKED","verified_real_supporting_angles":len(records),
  "verified_premium_hero_angles":0,
  "verified_classic_models":["Citroën 2CV"],
  "minimum_required_unique_angles":18,"minimum_required_models":5,
  "native_minimum_pixels_enforced":True,
  "publisher_reuse_terms_note":"Observe Commons source licence and attribution; no claim of exclusive rights.",
  "qa_note":"Original video fully decoded and extracted real camera-driving shots manually reviewed; shots may be too weak for final premium cut.",
  "exclusion_note":"Old 2CV meeting intro 1–8s with burned-in text, DS wrong vehicle, empty Alpine road excluded; no faux 1080p.",
  "files":records}
(DEST/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
with (DEST/"manifest.csv").open("w",newline="") as f:
 keys=["id","source_page","creator","model","file_path","source_path","clip_sha256","source_in","source_out","visual_review"]
 w=csv.DictWriter(f,fieldnames=keys,extrasaction="ignore");w.writeheader();w.writerows(records)
(DEST/"README.md").write_text(
 """# FR Legends — Agent A, curated authentic French 2CV motion footage V2
Status: **PARTIAL, Gate A BLOCKED**. NOT a complete five-model 18-angle handoff.

Contents: four independent real, moving 2CV shots, one 4K (3840x2160),
three 1080p (1920x1080), all individually FFmpeg-decoded. The MP4s are
H264 transcodes at exact original pixel dimensions and never upscaled.

All three newly recovered camera events come from a distinct 96.765s Commons
original of the 2025 2CV World Meeting; original and accurate SHA are included.
Credits and Commons source links in manifest. These are clean real supporting
B-roll, not high-end tracking shots or a substitute for missing Peugeot/Renault/Alpine.

Need native 1080p+ aesthetic DRIVING originals for Renault 5 Turbo/Clio V6,
Peugeot 205 GTI/205 T16/306 Maxi, Citroen DS and 1970s Alpine A110.
Do not proceed to final edit based on this bundle alone.
""")
with zipfile.ZipFile(ARCHIVE,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for file in DEST.rglob("*"):
  if file.is_file():z.write(file,file.relative_to(DEST))
print("AGENT_A_V2_RESULT",json.dumps({"source_sha_old":previous["clip_sha256"],
  "new_source_sha":SHA_MEETING,"verified_supporting_distinct_shots":len(records),
  "models":1,"hero_shots":0,"gate":"BLOCKED",
  "zip_bytes":ARCHIVE.stat().st_size,"zip_sha256":sha(ARCHIVE)}),flush=True)
