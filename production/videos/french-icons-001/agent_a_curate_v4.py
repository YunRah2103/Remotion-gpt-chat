#!/usr/bin/env python3
"""Build ONE verified 14-clip YUNEX French classic real-car footage ZIP.

Preserve original 13 V3 editor-ready full-native HD media and add ONE independently
reviewed original Renault 5 Turbo 2 motorway tracking composition from real 1080p.
Do not count the watermark-bearing AutoWeek Peugeot clip or unsafe upscales.
Original archive reuse permissions not verified; legal/reuse notes preserved.
"""
import hashlib,json,zipfile,urllib.request,subprocess,shutil,csv,time
from pathlib import Path
from PIL import Image,ImageDraw
from fractions import Fraction
V3=Path("out/source-v3/FR-LEGENDS-AGENT-A-CLASSICS-13-REAL-MOVING-SHOTS.zip")
OUT=Path("out/fr-legends-agent-a-v4")
FINAL=Path("out/FR-LEGENDS-AGENT-A-CLASSICS-14-REAL-MOVING-SHOTS.zip")
for d in (OUT/"clips",OUT/"originals",OUT/"contact_sheets"):d.mkdir(parents=True,exist_ok=True)
URL="https://archive.org/download/renault-5-turbo-2-avec-un-beau-bruit-tube-de-fuite/Renault%205%20Turbo%202%20%20avec%20un%20beau%20bruit%21%20%28tube%20de%20fuite%F0%9F%91%8C%29.mp4"
ORIG_SHA="df5beedbab0b5990b5d4361a6c7a26e63dbfe4cd4585c12e3a61df30a1b0ac59"
V3_SHA="ebfd51f9fade5c71a6cb82f4c2a1af665fc77ef250eddb12f95a049438af3eaa"
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for data in iter(lambda:f.read(1024*1024),b""):h.update(data)
 return h.hexdigest()
def cmd(args,timeout=140):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-650:])
 return p.stdout
def probe(file):
 d=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(file)],30))
 v=next(x for x in d["streams"] if x["codec_type"]=="video")
 return {"width":int(v["width"]),"height":int(v["height"]),
  "fps":round(float(Fraction(v["avg_frame_rate"])),3),"duration":round(float(d["format"].get("duration") or 0),3),
  "codec":v["codec_name"],"bitrate":int(d["format"].get("bit_rate") or 0),
  "audio":any(x.get("codec_type")=="audio" for x in d["streams"])}
assert V3.is_file(),"Missing real approved V3 artifact"
assert sha(V3)==V3_SHA,"V3 SHA not equal approved real original"
with zipfile.ZipFile(V3) as z:z.extractall(OUT)
man=json.loads((OUT/"manifest.json").read_text())
assert len(man["clips"])==13 and man["models_count"]==2,(len(man["clips"]),man["models_count"])
for item in man["clips"]:
 assert sha(OUT/item["clip"])==item["sha256"],item["id"]
source=OUT/"originals"/"renault-5-turbo2-original-native-1080p.mp4"
for index in range(5):
 try:
  request=urllib.request.Request(URL+("" if index%2==0 else "?download=1"),
    headers={"User-Agent":"Mozilla/5.0"})
  with urllib.request.urlopen(request,timeout=60) as r:
   n=0
   with source.open("wb") as f:
    while True:
     block=r.read(1048576)
     if not block:break
     n+=len(block)
     if n>45_000_000:raise RuntimeError("over original 45MB expected")
     f.write(block)
  if sha(source)!=ORIG_SHA:raise RuntimeError("download bytes mismatch genuine original SHA")
  break
 except Exception as e:
  source.unlink(missing_ok=True)
  print("SOURCE_RETRY",index,str(e)[:250],flush=True)
  if index==4:raise
  time.sleep(2+index)
origin_probe=probe(source)
assert origin_probe["width"]==1920 and origin_probe["height"]==1080 and abs(origin_probe["fps"]-25)<.01
assert 39<origin_probe["duration"]<42
# Human reviewed source storyboard: 22.5 and 27.5 seconds are clean, moving, close three-quarter side rolling shots.
START=20.0; END=29.0
clip=OUT/"clips"/"renault-5-turbo2-black-side-rolling-1080p.mp4"
cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(START),"-i",str(source),
     "-t",str(END-START),"-map","0:v:0","-map","0:a?","-c:v","libx264","-crf","18","-preset","fast",
     "-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-movflags","+faststart",str(clip)],155)
clip_probe=probe(clip)
assert (clip_probe["width"],clip_probe["height"])==(1920,1080),clip_probe
assert abs(clip_probe["fps"]-25)<.01 and clip_probe["duration"]>=8.5,clip_probe
cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(clip),"-map","0:v:0","-f","null","-"],100)
# Five independently decoded actual delivered MP4 frame positions for editorial QA.
board=Image.new("RGB",(1450,950),"#101317")
draw=ImageDraw.Draw(board)
draw.text((10,8),"NEW: Renault 5 Turbo 2 1080p 25fps -- actual output frames",fill="#eeeeee")
for i,p in enumerate((.06,.28,.5,.74,.94)):
 timepos=clip_probe["duration"]*p
 frame=OUT/"contact_sheets"/f"r5-temp-{i}.jpg"
 cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(timepos),"-i",str(clip),
   "-frames:v","1","-vf","scale=705:-2",str(frame)],55)
 with Image.open(frame) as im:
  im=im.convert("RGB");im.thumbnail((705,298))
  board.paste(im,((i%2)*725+5,(i//2)*311+30))
 frame.unlink()
proof=OUT/"contact_sheets"/"renault-5-turbo2-black-rolling-5-frames.jpg"
board.save(proof,quality=90)
item={
"id":"renault-5-turbo2-black-side-rolling",
"make":"Renault","model":"original 1980s Renault 5 Turbo 2 (visibly aftermarket wheels and modified livery)",
"source_url":"https://archive.org/details/renault-5-turbo-2-avec-un-beau-bruit-tube-de-fuite",
"creator":"Internet Archive uploader / original cameraman not independently established",
"clip":"clips/"+clip.name,"original":"originals/"+source.name,
"sha256":sha(clip),"original_sha256":ORIG_SHA,
"source_in":START,"source_out":END,"probe":clip_probe,
"original_probe":origin_probe,
"contact_sheet":"contact_sheets/"+proof.name,
"camera_grade":"supporting","actual_car_motion":True,
"qa_description":"Black real original rear-midengined Renault 5 Turbo 2, with TURBO side body graphics and boxed rear arches, seen rolling on public road; adjacent tracking car changes viewpoint from rear three-quarter to broad side. No baked-in logo or graphic overlay visible on checked frames; one true camera angle only.",
"rights_notes":"Internet Archive archived contributor source; **no commercial/social redistribution licence verified**. Editor must obtain reuse permission before public TikTok/Reels distribution."
}
man["clips"].append(item)
man.update({"true_native_video_clips":14,"models":["Citroen 2CV","original Alpine A110","Renault 5 Turbo 2"],
 "models_count":3,
 "premium_dramatic_shots":sum(x["camera_grade"]=="premium" for x in man["clips"]),
 "supporting_real_motion_shots":sum(x["camera_grade"]=="supporting" for x in man["clips"]),
 "gate":"BLOCKED_PARTIAL","last_new_video":"Renault 5 Turbo 2 physically downloaded/sha-checked and first verified true-HD 9-second moving angle.",
 "licence_warning":"2CV Commons attribution/share-alike; Alpine press publisher and new Internet Archive R5 Turbo2 permissions unverified. Do not publish those without rights review."})
assert len(man["clips"])==14 and man["models_count"]==3
(OUT/"manifest.json").write_text(json.dumps(man,indent=2,ensure_ascii=False))
with (OUT/"manifest.csv").open("w",newline="") as f:
 keys=["id","make","model","source_url","creator","clip","original","sha256","source_in","source_out","camera_grade","actual_car_motion","rights_notes"]
 writer=csv.DictWriter(f,fieldnames=keys,extrasaction="ignore")
 writer.writeheader();writer.writerows(man["clips"])
(OUT/"README.md").write_text(
 "YUNEX French Legends 001 Agent A CLASSICS V4 — actual real motion footage only.\n"+
 "14 FFmpeg-decodable native HD real moving video clips across 3 French classic car models.\n"+
 "1 original real 4K 2CV shot + 12 true 1080p from prior V3 + 1 native 1080p Renault 5 Turbo 2 tracking shot.\n"+
 "Model composition: four Citroen 2CV, nine original 1970s Alpine A110, one original Renault 5 Turbo 2.\n"+
 "The new nine-second R5 Turbo 2 clip is a real moving car in physical chase footage, one angle, NOT a still, CGI or fake upscaling.\n"+
 "Its black R5 Turbo 2 appears to have aftermarket large-diameter alloy wheels and side Turbo graphics. Identity precise; not the electric Turbo 3E.\n"+
 "The dashboard dashcam 205 clip is too weak; AutoWeek TV 205 clips include baked-in watermark; both deliberately rejected.\n"+
 "Gate A still BLOCKED: required 18 high-quality unique moving angles across 5 models, delivered 14 across 3.\n"+
 "Rights review: Attribution terms for Commons 2CV and publisher reuse for Alpine and R5 Turbo 2 must be checked before posting commercially or to TikTok.\n")
with zipfile.ZipFile(FINAL,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for p in OUT.rglob("*"):
  if p.is_file():z.write(p,p.relative_to(OUT))
print("V4_REAL_FILM_DELIVERY",json.dumps({"clips":len(man["clips"]),"models":man["models"],
  "premium":man["premium_dramatic_shots"],"supporting":man["supporting_real_motion_shots"],
  "r5_original_sha256":sha(source),"r5_clip_sha256":sha(clip),
  "r5_clip_probe":clip_probe,"zip_bytes":FINAL.stat().st_size,"zip_sha256":sha(FINAL),
  "gate":man["gate"]}),flush=True)
