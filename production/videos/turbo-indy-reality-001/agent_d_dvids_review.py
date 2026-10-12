#!/usr/bin/env python3
"""Non-gated public-domain DVIDS stream visual inventory. No unapproved footage in git."""
import os,json,hashlib,subprocess,time,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat
OUT=Path("out/indy-d-dvids-review");SRC=OUT/"working_sources";SRC.mkdir(parents=True,exist_ok=True)
URLS=[
("dvids2026_race","https://www.dvidshub.net/video/1008379/us-armed-forces-participate-indy-500-2026-b-roll-package"),
("dvids2025_broll1","https://www.dvidshub.net/video/964265/indianapolis-500-b-roll-reel-pt-1"),
("dvids2025_broll2","https://www.dvidshub.net/video/964267/indianapolis-500-b-roll-pt-2"),
]
def call(cmd,timeout):
    return subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
log=[]
for key,url in URLS:
    entry={"key":key,"source":url,"reuse":"DVIDS publicly marked public domain; check https://www.dvidshub.net/about/copyright and third-party elements"}
    try:
        tmpl=str(SRC/(key+".%(ext)s"))
        p=call(["yt-dlp","--no-playlist","--socket-timeout","20","--retries","1","--fragment-retries","2","-f","best",
                "-o",tmpl,url],400)
        if p.returncode:raise RuntimeError("download failed: "+p.stderr[-700:])
        files=list(SRC.glob(key+".*"))
        if not files:raise RuntimeError("download emitted no real file")
        file=max(files,key=lambda x:x.stat().st_size)
        v=call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(file)],25)
        if v.returncode:raise RuntimeError("ffprobe: "+v.stderr[-250:])
        js=json.loads(v.stdout)
        stream=next((x for x in js["streams"] if x["codec_type"]=="video"),{})
        dura=float(js["format"].get("duration",0))
        entry.update({"width":stream.get("width"),"height":stream.get("height"),"codec":stream.get("codec_name"),"fps":stream.get("avg_frame_rate"),"duration":dura,"bytes":file.stat().st_size,"sha256_original":hashlib.sha256(file.read_bytes()).hexdigest()})
        if dura<15:raise RuntimeError("Too short")
        frames=[]
        count=32
        for i in range(count):
            t=2+(dura-4)*i/(count-1)
            out=OUT/(key+f"_{i:02d}.jpg")
            p=call(["ffmpeg","-hide_banner","-nostdin","-y","-loglevel","error","-ss",f"{t:.3f}","-i",str(file),"-frames:v","1","-vf","scale=420:-2",str(out)],30)
            if p.returncode==0 and out.exists():
                im=Image.open(out).convert("RGB")
                frames.append((i,t,im.copy()));out.unlink()
        sheet=Image.new("RGB",(420*8,262*4),(9,9,9));d=ImageDraw.Draw(sheet)
        for k,(i,t,im) in enumerate(frames):
            x=k%8*420; y=k//8*262
            im.thumbnail((420,234))
            sheet.paste(im,(x,y+27))
            d.text((x+7,y+4),f"{key} - {t:05.1f}s",fill=(255,255,255))
        path=OUT/(key+"_32frame_contact.jpg");sheet.save(path,quality=82)
        entry["contact_sheet"]=str(path)
        entry["all_sample_frames_decoded"]=len(frames)
        entry["status"]="SOURCE_DOWNLOADED_AND_DECODED_VISUAL_REVIEW_NEEDED"
        print("SUCCESS",json.dumps(entry),flush=True)
    except Exception as e:
        entry.update({"status":"BLOCKED","error":str(e)[:800]});print("FAILURE",json.dumps(entry),flush=True)
    finally:
        for f in SRC.glob(key+".*"):f.unlink()
    log.append(entry)
(OUT/"inspection.json").write_text(json.dumps(log,indent=2))
# For this stage preserve only frame-contact sheets and source facts.
print("SHEET_INVENTORY:",json.dumps([x.get("contact_sheet") for x in log]),flush=True)
if not any(x.get("status","").startswith("SOURCE_") for x in log): sys.exit(2)
