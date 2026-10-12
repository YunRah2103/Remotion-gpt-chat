#!/usr/bin/env python3
"""Network and source-level validation. Does not publish third-party media."""
import html.parser, urllib.request, urllib.parse, json, subprocess, tempfile, os, hashlib
URL="https://audi-mediacenter.pl/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html"
class Links(html.parser.HTMLParser):
 def __init__(self): super().__init__(); self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=="a":
   d=dict(attrs);self.links.append((d.get("href",""),d.get("download","")))
req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0 (YUNEX source verification)"})
try:
 with urllib.request.urlopen(req,timeout=25) as r:
  content=r.read(4000000).decode("utf-8","replace")
 print("page reachable",len(content))
except Exception as e:
 print("PAGE_ERROR",str(e));raise SystemExit(1)
p=Links();p.feed(content)
links=[urllib.parse.urljoin(URL,h) for h,_ in p.links if h and any(x in (h+" "+_).lower() for x in (".mp4","download","pobierz","file"))]
print("candidate_links", json.dumps(links[:12]))
# Publisher explicitly limits footage to journalism; HEAD metadata ONLY; no third-party bytes uploaded.
for url in links[:6]:
 try:
  req=urllib.request.Request(url,method="HEAD",headers={"User-Agent":"Mozilla/5.0"})
  with urllib.request.urlopen(req,timeout=20) as r:
   print("HEAD",r.status,r.headers.get("Content-Type"),r.headers.get("Content-Length"),r.geturl().split("?")[0])
 except Exception as e:print("HEAD_ERROR",str(e)[:250])
if not links:
 print("No direct anchor parsed; inspect page's javascript download handler manually.")
