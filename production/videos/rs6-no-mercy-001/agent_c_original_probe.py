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
