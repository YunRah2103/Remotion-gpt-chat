#!/usr/bin/env python3
"""Research accessible publisher-hosted real video, media and stock libraries.
Never call file URLs accepted clips absent actual 1080p FFprobe/decoded visual evidence.
"""
import json, os, pathlib, re, urllib.parse, urllib.request, html, sys
from collections import Counter
ROOT=pathlib.Path("out/fr-classics-source-scout"); ROOT.mkdir(parents=True,exist_ok=True)
PAGES=[
("alpine-press-historic","https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/?lang=deu"),
("alpine-group-rally-1973","https://presse.alpinecars.de/video-alpine-a110-rallye-wm-erfolg-1973/?lang=deu"),
("media-alpine-classic","https://media.alpinecars.com/?lang=eng"),
("peugeot-205-40years","https://www.media.stellantis.com/uk-en/peugeot/press/the-peugeot-205-is-turning-40-an-alluring-sacred-number"),
("renault-original-r5-video","https://media.renault.com/renault-5-turbo-3e-led-electrifying-showcase-at-goodwood-festival-of-speed/?lang=eng"),
("classic-ds-event","https://www.salonkyhk.cz/z-prahy-na-azurove-pobrezi-czech-oldtimer-express-2025-miri-az-do-nice/"),
("classic-r5-alpine-for-sale","https://soulauto.com/1984-renault-5-alpine-turbo/")
]
UA="Mozilla/5.0 (compatible; ArchiveFilmSourceAudit/1.0)"
out={"sites":{},"stock":{}}
for name,url in PAGES:
 try:
  req=urllib.request.Request(url,headers={"User-Agent":UA})
  with urllib.request.urlopen(req,timeout=16) as response:
   page=response.read(2600000).decode("utf-8","replace")
   html_url=response.geturl()
  pattern=r'(?:https?:)?//[^\s"<>]+?\.(?:mp4|mov|m4v|m3u8|webm)(?:\?[^\s"<>]+)?'
  hits=list(dict.fromkeys(html.unescape(a).rstrip("\\") for a in re.findall(pattern,page,re.I)))
  # Spot source media asset identifiers/endpoints in inline configs; do not print entire page
  marker=re.findall(r'.{0,180}(?:1080p|assetId|mediaId|downloadLink|media\.renault|api/asset|media-manager|1080p 25fps).{0,230}',page,re.I)
  out["sites"][name]={"url":html_url,"video_links":hits[:80],"marker_snippets":marker[:50],"html_bytes":len(page)}
  print("SITE",name,"videos",len(hits),"markers",len(marker),flush=True)
  for link in hits[:7]:print("DIRECT",name,link[:240],flush=True)
 except Exception as e:
  out["sites"][name]={"error":str(e)}
  print("SITE_FAILED",name,str(e),flush=True)
# Basic provider query calls will not leak keys; search metadata ONLY first to avoid downloading irrelevant cars
sys.path.insert(0,str(pathlib.Path("production/footage_finder").resolve()))
try:
 from finder import search
 PEX=os.getenv("PEXELS_API_KEY","");PIX=os.getenv("PIXABAY_API_KEY","")
 print("PROVIDER_CONFIGURATION",json.dumps({"pexels_configured":bool(PEX),"pixabay_configured":bool(PIX)}),flush=True)
 queries=["Renault 5 Turbo","Peugeot 205 GTI","Peugeot 205 Turbo 16","Renault Clio V6",
          "Peugeot 306 Maxi","Alpine A110 classic","Citroen DS vintage","rally vintage Peugeot"]
 for query in queries:
  if not PEX and not PIX:
   out["stock"][query]={"status":"NO_KEYS"};break
  provider="both" if PEX and PIX else "Pexels" if PEX else "Pixabay"
  candidates,warnings=search(query,provider,PEX,PIX,per_provider=30)
  matches=[{"id":c.id,"provider":c.provider,"page":c.page,"width":c.width,
            "height":c.height,"tags":c.tags,"creator":c.creator,
            "duration":c.duration,"native_hd":c.width>=1920 and c.height>=1080} for c in candidates]
  out["stock"][query]={"count":len(candidates),"warnings":warnings,"candidates":matches[:35]}
  print("STOCK",query,"total",len(matches),"1080p",sum(x["native_hd"] for x in matches),"warnings",warnings,flush=True)
  for row in matches[:6]:print("CANDIDATE",row["id"],row["page"],row["width"],row["height"],row["tags"][:100],flush=True)
except Exception as e:
 out["stock_error"]=str(e)
 print("STOCK_FAILED",str(e),flush=True)
(ROOT/"report.json").write_text(json.dumps(out,indent=2,ensure_ascii=False))
print("SCOUT_COMPLETE",flush=True)
