#!/usr/bin/env python3
"""Check public manufacturer video pages for actual HD MP4 or HLS.
URLs from public pages are leads only, require FFprobe decoded-native and car review.
"""
import re,json,html,subprocess,sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup
OUT=Path("out/gt3-manufacturer-alt-probe");OUT.mkdir(parents=True,exist_ok=True)
pages=[
 {"make":"Aston Martin","url":"https://www.motorsport.com/endurance/video/aston-martin-at-the-2014-n-rburgring-24-hours-race/96046/"},
 {"make":"Aston Martin","url":"https://www.motorsport.com/endurance/video/aston-martin-vantage-gt3-n-rburgring-in-car-lap/96151/"},
 {"make":"BMW","url":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009555/bmw-m-motorsport-at-red-bull-formula-nuerburgring-event"},
 {"make":"Mercedes-AMG","url":"https://www.mercedes-amg.com/en/24h-nbr"},
 {"make":"Audi","url":"https://timescopefilms.com/work/audisport/"},
 {"make":"Audi","url":"https://www.audi.com/en/press-releases/audi-sport-wins-24-hours-of-nuerburgring-for-the-fifth-time-11764"},
 {"make":"Multi","url":"https://www.motorsport-action.de/24h-rennen/2025/24h-rennen-2025-en.html"},
 {"make":"Lamborghini","url":"https://www.lamborghini.com/en-en/motorsport/news"},
 {"make":"Aston Martin","url":"https://media.astonmartin.com/vantage-gt3-shines-as-it-breaks-new-ground-in-imsa-british-gts-nurburgring-24-hours-and-pikes-peak/?album=true&lang=eng"}
]
s=requests.Session();s.headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
results=[]
for item in pages:
 d=dict(item)
 try:
  r=s.get(item["url"],timeout=14);d.update(http=r.status_code,final=r.url,bytes=len(r.content))
  text=html.unescape(r.text)
  urls=re.findall(r'(?:https?:)?//[^\s"<>]+?\.(?:mp4|m3u8|mov|webm)(?:\?[^\s"<>]{0,100})?',text,re.I)
  soup=BeautifulSoup(r.text,"html.parser")
  for tag in soup.select("video, source, iframe, meta[property='og:video'], meta[name='twitter:player']"):
   for att in ["src","content","data-src"]:
    u=tag.get(att)
    if u and (".mp4" in u or ".m3u8" in u or "player" in u or "video" in u):urls.append(u)
  d["media_links"]=list(dict.fromkeys(urls))[:30]
  print("PUBLISHER",d["make"],r.status_code,len(r.content),"video-urls",len(d["media_links"]),str(d["media_links"])[:130],flush=True)
 except Exception as e:d["error"]=str(e)
 # Independently request extractor format list on first seven film-type pages.
 if item["make"] in ["Aston Martin","BMW","Audi","Mercedes-AMG","Multi"]:
  try:
   p=subprocess.run([sys.executable,"-m","yt_dlp","--ignore-config","--no-warnings","-F",item["url"]],
                    capture_output=True,text=True,timeout=26)
   d["yt_dlp_returncode"]=p.returncode
   d["format_listing_tail"]=(p.stdout or p.stderr)[-2200:]
   print("EXTRACTOR",d["make"],"status",p.returncode,"found_native1080",("1920x1080" in p.stdout or "1080p" in p.stdout),flush=True)
  except Exception as e:d["extract_error"]=str(e)
 results.append(d)
(OUT/"publisher_video_routes.json").write_text(json.dumps(results,indent=2)+"\n")
