#!/usr/bin/env python3
"""Bounded Agent A MP4 acquisition and video QA. Never publish uncleared media."""
import hashlib, json, os, pathlib, subprocess, time, urllib.request
from urllib.parse import urlparse

ROOT=pathlib.Path("/tmp/rs6-out"); ROOT.mkdir(parents=True,exist_ok=True)
URL=os.getenv("SOURCE_URL", "").strip()
CLEARED=os.getenv("RIGHTS_CONFIRMED", "").lower() == "true"
OUT={"url": URL, "rights_confirmed":CLEARED, "attempts":[], "status":"not_started"}

def run(args, seconds=45):
    return subprocess.run(args,capture_output=True,text=True,timeout=seconds,check=True).stdout

def save():
    (ROOT/"manifest.json").write_text(json.dumps(OUT,indent=2))

# Only diagnostic HEAD requests, never save media from these rights-restricted sources.
for url in [
 "https://audi-mediacenter.pl/data/filmy/48075/o/7405893_content_1280x720_play.mp4",
 "https://audi-mediacenter.pl/data/filmy/44943/o/18972_amtv-content720p-web_play.mp4",
 "https://audi-mediacenter.pl/data/filmy/44944/o/18973_amtv-content720p-web_play.mp4"
]:
    try:
        head=run(["curl","-sSIL","--max-time","12",url],17)
        OUT["attempts"].append({"host":urlparse(url).netloc,"source":url,"head_response":head[-600:],"media_saved":False})
    except Exception as e:
        OUT["attempts"].append({"source":url,"error":str(e)[:300]})
if not URL or not CLEARED:
    OUT["status"]="no_authorized_media_url" if not URL else "rights_not_confirmed"
    save()
    raise SystemExit(0)
if urlparse(URL).scheme != "https":
    OUT["status"]="invalid_url";save();raise SystemExit(2)
file=ROOT/"source.mp4"
for attempt in range(1,4):
    try:
        run(["curl","--fail","--location","--retry","2","--retry-all-errors",
             "--connect-timeout","10","--max-time","120","--max-filesize","536870912",
             "-o",str(file),URL],135)
        if file.stat().st_size<100_000: raise ValueError("source unexpectedly small")
        info=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(file)]))
        video=next(t for t in info["streams"] if t["codec_type"]=="video")
        if video["width"]<1920 or video["height"]<1080:
            raise ValueError("source not native landscape full HD: "+str((video["width"],video["height"])))
        run(["ffmpeg","-v","error","-xerror","-i",str(file),"-f","null","-"],300)
        for i,pct in enumerate((0.15,0.5,0.85)):
            duration=float(info["format"]["duration"])
            run(["ffmpeg","-y","-v","error","-ss",str(duration*pct),"-i",str(file),"-frames:v","1",str(ROOT/f"contact_{i}.jpg")])
        OUT.update(status="verified_source",sha256=hashlib.sha256(file.read_bytes()).hexdigest(),
                   bytes=file.stat().st_size, video={k:video.get(k) for k in ("codec_name","width","height","avg_frame_rate")},duration=info["format"].get("duration"))
        break
    except Exception as e:
        OUT["attempts"].append({"download_attempt":attempt,"error":str(e)[:350]})
        if file.exists(): file.unlink()
        if "not native landscape full HD" in str(e) or "invalid_url" in str(e): break
        if attempt<3:time.sleep(attempt*3)
else:
    OUT["status"]="all_attempts_failed"
save()
