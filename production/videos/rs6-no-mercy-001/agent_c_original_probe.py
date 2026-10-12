#!/usr/bin/env python3
"""Find source-original media from Audi public site. Read-only, no redistribution."""
import urllib.request, urllib.parse, re, html, json, subprocess, os
base="https://audi-mediacenter.pl"
page=base+"/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html"
def read(u,cap=400000):
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=20) as r:
   return r.read(cap).decode("utf-8","replace")
 except Exception as e: print("ERROR",u,repr(e)[:240]);return ""
h=read(page)
scripts=re.findall(r'<script[^>]+src=["\']([^"\']+)',h,re.I)
print("SCRIPTS",scripts[:25])
for src in scripts[:20]:
 u=urllib.parse.urljoin(page,html.unescape(src));t=read(u,300000)
 for term in ("data-file-id","data-type","pobierz","downloadFile","fileDownload","download"):
  if term.lower() in t.lower():
   print("SCRIPT_MATCH",u,"term",term)
   for m in list(re.finditer(re.escape(term),t,re.I))[:3]:
    print("SCRIPT_FRAGMENT",t[max(0,m.start()-220):m.end()+340].replace("\n"," ")[:600])
# Probe plausible original URLs solely by HEAD; never download originals without rights approval.
paths=[
 "/data/filmy/48075/o/7405893_content_1280x720.mp4",
 "/data/filmy/48075/o/7405893_content.mp4",
 "/data/filmy/48075/o/7405893_content_1920x1080.mp4",
 "/data/filmy/48075/o/7405893_content_1920x1080_play.mp4",
]
for p in paths:
 try:
  with urllib.request.urlopen(urllib.request.Request(base+p,method="HEAD",headers={"User-Agent":"Mozilla/5.0"}),timeout=12) as r:
   print("CANDIDATE",p,r.status,r.headers.get("Content-Length"),r.headers.get("Content-Type"))
 except Exception as e: print("CANDIDATE",p,str(e)[:120])

# Temporarily inspect higher-bitrate source without uploading copyrighted media.
import tempfile,pathlib,hashlib
src=base+"/data/filmy/48075/o/7405893_content_1280x720.mp4"
try:
 with tempfile.TemporaryDirectory() as td:
  dest=pathlib.Path(td)/"higher_resolution_candidate.mp4"
  with urllib.request.urlopen(urllib.request.Request(src,headers={"User-Agent":"Mozilla/5.0"}),timeout=60) as response, dest.open("wb") as out:
   total=0
   while True:
    chunk=response.read(1024*1024)
    if not chunk:break
    total+=len(chunk)
    if total>165*1024*1024:raise RuntimeError("size limit exceeded")
    out.write(chunk)
  print("ORIGINAL_BYTES",total,"SHA256",hashlib.sha256(dest.read_bytes()).hexdigest(),flush=True)
  a=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration:stream=codec_name,width,height,r_frame_rate","-of","json",str(dest)],capture_output=True,text=True,timeout=30)
  print("ORIGINAL_FFPROBE",a.returncode,a.stdout[:1800],a.stderr[:200],flush=True)
  if a.returncode==0:
   b=subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(dest),"-f","null","-"],capture_output=True,text=True,timeout=130)
   print("ORIGINAL_FULL_DECODE",b.returncode,b.stderr[:350],flush=True)
except Exception as e:print("ORIGINAL_ERROR",repr(e),flush=True)
