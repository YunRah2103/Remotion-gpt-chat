#!/usr/bin/env python3
"""Download and rigorously probe the original Audi Sport 2018 N24 embedded film.

No manufacture/GT3/shot PASS is inferred from uploader metadata or source format.
"""
import hashlib, json, subprocess, sys
from pathlib import Path

ROOT = Path("out/gt3-vimeo-actual")
MEDIA = ROOT/"native_hd_sources"
SHEETS = ROOT/"review_sheets"
MEDIA.mkdir(parents=True, exist_ok=True)
SHEETS.mkdir(parents=True, exist_ok=True)
URL = "https://player.vimeo.com/video/277958760?app_id=122963"
PUBLISHER = "https://timescopefilms.com/work/audisport/"
ID = "audi_sport_timescope_2018_n24"
report = dict(id=ID, url=URL, publisher=PUBLISHER, publisher_claim="Audi Sport, 24H Nuerburgring 2018, Rene Rast", status="NOT_ACQUIRED", verified_manufacturers=[], verified_distinct_gt3_shots=0, gate="BLOCKED_PENDING_VISUAL_QA")

def call(args,timeout=220):
    try:
        return subprocess.run(args,capture_output=True,text=True,timeout=timeout)
    except subprocess.TimeoutExpired:
        return subprocess.CompletedProcess(args,124,"","timed out")

def sha(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda:f.read(4*1024*1024),b""): h.update(b)
    return h.hexdigest()

metadata=call([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","-J","--socket-timeout","15","--retries","1",URL],80)
formats=[]
if metadata.returncode==0:
    try:
        jd=json.loads(metadata.stdout)
        formats=[{k:f.get(k) for k in ("format_id","width","height","ext","protocol")}
                 for f in jd.get("formats",[]) if (f.get("height") or 0)>=1080]
        report.update(title=jd.get("title"), duration_claimed=jd.get("duration"), formats_1080plus=formats)
    except Exception as e:
        report["format_parse_error"]=repr(e)
else:
    report["metadata_error"]=metadata.stderr[-1100:]

errors=[]
if formats:
    for quality in ("http-1080p","hls-fastly_skyfire-4833","bestvideo[height>=1080]/best[height>=1080]"):
        output=str(MEDIA/(ID+".%(ext)s"))
        dl=call([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-progress","--no-warnings",
                 "--socket-timeout","20","--retries","1","-f",quality,"-o",output,URL],230)
        files=[p for p in MEDIA.glob(ID+".*") if p.stat().st_size>100000]
        if dl.returncode!=0 or not files:
            errors.append(dict(format=quality,error=dl.stderr[-650:]))
            continue
        file=max(files,key=lambda p:p.stat().st_size)
        probe=call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(file)],35)
        if probe.returncode:
            errors.append(dict(format=quality,error="ffprobe: "+probe.stderr[-400:]));file.unlink();continue
        j=json.loads(probe.stdout)
        stream=next((s for s in j["streams"] if s["codec_type"]=="video"),{})
        w,h=int(stream.get("width",0)),int(stream.get("height",0))
        if w<1920 or h<1080:
            errors.append(dict(format=quality,error=f"sub-HD source {w}x{h}"));file.unlink();continue
        decode=call(["ffmpeg","-v","error","-i",str(file),"-f","null","-"],180)
        if decode.returncode:
            errors.append(dict(format=quality,error="full decode failed: "+decode.stderr[-300:]));file.unlink();continue
        from PIL import Image,ImageDraw
        duration=float(j["format"].get("duration") or 0)
        times=[round(duration*(i+0.5)/12,2) for i in range(12)]
        sheet=Image.new("RGB",(480*3,292*4),(10,10,12))
        draw=ImageDraw.Draw(sheet)
        for i,t in enumerate(times):
            tmp=SHEETS/(f"{ID}_{i:02d}.jpg")
            x,y=(i%3)*480,(i//3)*292
            f=call(["ffmpeg","-v","error","-y","-ss",str(t),"-i",str(file),
                    "-frames:v","1","-vf","scale=480:270",str(tmp)],35)
            if f.returncode==0 and tmp.exists():
                with Image.open(tmp) as im:sheet.paste(im.convert("RGB"),(x,y+19))
                tmp.unlink()
            draw.text((x+6,y+2),f"t={t:.2f}s",fill="white")
        sheetfile=SHEETS/(ID+"_12FRAME.jpg")
        sheet.save(sheetfile,quality=90)
        report.update(status="NATIVE_HD_ACQUIRED_VISUAL_QA_PENDING",quality_used=quality,
                      native_width=w,native_height=h,source_fps=stream.get("avg_frame_rate"),
                      bytes=file.stat().st_size,sha256=sha(file),duration_seconds=duration,
                      media_file=str(file.relative_to(ROOT)),contact_sheet=str(sheetfile.relative_to(ROOT)),
                      sampled_times=times,ffprobe=j)
        break
report["attempt_errors"]=errors
if not formats:
    report["rejection_reason"]="1080p rendition not accessible from current runner; no qualifying media"
(ROOT/"manifest.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
(ROOT/"README.md").write_text("# Audi Sport 2018 Nürburgring source inspection\n\nSource: "+URL+
"\nPublisher: "+PUBLISHER+"\nAny actual original media is in native_hd_sources, frames in review_sheets.\n"+
"Maker, exact model, race action, camera uniqueness and track must be independently visually verified. Gate remains BLOCKED pending verification.\n")
print(json.dumps({k:v for k,v in report.items() if k not in ("ffprobe","formats_1080plus")},indent=2,ensure_ascii=False),flush=True)
