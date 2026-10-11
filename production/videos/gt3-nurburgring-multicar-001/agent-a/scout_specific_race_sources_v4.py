#!/usr/bin/env python3
"""Agent A targeted acquisition V4. Real media only, never infer GT3 identity from a title.
Targets publisher video embeds and exact individual social post URLs (no profile enumeration).
Every accepted output must be native HD, fully decoded, hashed and frame-sampled.
All new assets remain MODEL-QA PENDING until independently visually examined.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path
from urllib.parse import unquote
import requests
from PIL import Image, ImageDraw

ROOT = Path("out/gt3-specific-v4-scout")
MEDIA = ROOT/"native_unapproved_media"
SHEETS = ROOT/"contact_sheets"
for d in [ROOT,MEDIA,SHEETS]: d.mkdir(parents=True, exist_ok=True)
SESSION = requests.Session()
SESSION.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36"})
PAGES = [
 ("lamborghini_abt_video_motorsportmagazin","Lamborghini Huracan GT3 EVO2","https://www.motorsport-magazin.com/24h-stunden-nuerburgring/video-13392-abt-lamborghini-24h-nuerburgring-huracan-red-bull.html"),
 ("lamborghini_abt_video_ffh","Lamborghini Huracan GT3 EVO2","https://www.ffh.de/video/mediathek/396207-abt-lamborghini-bei-24h-nuerburgring-huracan-mit-fluegeln.html"),
 ("ferrari_verstappen_nordschleife_sportauto","Ferrari 296 GT3","https://www.sportauto.fr/actu/insolites-actu/max-verstappen-f1-revivez-tour-camera-embarquee-onboard-nordschleife-nurburgring-ferrari-video-439831.html"),
 ("ferrari_verstappen_track_video_lesvoitures","Ferrari 296 GT3","https://lesvoitures.fr/max-verstappen-nurburgring-franz-hermann-video/"),
 ("aston_vantage_race_highlights","Aston Martin Vantage GT3","https://www.motorsport.com/endurance/video/aston-martin-at-the-2014-n-rburgring-24-hours-race/96046/"),
 ("aston_vantage_gt3_onboard","Aston Martin Vantage GT3","https://www.motorsport.com/endurance/video/aston-martin-vantage-gt3-n-rburgring-in-car-lap/96151/"),
 ("ferrari_nls_2025_race_verstappen","Ferrari 296 GT3","https://news.verstappen.com/en/article/5958/"),
 ("lamborghini_abt_nls_2023","Lamborghini Huracan GT3 EVO2","https://www.nuerburgring-langstrecken-serie.de/language/en/2023/02/14/abt-to-start-in-the-green-hell-with-lamborghini/")
]
results=[]
identified_social=[]
def sha256(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for chunk in iter(lambda:f.read(1048576),b""): h.update(chunk)
 return h.hexdigest()
def run(cmd,timeout):
 return subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
def video_probe(path):
 p=run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],30)
 if p.returncode: raise RuntimeError("ffprobe:"+p.stderr[-300:])
 d=json.loads(p.stdout)
 v=next((s for s in d["streams"] if s["codec_type"]=="video"),None)
 if v is None: raise RuntimeError("NO_VIDEO_STREAM")
 w,h=int(v["width"]),int(v["height"])
 if not ((w>=1920 and h>=1080 and w>h) or (w>=1080 and h>=1920 and h>w)):
  raise RuntimeError(f"LOW_NATIVE_RESOLUTION_{w}x{h}")
 duration=float(d["format"].get("duration") or 0)
 if duration<1:raise RuntimeError("TOO_SHORT")
 if (w<h):
  # Qualifies only for native portrait storage, NOT landscape edit without approved crop.
  pass
 dec=run(["ffmpeg","-nostdin","-v","error","-i",str(path),"-f","null","-"], min(160,max(30,int(duration*2+20))))
 if dec.returncode:raise RuntimeError("FULL_DECODE_FAILED:"+dec.stderr[-200:])
 return d,v,duration
def contact(path,tag,duration,width,height):
 cells=[]
 canvas=Image.new("RGB",(960,3*210),(12,12,12));draw=ImageDraw.Draw(canvas)
 for i in range(9):
  t=round(duration*(i+.4)/9,3)
  frame=SHEETS/(tag+f"_{i}.jpg")
  p=run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-ss",str(t),"-i",str(path),"-frames:v","1","-vf","scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2","-q:v","4",str(frame)],25)
  if p.returncode==0 and frame.exists():
   with Image.open(frame) as im:canvas.paste(im.convert("RGB"),((i%3)*320,(i//3)*210+25))
   frame.unlink()
  draw.text(((i%3)*320+5,(i//3)*210+5),f"{t:.1f}s / {width}x{height}",fill="white")
 outfile=SHEETS/(tag+"_9frame.jpg");canvas.save(outfile,quality=87)
 return str(outfile.relative_to(ROOT))
def acquire(id,make,url,engine,referer=None):
 target=MEDIA/id
 target.mkdir(exist_ok=True)
 rec={"id":id,"expected_make_from_article_not_visual_proof":make,"original_page_or_post":url,"engine":engine,"status":"NOT_ACQUIRED"}
 started=time.monotonic()
 try:
  if engine=="yt-dlp":
   cmd=["yt-dlp","--no-playlist","--ignore-config","--no-warnings","--socket-timeout","12",
        "--retries","1","--fragment-retries","1","--concurrent-fragments","2","--max-filesize","250M",
        "--no-part","--merge-output-format","mp4","-f","bv*[height>=1080]+ba/b[height>=1080]/best[height>=1080]",
        "-o",str(target/"source.%(ext)s"),url]
   p=run(cmd,75)
  elif engine=="gallery-dl":
   cmd=["gallery-dl","--no-part","--directory",str(target),url]
   p=run(cmd,55)
  else:
   raise RuntimeError("UNSUPPORTED_BACKEND")
  rec["exit_code"]=p.returncode
  rec["stdout_tail"]=p.stdout[-600:]
  rec["stderr_tail"]=p.stderr[-1000:]
  files=[x for x in target.rglob("*") if x.is_file() and x.suffix.lower() in [".mp4",".mkv",".mov",".webm"]]
  if not files:
   raise RuntimeError("NO_REAL_VIDEO_DOWNLOADED")
  choice=max(files,key=lambda x:x.stat().st_size)
  ff,v,duration=video_probe(choice)
  rec.update(status="NATIVE_HD_FULLY_DECODED_IDENTITY_AND_CAMERA_QA_PENDING",
      relative_file=str(choice.relative_to(ROOT)),bytes=choice.stat().st_size,sha256=sha256(choice),
      width=v["width"],height=v["height"],duration_seconds=duration,ffprobe=ff,
      full_video_decode="PASS",contact_sheet=contact(choice,id,duration,v["width"],v["height"]),
      qualifier="NOT_COUNTED_UNTIL_VISUAL_GT3_MAKE_TRACK_AND_UNIQUE_ANGLE_INSPECTION",
      landscape_note="Portrait-only source is not automatically suitable for 1920x1080 film" if v["height"]>v["width"] else "Landcape candidate")
  print("HD VIDEO ACQUIRED",id,rec["bytes"],v["width"],v["height"],rec["sha256"],flush=True)
 except subprocess.TimeoutExpired:
  rec.update(status="REJECTED_NO_QUALIFIED_NATIVE_VIDEO",failure="STRICT_PER_SOURCE_TIMEOUT")
 except Exception as e:
  rec.update(status="REJECTED_NO_QUALIFIED_NATIVE_VIDEO",failure=str(e)[-350:])
  shutil.rmtree(target,ignore_errors=True)
 rec["execution_seconds"]=round(time.monotonic()-started,2)
 results.append(rec)
 print("SCOUT",id,rec["status"],rec.get("failure",""),rec["execution_seconds"],flush=True)
def page_social_exact_links(id,url):
 try:
  r=SESSION.get(url,timeout=(8,13)); r.raise_for_status()
  txt=unquote(r.text.replace("\\/","/").replace("&amp;","&"))
  patterns=[r"https?://(?:www\.)?instagram\.com/(?:reel|p)/[A-Za-z0-9_-]{6,}",
            r"https?://(?:www\.)?tiktok\.com/@[A-Za-z0-9_.-]+/video/\d{14,22}"]
  for pat in patterns:
   for found in re.findall(pat,txt,flags=re.I):
    identified_social.append({"url":found.rstrip(".,\"'"),"discovered_at":url,"source_id":id})
  print("PAGE",id,r.status_code,"bytes",len(txt),"exact post IDs",len(identified_social),flush=True)
 except Exception as exc:print("PAGE_REQUEST_ERROR",id,str(exc)[-200:],flush=True)
# No profiles, no blind search, no repeated old sim post, no YouTube retry.
for id,make,url in PAGES:
 page_social_exact_links(id,url)
 acquire(id,make,url,"yt-dlp")
# Individually identified posts only; never crawl social profiles or take a guess at post IDs.
unique={v["url"]:v for v in identified_social}
for idx,post in enumerate(list(unique.values())[:4]):
 url=post["url"]
 engine="gallery-dl" if "tiktok" in url else "yt-dlp"
 acquire(f"embedded_post_{idx+1}", "MODEL_PENDING_FROM_EMBED",url,engine)
report={"status":"TARGETED_REAL_SOURCE_SCOUT_COMPLETED","source_pages":PAGES,"exact_social_posts_discovered":list(unique.values()),
        "acquisition_results":results,
        "native_media_acquired":sum(x["status"].startswith("NATIVE_HD") for x in results),
        "visual_gt3_new_makes_confirmed":0,
        "gate":"BLOCKED - requires human visual identification; baseline prior V3 3/6 makes and 5/24 shots",
        "note":"No webpage title/author guarantee on-track real GT3 model. Publisher source only; every new video remains uncategorised until actual frame review."}
(ROOT/"MANIFEST_QA_PENDING.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
(ROOT/"README.md").write_text("Agent A real targeted single-post/publisher source download scout. Check MANIFEST_QA_PENDING.json and *_9frame.jpg. Native originals here are UNAPPROVED unless independently visually inspected. No extrapolating five GT3 scenes to 24 shots. Never count an article or 720p file.\n")
