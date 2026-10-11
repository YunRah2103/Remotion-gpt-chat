#!/usr/bin/env python3
"""Non-YouTube video-player media gate (manufacturer 2023-26 N24, GT3).

Download only physically available native >=1080p original video streams; do
not pretend article/player/advertised 1080 is actual eligible N24 GT3 footage.
"""
import subprocess,sys,json,hashlib,time
from pathlib import Path
from PIL import Image,ImageDraw
OUT=Path("out/gt3-alt-race-player-media");MEDIA=OUT/"clips";REVIEW=OUT/"contact_sheets"
for d in [OUT,MEDIA,REVIEW]:d.mkdir(exist_ok=True,parents=True)
SOURCES=[
 ("ferrari_motorsport_2023","https://it.motorsport.com/gtwc-endurance/video/ferrari-296-gt3-limpresa-al-ring-che-fa-storia/642627/","Ferrari","Ferrari 296 GT3 winning N24 recap",2023),
 ("n24_official_highlights_2023","https://www.24h-rennen.de/en/result/?r=2023-05-21","multi","Official Ferrari 296 GT3 2023 winner highlights",2023),
 ("lamborghini_motorsportmagazin_2024","https://www.motorsport-magazin.com/24h-stunden-nuerburgring/video-13392-abt-lamborghini-24h-nuerburgring-huracan-red-bull.html","Lamborghini","ABT Lamborghini Huracan GT3 Evo2 2024 film (might be static 40s reveal; visual check)",2024),
 ("lamborghini_ffh_2024","https://www.ffh.de/video/mediathek/396207-abt-lamborghini-bei-24h-nuerburgring-huracan-mit-fluegeln.html","Lamborghini","Same publisher video alias possible, deduplicate by SHA",2024),
 ("ferrari_2023_bilibili","https://www.bilibili.com/video/BV1VP411D7Xo/","multi","2023 Nürburgring 24h replay rehost, low or auth-gated likely",2023),
 ("redbull_2026_n24","https://www.redbull.tv/en/page/rrn:content:event-profiles:abc489c0-160e-4bfc-af28-4b77611f08ec/adac-ravenol-24h-nuerburgring","multi","Red Bull N24 2026 event racing broadcast; player may lack stream",2026),
 ("ferrari_news_film","https://www.ferrari.com/en-EN/competizioni-gt/articles/ferrari-296-gt3-wins-24-hours-of-nurburgring","Ferrari","Ferrari 2023 official GT3 winning article",2023),
 ("nurburgring_tv","https://www.nuerburgring.tv/en/work","multi","Nürburgring.tv official film portfolio",2026),
 ("lamborghini_n24_documentary","https://mcchip-dkr.com/en/news/motorsport/24-hours-nuerburgring-2026-a-look-back-at-our-weekend","Lamborghini","Lamborghini 2026 GT3 entrant publisher N24 documentary",2026)
]
def run(cmd,t):
 try:return subprocess.run(cmd,capture_output=True,text=True,timeout=t)
 except Exception as e: return subprocess.CompletedProcess(cmd,123,"",str(e))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(2**20),b''):h.update(b)
 return h.hexdigest()
rows=[]
for i,(id,url,make,hint,year) in enumerate(SOURCES):
 row=dict(id=id,url=url,make_hint=make,title_hint=hint,year=year,status="NO_NATIVE_MEDIA")
 r=run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings","--socket-timeout","13","--retries","0","--skip-download","-J",url],45)
 if r.returncode!=0:
  row["metadata_error"]=(r.stderr or r.stdout)[-850:]
  print("METADATA FAILED",id,row['metadata_error'][-150:],flush=True)
  rows.append(row);continue
 try:
  j=json.loads(r.stdout);row.update(title=j.get('title'),duration_advertised=j.get('duration'),uploader=j.get('uploader'))
  fms=[{"width":x.get("width"),"height":x.get("height"),"format_id":x.get("format_id"),"ext":x.get("ext")}
       for x in j.get('formats',[]) if x.get("height") and x.get("width")]
  row["candidate_formats"]=fms[-30:]
  qualifies=[f for f in fms if ((f['width'] or 0)>=1920 and (f['height'] or 0)>=1080) or ((f['width'] or 0)>=1080 and (f['height'] or 0)>=1920)]
  if not qualifies:
   row['status']="NO_LISTED_NATIVE_HD"
   print("BELOW NATIVE 1080",id,sorted(set((f["width"],f["height"]) for f in fms))[-4:],flush=True)
   rows.append(row);continue
  # Limit remote to first 15 seconds where supported; preserve original format.
  template=str(MEDIA/(id+".%(ext)s"))
  dl=run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings",
        "--socket-timeout","14","--retries","0","-f","bv*[height>=1080]/b[height>=1080]",
        "--download-sections","*0-16","--merge-output-format","mp4",
        "-o",template,url],180)
  files=[p for p in MEDIA.glob(id+".*") if p.stat().st_size>200000]
  if dl.returncode or not files:
   row["status"]="HD_LISTED_DOWNLOAD_FAILED";row["download_error"]=dl.stderr[-600:]
   print("HD DOWNLOAD FAILED",id,row["download_error"][-140:],flush=True)
   rows.append(row);continue
  f=max(files,key=lambda x:x.stat().st_size)
  pro=run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)],35)
  if pro.returncode:raise RuntimeError("FFprobe invalid "+pro.stderr[-300:])
  jj=json.loads(pro.stdout);v=next(s for s in jj['streams'] if s['codec_type']=='video')
  w,h=int(v['width']),int(v['height'])
  if not ((w>=1920 and h>=1080) or (w>=1080 and h>=1920)):raise RuntimeError(f"Native decoded only {w}x{h}")
  decoded=run(["ffmpeg","-v","error","-i",str(f),"-f","null","-"],70)
  if decoded.returncode:raise RuntimeError("Decode fail: "+decoded.stderr[-300:])
  duration=float(jj['format'].get('duration') or 0)
  img=Image.new('RGB',(1440,590),(10,10,10));draw=ImageDraw.Draw(img)
  for k in range(6):
   sec=max(.05,duration*(k+.35)/6)
   thumb=REVIEW/f"{id}_{k}.jpg"
   cmd=["ffmpeg","-v","error","-y","-ss",str(sec),"-i",str(f),"-frames:v","1",
     "-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",str(thumb)]
   z=run(cmd,35)
   if z.returncode==0 and thumb.exists():
    with Image.open(thumb) as pic:img.paste(pic.convert('RGB'),((k%3)*480,(k//3)*295+22))
    thumb.unlink()
   draw.text(((k%3)*480+3,(k//3)*295+3),f"{sec:.1f}s {w}x{h}",fill='white')
  sheet=REVIEW/(id+"_6FRAME.jpg");img.save(sheet,quality=88)
  row.update(status="ACTUAL_NATIVE_HD_ACQUIRED_GT3_VISUAL_QA_PENDING",file=str(f.relative_to(OUT)),
    sha256=sha(f),bytes=f.stat().st_size,width=w,height=h,duration=duration,ffprobe=jj,contact_sheet=str(sheet.relative_to(OUT)))
  print("ACTUAL NEW MEDIA",id,w,h,row['bytes'],flush=True)
 except Exception as e:
  row['status']="SOURCE_REJECTED";row['reject_reason']=str(e)[-450:]
 rows.append(row)
(OUT/"manifest.json").write_text(json.dumps(dict(title="Independently fetched off-YouTube GT3 publisher sources",gate="VISUAL_GT3_MODEL_TRACK_VERIFICATION_REQUIRED",source_rows=rows),indent=2))
print("SUMMARY",json.dumps([(r['id'],r['status']) for r in rows]))
