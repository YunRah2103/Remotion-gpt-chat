#!/usr/bin/env python3
"""Detect real directly linked publisher video URLs on GT3 Nürburgring articles."""
import requests,re,json,html
from pathlib import Path
from urllib.parse import urljoin
PAGES=[
"https://format67.net/portfolio/falken-the-perfect-lap-nuerburgring-nordschleife/",
"https://www.motomovie.de/video/24h-rennen-nuerburgring-2025-freitag-wird-der-cayman-bis-zum-rennen-fertig-mcchip-dkr-24432",
"https://www.abt-sportsline.com/motorsport-news/detail/abt-to-enter-24-hour-race-with-strong-partners-and-driver-line-ups",
"https://www.swr.de/sport/mehr-sport/motorsport/bmw-gewinnt-24h-rennen-nuerburgring-100.html",
"https://thetiremagazine.com/2024/07/12/the-new-falken-24h-race-film-is-online-why-we-race/",
"https://thetiremagazine.com/2026/09/09/dunlop-unveils-taking-the-line-a-short-film-from-the-nurburgring-24-hours/"
]
ROOT=Path("out/gt3-a-new-race-publisher-direct-links");ROOT.mkdir(parents=True,exist_ok=True)
s=requests.Session();s.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125 Safari/537.36"})
rows=[]
for page in PAGES:
 rec={"page":page,"links":[]}
 try:
  r=s.get(page,timeout=(9,20));rec["status_code"]=r.status_code;r.raise_for_status()
  raw=html.unescape(r.text.replace("\\/","/"))
  rec["html_bytes"]=len(r.content)
  for pattern in [r'(?:https?:)?//[^\s"<>\\]+?\.(?:mp4|m3u8|mpd)(?:\?[^\s"<>\\]*)?',r'/wp-content/uploads/[^\s"<>\\]+?\.mp4',r'(?:contentUrl|videoUrl|file|src)["\s:=]+["\']([^"\']+\.(?:mp4|m3u8))']:
   for v in re.findall(pattern,raw,re.I):
    if isinstance(v,tuple):v=v[0]
    v=v.strip('"\' ,;()')
    if v.startswith("//"):v="https:"+v
    u=urljoin(page,v)
    if len(u)<500 and u.startswith("https"):rec["links"].append(u)
  rec["links"]=sorted(set(rec["links"]))[:45]
  rec["interesting_external_embeds"]=sorted(set(re.findall(r'https?://(?:player\.vimeo\.com|[^ "\']+brightcove[^ "\']*|[^ "\']+jwplayer[^ "\']*)[^\s"\'<>]*',raw,re.I)))[:12]
  print("PAGE",r.status_code,len(rec["links"]),page,flush=True)
 except Exception as e:rec["error"]=str(e)[-400:];print("PAGE_FAIL",page,rec["error"],flush=True)
 rows.append(rec)
(ROOT/"DIRECT_VIDEO_DISCOVERY.json").write_text(json.dumps({"scanned_pages":rows,"note":"These are media link discoveries, not acquired video. Native 1920x1080 probe required."},indent=2)+"\n")
