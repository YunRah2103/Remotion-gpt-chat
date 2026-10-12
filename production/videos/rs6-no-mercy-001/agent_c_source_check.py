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

# Second pass: inspect media URLs embedded in source HTML, not merely anchor hrefs.
import re, html
for marker in ("pobierz","download","mp4","video","plik","media"):
 matches=list(re.finditer(marker,content,re.I))
 print("MARKER",marker,"count",len(matches))
 for m in matches[:6]:
  frag=content[max(0,m.start()-110):min(len(content),m.end()+180)]
  frag=re.sub(r"\\s+"," ",frag)
  print("CONTEXT",frag[:280])

for match in re.findall(r'https?[^\s<>]+?\.mp4', content, re.I):
 print('POSSIBLE_MP4', match[:300])

# Verify the explicitly embedded 1280x720 playback MP4 temporarily, without public distribution.
import pathlib
preview=urllib.parse.urljoin(URL,"/data/filmy/48075/o/7405893_content_1280x720_play.mp4")
print("EMBEDDED_PREVIEW",preview)
try:
 with urllib.request.urlopen(urllib.request.Request(preview,headers={"User-Agent":"Mozilla/5.0"}),timeout=35) as response:
  print("PREVIEW_HTTP",response.status,response.headers.get("Content-Type"),response.headers.get("Content-Length"))
  with tempfile.TemporaryDirectory() as td:
   dest=pathlib.Path(td)/"rs6_official_preview.mp4"
   size=0
   with dest.open("wb") as out:
    while True:
     part=response.read(1024*1024)
     if not part:break
     size+=len(part)
     if size>90*1024*1024:raise RuntimeError("Preview exceeds 90 MiB cap")
     out.write(part)
   print("PREVIEW_BYTES",size,"SHA256",hashlib.sha256(dest.read_bytes()).hexdigest())
   probe=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration:stream=codec_name,width,height,r_frame_rate","-of","json",str(dest)],capture_output=True,text=True,timeout=30)
   print("FFPROBE",probe.returncode,probe.stdout[:1800],probe.stderr[:500])
   decode=subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(dest),"-f","null","-"],capture_output=True,text=True,timeout=120)
   print("FULL_DECODE",decode.returncode,decode.stderr[:500])
except Exception as e:
 print("PREVIEW_ERROR",repr(e))
