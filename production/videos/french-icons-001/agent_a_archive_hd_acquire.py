#!/usr/bin/env python3
"""Acquire actual Internet Archive HD French classics and generate original-frame storyboards.

Research/visual-QA stage: downloads all original media (not preview fake) to ffprobe and
sample real decoded frames. Delivers one *QA proof* ZIP, no full media claim until approval.
Internet Archive does not itself prove reuse permissions for archived creator films.
"""
import concurrent.futures,hashlib,json,os,pathlib,shutil,subprocess,time,urllib.parse,urllib.request,zipfile,traceback
from fractions import Fraction
from PIL import Image,ImageDraw,ImageFont
R=pathlib.Path("out/fr-a-archive-hd-ingest");RAW=R/"originals";CONTACT=R/"contact_sheets";SHORT=R/"samples"
for d in [RAW,CONTACT,SHORT]:d.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("205-gti-midnight-london","midnight-run-peugeot-205-gti-london","Peugeot 205 GTI","modern night driving/cinematic"),
 ("205-gti-1985-road","peugeot-205-gti-1.6-1985","Peugeot 205 GTI","1985 1.6 classic driving film"),
 ("205-gti-1.9-classic","owning-a-peugeot-205-1.9-gti-classic-car-review","Peugeot 205 GTI","dedicated classic car drive"),
 ("r5-turbo-1981","uw-garage-renault-5-turbo-i-1981-by-autovisie-tv","Renault 5 Turbo (mid-engined original)","Autovisie filmed original R5 Turbo I 1981"),
 ("r5-turbo-2-driving","renault-5-turbo-2-avec-un-beau-bruit-tube-de-fuite","Renault 5 Turbo 2","exhaust and road driving"),
 ("citroen-ds-pallas-1968","citroen-ds-21-m-pallas-1968","Citroën DS","original 1968 DS 21 M Pallas"),
 ("clio-v6-hammond","youtube-KjcbCUaonuI","Renault Clio V6","Richard Hammond real V6 filmed test"),
 ("clio-v6-london","carspotting-in-london-august-2024-rr-cullinan-clio-v-6-slk-55-amg-ferrari-330-gts-911-gt-3-rs","Renault Clio V6","2024 carspotting some Clio driving")
]
UA="YUNEX-Agent-A-French-Historic-Video-QA/1.0 (https://github.com/YunRah2103/Remotion-gpt-chat)"
def api(url,limit=9_000_000):
 request=urllib.request.Request(url,headers={"User-Agent":UA})
 with urllib.request.urlopen(request,timeout=50) as response:
  return response.read(limit)
def cmd(a,limit=180):
 p=subprocess.run(a,capture_output=True,text=True,timeout=limit)
 if p.returncode:raise RuntimeError("FFMPEG_FAILED "+p.stderr[-450:])
 return p.stdout
def sha(file):
 h=hashlib.sha256()
 with file.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def probe(file):
 info=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(file)],45))
 v=next(x for x in info["streams"] if x.get("codec_type")=="video")
 f=v.get("avg_frame_rate","0/1")
 return {"width":int(v["width"]),"height":int(v["height"]),"fps":round(float(Fraction(f)),3),
         "duration_sec":round(float(info["format"].get("duration") or 0),3),
         "bitrate":int(info["format"].get("bit_rate") or 0),
         "codec":v.get("codec_name"),"video_original_bytes":file.stat().st_size}
def fetch_media(slug,identifier,claimed,context):
 item={"id":slug,"identifier":identifier,"page":"https://archive.org/details/"+identifier,"target":claimed,
       "status":"DOWNLOAD_NOT_STARTED","model_on_screen_verified":False,"unique_moving_camera_angles_approved":0,
       "license_verified":False,"strong_hero":False,"source_context":context}
 try:
  d=json.loads(api("https://archive.org/metadata/"+urllib.parse.quote(identifier),6_000_000))
  f=[x for x in d.get("files",[]) if x.get("name","").lower().endswith(".mp4") and x.get("source")=="original"]
  f=[x for x in f if int(x.get("size") or 0)<200_000_000]
  if not f:raise RuntimeError("ORIGINAL_UNDER_200MB_NOT_FOUND")
  f.sort(key=lambda x:-int(x.get("size") or 0))
  entry=f[0]
  url="https://archive.org/download/"+urllib.parse.quote(identifier)+"/"+urllib.parse.quote(entry["name"])
  item.update({"original_file":entry["name"],"published_bytes":int(entry.get("size") or 0),
    "video_original_url":url,"archive_uploader":d.get("metadata",{}).get("creator"),
    "archive_date":d.get("metadata",{}).get("date"),
    "archive_licenseurl":d.get("metadata",{}).get("licenseurl")})
  path=RAW/(slug+".mp4")
  for attempt in range(2):
   try:
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":UA}),timeout=90) as r:
     if int(r.headers.get("Content-Length") or 0)>205_000_000:raise RuntimeError("ORIGINAL_FILE_TOO_LARGE")
     count=0
     with path.open("wb") as dest:
      while True:
       b=r.read(1<<20)
       if not b:break
       count+=len(b)
       if count>205_000_000:raise RuntimeError("ORIGINAL_FILE_TOO_LARGE")
       dest.write(b)
    break
   except Exception:
    if attempt==1:raise
    time.sleep(3)
  info=probe(path);item.update({"probe":info,"original_sha256":sha(path)})
  if info["width"]<1920 or info["height"]<1080 or info["fps"]<23:
   raise RuntimeError("ACTUAL_SOURCE_BELOW_NATIVE_1080_GATE")
  if info["duration_sec"]<6:
   raise RuntimeError("SOURCE_TOO_SHORT")
  # Sample exactly original native video frames over entire duration.
  from PIL import Image,ImageDraw
  W,H=1920,1500
  img=Image.new("RGB",(W,H),"#171a1f");draw=ImageDraw.Draw(img)
  draw.text((15,9),f"{claimed} : {slug} — REAL source frames, not thumbnails",fill="white")
  for ix in range(16):
   pos=min(info["duration_sec"]-.15,info["duration_sec"]*(ix+.5)/16)
   shot=CONTACT/(slug+"-"+str(ix)+".jpg")
   cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(pos),"-i",str(path),
      "-frames:v","1","-vf","scale=470:-2",str(shot)],75)
   with Image.open(shot) as frame:
    frame=frame.convert("RGB");frame.thumbnail((470,335))
    x=(ix%4)*480+5;y=(ix//4)*366+32
    img.paste(frame,(x,y))
    draw.text((x+4,y+340),f"{pos:.1f}s",fill="#eeeeee")
   shot.unlink()
  canvas=CONTACT/(slug+"-16-frame-storyboard.jpg");img.save(canvas,quality=90)
  # Real center 2 seconds proof clip for manual playback check, not editorial claimed shot.
  mid=max(0,info["duration_sec"]*.5-1.25)
  sample=SHORT/(slug+"-center-2s.mp4")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(mid),"-i",str(path),
       "-t","2.5","-map","0:v:0","-c:v","libx264","-crf","23","-preset","ultrafast",
       "-an",str(sample)],130)
  item.update({"status":"TRUE_NATIVE_HD_SOURCE_PROBED_AND_16_REAL_FRAMES_REVIEW_PENDING",
    "contact_sheet":"contact_sheets/"+canvas.name,"center_sample":"samples/"+sample.name,
    "sample_sha256":sha(sample)})
  print("REAL_ORIGINAL_HD",slug,json.dumps(info),"SHA",item["original_sha256"],flush=True)
 except Exception as e:
  item.update({"status":"REJECTED_OR_UNAVAILABLE","error":str(e)[:700]})
  print("SOURCE_FAIL",slug,item["error"],flush=True)
 finally:
  (RAW/(slug+".mp4")).unlink(missing_ok=True)
 return item
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 jobs=[pool.submit(fetch_media,*v) for v in SOURCES]
 for future in concurrent.futures.as_completed(jobs):
  rows.append(future.result())
  (R/"manifest.json").write_text(json.dumps(rows,indent=2,ensure_ascii=False))
(R/"README.md").write_text(
 "Actual Internet Archive original MP4s fetched, ffprobed and sampled at REAL native source resolution. Contact sheets show 16 sample times across each source (not film stills masquerading as shots). Short center MP4 proofs are for human QA; original re-download URL + SHA recorded. Original publisher social reuse/licensing UNVERIFIED, and no model or angle approved until visual inspection. No claims of fully passed Gate A.\n")
OUT=pathlib.Path("out/FR-LEGENDS-A-ARCHIVE-MISSING-CLASSICS-REAL-QA.zip")
with zipfile.ZipFile(OUT,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as arc:
 for f in R.rglob("*"):
  if f.is_file():arc.write(f,f.relative_to(R))
print("ARCHIVE_MEDIA_FINAL",json.dumps({"source_fetched_nativeHD":sum(x["status"].startswith("TRUE_NATIVE_HD") for x in rows),
    "candidates":len(rows),"gate":"NOT_PASSED","qa_zip_size_bytes":OUT.stat().st_size,
    "qa_zip_sha256":sha(OUT)}),flush=True)
