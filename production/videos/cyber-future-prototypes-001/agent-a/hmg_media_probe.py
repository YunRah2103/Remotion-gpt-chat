import requests,re,json,html
from pathlib import Path
from bs4 import BeautifulSoup
O=Path("out/agent-a-hmg-media");O.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers["User-Agent"]="Mozilla/5.0 Chrome/128.0.0.0 Safari/537.36"
PAGES=[
"https://www.hyundaimotorgroup.com/en/tv/CONT0000000000163250",
"https://www.hyundaimotorgroup.com/en/tv/CONT0000000000173461",
"https://www.hyundaimotorgroup.com/en/story/CONT0000000000052957",
"https://www.hyundai.com/worldwide/en/newsroom/detail/0000000855",
"https://www.hyundai-n.com/en/brand/press/audacious-rn24-nday-2024-en",
]
reports=[]
for u in PAGES:
 try:
  r=S.get(u,timeout=35);r.raise_for_status()
  content=html.unescape(r.text).replace("\\/","/")
  srcs=re.findall(r'(?i)(?:https?://|//)[^"\'<>\s\\]{8,350}?\.(?:mp4|mov|m4v|webm|m3u8|mpd)(?:\?[^"\'<>\s\\]{0,150})?',content)
  embed=re.findall(r'(?i)(?:src|source|videoUrl|video_url|playUrl|filePath|mediaUrl|streamUrl)["\':=\s]+["\']([^"\'<>]{8,400})',content)
  scripthits=[x for x in re.findall(r'<script[^>]*src=["\']([^"\']+)',content) if any(q in x.lower() for q in ("video","player","vod","media"))]
  cues=[]
  for marker in ["m3u8","filePath","videoUrl","video_url","videoplay","mediaDownload","jwplayer","streaming","mp4","vodUrl"]:
   n=content.lower().find(marker.lower())
   if n>=0:cues.append({"marker":marker,"context":content[max(0,n-200):n+300]})
  reports.append({"page":u,"status":r.status_code,"bytes":len(content),"video_addresses":list(dict.fromkeys(srcs))[:30],"embeds":embed[:25],"script_candidates":scripthits[:25],"cues":cues})
  print("PAGE",u,"video urls",len(srcs),"embed",len(embed),"scripts",len(scripthits),flush=True)
  for m in srcs[:8]:print("MEDIA",m,flush=True)
 except Exception as e:reports.append({"page":u,"error":str(e)[:300]});print("FAILED",u,str(e)[:100],flush=True)
(O/"hmg_probe.json").write_text(json.dumps(reports,indent=2))
