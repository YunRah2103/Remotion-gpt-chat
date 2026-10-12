#!/usr/bin/env python3
"""Validate new legally reusable Indy500 footage leads on a GitHub-hosted runner."""
import json,subprocess,requests,re,time,os
from pathlib import Path
out=Path("out/agent-d-newsource-probe");out.mkdir(parents=True,exist_ok=True)
log=[]
session=requests.Session()
session.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36","Referer":"https://www.dvidshub.net/"})
URLs=[
 ("dvids_2026_1080","https://www.dvidshub.net/download/videofile/10230584"),
 ("dvids_2026_4k","https://www.dvidshub.net/download/videofile/10230582"),
 ("dvids_2025_1080","https://www.dvidshub.net/download/videofile/9706412"),
]
for name,url in URLs:
    t=time.time()
    try:
        r=session.get(url,headers={"Range":"bytes=0-2047"},stream=True,timeout=(10,15),allow_redirects=True)
        n=next(r.iter_content(2048),b"")
        entry=dict(label=name,url=url,status=r.status_code,content_type=r.headers.get("content-type"),content_range=r.headers.get("Content-Range"),content_length=r.headers.get("Content-Length"),final_url=r.url,first_bytes_hex=n[:24].hex(),elapsed=round(time.time()-t,2))
        if r.status_code in (200,206) and ("video" in str(entry["content_type"]) or b"ftyp" in n[:64]):
            entry["AVAILABLE"]="VALID_VIDEO_HEADER"
        elif r.status_code in (200,206): entry["AVAILABLE"]="MAYBE_NONVIDEO"
        else: entry["AVAILABLE"]="BLOCKED_OR_UNAVAILABLE"
        log.append(entry)
    except Exception as e:log.append(dict(label=name,error=str(e)[:420]))
for name,url in [
 ("dvids2026_yt","https://www.dvidshub.net/video/1008379/us-armed-forces-participate-indy-500-2026-b-roll-package"),
 ("dvids2025_yt","https://www.dvidshub.net/video/964265/indianapolis-500-b-roll-reel-pt-1"),
 ("vimeo2025","https://vimeo.com/1083607835"),
 ("vimeoVertical","https://vimeo.com/416997619"),
 ("youtube_palou","https://www.youtube.com/watch?v=phfrSlGyBBE"),
]:
    try:
        p=subprocess.run(["yt-dlp","--dump-single-json","--skip-download","--no-playlist","--socket-timeout","8","--retries","0","--ignore-errors",url],capture_output=True,text=True,timeout=45)
        if p.returncode==0 and p.stdout.strip():
            info=json.loads(p.stdout);fm=info.get("formats",[])
            v=sorted(({"height":f.get("height"),"width":f.get("width"),"ext":f.get("ext"),"format_id":f.get("format_id"),"protocol":f.get("protocol")} for f in fm if f.get("vcodec")!="none"),key=lambda f:f["height"] or 0,reverse=True)
            log.append({"label":name,"extractor":info.get("extractor"),"title":info.get("title"),"format_count":len(fm),"top_video_formats":v[:5],"has_download_url":bool(info.get("url"))})
        else:log.append({"label":name,"error":p.stderr[-600:] or p.stdout[-350:]})
    except Exception as e:log.append({"label":name,"error":str(e)[:450]})
p=out/"PROBE.json";p.write_text(json.dumps(log,indent=2))
for x in log:print(json.dumps(x)[:1600],flush=True)
