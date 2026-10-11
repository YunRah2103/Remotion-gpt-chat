#!/usr/bin/env python3
"""Unwrap original publisher-embedded MP4/HLS/Vimeo URLs (not YouTube).
One-level native HTML/iframe source audit with real 1080p FFprobe proof.
"""
import re,html,json,subprocess,hashlib
from urllib.parse import urljoin,unquote
from pathlib import Path
from bs4 import BeautifulSoup
import requests
O=Path("out/gt3-n24-publisher-html-embedded");O.mkdir(parents=True,exist_ok=True)
PAGES=[
("Ferrari","https://www.24h-rennen.de/en/2019/06/20/10-years-gt3-at-the-nuerburgring/"),
("Ferrari","https://www.24h-rennen.de/2023/05/21/schlussbericht-2/"),
("Ferrari","https://www.24h-rennen.de/en/result/?r=2023-05-21"),
("Ferrari","https://it.motorsport.com/gtwc-endurance/video/ferrari-296-gt3-limpresa-al-ring-che-fa-storia/642627/"),
("Lamborghini","https://www.motorsport-magazin.com/24h-stunden-nuerburgring/video-13392-abt-lamborghini-24h-nuerburgring-huracan-red-bull.html"),
("Lamborghini","https://www.ffh.de/video/mediathek/396207-abt-lamborghini-bei-24h-nuerburgring-huracan-mit-fluegeln.html"),
("Lamborghini","https://mcchip-dkr.com/en/news/motorsport/24-hours-nuerburgring-2026-a-look-back-at-our-weekend"),
("Lamborghini","https://www.redbull.com/gb-en/events/adac-ravenol-24h-nurburgring"),
("Ferrari","https://www.ferrari.com/en-EN/competizioni-gt/articles/ferrari-296-gt3-wins-24-hours-of-nurburgring"),
("Multi","https://www.nuerburgring.tv/en/work"),
("Aston Martin","https://media.astonmartin.com/vantage-gt3-shines-as-it-breaks-new-ground-in-imsa-british-gts-nurburgring-24-hours-and-pikes-peak/?album=true&lang=eng"),
("Audi","https://timescopefilms.com/work/audisport/")
]
SESSION=requests.Session();SESSION.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"})
reg=re.compile(r'(?:https?:)?//[^\s"<>\\]{8,350}?\.(?:mp4|m3u8|mov)(?:\?[^\s"<>\\]{0,120})?',re.I)
rows=[];found={}
def fetch(url):
 try:
  r=SESSION.get(url,timeout=16)
  return dict(status=r.status_code,url=r.url,html=r.text[:850000])
 except Exception as e:return dict(error=str(e),url=url,html="")
for make,page in PAGES:
 result=dict(make_hint=make,page=page)
 r=fetch(page);result['http']=r.get('status');result['bytes']=len(r.get('html',''))
 src=html.unescape(r.get('html','')).replace("\\/","/")
 parsed=BeautifulSoup(src,'html.parser')
 iframe_urls=[]
 for node in parsed.find_all(['iframe','source','video','meta']):
  for a in ['src','data-src','content','srcset','data-video']:
   val=node.get(a)
   if not val:continue
   if 'video' in val or '.mp4' in val or '.m3u8' in val or 'vimeo' in val or 'player' in val:
    iframe_urls.append(urljoin(r.get('url',page),html.unescape(val)))
 media=list(dict.fromkeys(x.group().rstrip('.,;') for x in reg.finditer(src)))
 for url in iframe_urls[:8]:
  if any(x in url for x in ['youtube.com','youtu.be','googleads','doubleclick','googletagmanager']):continue
  sub=fetch(url)
  st=html.unescape(sub.get('html','')).replace("\\/","/")
  media.extend(x.group().rstrip('.,;') for x in reg.finditer(st))
  # Vimeo known test player separate from YouTube
  if 'player.vimeo.com/video/' in url:found.setdefault(url,make)
 result["iframe_urls"]=list(dict.fromkeys(iframe_urls))[:12]
 result["media_candidates"]=list(dict.fromkeys(media))[:20]
 result["excerpt"]=""
 for u in result["media_candidates"]:found.setdefault(u,make)
 rows.append(result)
 print('PUBLISHER',make,result['http'],len(media),len(iframe_urls),page,flush=True)
(O/"page_sources.json").write_text(json.dumps(rows,indent=2))
verified=[]
for i,(url,make) in enumerate(list(found.items())[:35]):
 out=dict(url=url,make_hint=make,status="NOT_ACQUIRED")
 if 'youtube' in url:continue
 try:
  if 'vimeo' in url:
   c=subprocess.run(['python','-m','yt_dlp','--ignore-config','--no-playlist','-J','--skip-download',url],
    capture_output=True,text=True,timeout=45)
   if c.returncode:raise ValueError(c.stderr[-500:])
   j=json.loads(c.stdout)
   out["native_formats"]=[(x.get('width'),x.get('height')) for x in j.get('formats',[]) if x.get('height',0)>=1080]
   out['status']="VIMEO_NATIVE_LISTED_VISUAL_QA_PENDING" if out["native_formats"] else "NO_NATIVE_HD"
  else:
   c=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',url],capture_output=True,text=True,timeout=50)
   if c.returncode:raise ValueError(c.stderr[-600:])
   j=json.loads(c.stdout);v=next(s for s in j['streams'] if s['codec_type']=='video')
   out.update(width=v.get('width'),height=v.get('height'),duration=j['format'].get('duration'))
   out["status"]="SOURCE_NATIVE_1080P_IDENTIFIED_NOT_DOWNLOADED" if v['width']>=1920 and v['height']>=1080 else "SOURCE_TOO_SMALL"
  print("VIDEO DIRECT",url,out['status'],flush=True)
 except Exception as e:out['error']=str(e)[-500:]
 verified.append(out)
(O/"report.json").write_text(json.dumps(dict(gate="REQUIRES_REAL_DOWNLOAD_AND_VISUAL_GT3_RACE_QA",discovered=verified,pages=rows),indent=2))
print("FINAL",len(found),"player sources",len([x for x in verified if "1080P" in x['status'] or "LISTED" in x['status']]))
