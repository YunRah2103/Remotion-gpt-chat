#!/usr/bin/env python3
"""Acquire genuine B2 creator footage for an UNPUBLISHED owner review release.

Unlike diagnostics-only runs this creates actual playable H.264 MP4s with
ffprobe, full decode, SHA256 and contact sheets. Third-party source clips may
enter an owner-only GitHub DRAFT release, never a public release without a grant.
Additional creator clips are NOT asserted to be C8 or cinematic until reviewed.
"""
from __future__ import annotations
import hashlib
import json
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path
from yt_dlp import YoutubeDL
from yt_dlp.utils import download_range_func
from PIL import Image, ImageDraw

ROOT=Path("b2_review_pack")
ROOT.mkdir(exist_ok=True)
FRAMES=ROOT/"contact"
FRAMES.mkdir(exist_ok=True)
MP4S=ROOT/"mp4"
MP4S.mkdir(exist_ok=True)
WORK=Path("b2_candidate_reports")
WORK.mkdir(exist_ok=True)
C8_SOURCES=[
    ("B2_LUAN2_REAL_STREET_PASS","https://www.tiktok.com/@luan_rs6/video/7690903160537369878","verified_existing",0),
    ("B2_FE78_ROLLING_WAGON","https://www.tiktok.com/@fe78_rs6/video/7412214954805267745","backup_unconfirmed_C8",0),
]
PRIOR_IDS={"7450110951648513302","7412214954805267745",
           "7349887931160612129","7346547136898583841"}
MOTION=re.compile(r"roll|driv|road|tunnel|nacht|night|ausfahrt|fahrt|flyby|fly.by|pass|autobahn|regen|wet|snow|through|fahr|beweg",re.I)
OFFTOPIC=re.compile(r"\bc7\b|\brs7\b|forza|assetto|game|cgi|simulator",re.I)

def cli(args,timeout=100):
    try:
        p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
        return p.returncode,p.stdout,p.stderr[-650:]
    except Exception as e:
        return 250,"",str(e)[:500]

def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for part in iter(lambda:f.read(1024*1024),b""):
            h.update(part)
    return h.hexdigest()

def yopts():
    return dict(quiet=True,no_warnings=True,socket_timeout=15,retries=1,
        extractor_retries=1,fragment_retries=1,noplaylist=True)

def discover_more():
    result={"source":"https://www.tiktok.com/@fe78_rs6","status":None,"selected":[]}
    try:
        opts=yopts();opts.update(extract_flat="in_playlist",playlistend=75)
        with YoutubeDL(opts) as dl:
            info=dl.extract_info(result["source"],download=False)
        entries=(info or {}).get("entries") or []
        matches=[]
        for ent in entries:
            if not ent: continue
            ident=str(ent.get("id") or "")
            url=ent.get("webpage_url") or ent.get("url") or ""
            if not str(url).startswith("https://www.tiktok.com/"):
                url=f"https://www.tiktok.com/@fe78_rs6/video/{ident}"
            title=ent.get("title") or ""
            if ident in PRIOR_IDS or OFFTOPIC.search(title):continue
            score=4 if MOTION.search(title) else 0
            if re.search(r"rs6|audi|avant|c8",title,re.I):score+=2
            if score>=4 and ident:
                matches.append({"id":ident,"title":title[:220],
                                "url":url,"score":score})
        matches.sort(key=lambda x:(-x["score"],x["id"]),reverse=False)
        result.update(status="DISCOVERY_OK",posts_seen=len(entries),selected=matches[:7])
    except Exception as e:
        result.update(status="DISCOVERY_FAILED",error=str(e)[-300:])
    return result

def acquire(label,url,classification,start=0):
    row={"id":label,"url":url,"classification":classification,
         "rights":"NOT CLEARED FOR PUBLIC REDISTRIBUTION",
         "editor_approved":False,"c8_visual_review_required":True,
         "status":"UNTESTED"}
    with tempfile.TemporaryDirectory(prefix="b2-draft-") as temp:
        td=Path(temp)
        try:
            opts=yopts()
            opts.update(skip_download=False,format="bv*+ba/b",
                merge_output_format="mp4",
                outtmpl=str(td/"original.%(ext)s"),
                download_ranges=download_range_func(None,[(start,start+6)]),
                force_keyframes_at_cuts=True)
            with YoutubeDL(opts) as dl:
                data=dl.extract_info(url,download=True)
            if data:
                row["title"]=(data.get("title") or "")[:180]
                row["uploader"]=data.get("uploader")
                row["source_license"]=data.get("license")
                row["source_length"]=data.get("duration")
            files=sorted([f for f in td.iterdir() if f.suffix.lower() in (".mp4",".webm",".mkv")],
                         key=lambda f:f.stat().st_size,reverse=True)
            if not files:
                row["status"]="NO_ORIGINAL_MP4";return row
            origin=files[0]
            row["original_sha256"]=sha256(origin)
            row["original_sample_bytes"]=origin.stat().st_size
            rc,out,err=cli(["ffprobe","-v","error","-show_entries",
                "stream=codec_type,width,height,avg_frame_rate:format=duration,size",
                "-of","json",str(origin)],timeout=20)
            source_probe=json.loads(out) if rc==0 else {}
            row["source_ffprobe"]=source_probe
            vs=next((x for x in source_probe.get("streams",[]) if x.get("codec_type")=="video"),{})
            short_side=min(int(vs.get("width") or 0),int(vs.get("height") or 0))
            long_side=max(int(vs.get("width") or 0),int(vs.get("height") or 0))
            if short_side<1080 or long_side<1920:
                row["status"]="REJECT_NATIVE_LOW_RES";return row
            path=MP4S/(label+".mp4")
            rc,out,err=cli(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                "-y","-i",str(origin),"-t","4","-an",
                "-vf","fps=30,scale=1080:1920:force_original_aspect_ratio=increase,"
                       "crop=1080:1920,format=yuv420p",
                "-c:v","libx264","-preset","veryfast","-crf","19",
                "-movflags","+faststart",str(path)],timeout=125)
            if rc or not path.exists() or path.stat().st_size<100000:
                row.update(status="TRANSCODE_FAILED",error=err);return row
            rc,_,err=cli(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                "-xerror","-i",str(path),"-f","null","-"],timeout=55)
            if rc:
                row.update(status="DECODE_FAILED",error=err)
                path.unlink(missing_ok=True);return row
            rc,out,err=cli(["ffprobe","-v","error","-show_entries",
                "stream=codec_type,codec_name,width,height,avg_frame_rate:"
                "format=duration,size","-of","json",str(path)],timeout=20)
            row["final_probe"]=json.loads(out) if rc==0 else {}
            row["output_sha256"]=sha256(path)
            row["output_bytes"]=path.stat().st_size
            row["full_decode_pass"]=True
            stills=td/"stills"
            stills.mkdir()
            rc,_,err=cli(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                "-y","-i",str(path),"-vf","fps=1,scale=270:-2",
                "-frames:v","4",str(stills/"f_%02d.jpg")],timeout=30)
            images=[Image.open(p).convert("RGB") for p in sorted(stills.glob("*.jpg"))]
            if images:
                h=images[0].height
                sheet=Image.new("RGB",(270*len(images),h+35),"#13171a")
                draw=ImageDraw.Draw(sheet)
                for n,image in enumerate(images):
                    sheet.paste(image,(270*n,35))
                    draw.text((270*n+5,8),f"{label} +{n}s",fill="white")
                sheet.save(FRAMES/(label+".jpg"),quality=88)
            row["status"]="PLAYABLE_REVIEW_MP4_ACQUIRED"
            print("REAL_MP4",label,row["output_bytes"],row["output_sha256"],flush=True)
        except Exception as e:
            row.update(status="ERROR",error=str(e)[-500:])
        return row

def check_lowdown():
    info={"candidate":"THE-LOWDOWN original C8 RS6 film",
          "url":"https://www.youtube.com/watch?v=FUBopyqaXds",
          "creator_site":"https://www.the-lowdown.com/audi-rs6/",
          "source_review_issue":54,
          "license":"unverified",
          "status":"NOT_ACQUIRED"}
    # Attempt legitimate public YouTube metadata/extractor, no authentication
    try:
        with YoutubeDL(dict(yopts(),skip_download=True)) as dl:
            x=dl.extract_info(info["url"],download=False)
        if x:
            info.update(status="YOUTUBE_METADATA_OK",
                title=x.get("title"),duration=x.get("duration"),
                uploader=x.get("uploader"),max_source_height=max(
                    [f.get("height") or 0 for f in x.get("formats",[])] or [0]))
    except Exception as e:
        info.update(status="YOUTUBE_UNAVAILABLE",error=str(e)[-350:])
    # Independent original-site HTML inspect; only report any publicly
    # advertised media URLs; don't bypass auth/DRM.
    try:
        import requests
        r=requests.get(info["creator_site"],timeout=15,
                       headers={"User-Agent":"Mozilla/5.0"})
        info["creator_http"]=r.status_code
        info["creator_html_bytes"]=len(r.content)
        snippets=re.findall(r"""(?i)(?:https?:)?//[^\s"'<>]{4,260}(?:\.mp4|\.m3u8)(?:\?[^\s"'<>]*)?""",
                            r.text)
        info["creator_embedded_public_media_urls"]=[s[:250] for s in snippets[:8]]
        info["creator_youtube_ref"]=("FUBopyqaXds" in r.text)
    except Exception as e:
        info["creator_probe_error"]=str(e)[-250:]
    return info

def main():
    discovery=discover_more()
    (WORK/"discovery.json").write_text(json.dumps(discovery,indent=2))
    sources=list(C8_SOURCES)
    for i,entry in enumerate(discovery.get("selected",[])[:6],1):
        sources.append((f"B2_NEW_FE78_{i:02d}",entry["url"],
                        "NEW_UNVERIFIED_AUDIT",0))
    out=[]
    for row in sources:
        result=acquire(*row)
        out.append(result)
        print("B2_TARGET",result["id"],result["status"],flush=True)
        (WORK/"report.json").write_text(json.dumps(out,indent=2))
    low=check_lowdown()
    (WORK/"lowdown.json").write_text(json.dumps(low,indent=2))
    (ROOT/"manifest.json").write_text(json.dumps(
      {"project":"YUNEX RS6 B2","owner_only":True,
       "release_state":"DRAFT - NOT PUBLIC",
       "rights":"UNVERIFIED; NOT FOR PUBLIC RELEASE",
       "sources":out,"lowdown":low},indent=2))
    with (ROOT/"SHA256SUMS.txt").open("w") as f:
        for p in sorted(MP4S.glob("*.mp4")):
            f.write(f"{sha256(p)}  mp4/{p.name}\n")
    count=len(list(MP4S.glob("*.mp4")))
    if count<2:
        raise SystemExit(f"only {count} playable MP4s, require >=2")
    zpath=ROOT/"YUNEX_RS6_B2_OWNER_REVIEW.zip"
    with zipfile.ZipFile(zpath,"w",zipfile.ZIP_DEFLATED,6) as z:
        for p in sorted(ROOT.rglob("*")):
            if p.is_file() and p!=zpath:
                z.write(p,p.relative_to(ROOT))
    (WORK/"summary.json").write_text(json.dumps(
        {"playable_review_mp4s":count,"zip_bytes":zpath.stat().st_size,
         "zip_sha256":sha256(zpath),
         "status":"UNPUBLISHED_OWNER_ONLY_DRAFT"},indent=2))
    print("B2_DRAFT_READY",count,zpath.stat().st_size,flush=True)

if __name__=="__main__":
    main()
