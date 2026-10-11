#!/usr/bin/env python3
"""Unauthenticated metadata-only discovery of official Nürburgring social video posts.

Never declare media acquired based on profile listings; extracted links are leads only.
Uses normal yt-dlp site extractors, no cookies/bypass, bounded to 8 most recent posts.
"""
from pathlib import Path
import json
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parent
SOURCES=json.loads((ROOT/"alternative-source-candidates.json").read_text())
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else Path("out/gt3-multicar-agent-a")
OUT.mkdir(parents=True,exist_ok=True)
results=[]
for url in SOURCES.get("social_discovery_accounts",[]):
    cmd=[sys.executable,"-m","yt_dlp","--ignore-config","--flat-playlist","--playlist-end","8",
         "--skip-download","--no-warnings","--socket-timeout","8","--retries","1",
         "--dump-json",url]
    start=time.time()
    try:
        proc=subprocess.run(cmd,capture_output=True,text=True,timeout=55)
        posts=[]
        for row in proc.stdout.splitlines():
            try:
                item=json.loads(row)
            except ValueError:
                continue
            if not isinstance(item,dict):
                continue
            title=str(item.get("title") or item.get("description") or "")
            raw_url=item.get("webpage_url") or item.get("url") or ""
            post={"id":item.get("id"),"title":title[:200],"url":raw_url,"duration":item.get("duration"),
                  "requested_platform":url.split("/")[2],"likely_gt3":any(s in title.lower() for s in
                  ("gt3","24hnbr","24h nur","nürburgring","nurburgring","motorsport","nordschleife"))}
            posts.append(post)
        results.append({"profile":url,"status":"DISCOVERED" if posts else "NO_POSTS",
                        "metadata_posts":posts,"returncode":proc.returncode,
                        "error_tail":proc.stderr[-650:],"elapsed_seconds":round(time.time()-start,2)})
    except Exception as exc:
        results.append({"profile":url,"status":"BLOCKED","error":str(exc)})
output=OUT/"social-discovery.json"
output.write_text(json.dumps({"disclaimer":"Profile posts/metadata only. None are verified downloaded video or legitimate GT3 race clips.", "profiles":results},indent=2)+"\n")
print(json.dumps([{"profile":r["profile"],"status":r["status"],"posts":len(r.get("metadata_posts",[])),
                  "error":r.get("error_tail","")[-140:]} for r in results],indent=2))
