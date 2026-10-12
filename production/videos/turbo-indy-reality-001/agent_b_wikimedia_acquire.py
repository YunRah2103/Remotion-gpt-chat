#!/usr/bin/env python3
"""YUNEX Agent B: real IndyCar cinematic source acquisition and checked artifact preparation."""
import hashlib, json, os, re, subprocess, sys, time, urllib.parse, zipfile
from pathlib import Path
import base64
import requests
from PIL import Image, ImageChops, ImageStat, ImageDraw, ImageOps

OUT=Path("out/turbo-indy-agent-b"); SRC=OUT/"sources"; CLIPS=OUT/"clips"; SHEETS=OUT/"contact_sheets"
for p in (SRC,CLIPS,SHEETS): p.mkdir(parents=True,exist_ok=True)
session=requests.Session(); session.headers.update({"User-Agent":"YUNEX-IndyCar-Research/1.0 (GitHub Actions footage quality review; contact via GitHub issue 37)"})
SOURCES=[
 ("indy25_start","Indy5002025start.webm","2025 Indy 500 real race start / Andretti incident","TRUE RACE START — editorial licensing HOLD (license review pending)",3.5),
 ("indy25_parade","2025Indy500parade.webm","2025 Indy 500 procession / parade","Only for possible real car perspective; no race speed",1.0),
 ("indy24_01_fallback","2024 Indianapolis 500 - Sarah Stierch 01.webm","2024 Indy 500 genuine pace lap","DUPLICATE OF AGENT D — use only for A/B motion comparison, not separate footage",5.0),
]

OFFICIAL=[]
LOG=[];MANIFEST=[]
def run(args,timeout=65):
    return subprocess.run(args,capture_output=True,text=True,timeout=timeout)
def probe(f):
    p=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)])
    if p.returncode: raise RuntimeError("ffprobe failed: "+p.stderr[-500:])
    d=json.loads(p.stdout);v=next((x for x in d["streams"] if x["codec_type"]=="video"),None)
    if not v: raise RuntimeError("No video stream")
    return {"width":v.get("width"),"height":v.get("height"),"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),
            "duration_s":float(d["format"].get("duration",0)),"filesize":f.stat().st_size}
def md5_link(name):
    normalized=name.replace(" ","_");h=hashlib.md5(normalized.encode()).hexdigest()
    return "https://upload.wikimedia.org/wikipedia/commons/"+h[0]+"/"+h[:2]+"/"+urllib.parse.quote(normalized)
def wiki_metadata(name):
    try:
        a=session.get("https://commons.wikimedia.org/w/api.php",params={"action":"query","prop":"imageinfo","iiprop":"extmetadata|url","titles":"File:"+name,"format":"json"},timeout=15)
        a.raise_for_status()
        pages=a.json()["query"]["pages"];item=next(iter(pages.values()))["imageinfo"][0]
        meta=item.get("extmetadata",{})
        return {"url":item.get("url"),"license":re.sub("<[^>]+>","",meta.get("LicenseShortName",{}).get("value","not stated")),
                "artist":re.sub("<[^>]+>","",meta.get("Artist",{}).get("value","unknown"))[:250]}
    except Exception as e:
        LOG.append({"wiki_metadata":name,"error":str(e)[:200]})
        return {"url":md5_link(name),"license":"see Wikimedia Commons individual file page","artist":"Sarah Stierch / Missvain"}
def download(url,target):
    with session.get(url,stream=True,timeout=(15,38),allow_redirects=True) as r:
        r.raise_for_status()
        typ=r.headers.get("content-type","")
        if "text/html" in typ: raise ValueError("HTML, not video: "+str(r.url))
        n=0
        with open(target,"wb") as f:
            for c in r.iter_content(1024*1024):
                if c:f.write(c); n+=len(c)
                if n>160*1024*1024:raise RuntimeError("source exceeds bounded 160 MB")
    if n<100000:raise ValueError("Suspiciously small source")
    return r.url
def frame(src,t,dest):
    cmd=["ffmpeg","-hide_banner","-nostdin","-y","-loglevel","error","-ss",str(t),"-i",str(src),"-frames:v","1","-vf","scale=720:-2",str(dest)]
    p=run(cmd,timeout=25)
    if p.returncode or not dest.exists(): raise RuntimeError("Frame decoding failed: "+p.stderr[-250:])
def process(identity,local,url,label,rights,role,initial_sec=0.5):
    meta=probe(local)
    if max(meta["width"],meta["height"]) <1920 or min(meta["width"],meta["height"])<1080:
        LOG.append({"reject_low_resolution":identity,"meta":meta});return
    if meta["duration_s"]<1.5:LOG.append({"reject_short":identity,"meta":meta});return
    start=min(initial_sec,max(0,meta["duration_s"]-2.6))
    duration=min(2.5,meta["duration_s"]-start)
    dest=CLIPS/(identity+".mp4")
    # 4K originals are explicitly downsampled to 1080p deliverable. Never upscale source.
    p=run(["ffmpeg","-hide_banner","-nostdin","-y","-loglevel","error","-ss",str(start),"-i",str(local),
           "-t",str(duration),"-map","0:v:0","-an","-vf","scale='min(iw,1920)':'min(ih,1920)':force_original_aspect_ratio=decrease:force_divisible_by=2",
           "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p","-movflags","+faststart",str(dest)],timeout=100)
    if p.returncode: raise RuntimeError("ffmpeg transcode failed "+p.stderr[-500:])
    delivered=probe(dest)
    if min(delivered["width"],delivered["height"])<1000 and delivered["width"]>delivered["height"]:
        LOG.append({"reject_delivery_resolution":identity,"meta":delivered});dest.unlink();return
    shots=[]
    for idx,t in enumerate([0.25,min(1.1,duration-0.2),max(0.5,duration-0.3)]):
        destframe=SHEETS/(identity+f"_{idx}.jpg")
        frame(dest,t,destframe); shots.append(Image.open(destframe).convert("RGB"))
    diffs=[]
    for i in range(len(shots)-1):
        diff=ImageStat.Stat(ImageChops.difference(shots[i],shots[i+1])).mean
        diffs.append(round(sum(diff)/3,2))
    contact=Image.new("RGB",(720,3*440),(16,16,16))
    d=ImageDraw.Draw(contact)
    for i,im in enumerate(shots):
        im.thumbnail((720,400))
        contact.paste(im,(0,i*440+32))
        d.text((12,i*440+5),f"{identity} frame {i+1}",fill="white")
    cp=SHEETS/(identity+"_contact.jpg");contact.save(cp,quality=86)
    preview=contact.copy();preview.thumbnail((440,810))
    tiny=SHEETS/(identity+"_small.jpg");preview.save(tiny,quality=68)
    print("CONTACT_B64_"+identity+"="+base64.b64encode(tiny.read_bytes()).decode(),flush=True)
    for f in SHEETS.glob(identity+"_[0-9].jpg"):f.unlink()
    digest=hashlib.sha256(dest.read_bytes()).hexdigest()
    MANIFEST.append({"clip":str(dest.relative_to(OUT)),"contact_sheet":str(cp.relative_to(OUT)),
       "source_url":url,"source_title":label,"visual_role":role,"rights":rights,
       "original_source":meta,"delivered_video":delivered,
       "cut_source_start_s":start,"cut_duration_s":duration,"pixel_change_mean":diffs,
       "sha256":digest,"editorial_status":"PROVISIONAL: contact sheet visual review required; no claim of artistic approval"})
    LOG.append({"accepted_ffprobe":identity,"source_px":f'{meta["width"]}x{meta["height"]}',"clip_px":f'{delivered["width"]}x{delivered["height"]}',"motion_luma_deltas":diffs})
def main():
    for ident,name,desc,role,offset in SOURCES:
        url=md5_link(name);file=SRC/(ident+".webm")
        try:
            info=wiki_metadata(name);actual=info.get("url") or url
            try:final_url=download(actual,file)
            except Exception as e:
                LOG.append({"primary_failed":ident,"error":str(e)[:240]})
                final_url=download(url,file)
            rights=info.get("license","Unknown")+"; attribution/terms on "+"https://commons.wikimedia.org/wiki/File:"+name.replace(" ","_")
            process(ident,file,final_url,desc,rights,role,initial_sec=offset)
            if ident=="indy25_start":
                process(ident+"_middle",file,final_url,desc,rights,role,initial_sec=10.5)
        except Exception as e:LOG.append({"failed":ident,"url":url,"error":str(e)[:500]})
        finally:
            if file.exists():file.unlink()
    for ident,url,desc,rights in OFFICIAL:
        # Official media is rights-reserved, retrieval is an exploratory technical test,
        # not a statement of redistribution permission. Restrict to short extracts.
        try:
            tmpl=str(SRC/(ident+".%(ext)s"))
            p=run(["yt-dlp","--no-playlist","--socket-timeout","10","--retries","1","--fragment-retries","1",
                 "--download-sections","*0-6","--format","bestvideo[height>=1080]+bestaudio/best[height>=1080]",
                 "--merge-output-format","mp4","-o",tmpl,url],timeout=75)
            media=list(SRC.glob(ident+".*"))
            if p.returncode or not media:raise RuntimeError("Official capture blocked: "+p.stderr[-350:])
            process(ident,media[0],url,desc,rights,"onboard / genuine pit")
        except Exception as e:LOG.append({"official_blocked":ident,"url":url,"error":str(e)[:450]})
        finally:
            for f in SRC.glob(ident+".*"):f.unlink()
    (OUT/"manifest.json").write_text(json.dumps(MANIFEST,indent=2))
    (OUT/"acquisition_log.json").write_text(json.dumps(LOG,indent=2))
    with open(OUT/"SHA256SUMS.txt","w") as f:
        for x in MANIFEST:f.write(x["sha256"]+"  "+x["clip"]+"\n")
    report="# Agent D: independent IndyCar cinematic footage QA\n\n"
    report+=f"Accepted mechanically verifiable video snippets: **{len(MANIFEST)}**. Human contact-sheet review is still required.\n\n"
    report+="No repeat of race-pack television footage is intentionally included. Files are real camera-recorded footage and must be screened for visual suitability. Some context clips have no cars. The 2025 race start is license-review pending and must NOT be treated as cleared for publication. Sources may require attribution, and official IndyCar media is *not* cleared for commercial reuse.\n\n"
    report+="| Clip | Role | Original resolution | Delivered | Motion deltas |\n|---|---|---|---|---|\n"
    for x in MANIFEST:
        a=x["original_source"];b=x["delivered_video"]
        report+=f'| {x["clip"]} | {x["visual_role"]} | {a["width"]}x{a["height"]} | {b["width"]}x{b["height"]} | {x["pixel_change_mean"]} |\n'
    (OUT/"QA_REPORT.md").write_text(report)
    archive=Path("out/YUNEX_TURBO_INDY_AGENT_B_CINEMATIC.zip")
    with zipfile.ZipFile(archive,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=2) as z:
        for p in OUT.rglob("*"):
            if p.is_file():z.write(p,p.relative_to(OUT))
    print(report)
    print("ARTIFACT_PATH:",archive,"BYTES:",archive.stat().st_size)
    print("SUMMARY_MANIFEST_COUNT:",len(MANIFEST))
    for e in LOG:
        if "failed" in e or "blocked" in str(e):print("FAILURE:",str(e)[:280])
    if not MANIFEST:sys.exit("No real playable files acquired; artifact diagnostics only")
if __name__=="__main__":main()
