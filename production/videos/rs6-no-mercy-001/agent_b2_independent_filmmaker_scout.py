#!/usr/bin/env python3
"""B2 discovery of new independent filmmaker originals, not Audi press or C2 macros.

Paths: Vimeo creator-owned public videos via yt-dlp and original production
portfolio HTML direct MP4 embeds. Stage *only* successful decode originals in
an owner-only UNPUBLISHED DRAFT; publication permissions not established.
All provenance, native resolution, frame samples, checksums and failures
are reported honestly. Don't treat 1080x1920 output as native if cropped.
"""
import hashlib
import html
import json
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import urlparse
import requests
from yt_dlp import YoutubeDL
from yt_dlp.utils import download_range_func
from PIL import Image, ImageDraw

DIR=Path("b2_new_creator_private")
VID=DIR/"mp4"; VID.mkdir(parents=True,exist_ok=True)
FR=DIR/"contact";FR.mkdir(exist_ok=True)
REPORT=Path("b2_new_creator_evidence");REPORT.mkdir(exist_ok=True)
TARGETS=[
 ("MAJESTY_RS6_TUNCER","https://vimeo.com/1143972759","Tuncer Films",0),
 ("BRM_RS6_MTM","https://vimeo.com/1164115588","Bram Hoffs / brm.media",0),
 ("BYRON_AUDI_RS6","https://vimeo.com/1013148551","YIPING WANG/inJECT",0),
]
SITES=[
 ("PERFORM_CAR_RENT","https://141-productionz.com/case-studies/perform-car-rent","141_PRODUCTIONZ")
]
def digest(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for c in iter(lambda:f.read(1024*1024),b""):h.update(c)
    return h.hexdigest()
def proc(argv,timeout=100):
    try:
        p=subprocess.run(argv,capture_output=True,text=True,timeout=timeout)
        return p.returncode,p.stdout,p.stderr[-400:]
    except Exception as e:return 999,"",str(e)[:400]
def inspect(path):
    rc,out,err=proc(["ffprobe","-v","error","-show_entries",
        "stream=codec_type,codec_name,width,height,r_frame_rate:"
        "format=duration,size","-of","json",str(path)],timeout=20)
    return json.loads(out) if rc==0 else {"error":err}
def convert_original(path,key,source_provenance,description):
    row=dict(key=key,origin=source_provenance,description=description,
       creator_rights="No permission for public redistribution recorded",
       published_public=False,authentic_c8_visual="NOT_YET_VERIFIED",
       driving_visual="NOT_YET_VERIFIED",status="UNVERIFIED")
    p=inspect(path);row["source_ffprobe"]=p
    source_video=next((s for s in p.get("streams",[]) if s.get("codec_type")=="video"),{})
    w=int(source_video.get("width") or 0);h=int(source_video.get("height") or 0)
    if w<1080 or h<1080:
        row["status"]="REJECT_NATIVE_UNDER_1080";return row
    row["original_sha256"]=digest(path)
    row["original_sample_bytes"]=path.stat().st_size
    row["native_landscape_or_portrait"]="portrait" if h>w else "landscape"
    output=VID/(key+".mp4")
    rc,out,err=proc(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
        "-i",str(path),"-t","4","-an",
        "-vf","fps=30,scale=1080:1920:force_original_aspect_ratio=increase,"
              "crop=1080:1920,format=yuv420p",
        "-c:v","libx264","-preset","fast","-crf","18",
        "-movflags","+faststart",str(output)],timeout=110)
    if rc or not output.is_file() or output.stat().st_size<50000:
        row.update(status="REENCODE_FAILED",error=err);output.unlink(missing_ok=True);return row
    rc,_,err=proc(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
        "-xerror","-i",str(output),"-f","null","-"],timeout=45)
    if rc:
        output.unlink(missing_ok=True);row.update(status="FULL_DECODE_FAILED",error=err);return row
    row.update(status="PLAYABLE_PRIVATE_REVIEW_MP4",bytes=output.stat().st_size,
      source_relative_start=0,duration_requested=4,
      output_sha256=digest(output),output_ffprobe=inspect(output),full_decode=True,
      output_native_portrait_pixels=(h>=1920 and w>=1080))
    with tempfile.TemporaryDirectory(prefix="b2newframes") as temp:
        d=Path(temp)
        proc(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
            "-i",str(output),"-vf","fps=1,scale=270:-2",
            "-frames:v","4",str(d/"frame-%02d.jpg")],timeout=20)
        images=[Image.open(z).convert("RGB") for z in sorted(d.glob("frame-*"))]
        if images:
            sheet=Image.new("RGB",(270*len(images),images[0].height+28),"#101216")
            draw=ImageDraw.Draw(sheet)
            for i,img in enumerate(images):
                sheet.paste(img,(i*270,28))
                draw.text((i*270+5,6),key+" "+str(i)+"s",fill="white")
            sheet.save(FR/(key+".jpg"),quality=86)
    return row
def vimeo(key,url,creator,start):
    row=dict(key=key,url=url,creator=creator,source_method="yt-dlp original public Vimeo creator page",
         status="DISCOVERY_ONLY")
    with tempfile.TemporaryDirectory(prefix="b2vimeo") as td:
        d=Path(td)
        try:
            opts=dict(quiet=True,no_warnings=True,skip_download=True,noplaylist=True,
                socket_timeout=14,retries=1,fragment_retries=1,extractor_retries=1)
            with YoutubeDL(opts) as dl:
                info=dl.extract_info(url,download=False)
            row.update(source_title=info.get("title"),
                source_duration=info.get("duration"),source_creator=info.get("uploader"),
                source_license=info.get("license"),
                claimed_heights=sorted(set(f.get("height") or 0 for f in info.get("formats",[])))[-6:])
            if not any((f.get("height") or 0)>=1080 for f in info.get("formats",[])):
                row["status"]="NO_VERIFIED_1080_FORMAT";return row
            dlopts=dict(opts,skip_download=False,
                format="bv*[height<=2160]+ba/b[height<=2160]/b",
                outtmpl=str(d/"original.%(ext)s"),
                merge_output_format="mp4",
                download_ranges=download_range_func(None,[(start,start+6)]),
                force_keyframes_at_cuts=True)
            with YoutubeDL(dlopts) as dl:
                dl.extract_info(url,download=True)
            candidates=sorted((p for p in d.iterdir() if p.suffix.lower() in (".mp4",".webm",".mkv")),
                              key=lambda p:p.stat().st_size,reverse=True)
            if not candidates:
                row["status"]="MEDIA_DOWNLOAD_EMPTY";return row
            row.update(convert_original(candidates[0],key,url,creator))
        except Exception as e:
            row["status"]="VIMEO_ACCESS_OR_DOWNLOAD_ERROR";row["error"]=str(e)[-320:]
    return row
def portfolio(key,url,creator):
    row=dict(key=key,url=url,creator=creator,status="DISCOVERY_ONLY")
    try:
        r=requests.get(url,timeout=17,headers={"User-Agent":"Mozilla/5.0"})
        row.update(page_status=r.status_code,page_bytes=len(r.content))
        r.raise_for_status()
        data=html.unescape(r.text).replace("\\/","/")
        patterns=[r'https?://[^\s"<>]+?\.mp4(?:\?[^\s"<>]*)?',
                  r'https?://[^\s"<>]+?\.m3u8(?:\?[^\s"<>]*)?']
        links=[]
        for pattern in patterns:
            for media in re.findall(pattern,data,re.I):
                if media not in links:links.append(media)
        row.update(candidate_domains=sorted(set(urlparse(x).netloc for x in links)),
                   media_links_count=len(links),contains_video_tag=bool(re.search(r'<video\b',data,re.I)))
        for j,media in enumerate(links[:3],1):
            # ffprobe publicly embedded direct media; never download inaccessible assets
            rc,out,err=proc(["ffprobe","-v","error","-show_entries",
                "format=duration,size:stream=codec_type,width,height,r_frame_rate",
                "-of","json",media],timeout=30)
            if rc:continue
            meta=json.loads(out)
            row.setdefault("candidate_meta",[]).append(meta)
            if not any(s.get("codec_type")=="video" and
               min(s.get("height",0),s.get("width",0))>=1080
               for s in meta.get("streams",[])):continue
            with tempfile.TemporaryDirectory(prefix="b2portfolio") as td:
                p=Path(td)/"original.mp4"
                rc,_,err=proc(["ffmpeg","-hide_banner","-nostdin","-loglevel","error",
                    "-y","-i",media,"-t","5","-map","0:v:0","-an",
                    "-c:v","libx264","-crf","21","-preset","ultrafast",str(p)],timeout=90)
                if rc==0 and p.is_file():
                    row.update(convert_original(p,key,url,creator))
                    row["proven_media_domain"]=urlparse(media).netloc
                    break
        if row["status"]=="DISCOVERY_ONLY":row["status"]="NO_ACCESSIBLE_HIGH_RES_DIRECT_MP4"
    except Exception as e:
        row["status"]="WEBPAGE_FAILED";row["error"]=str(e)[-350:]
    return row
def main():
    rows=[]
    for source in TARGETS:
        row=vimeo(*source);rows.append(row)
        print("VIMEO",row["key"],row["status"],row.get("claimed_heights"),flush=True)
        (REPORT/"results.json").write_text(json.dumps(rows,indent=2))
    for source in SITES:
        row=portfolio(*source);rows.append(row)
        print("PORTFOLIO",row["key"],row["status"],row.get("candidate_domains"),flush=True)
        (REPORT/"results.json").write_text(json.dumps(rows,indent=2))
    real=list(VID.glob("*.mp4"))
    (DIR/"manifest.json").write_text(json.dumps(
        {"new_artist_originals":rows,"draft":True,
         "public_redistribution":False},indent=2))
    (DIR/"SHA256SUMS.txt").write_text("".join(f"{digest(p)}  mp4/{p.name}\n" for p in sorted(real)))
    if real:
        z=DIR/"B2_NEW_CREATORS_DRAFT.zip"
        with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED,6) as f:
            for p in sorted(DIR.rglob("*")):
                if p.is_file() and p!=z:f.write(p,p.relative_to(DIR))
        (REPORT/"bundle.json").write_text(json.dumps(
            {"count":len(real),"zip_sha256":digest(z),
             "zip_size":z.stat().st_size,"status":"OWNER_ONLY_DRAFT_MP4S_CREATED"},indent=2))
    else:
        (REPORT/"bundle.json").write_text(json.dumps(
            {"count":0,"status":"NO_NEW_VIDEO_MEDIA_ACQUIRED"},indent=2))
    print("NEW_B2_REAL_MP4_COUNT",len(real),flush=True)
if __name__=="__main__":main()
