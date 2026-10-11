#!/usr/bin/env python3
"""Agent A2: discover real player video asset requests in publicly viewable film pages.

Media is eligible only when actually downloaded, probed to native HD,
fully decoded, hashed and contact-sheet inspected. No login/CAPTCHA bypass,
fake GT3 claim, YouTube mirrors, simulation, or synthetic video.
"""
from pathlib import Path
from urllib.parse import urlparse,parse_qsl,urlencode,urlunparse
import hashlib,json,re,subprocess,time,zipfile,requests
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
OUT=Path("out/gt3-a2-browser")
FILES=OUT/"originals_for_visual_review"; SHEETS=OUT/"contact_sheets"
for p in (OUT,FILES,SHEETS):p.mkdir(parents=True,exist_ok=True)
SOURCES=[
  [
    "ferrari_frikadelli_n24_nringinfo_2023",
    "Ferrari 296 GT3",
    "https://www.facebook.com/Nringinfo/videos/-der-ferrari-296-gt3-von-frikadelli-racing-ist-einfach-ein-absoluter-fan-lieblin/1765854030772184/"
  ],
  [
    "ferrari_nbr_gt3_fullspeed_2026",
    "Ferrari 296 GT3",
    "https://www.facebook.com/61590582480924/videos/full-speed-around-the-n%C3%BCrburgring-in-the-ferrari-296-gt3-the-ferraris-side-by-si/2315548349196371/"
  ],
  [
    "ferrari_fan_race_2026",
    "Ferrari 296 GT3",
    "https://www.facebook.com/EnduranceLive.fr/videos/reflex-%EF%B8%8Fnurburgringgt3-nurburgring-vln/1014294421658636/"
  ],
  [
    "mclaren_rjn_gtwc_rollout",
    "McLaren 720S GT3 EVO",
    "https://www.facebook.com/teamrjn/videos/rolling-out-gtworldcheu-mclaren-gt3-nurburgring/29244441448478046/"
  ],
  [
    "mclaren_gtwc_race2026",
    "McLaren 720S GT3 EVO",
    "https://www.facebook.com/GTWorldChallengeEurope/videos/that-was-a-bumpy-landing-n%C3%BCrburgring-2830-august-2026%EF%B8%8F-link-in-biogtworld-n%C3%BCrbur/28023681463940636/"
  ],
  [
    "mclaren_gt3_collision_race",
    "McLaren 720S GT3 EVO",
    "https://www.facebook.com/61557918366855/videos/unfortunately-the-race-was-over-early-for-this-mclaren-720-gt3-evo-it-sustained-/2218250978749030/"
  ],
  [
    "mclaren_dtm_dorr",
    "McLaren 720S GT3 EVO",
    "https://www.facebook.com/DTM/videos/vermeulen-magic-dtm-dtm26-dtm2026-ran__racing-ransport/1521328826044492/"
  ],
  [
    "mclaren_trackset_race",
    "McLaren 720S GT3 EVO",
    "https://www.facebook.com/61577031971519/videos/n%C3%BCrburgring-was-as-always-a-one-of-a-kind-trackthanks-to-novem_goldgroup-for-the/1971592173553946/"
  ],
  [
    "ferrari_race_24hr_team",
    "Ferrari 296 GT3",
    "https://www.facebook.com/Nringinfo/videos/was-traut-ihr-dem-ferrari-296-gt3-beim-24-stunden-rennen-zu-realize-kondo-racing/1761573544796603/"
  ],
  [
    "mclaren_nurb_gt3_cars",
    "McLaren 720S GT3 EVO",
    "https://www.facebook.com/61573100890717/videos/the-speed-of-gt3-cars-is-crazy-motorsport-gt3-n%C3%BCrburgring-racing-mk96/1822910332039454/"
  ],
  [
    "mclaren_nbr_gallery_race",
    "McLaren 720S GT3 EVO",
    "https://www.facebook.com/61574516889044/videos/n%C3%BCrburgring-and-gt3s-is-just-the-perfect-combo-nothing-beats-the-sound-speed-and/1777139410154383/"
  ]
]
rows=[]
def cmd(args,timeout=55):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-400:])
 return p.stdout
def hashfile(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def ffprobe(p):
 d=json.loads(cmd(["ffprobe","-v","error","-of","json","-show_format","-show_streams",str(p)],30))
 v=next((a for a in d["streams"] if a["codec_type"]=="video"),None)
 if not v:raise RuntimeError("no video stream")
 w,h=int(v["width"]),int(v["height"])
 if not ((w>=1920 and h>=1080 and w>h) or (w>=1080 and h>=1920 and h>w)):
  raise RuntimeError(f"REJECT native source pixels {w}x{h}")
 dur=float(d["format"].get("duration") or 0)
 if dur<1.5:raise RuntimeError("too short")
 cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(p),"-map","0:v:0","-f","null","-"],120)
 return d,v,dur
def screenshot_sheet(p,tag,dur):
 img=Image.new("RGB",(1200,550),"#151515")
 draw=ImageDraw.Draw(img)
 for i in range(8):
  t=max(.15,dur*(i+.45)/8)
  tmp=SHEETS/f"tmp_{tag}_{i}.jpg"
  cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{t:.2f}","-i",str(p),
       "-frames:v","1","-vf","scale=300:240:force_original_aspect_ratio=decrease,pad=300:240:(ow-iw)/2:(oh-ih)/2",
       str(tmp)],25)
  with Image.open(tmp) as f:img.paste(f.convert("RGB"),(i%4*300,i//4*275+28))
  draw.text((i%4*300+8,i//4*275+5),f"{tag} {t:.1f}s",fill="white")
  tmp.unlink(missing_ok=True)
 out=SHEETS/(tag+".jpg");img.save(out,quality=85)
 return str(out.relative_to(OUT))
def eligible_candidate(u):
 u=u.replace("\\/","/").replace("&amp;","&")
 if len(u)>2400:return False
 if u.startswith("blob:") or u.startswith("data:"):return False
 if not u.startswith("https://"):return False
 if any(a in u for a in (".m3u8",".mpd",".mp4")):return True
 return False
def browser_discover(ctx,pageurl):
 links=[];signals=[]
 page=ctx.new_page()
 def response(res):
  try:
   url=res.url
   ctype=res.headers.get("content-type","")
   if eligible_candidate(url) or "mpegurl" in ctype or "video/mp4" in ctype:
    links.append(url)
    signals.append({"status":res.status,"mime":ctype,"url":url[:450]})
  except Exception:pass
 page.on("response",response)
 try:
  page.goto(pageurl,wait_until="domcontentloaded",timeout=17000)
  page.wait_for_timeout(2200)
  # Do not interact with login or consent walls, but try ordinary visible player button.
  try:
   v=page.locator("video").first
   if v.count():v.evaluate("(el)=>el.play().catch(()=>{})",timeout=5000)
  except Exception:pass
  try:
   play=page.locator("[aria-label*='Play' i],.vjs-big-play-button,[data-testid='play-button']").first
   if play.count():play.click(timeout=1800)
  except Exception:pass
  page.wait_for_timeout(2200)
  for value in page.evaluate("() => Array.from(document.querySelectorAll('video,source')).map(e=>e.currentSrc||e.src).filter(Boolean)"):
   if eligible_candidate(value):links.append(value)
  for value in re.findall(r"https?:[^\s\"'<>{}]{10,500}(?:\.m3u8|\.mp4|\.mpd)(?:\?[^\s\"'<>{}]{0,200})?",page.content(),re.I):
   if eligible_candidate(value):links.append(value)
  title=page.title()
 except Exception as e:
  title="PAGE_FAILURE "+str(e)[:180]
 finally:page.close()
 return list(dict.fromkeys(links))[:12],signals[:40],title
def download_candidate(url,tag):
 if "fbcdn.net" in url and ".mp4" in url:
  # Player emitted HTTP byte-chunk URLs for audio and video separately.
  # Recover only the origin-hosted publicly accessible complete video file.
  if "/m78/" in url:raise RuntimeError("FB_AUDIO_ONLY_RENDITION_SKIPPED")
  from html import unescape
  url=unescape(url.replace("\\/","/"))
  parsed=urlparse(url)
  query=[(k,v) for k,v in parse_qsl(parsed.query,keep_blank_values=True)
         if k not in ("bytestart","byteend")]
  full=urlunparse(parsed._replace(query=urlencode(query)))
  target=FILES/(tag+".mp4")
  with requests.get(full,headers={
        "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) Chrome/126 Safari/537.36",
        "Referer":"https://www.facebook.com/",
        "Range":"bytes=0-"},
        stream=True,timeout=(8,18)) as res:
   res.raise_for_status()
   ctype=res.headers.get("content-type","")
   if "html" in ctype:raise RuntimeError("FB_CDN_GOT_HTML")
   count=0
   with target.open("wb") as f:
    for b in res.iter_content(1024*1024):
     if b:
      count+=len(b)
      if count>150*1024*1024:raise RuntimeError("FB_CDN_TOO_LARGE")
      f.write(b)
  if target.stat().st_size<100000:raise RuntimeError("FB_ORIGINAL_TOO_SMALL")
  return target
 # yt-dlp explicitly requests real >=1080p original rendition.
 stem=FILES/(tag+"_%(ext)s")
 opts=["yt-dlp","--ignore-config","--no-playlist","--no-warnings",
       "--socket-timeout","10","--retries","1","--fragment-retries","1",
       "--download-sections","*0-14","--merge-output-format","mkv",
       "-f","bestvideo[height>=1080]+bestaudio/best[height>=1080]",
       "-o",str(stem),url]
 try:cmd(opts,85)
 except Exception as e:
  if ".mp4" not in url:raise
  # Public HTTP original only; bounded 12sec remux, no quality conversion
  output=FILES/(tag+".mkv")
  cmd(["ffmpeg","-nostdin","-v","error","-y","-i",url,"-t","12",
       "-map","0:v:0","-map","0:a?","-c","copy",str(output)],85)
 vids=[f for f in FILES.glob(tag+"*") if f.suffix.lower() in [".mp4",".mkv",".mov",".webm"] and f.stat().st_size>100000]
 if not vids:raise RuntimeError("No video bytes acquired")
 return max(vids,key=lambda f:f.stat().st_size)

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
 ctx=browser.new_context(user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                         viewport={"width":1600,"height":900})
 for id,make,page in SOURCES:
  row={"source_id":id,"expected_make_NOT_verified":make,"publisher_page":page,
       "actual_media_approved":False,"verified_unique_angles":0}
  start=time.monotonic()
  try:
   links,signals,title=browser_discover(ctx,page)
   row.update(browser_page_title=title,video_requests=signals,detected_media_links=links)
   print("BROWSER VIDEO ENDPOINTS",id,len(links),title,flush=True)
   if "facebook.com" in page:
    links=sorted(links,key=lambda u:(0 if "fbcdn.net" in u and "/m367/" in u else 1 if "fbcdn.net" in u and "/m78/" not in u else 2))
   for i,u in enumerate(links[:9] if "facebook.com" in page else links[:3]):
    path=None
    try:
     path=download_candidate(u,id+str(i))
     raw,v,dur=ffprobe(path)
     row.update(status="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING",file=str(path.relative_to(OUT)),
                actual_media_url=u,sha256=hashfile(path),bytes=path.stat().st_size,
                resolution=[int(v["width"]),int(v["height"])],duration=dur,
                ffprobe=raw,contact_sheet=screenshot_sheet(path,id,dur))
     print("NATIVE_MEDIA_ACQUIRED",id,row["resolution"],row["sha256"],flush=True)
     break
    except Exception as err:
     row.setdefault("errors",[]).append(str(err)[-250:])
     if path:path.unlink(missing_ok=True)
   if row.get("status")!="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING":
    row["status"]="NO_QUALIFYING_REAL_VIDEO"
  except Exception as e:row.update(status="NO_QUALIFYING_REAL_VIDEO",error=str(e)[-350:])
  row["execution_s"]=round(time.monotonic()-start,2)
  rows.append(row)
 browser.close()
good=[r for r in rows if r["status"]=="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING"]
manifest={"agent":"A2","native_hd_media_file_count":len(good),"visually_verified_gt3_makes":[],"approved_camera_angles":0,
          "status":"MODEL_CLASS_TRACK_CAMERA_VISUAL_QA_PENDING" if good else "BLOCKED_0_REAL_MEDIA",
          "sources":rows}
(OUT/"SOURCE_MANIFEST.json").write_text(json.dumps(manifest,indent=2))
(OUT/"README.md").write_text("# A2 browser-discovered actual video assets\n\n"
 f"Native HD decoded original samples: **{len(good)}**. Confirmed GT3 identity: **0 (visual QA pending)**.\n"
 "All unused links and rejected endpoints are diagnostic-only; never pass editor without native video/visual audit.\n")
pack=OUT/"GT3_A2_BROWSER_ORIGINALS_AND_QA.zip"
with zipfile.ZipFile(pack,"w",zipfile.ZIP_STORED,allowZip64=True) as z:
 for file in OUT.rglob("*"):
  if file.is_file() and file!=pack:z.write(file,file.relative_to(OUT))
print("BROWSER_SOURCE_RUN_FINISHED",len(good),"native videos",pack.stat().st_size,"ZIP SHA",hashfile(pack),flush=True)
