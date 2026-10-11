#!/usr/bin/env python3
"""Real original HD acquisition check on official 2025 DTM Nürburgring Red Bull TV.
First discover player item URLs actually linked in official 2025 event HTML.
No guessed URL, no 2026 Temerario labelled 2025 Huracan. Probe real 1080 streams.
"""
import requests,json,re,html,subprocess,hashlib,sys,time
from pathlib import Path
from PIL import Image,ImageDraw
from urllib.parse import urljoin
ROOT=Path("out/gt3-a-redbull-dtm-2025-source-probe")
ORIGINAL=ROOT/"verified_original_16x9_media";FRAMES=ROOT/"contact_sheets"
for p in (ROOT,ORIGINAL,FRAMES):p.mkdir(parents=True,exist_ok=True)
PAGES=["https://www.redbull.com/de-de/events/dtm-nurburgring","https://www.redbull.com/ca-en/events/dtm-nurburgring"]
S=requests.Session();S.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36"})
records=[];vurls=[]
def run(cmd,t=60):
 try:return subprocess.run(cmd,text=True,capture_output=True,timeout=t)
 except subprocess.TimeoutExpired:return subprocess.CompletedProcess(cmd,124,"","BOUNDED_TIMEOUT")
def digest(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for x in iter(lambda:f.read(1048576),b""):h.update(x)
 return h.hexdigest()
for page in PAGES:
 row={"page":page}
 try:
  resp=S.get(page,timeout=(8,20));resp.raise_for_status()
  raw=html.unescape(resp.text.replace("\\/","/"))
  row["html_chars"]=len(raw);row["status"]="PUBLISHER_PAGE_FETCHED"
  pattern=r'(?:https?://www\.redbull\.com)?/(?:[a-z]{2}-[a-z]{2})/(?:videos|episodes|shows)/[a-zA-Z0-9_-]{10,}'
  paths=re.findall(pattern,raw,re.I)
  urls=[]
  for x in paths:
   link=urljoin(page,x)
   if len(link)<400 and "nurburgring" in (link.lower()):urls.append(link)
  # Keep all true publisher player-video URLs, not only Nürburgring-named (race replays may have IDs).
  for x in paths:
   link=urljoin(page,x)
   if len(link)<400:urls.append(link)
  row["linked_videos"]=list(dict.fromkeys(urls))[:35]
  vurls+=row["linked_videos"]
  row["player_keys"]=sorted(set(re.findall(r'"(?:videoId|assetId|episodeId|contentId)"\s*:\s*"([^"]{6,80})"',raw,re.I)))[:16]
  print("EVENT_PAGE",page,"VIDEO_LINKS",len(row["linked_videos"]),"CHARACTERS",len(raw),flush=True)
 except Exception as ex:
  row.update(status="HTTP_FAIL",failure=str(ex)[-350:])
  print("EVENT_PAGE_BLOCKED",page,str(ex)[-200:],flush=True)
 records.append(row)
vurls=list(dict.fromkeys(vurls))
# Event pages might themselves resolve to an actual Video archive.
targets=vurls[:6]+PAGES[:1]
probing=[]
for ix,url in enumerate(targets):
 row={"url":url}
 try:
  args=[sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings",
    "--socket-timeout","12","--retries","0","--fragment-retries","0","--skip-download","-J",url]
  response=run(args,50)
  if response.returncode:raise RuntimeError("MEDIA_EXTRACTOR "+(response.stderr or response.stdout)[-450:])
  meta=json.loads(response.stdout)
  row.update(title=meta.get('title'),duration_seconds=meta.get('duration'),extractor=meta.get('extractor'))
  hd=[f for f in meta.get("formats",[]) if (f.get("width") or 0)>=1920 and (f.get("height") or 0)>=1080 and (f.get('vcodec') or "none")!="none"]
  row["advertised_original_1080_formats"]=[{k:f.get(k) for k in ("format_id","width","height","ext","protocol","vcodec")} for f in hd][-15:]
  if not hd:raise RuntimeError("NO_ADVERTISED_NATIVE_LANDSCAPE_1080")
  # Avoid downloading entire race movie. Clip ≤9 source seconds after 14s; independent original 1080 stream.
  out=ORIGINAL/f"RB_2025_NURBURGRING_{ix:02d}.%(ext)s"
  d=run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings",
    "--socket-timeout","15","--retries","0","--fragment-retries","0",
    "-f","bv*[width>=1920][height>=1080]/b[width>=1920][height>=1080]",
    "--download-sections","*14-23","--merge-output-format","mp4","--max-filesize","120M","-o",str(out),url],120)
  files=[p for p in ORIGINAL.glob(f"RB_2025_NURBURGRING_{ix:02d}.*") if p.stat().st_size>100000]
  if d.returncode or not files:raise RuntimeError("NO_DOWNLOAD "+(d.stderr or d.stdout)[-350:])
  file=max(files,key=lambda p:p.stat().st_size)
  ff=run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(file)],45)
  if ff.returncode:raise RuntimeError(ff.stderr[-300:])
  inf=json.loads(ff.stdout);v=next(x for x in inf["streams"] if x["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  if w<1920 or h<1080 or w<=h:raise RuntimeError(f"ACTUAL_BELOW_LANDSCAPE_FHD_{w}x{h}")
  decoded=run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(file),"-f","null","-"],70)
  if decoded.returncode:raise RuntimeError("INVALID_VIDEO_FRAME_DECODE "+decoded.stderr[-250:])
  duration=float(inf["format"].get("duration") or 0)
  img=Image.new("RGB",(960,200),(5,5,5));drawer=ImageDraw.Draw(img)
  for j in range(4):
   sec=max(.05,duration*(j+.5)/4)
   temp=FRAMES/f"t_{ix}_{j}.jpg"
   shot=run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(sec),"-i",str(file),
   "-frames:v","1","-vf","scale=240:135","-q:v","4",str(temp)],30)
   if not shot.returncode and temp.exists():
    with Image.open(temp) as im:img.paste(im.convert("RGB"),(j*240,21))
   temp.unlink(missing_ok=True)
   drawer.text((j*240+4,3),f"{sec:.1f}s",fill="white")
  dest=FRAMES/(f"RB_2025_NBR_{ix}_4FRAME.jpg");img.save(dest,quality=89)
  row.update(status="REAL_NATIVE_HD_DOWNLOADED_FULLY_DECODED_GT3_MAKE_VISUAL_QA_PENDING",
   sha256=digest(file),bytes=file.stat().st_size,video=str(file.relative_to(ROOT)),
   contact_sheet=str(dest.relative_to(ROOT)),native_pixels=[w,h],actual_duration=duration,ffprobe=inf)
  print("NEW_TRUE_NATIVE_HD_RACE_VIDEO",url,row["native_pixels"],row["bytes"],row["sha256"],flush=True)
 except Exception as e:
  row["status"]="NOT_QUALIFIED";row["error"]=str(e)[-500:]
  print("REDBULL_TARGET_FAILED",url,row["error"],flush=True)
 probing.append(row)
(ROOT/"SOURCE_REPORT.json").write_text(json.dumps({"project":"GT3-NURBURGRING-MULTICAR",
 "publisher":"Red Bull 2025 Nürburgring DTM public replay",
 "page_results":records,"probed_urls":probing,
 "approved_GT3_makes":0,"approved_independently_filmed_GT3_views":0,
 "note":"Event pages or video titles are not source footage; any physical 1080 films remain pending actual GT3 model/camera verification."},indent=2)+"\n")
print("ACTUAL_PHYSICAL_1080_VIDEO_SOURCES",sum(x["status"].startswith("REAL_NATIVE") for x in probing),flush=True)
