#!/usr/bin/env python3
"""Find official Alpine press original-HD asset download endpoints from PUBLIC HTML/config."""
import urllib.request,re,html,json,pathlib
O=pathlib.Path("out/fr-classics-alpine-press");O.mkdir(parents=True,exist_ok=True)
sites=[
 "https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/?lang=deu",
 "https://presse.alpinecars.de/video-alpine-a110-rallye-wm-erfolg-1973/?lang=deu"
]
report=[]
for url in sites:
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=35) as r:s=r.read().decode("utf-8","replace")
  un=html.unescape(s)
  patterns=["Rallye Monte Carlo Historique 2013", "Vicoire De Alpine","1080p 25fps", "jpg", "video", "medias", "download", "wp-json","press"]
  snippets={}
  for p in patterns[:3]:
   match=list(re.finditer(re.escape(p),un,re.I))
   snippets[p]=[un[max(0,m.start()-850):m.end()+850] for m in match[:5]]
  js=[x for x in re.findall(r'<script[^>]+src=["\x27]([^"\x27]+)',un) if "google" not in x][:80]
  links=re.findall(r'(?:https?:)?//[^\s"\x27<>]+',un)
  relevant=[x[:350] for x in links if any(n in x.lower() for n in ["api","asset","mp4","media","storage","download","cdn"])][:120]
  data={"url":url,"html_bytes":len(s),"snippets":snippets,"javascript_sources":js,
        "candidate_urls":list(dict.fromkeys(relevant))}
  report.append(data);print("PAGE",url,"js",len(js),"urls",len(relevant),flush=True)
  for k,v in snippets.items():
   for item in v[:3]:print("SNI",k,re.sub(r'\s+',' ',item)[:600],flush=True)
  for x in js[:30]:print("SCRIPT",x,flush=True)
  for x in relevant[:35]:print("LINK",x,flush=True)
 except Exception as e:print("ERROR",str(e),flush=True);report.append({"url":url,"error":str(e)})
(O/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
