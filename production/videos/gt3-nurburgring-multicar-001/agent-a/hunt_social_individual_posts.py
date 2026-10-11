#!/usr/bin/env python3
"""Individual-post TikTok/Instagram GT3 Nordschleife hunt (no logins, no profile-loop).

Search indexed SPECIFIC videos with make/year/team, validate playable downloads using
ffprobe, source byte hash and contact sheets. Source gate remains review pending.
"""
import concurrent.futures as cf
import hashlib, html, json, re, subprocess, sys, time
from pathlib import Path
from urllib.parse import quote, unquote
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw

OUT=Path("out/gt3-social-individual-post-hunt")
M=OUT/"native_media";V=OUT/"contact_sheets"
for d in [OUT,M,V]:d.mkdir(parents=True,exist_ok=True)
QUERY_LIST=[
 ("Ferrari","site:tiktok.com/@/video/ \"296 GT3\" \"Nürburgring\""),
 ("Ferrari","site:instagram.com/reel/ \"Ferrari 296\" \"24h Nürburgring\""),
 ("Ferrari","\"instagram.com/reel/\" \"Rinaldi Racing\" \"N24\""),
 ("Ferrari","\"tiktok.com/@\" \"Verstappen\" \"Ferrari 296 GT3\" Nordschleife"),
 ("Lamborghini","site:instagram.com/reel/ \"ABT\" \"Lamborghini\" \"Nürburgring\""),
 ("Lamborghini","site:tiktok.com/@/video/ \"Huracan GT3\" \"Nordschleife\""),
 ("Lamborghini","\"instagram.com/reel/\" \"Red Bull Team ABT\" GT3"),
 ("Lamborghini","\"tiktok.com/@\" \"24hnbr\" \"Lamborghini\""),
 ("Aston Martin","site:instagram.com/reel/ \"Walkenhorst\" \"Vantage GT3\""),
 ("Aston Martin","site:tiktok.com/@/video/ \"Aston Martin Vantage GT3\" \"Nürburgring\""),
 ("Audi","site:instagram.com/reel/ \"R8 LMS\" \"24h\" \"Nürburgring\""),
 ("Audi","site:tiktok.com/@/video/ \"Scherer Sport\" \"Audi R8\""),
 ("McLaren","site:instagram.com/reel/ \"McLaren 720S GT3\" Nürburgring"),
 ("BMW","site:instagram.com/reel/ \"BMW M4 GT3\" \"Nürburgring\""),
 ("Multi","site:instagram.com/reel/ \"24hnbr\" racing 2025"),
 ("Multi","site:tiktok.com/@/video/ \"24hnbr\" racing 2025"),
 ("Multi","\"instagram.com/reel/\" \"nls\" \"gt3\" motorsport"),
 ("Multi","\"tiktok.com/@\" \"gtworldcheu\" \"nürburgring\""),
]
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
ENGINES={
 "bing": lambda q:"https://www.bing.com/search?q="+quote(q)+"&count=30",
 "google":lambda q:"https://www.google.com/search?q="+quote(q)+"&num=40",
 "duckduckgo":lambda q:"https://html.duckduckgo.com/html/?q="+quote(q),
 "brave":lambda q:"https://search.brave.com/search?q="+quote(q)+"&source=web",
}
social_re=re.compile(r'https?://(?:www\.)?(?:instagram\.com/(?:p|reel)/[A-Za-z0-9_-]{7,20}|tiktok\.com/@[A-Za-z0-9_.-]+/video/\d{17,21})',re.I)
reports=[]
def lookup(args):
 make,q,engine,url=args
 o=dict(make_hint=make,query=q,engine=engine,engine_url=url,posts=[])
 try:
  response=requests.get(url,headers={"User-Agent":UA},timeout=15)
  body=html.unescape(unquote(response.text))
  soup=BeautifulSoup(body,'html.parser')
  for a in soup.find_all('a',href=True):
   body+="\n"+html.unescape(unquote(a.get('href','')))
  posts=list(dict.fromkeys(m.group().rstrip('),;') for m in social_re.finditer(body)))
  o.update(http=response.status_code,page_bytes=len(response.content),posts=posts[:25])
 except Exception as e:o['error']=repr(e)
 return o
tasks=[(make,q,engine,geturl(q)) for make,q in QUERY_LIST for engine,geturl in ENGINES.items()]
with cf.ThreadPoolExecutor(max_workers=8) as pool:
 for row in pool.map(lookup,tasks):
  reports.append(row)
  print("INDEX",row["engine"],row["make_hint"],row.get("http"),len(row["posts"]),flush=True)
leads={}
for r in reports:
 for link in r['posts']:leads.setdefault(link,[]).append(r['make_hint'])
# Verify possible exact social links, no profile list / no credential guessing.
accepted=[];attempts=[]
for i,(url,make_hints) in enumerate(list(leads.items())[:32]):
 o=dict(url=url,make_hints=sorted(set(make_hints)),status="NOT_ACQUIRED")
 try:
  meta=subprocess.run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
          "--skip-download","-J","--socket-timeout","12","--retries","0",url],
          capture_output=True,text=True,timeout=40)
  if meta.returncode:raise ValueError("metadata: "+meta.stderr[-500:])
  d=json.loads(meta.stdout)
  formats=[f for f in d.get('formats',[]) if f.get('width') and f.get('height')]
  best=max(formats,key=lambda f:max((f.get('width') or 0),(f.get('height') or 0)),default={})
  o.update(title=d.get('title'),uploader=d.get('uploader'),duration=d.get('duration'),
      best_listed={"width":best.get('width'),"height":best.get('height'),"format_id":best.get('format_id')})
  sizes=[(int(f.get('width') or 0),int(f.get('height') or 0)) for f in formats]
  eligible=any((w>=1920 and h>=1080) or (w>=1080 and h>=1920) for w,h in sizes)
  if not eligible:raise ValueError("native size listed below 1080p: "+str(sorted(set(sizes))[-5:]))
  template=str(M/(f"social_{i:02d}.%(ext)s"))
  x=subprocess.run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
       "-f","bv*[height>=1080]/b[height>=1080]","--no-progress","--socket-timeout","12","--retries","0",
       "--merge-output-format","mp4","-o",template,url],
       capture_output=True,text=True,timeout=160)
  files=[p for p in M.glob(f"social_{i:02d}.*") if p.stat().st_size>30000]
  if x.returncode or not files:raise ValueError("download: "+x.stderr[-500:])
  f=max(files,key=lambda p:p.stat().st_size)
  info=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)],timeout=40))
  stream=next(k for k in info['streams'] if k['codec_type']=='video')
  w,h=int(stream['width']),int(stream['height'])
  if not ((w>=1920 and h>=1080) or (w>=1080 and h>=1920)):
   f.unlink();raise ValueError(f"actual source {w}x{h} fails native HD gate")
  p=subprocess.run(["ffmpeg","-v","error","-i",str(f),"-f","null","-"],capture_output=True,timeout=140)
  if p.returncode:f.unlink();raise ValueError("full decode failed: "+p.stderr.decode()[-250:])
  total=float(info['format'].get('duration') or 0)
  if total<2:f.unlink();raise ValueError("video under 2 seconds")
  canvas=Image.new('RGB',(480*3,310*2),(0,0,0));dr=ImageDraw.Draw(canvas)
  for k in range(6):
   t=total*(k+.4)/6
   temp=V/f"tmp_{i:02d}_{k}.jpg"
   p=subprocess.run(["ffmpeg","-v","error","-y","-ss",str(t),"-i",str(f),"-frames:v","1","-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",str(temp)],capture_output=True,timeout=35)
   if p.returncode==0 and temp.exists():
    with Image.open(temp) as im:canvas.paste(im.convert("RGB"),((k%3)*480,(k//3)*310+25))
    temp.unlink()
   dr.text(((k%3)*480+4,(k//3)*310+5),f"{t:.1f}s {w}x{h}",fill="white")
  sheet=V/f"social_{i:02d}_SHEET.jpg";canvas.save(sheet,quality=89)
  hash=hashlib.sha256()
  with f.open("rb") as fi:
   for chunk in iter(lambda:fi.read(2**20),b''):hash.update(chunk)
  o.update(status="NATIVE_HD_DOWNLOADED_VISUAL_GT3_QA_PENDING",file=str(f.relative_to(OUT)),sha256=hash.hexdigest(),
      width=w,height=h,bytes=f.stat().st_size,duration=total,ffprobe=info,
      contact_sheet=str(sheet.relative_to(OUT)))
  accepted.append(o)
  print("ACTUAL SOURCE",o['url'],w,h,f.stat().st_size,flush=True)
 except Exception as e:
  o.update(status="REJECTED",reason=str(e)[-800:])
 attempts.append(o)
 (OUT/"live_status.json").write_text(json.dumps(dict(accepted_sources=len(accepted),attempted=len(attempts),attempts=attempts),indent=2))
(OUT/"manifest.json").write_text(json.dumps(dict(gate="BLOCKED_PENDING_INDEPENDENT_MAKE_RACE_REVIEW",source_type="public TikTok/Instagram individual posts",indices=reports,post_urls_found=list(leads),accepted=accepted,attempted=attempts,criteria="Original native>=1920x1080 landscape or >=1080x1920 portrait. Verify actual racing Nürburgring GT3 and no watermark before admitting into 24/6 source gate."),indent=2))
print("RESULT",json.dumps({"indexed_post_urls":len(leads),"native_HD_downloaded":len(accepted),"attempted":len(attempts)},indent=2))
