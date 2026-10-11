#!/usr/bin/env python3
"""Agent A2 native real-footage acquisition and fail-closed technical QA.

NO synthetic media or source URLs passed off as delivered files. Confirm real
Ferrari/Aston/McLaren GT3 identity by independent visual inspection AFTER this
acquisition stage. Website titles aren't sufficient identity evidence.
"""
from __future__ import annotations
import hashlib, json, os, re, shutil, subprocess, sys, time, zipfile
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parent
OUT=Path("out/gt3-a2")
MEDIA=OUT/"actual_native_media"
SHEETS=OUT/"contact_sheets"
for d in (MEDIA,SHEETS): d.mkdir(parents=True, exist_ok=True)
SOURCES=json.loads((ROOT/"candidates.json").read_text())["sources"]
S=requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/127.0 Safari/537.36"})
SRC_RESULTS=[]
SEEN=set()
START=time.monotonic()
GLOBAL_SECONDS=int(os.environ.get("A2_RUNTIME_SECONDS","360"))
MAX_ASSETS=int(os.environ.get("A2_MAX_ASSETS","12"))

def sh(args,timeout=50,check=True):
    r=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    if check and r.returncode: raise RuntimeError((r.stderr or r.stdout)[-600:])
    return r.stdout.strip(),r.returncode

def hashfile(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""): h.update(block)
    return h.hexdigest()

def probe(path):
    raw,_=sh(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],timeout=30)
    p=json.loads(raw)
    v=next((x for x in p["streams"] if x["codec_type"]=="video"),None)
    if not v:raise ValueError("No video stream")
    w,h=int(v["width"]),int(v["height"])
    if not ((w>=1920 and h>=1080 and w>h) or (w>=1080 and h>=1920 and h>w)):
        raise ValueError(f"REJECT native pixels {w}x{h}, no upscaling permitted")
    dur=float(p["format"].get("duration",0))
    if dur<1.8:raise ValueError(f"Too short: {dur}")
    return p,v,dur

def contact_sheet(path,id,dur):
    out=SHEETS/(id+".jpg")
    canvas=Image.new("RGB",(1600,510),"#151515")
    draw=ImageDraw.Draw(canvas)
    times=[min(max(.15,dur-0.2),max(.2,(i+.5)*dur/8)) for i in range(8)]
    for k,t in enumerate(times):
        f=SHEETS/(f"_{id}_{k}.png")
        try:
            sh(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(path),"-frames:v","1","-vf","scale=400:225:force_original_aspect_ratio=decrease","-update","1",str(f)],timeout=25)
            with Image.open(f) as im:
                im=im.convert("RGB");im.thumbnail((400,225))
                x=(k%4)*400;y=(k//4)*255
                canvas.paste(im,(x,y+23))
                draw.text((x+8,y+5),f"{id}  t={t:.1f}s",fill="white")
        except Exception as e: print("Frame issue",id,t,str(e)[:100],flush=True)
        finally:f.unlink(missing_ok=True)
    canvas.save(out,quality=83,optimize=True)
    return str(out.relative_to(OUT)),times

def real_download(url,dest):
    if "instagram.com/" in url or "tiktok.com/" in url:
        directory=dest.parent/(dest.stem+"_exact_post")
        directory.mkdir(exist_ok=True)
        logs=[]
        attempts=[
          ["gallery-dl","--no-part","--directory",str(directory.resolve()),url],
        ]
        if "instagram.com/" in url:
            shortcode=url.rstrip("/").split("/")[-1]
            attempts.append(["instaloader","--dirname-pattern",str(directory.resolve()),
                             "--no-captions","--no-video-thumbnails",
                             "--no-metadata-json","--","-"+shortcode])
        for cmdline in attempts:
            try:
                stdout,code=sh(cmdline,timeout=48,check=False)
                logs.append(cmdline[0]+":"+str(code)+" "+stdout[-110:])
                videos=[p for p in directory.rglob("*") if p.is_file() and
                        p.suffix.lower() in (".mp4",".mkv",".webm",".mov") and
                        p.stat().st_size>100*1024]
                if videos:
                    return "exact-post-"+cmdline[0],max(videos,key=lambda p:p.stat().st_size)
            except Exception as e:logs.append(cmdline[0]+":"+str(e)[:180])
        raise RuntimeError("SOCIAL_NO_REAL_VIDEO "+str(logs)[-280:])
    if re.search(r"\.(mp4|mov|mkv|webm)(?:\?|$)",url,re.I):
        try:
            with S.get(url,stream=True,timeout=(8,18)) as r:
                r.raise_for_status()
                mime=r.headers.get("content-type","")
                if "text/html" in mime:raise ValueError("HTML response, not video")
                length=int(r.headers.get("content-length") or 0)
                if length>150*1024*1024:raise RuntimeError("LARGE_DIRECT_USE_YTDLP")
                size=0
                with dest.open("wb") as f:
                    for part in r.iter_content(chunk_size=1024*1024):
                        if not part:continue
                        size+=len(part)
                        if size>150*1024*1024:raise RuntimeError("DIRECT_TOO_LARGE")
                        f.write(part)
            if dest.stat().st_size<100*1024:raise ValueError("Video too small")
            return "direct-original-mp4"
        except Exception as e:
            dest.unlink(missing_ok=True)
            print("direct fallback to yt-dlp",str(e)[:140],flush=True)
    # True video retrieved by yt-dlp. Download bounded sections for large sources;
    # does not imply the section contains the make described on a webpage.
    tmpl=str(dest.parent/(dest.stem+".%(ext)s"))
    args=[sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
          "--no-progress","--socket-timeout","12","--retries","1","--fragment-retries","1",
          "--concurrent-fragments","2","--merge-output-format","mkv",
          "--download-sections","*0-24",
          "-f","bestvideo[height>=1080]+bestaudio/best[height>=1080]",
          "-o",tmpl,url]
    sh(args,timeout=90)
    paths=sorted(dest.parent.glob(dest.stem+".*"),key=lambda p:p.stat().st_size,reverse=True)
    files=[p for p in paths if p.suffix.lower() in {".mkv",".mp4",".webm",".mov"} and p.stat().st_size>100*1024]
    if not files:raise RuntimeError("yt-dlp finished but no actual media file")
    return "yt-dlp-native-section",files[0]

def discover(url):
    try:
        r=S.get(url,timeout=(9,16))
        r.raise_for_status()
        soup=BeautifulSoup(r.text[:2_000_000],"html.parser")
        urls=[]
        # Strongest: actual HTML5 <video> and <source>
        for tag in soup.select("video[src],video source[src],meta[property='og:video'],meta[property='og:video:url'],meta[name='twitter:player']"):
            candidate=tag.get("src") or tag.get("content")
            if candidate:urls.append(urljoin(r.url,candidate))
        for attr in ("data-src","data-video","data-url"):
            for tag in soup.select("["+attr+"]"):
                v=tag.get(attr)
                if v and (".mp4" in v or "vimeo.com/" in v):urls.append(urljoin(r.url,v))
        for match in re.findall(r'https?:[^"''\s<>\\]{15,400}?\.(?:mp4|mov|m3u8)(?:\?[^"''\s<>\\]{0,150})?',r.text[:2_000_000],flags=re.I):
            urls.append(match.replace("\\/","/").replace("&amp;","&"))
        for iframe in soup.select("iframe[src]"):
            src=iframe.get("src","")
            if any(x in src for x in ("vimeo.com","wistia","brightcove","jwplayer","youtube.com")):
                urls.append(urljoin(r.url,src))
        # Explicit Vimeo IDs embedded as JSON
        for vid in re.findall(r'(?:player\.vimeo\.com/video/|vimeo\.com/)(\d{7,12})',r.text):
            urls.append("https://player.vimeo.com/video/"+vid)
        allurls=list(dict.fromkeys(urls))
        allowed=[x for x in allurls if ("youtube" not in x and "youtu.be" not in x)]
        return allowed[:8],{"http":r.status_code,"page_bytes":len(r.content),"candidate_embeds":len(allurls),
                          "youtube_embeds_skipped":len(allurls)-len(allowed)}
    except Exception as e:
        return [],{"discover_error":str(e)[:300]}

def check_asset(url,source,k):
    assetkey=source["id"]+"_"+str(k)
    target=MEDIA/(assetkey+".mp4")
    row={"asset_id":assetkey,"source_page":source["url"],"actual_video_url":url,
         "candidate_manufacturer":source["make"],"candidate_gt3_model":source["model"],
         "claimed_event":source["event"],"model_verified_from_frames":False,
         "nurburgring_verified_from_frames":False,"unique_camera_angle_verified":False,
         "visual_approval":"PENDING_INDEPENDENT_FRAME_REVIEW",
         "approved_edit_shots":0}
    file=target
    try:
        result=real_download(url,target)
        if isinstance(result,tuple):method,file=result
        else:method=result
        full,v,dur=probe(file)
        # Physically decode all frames. Never accept an ffprobe-only success.
        sh(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(file),"-map","0:v:0",
            "-f","null","-"],timeout=125)
        row.update(status="NATIVE_HD_DECODED_REVIEW_PENDING",method=method,
                   original_media_file=str(file.relative_to(OUT)),
                   sha256=hashfile(file),file_bytes=file.stat().st_size,
                   native_resolution=[int(v["width"]),int(v["height"])],
                   native_fps=v.get("avg_frame_rate"),duration_seconds=round(dur,3),
                   ffprobe=full,source_start_seconds=0,source_end_seconds=round(dur,3))
        row["contact_sheet"],row["contact_frame_times"]=contact_sheet(file,assetkey,dur)
        print("REAL NATIVE VIDEO:",assetkey,row["native_resolution"],row["sha256"],flush=True)
    except Exception as e:
        file.unlink(missing_ok=True)
        target.unlink(missing_ok=True)
        row.update(status="REJECTED_NOT_DELIVERABLE",error=str(e)[-470:])
        print("REJECT",assetkey,str(e)[-200:],flush=True)
    return row

for src in sorted(SOURCES,key=lambda x:x["priority"]):
    if time.monotonic()-START>GLOBAL_SECONDS:break
    if sum(r.get("status")=="NATIVE_HD_DECODED_REVIEW_PENDING" for r in SRC_RESULTS)>=MAX_ASSETS:break
    print("SCOUT",src["id"],src["make"],src["url"],flush=True)
    links,meta=discover(src["url"])
    # For publisher pages yt-dlp may find player config that static scraping misses.
    # Without URLs, try the page once, but never loop endlessly.
    if not links:links=[src["url"]]
    for k,link in enumerate(links[:3]):
        if time.monotonic()-START>GLOBAL_SECONDS:break
        if link in SEEN:continue
        SEEN.add(link)
        result=check_asset(link,src,k)
        result["discovery"]=meta
        SRC_RESULTS.append(result)
        # Single successful source per webpage; seek breadth, not repeats.
        if result["status"]=="NATIVE_HD_DECODED_REVIEW_PENDING":break

ok=[x for x in SRC_RESULTS if x.get("status")=="NATIVE_HD_DECODED_REVIEW_PENDING"]
manifest={
    "project":"YUNEX GT3 MULTI-CAR 001","agent":"A2","branch":"automotive-edits/gt3-nurburgring-multicar-001/a2-ferrari-aston-mclaren",
    "native_hd_decoded_media_count":len(ok),
    "approved_unique_gt3_racing_shots":0,
    "manufacturer_visual_approvals":[],
    "GT3_visual_gate_pass":False,
    "technical_gate_note":"Native-resolution/physical FFmpeg decoded video only. Make/model, GT3 class, Nürburgring track and distinct angles require independent human inspection of contact sheets and frames; no clip is automatically approved.",
    "download_results":SRC_RESULTS,"elapsed_seconds":round(time.monotonic()-START,1)
}
(OUT/"SOURCE_MANIFEST_FFPROBE.json").write_text(json.dumps(manifest,indent=2))
(OUT/"README.md").write_text("# Agent A2 physical native-video delivery\n\n"
    f"Actual native >=1080p videos with full FFmpeg decode: **{len(ok)}**. "
    "Visually approved Nürburgring GT3 shots: **0 pending frame review**.\n\n"
    "For each original see SOURCE_MANIFEST_FFPROBE.json with exact URL, pixels, "
    "FFprobe, SHA-256, media filename, timestamps and contact_sheet.\n"
    "Reject all wrong models/classes/tracks, static footage, duplicate cameras, "
    "watermarked/soft/low-res shots. No upscales and no fake make confirmations.\n")
zipfile_path=OUT/"YUNEX_GT3_AGENT_A2_NATIVE_FERRARI_ASTON_MCLAREN_REVIEW.zip"
with zipfile.ZipFile(zipfile_path,"w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
    for sub in ["README.md","SOURCE_MANIFEST_FFPROBE.json"]:
        z.write(OUT/sub,sub)
    for folder in (MEDIA,SHEETS):
        for p in folder.iterdir():
            if p.is_file():z.write(p,str(p.relative_to(OUT)))
print("COMPLETE",json.dumps({"native_hd":len(ok),"zip_bytes":zipfile_path.stat().st_size,
      "zip_sha256":hashfile(zipfile_path),"verified_gt3_angles":0}),flush=True)
