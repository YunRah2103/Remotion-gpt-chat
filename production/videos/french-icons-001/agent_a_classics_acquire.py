#!/usr/bin/env python3
"""Agent A: actually acquire, inspect and package classic French automobile video candidates.

Source-label identification is only provisional until contact sheets are human reviewed.
Never enlarge/upscale source pixels. Originals remain untouched until sample is created.
"""
import csv, hashlib, json, os, shutil, subprocess, sys, time, zipfile
from pathlib import Path

ROOT=Path("out/fr-legends-a")
RAW=ROOT/"originals"
CLIPS=ROOT/"clips"
SHEETS=ROOT/"contact_sheets"
for p in (RAW,CLIPS,SHEETS):p.mkdir(parents=True,exist_ok=True)

# Vimeo film-owner pages discovered from their public descriptions; no YouTube fallback.
# Do not confuse original Alpine A110 with 2017+ Alpine, concept cars, or restomods.
SOURCES=[
 ("2cv-sahara","Citroen","2CV Sahara 1964","Maison Vignaux","https://vimeo.com/173664604"),
 ("2cv-leafy","Citroen","2CV","Bradley Stearn","https://vimeo.com/132349577"),
 ("2cv-road","Citroen","2CV","2 Femmes en 2CV","https://vimeo.com/142971278"),
 ("2cv-riviera","Citroen","2CV","Evently Yours","https://vimeo.com/768447211"),
 ("ds-cinematic","Citroen","DS (identity pending)","Kaktus Media","https://vimeo.com/1045355575"),
 ("205-gti-scott","Peugeot","205 GTI","Scott Beech","https://vimeo.com/445315891"),
 ("205-gti-ring","Peugeot","205 GTI race build","nurburgring explorer","https://vimeo.com/37907949"),
 ("205-gti-herman","Peugeot","205 GTI 1.6","Herman Wassenaar","https://vimeo.com/929214"),
 ("205-t16-montlhery","Peugeot","205 Turbo 16 (mixed event)","Xavier","https://vimeo.com/235242860"),
 ("r5-turbo","Renault","5 Turbo","brumbrum.ch","https://vimeo.com/329522784"),
 ("clio-v6","Renault","Clio V6 modified exhaust","QuickSilver Sound Architects","https://vimeo.com/731296447"),
 ("alpine-rally-2023","Alpine","A110 original and modern mixed","Franck Trozzo Kazagui / Alpine","https://vimeo.com/812445061"),
 ("alpine-1973","Alpine","A110 1973","Carmody Creative","https://vimeo.com/1134649595"),
 ("alpine-ad-2012","Alpine","A110 original and concept mixed","Julien Rocher","https://vimeo.com/45074634"),
 ("alpine-official-historic","Alpine","A110 original Rallye Monte Carlo Historique 2013","Alpine / Renault Classic","https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/?lang=deu")
]
def sha(path):
 h=hashlib.sha256()
 with open(path,"rb") as f:
  for chunk in iter(lambda:f.read(1048576),b""):h.update(chunk)
 return h.hexdigest()
def call(argv,timeout=120):
 return subprocess.run(argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
def probe(path):
 r=call(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)])
 if r.returncode: raise RuntimeError("ffprobe "+r.stderr[-400:])
 d=json.loads(r.stdout); s=next((x for x in d["streams"] if x["codec_type"]=="video"),None)
 if not s:raise RuntimeError("NO_VIDEO_STREAM")
 n,dn=(s.get("avg_frame_rate") or "0/1").split("/")
 fps=float(n)/max(1,float(dn));w=int(s["width"]);h=int(s["height"])
 return {"width":w,"height":h,"fps":round(fps,3),
         "duration":round(float(d["format"].get("duration") or 0),3),
         "bitrate":int(d["format"].get("bit_rate") or 0),
         "codec":s["codec_name"],"has_original_audio":any(x["codec_type"]=="audio" for x in d["streams"])}
def viable(m):
 w,h=m["width"],m["height"]
 return ((1920<=w<=3840 and 1080<=h<=2160 and abs(w/h-16/9)<.2) or
         (1080<=w<=2160 and 1920<=h<=3840 and abs(w/h-9/16)<.15)) and m["fps"]>=23 and m["duration"]>=3
def sheet(video,key,duration):
 from PIL import Image,ImageDraw
 images=[]
 for i,t in enumerate((.15,.5,.85)):
  target=SHEETS/(key+"-"+str(i)+".jpg")
  r=call(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(round(duration*t,3)),"-i",str(video),"-frames:v","1","-vf","scale=640:-2",str(target)],60)
  if r.returncode or not target.exists():raise RuntimeError("frame_decode_failed")
  with Image.open(target) as im:
   im=im.convert("RGB");im.thumbnail((480,270))
   images.append(im.copy())
 canvas=Image.new("RGB",(1500,340),"#101216")
 draw=ImageDraw.Draw(canvas);draw.text((12,8),key+" / decoded source frames",fill="white")
 for i,im in enumerate(images):canvas.paste(im,(10+i*500,42))
 output=SHEETS/(key+"-contact.jpg");canvas.save(output,quality=88)
 for i in range(3):(SHEETS/(key+"-"+str(i)+".jpg")).unlink(missing_ok=True)
 return str(output.relative_to(ROOT))
results=[]; faults=[]
for idx,(key,make,model,creator,url) in enumerate(SOURCES,1):
 print(f"[{idx}/{len(SOURCES)}] ATTEMPT {key} {url}",flush=True)
 r={"id":key,"make":make,"source_identification":model,"model_identity_verified":False,
    "source_owner":creator,"source_url":url,"permissions_verified":False,
    "rights_note":"Publicly accessible creator page; no grant of reuse or redistribution verified. Obtain permission before publication.",
    "human_visual_qa":"PENDING","distinct_moving_angle_verified":False}
 try:
  prefix=RAW/(key+"-source")
  cmd=[sys.executable,"-m","yt_dlp","--no-playlist","--no-progress",
       "--socket-timeout","20","--retries","1","--fragment-retries","1",
       "--max-filesize","400M","--merge-output-format","mp4",
       "-f","bestvideo[height>=1080][height<=2160]+bestaudio/best[height>=1080][height<=2160]",
       "-o",str(prefix)+".%(ext)s",url]
  v=call(cmd,timeout=145)
  if v.returncode:
   raise RuntimeError("download_failed: "+v.stderr[-550:].replace("\n"," "))
  found=[x for x in RAW.glob(key+"-source.*") if x.suffix.lower() in (".mp4",".webm",".mkv",".mov")]
  if not found:raise RuntimeError("no_downloaded_media_file")
  original=max(found,key=lambda p:p.stat().st_size)
  native=probe(original)
  if not viable(native):raise RuntimeError("native_quality_rejected: "+str(native))
  original_hash=sha(original)
  # A single source produces at most one candidate, never inflated by repetitive slicing.
  start=min(2.0,max(0,native["duration"]*.08))
  segment=min(6.0,native["duration"]-start-.4)
  if segment<3:raise RuntimeError("insufficient_duration")
  clip=CLIPS/(key+".mp4")
  # Stream-copy where possible; preserve actual pixels, frame rate, native detail.
  trim=call(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(original),
             "-t",str(segment),"-map","0:v:0","-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(clip)],100)
  if trim.returncode:raise RuntimeError("native_stream_copy_failed: "+trim.stderr[-180:])
  actual=probe(clip)
  if not viable(actual):raise RuntimeError("clip_quality_failed")
  dec=call(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(clip),
            "-map","0:v:0","-f","null","-"],95)
  if dec.returncode:raise RuntimeError("decode_failed: "+dec.stderr[-250:])
  contact=sheet(clip,key,actual["duration"])
  r.update({"status":"TECHNICAL_CANDIDATE_HUMAN_REVIEW_PENDING","path":"clips/"+clip.name,
     "source_sha256":original_hash,"sha256":sha(clip),"source_size":original.stat().st_size,
     "clip_size":clip.stat().st_size,"source_probe":native,"clip_probe":actual,
     "source_in_sec":start,"source_out_sec":round(start+segment,3),"contact_sheet":contact,
     "is_original_not_upscaled":True,"crop_notes":"Native source; 9:16 crop suitability not confirmed."})
  print("CANDIDATE",key,actual,flush=True)
 except Exception as ex:
  r.update({"status":"REJECTED_OR_UNAVAILABLE","reason":str(ex)[:700]})
  print("FAIL",key,r["reason"],flush=True)
 finally:
  for file in RAW.glob(key+"-source.*"):file.unlink(missing_ok=True)
  if r["status"]=="REJECTED_OR_UNAVAILABLE":
   (CLIPS/(key+".mp4")).unlink(missing_ok=True)
  results.append(r)
  (ROOT/"manifest.json").write_text(json.dumps(results,indent=2,ensure_ascii=False))
  with (ROOT/"manifest.csv").open("w",newline="") as f:
   cols=["id","make","source_identification","source_url","source_owner","status","path","sha256",
         "model_identity_verified","human_visual_qa","permissions_verified","reason"]
   cw=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore");cw.writeheader();cw.writerows(results)
passed=[x for x in results if x["status"].startswith("TECHNICAL_")]
models=set(x["source_identification"] for x in passed)
status="BLOCKED" if not passed else "PARTIAL_HUMAN_QA_REQUIRED"
(ROOT/"README.md").write_text(
 "FR Legends Agent A — Classics acquisition candidates\n\n"
 "Status: "+status+"\n"
 "Actual technically valid native HD clips: "+str(len(passed))+"\n"
 "Visually verified distinct car shots: 0 (contact sheets need human review)\n"
 "Source-label vehicle variants: "+str(len(models))+" (unverified)\n\n"
 "Each source creates at most one clip. No simulated car shots or 720p upscales.\n"
 "Source copyright/usage permissions not established by public web playback.\n"
 "Do not publish these clips or assert final Gate A PASS without visual, identity and rights review.\n")
archive=Path("out/fr-legends-agent-a-classics.zip")
with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for file in ROOT.rglob("*"):
  if file.is_file():z.write(file,file.relative_to(ROOT))
print("FINAL",json.dumps({"status":status,"actual_technical_candidates":len(passed),"zip_bytes":archive.stat().st_size,
      "models_provisional":sorted(models),"attempted_sources":len(results)}),flush=True)
# Do not claim human visual PASS from automated FFmpeg checks.
