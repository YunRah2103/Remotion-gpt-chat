#!/usr/bin/env python3
"""Alternate unauthenticated media discovery for Agent B.
Temporary acquisition for QA only; rights/visual approval required before artifact upload.
"""
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote
import requests

def log(*args):
    print(*args, flush=True)

def extract_candidates(url):
    candidates=[]
    ua={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36"}
    if "vimeo.com/" in url:
        vid=url.rstrip("/").split("/")[-1]
        for endpoint in [f"https://player.vimeo.com/video/{vid}/config",f"https://player.vimeo.com/video/{vid}"]:
            try:
                r=requests.get(endpoint,headers=ua,timeout=16)
                log("VIMEO_ENDPOINT",r.status_code,r.url,r.headers.get('content-type'),len(r.content))
                if r.ok and "application/json" in r.headers.get("content-type",""):
                    j=r.json()
                    for obj in j.get("request",{}).get("files",{}).get("progressive",[]):
                        if obj.get("url"): candidates.append((int(obj.get("height") or 0),obj["url"]))
                if r.ok and not candidates:
                    for s in re.findall(r'https?[^"\s<>]{1,450}?(?:\\u002F|/)[^"\s<>]{1,500}?\\.mp4[^"\s<>]*',r.text):
                        candidates.append((0,unquote(s.replace("\\u002F","/"))))
            except Exception as e: log("VIMEO_EXCEPTION",repr(e))
    elif "pixabay.com" in url:
        for endpoint in [url,"https://pixabay.com/videos/audi-rs6-audi-exhaust-sound-126186/"]:
            try:
                r=requests.get(endpoint,headers=ua,timeout=16)
                log("PIXABAY_ENDPOINT",r.status_code,r.url,r.headers.get('content-type'),len(r.content))
                # Parse only explicitly linked mp4 sources from the video page.
                for s in re.findall(r'https?[^"\s<>]{10,600}?\\.mp4(?:\\?[^"\s<>]*)?',r.text,re.I):
                    candidates.append((0,s.replace("&amp;","&").replace("\\u002F","/")))
            except Exception as e: log("PIXABAY_EXCEPTION",repr(e))
    seen=set()
    for h,url in sorted(candidates,key=lambda z:z[0],reverse=True):
        if url not in seen and url.startswith("https://"):
            seen.add(url)
            yield h,url

def run(name,source,destination):
    Path(destination).parent.mkdir(parents=True,exist_ok=True)
    for i,(height,media_url) in enumerate(extract_candidates(source),1):
        log("CANDIDATE",name,i,"declared_height",height,"host",media_url.split("/")[2])
        try:
            cmd=["ffmpeg","-hide_banner","-nostdin","-y","-loglevel","error","-ss","0","-i",media_url,"-t","8","-map","0:v:0","-map","0:a:0?","-c:v","libx264","-crf","18","-preset","veryfast","-c:a","aac","-movflags","+faststart",destination]
            result=subprocess.run(cmd,text=True,capture_output=True,timeout=85)
            log("FFMPEG_PULL",name,i,result.returncode,result.stderr[-700:])
            if result.returncode==0 and Path(destination).stat().st_size>10000:
                log("DOWNLOADED_BYTES",Path(destination).stat().st_size)
                return True
        except Exception as e:
            log("PULL_EXCEPTION",repr(e))
    return False

if __name__=="__main__":
    if len(sys.argv)!=4:
        sys.exit("usage: fallback.py label source_url output_file")
    sys.exit(0 if run(*sys.argv[1:]) else 1)
