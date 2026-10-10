#!/usr/bin/env python3
"""Probe non-YouTube 964 Turbo Vimeo sources without asserting video availability."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

URLS = (
 ("classicsracer-promo", "https://vimeo.com/112141699"),
 ("classicsracer-film", "https://vimeo.com/112689332"),
 ("classicsracer-player-112141699","https://player.vimeo.com/video/112141699"),
 ("classicsracer-player-112689332","https://player.vimeo.com/video/112689332"),
)

def get_info(id,url):
    cmd = [sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
           "--skip-download","--dump-single-json","--socket-timeout","20",
           "--retries","1","--extractor-retries","1",url]
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=110)
        if p.returncode:
            return {"id":id,"url":url,"status":"ERROR","error":p.stderr[-1200:],"downloaded":False}
        data=json.loads(p.stdout)
        v=[]
        for f in data.get("formats",[]):
            if f.get("vcodec") in (None,"none") or not f.get("width") or not f.get("height"):continue
            v.append({"formatId":f.get("format_id"),"width":f.get("width"),"height":f.get("height"),
                      "fps":f.get("fps"),"videoCodec":f.get("vcodec"),"estimatedBytes":f.get("filesize") or f.get("filesize_approx"),
                      "bitrateKbps":f.get("tbr")})
        v.sort(key=lambda z:(int(z["height"]),int(z["width"]),float(z["bitrateKbps"] or 0)),reverse=True)
        return {"id":id,"url":url,"status":"METADATA_ACQUIRED","sourceCreator":data.get("uploader"),
                "title":data.get("title"),"duration":data.get("duration"),"sourceId":data.get("id"),
                "availableFormats":len(v),"topFormats":v[:20],"downloaded":False,
                "vehicleAndSceneIndependentlyVerified":False,"reuseRightsVerified":False}
    except Exception as exc:
        return {"id":id,"url":url,"status":"ERROR","error":str(exc)[:400],"downloaded":False}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",default="out/porsche-964-vimeo-probe.json")
    args=p.parse_args()
    results={"schemaVersion":1,"task":"source selection; real media acquisition not yet verified","sources":[get_info(id,url) for id,url in URLS]}
    o=Path(args.output);o.parent.mkdir(exist_ok=True,parents=True);o.write_text(json.dumps(results,indent=2)+"\n")
    print(json.dumps({"sources":[{"id":x["id"],"status":x["status"],"title":x.get("title"),
                                  "duration":x.get("duration"),"topFormat":x.get("topFormats",[None])[0],
                                  "error":x.get("error")} for x in results["sources"]]},indent=2))
    return 0 if any(x["status"]=="METADATA_ACQUIRED" for x in results["sources"]) else 2
if __name__=="__main__":raise SystemExit(main())
