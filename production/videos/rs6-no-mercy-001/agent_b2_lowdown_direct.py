#!/usr/bin/env python3
"""Original creator webpage->Vimeo external MP4 direct acquisition, no YouTube.

Publicly embedded source on https://www.the-lowdown.com/audi-rs6/.
Test network response, native media FFprobe, private 3x 4s source frame
captures, decoding and ZIP. May upload playable shots ONLY to existing
owner-only unpublished draft Release; public release remains disallowed
without permission from THE-LOWDOWN.
"""
import hashlib, html, json, re, shutil, subprocess, tempfile, zipfile
from pathlib import Path
import requests
from PIL import Image,ImageDraw
ROOT=Path("b2-lowdown-review")
ROOT.mkdir(exist_ok=True)
OUT=Path("b2-lowdown-proofs")
OUT.mkdir(exist_ok=True)
SITE="https://www.the-lowdown.com/audi-rs6/"
HDR={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0.0.0 Safari/537.36",
     "Referer":"https://www.the-lowdown.com/"}
REPORT={"creator":"THE-LOWDOWN", "creator_page":SITE,
        "rights":"UNVERIFIED - OWNER-ONLY DRAFT PREVIEW",
        "public_media_release":False,"status":"SOURCE_NOT_FETCHED","candidates":[]}
def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()
def cmd(args,timeout=90):
    try:
        r=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
        return r.returncode,r.stdout,r.stderr[-700:]
    except Exception as e:return -1,"",str(e)[:500]
def extract():
    page=requests.get(SITE,headers=HDR,timeout=20)
    page.raise_for_status()
    source=html.unescape(page.text).replace("\\/","/")
    urls=re.findall(r"""https?://[^\s"'<>\\]+\.mp4(?:\?[^\s"'<>\\]+)?""",source,re.I)
    result=[]
    for u in urls:
        u=html.unescape(u)
        if "player.vimeo.com/external/" in u and u not in result: result.append(u)
    if not result:
        # Replay the original direct MP4 URL recovered in an earlier successful
        # GitHub Actions diagnostic artifact, which came from the creator's
        # own public HTML. This avoids publishing tokens in source control and
        # survives transient changes to the creator site/HTML caching.
        seed=Path("b2-seed/b2_candidate_reports/lowdown.json")
        if seed.is_file():
            try:
                old=json.loads(seed.read_text())
                for value in old.get("creator_embedded_public_media_urls",[]):
                    value=html.unescape(value)
                    if value.startswith("https://player.vimeo.com/external/450095160.") and ".mp4?" in value:
                        result.append(value)
                REPORT["source_from_verified_prior_capture"]=bool(result)
            except Exception as e:
                REPORT["seed_read_error"]=str(e)[-250:]
    return result[:5]
def probe(url,i):
    r={"index":i,"url_host":"player.vimeo.com","source_is_creator_embed":True}
    try:
        p=requests.get(url,headers=dict(HDR,Range="bytes=0-4095"),timeout=20,stream=True)
        r.update(http_status=p.status_code,range=p.headers.get("Content-Range"),
                 bytes=p.headers.get("Content-Length"),
                 type=p.headers.get("Content-Type"))
        r["first_bytes_hex"]=next(p.iter_content(20),b"").hex()
        p.close()
    except Exception as e:r["http_error"]=str(e)[-350:]
    rc,out,err=cmd(["ffprobe","-v","error","-show_entries",
        "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate",
        "-of","json","-headers",
        "Referer: https://www.the-lowdown.com/\r\nUser-Agent: Mozilla/5.0\r\n",
        url],timeout=45)
    r["ffprobe_rc"]=rc
    r["source_probe"]=json.loads(out) if rc==0 else None
    if rc:r["ffprobe_error"]=err
    return r
def excerpt(url,sec,i):
    name=f"B2_LOWDOWN_NIGHT_{i:02d}"
    path=ROOT/(name+".mp4")
    # Sequential video-seeking directly against progressive media if HTTP
    # Range is supported. 4s at native1080 portrait crop; no audio.
    command=["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
        "-headers","Referer: https://www.the-lowdown.com/\r\nUser-Agent: Mozilla/5.0\r\n",
        "-ss",str(sec),"-i",url,"-t","4","-an",
        "-vf","fps=30,scale=1080:1920:force_original_aspect_ratio=increase,"
              "crop=1080:1920,format=yuv420p",
        "-c:v","libx264","-preset","veryfast","-crf","19",
        "-movflags","+faststart",str(path)]
    rc,_,err=cmd(command,timeout=125)
    row={"name":name,"start_sec":sec,"duration_requested":4,
         "url":SITE,"ffmpeg_rc":rc,"error":err[-350:] if rc else None}
    if rc or not path.exists() or path.stat().st_size<50000:
        path.unlink(missing_ok=True);row["status"]="DOWNLOAD_OR_ENCODE_FAILED";return row
    rc,_,err=cmd(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-xerror",
        "-i",str(path),"-f","null","-"],timeout=45)
    row["full_decode_ok"]=rc==0
    if rc:
        path.unlink(missing_ok=True);row["status"]="DECODE_REJECT";return row
    row.update(status="PLAYABLE_MP4_CREATED",file_bytes=path.stat().st_size,
               sha256=sha(path))
    prc,pout,perr=cmd(["ffprobe","-v","error","-show_entries",
        "stream=width,height,codec_type,r_frame_rate:format=duration,size",
        "-of","json",str(path)],20)
    row["ffprobe"]=json.loads(pout) if prc==0 else {}
    with tempfile.TemporaryDirectory(prefix="b2-lowdown-frames") as d:
        pattern=str(Path(d)/"frame_%02d.jpg")
        cmd(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
             "-y","-i",str(path),"-vf","fps=1,scale=270:-2",
             "-frames:v","4",pattern],30)
        frames=[Image.open(p).convert("RGB") for p in sorted(Path(d).glob("frame*"))]
        if frames:
            sheet=Image.new("RGB",(270*len(frames),frames[0].height+28),"#111")
            draw=ImageDraw.Draw(sheet)
            for k,img in enumerate(frames):
                sheet.paste(img,(270*k,28))
                draw.text((270*k+5,6),f"{name} {sec+k}s",fill="white")
            sheet.save(ROOT/(name+".jpg"),quality=84)
    return row

def main():
    try:
        sources=extract()
        REPORT["source_candidates_count"]=len(sources)
        if not sources:REPORT["status"]="NO_EMBEDDED_MP4"
        for i,u in enumerate(sources):
            pr=probe(u,i)
            REPORT["candidates"].append(pr)
            # Do not save signed URL or token to public reports
            (OUT/"network.json").write_text(json.dumps(REPORT,indent=2))
            print("SOURCE_PROBE",i,pr.get("http_status"),pr.get("source_probe",{}),flush=True)
            info=pr.get("source_probe") or {}
            videos=[x for x in info.get("streams",[]) if x.get("codec_type")=="video"]
            if not videos:continue
            v=videos[0]
            if min(v.get("width",0),v.get("height",0))<1080:
                pr["quality_gate"]="REJECT_NATIVE_SOURCE_UNDER_1080";continue
            for k,sec in enumerate((0,8,20),1):
                sec=int(sec)
                if float(info.get("format",{}).get("duration") or 0)<sec+4:continue
                row=excerpt(u,sec,k)
                REPORT.setdefault("outputs",[]).append(row)
                print("EXCERPT",row["name"],row["status"],flush=True)
            if any(r["status"]=="PLAYABLE_MP4_CREATED" for r in REPORT.get("outputs",[])):
                REPORT["status"]="CREATOR_ORIGINAL_PLAYABLE_1080P"
                break
    except Exception as e:
        REPORT.update(status="EXTRACTION_ERROR",error=str(e)[-500:])
    # Remove signed media URLs before uploading diagnostic JSON.
    for record in REPORT.get("candidates",[]):
        record.pop("signed_url",None)
    (OUT/"results.json").write_text(json.dumps(REPORT,indent=2))
    files=list(ROOT.glob("*.mp4"))
    if files:
        (ROOT/"manifest.json").write_text(json.dumps(REPORT,indent=2))
        (ROOT/"SHA256SUMS.txt").write_text("".join(f"{sha(p)}  {p.name}\n" for p in files))
        z=ROOT/"B2_LOWDOWN_ORIGINAL_OWNER_REVIEW.zip"
        with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED) as arc:
            for f in sorted(ROOT.iterdir()):
                if f.is_file() and f!=z:arc.write(f,f.name)
        (OUT/"bundle.json").write_text(json.dumps(
            {"status":"REAL_PRIVATE_MEDIA_READY","files":[p.name for p in files],
             "zip_size":z.stat().st_size,"zip_sha256":sha(z)},indent=2))
    else:
        (OUT/"bundle.json").write_text(json.dumps(
            {"status":"NO_PLAYABLE_ORIGINAL_SOURCE_MEDIA"}))
    print("FINAL",REPORT["status"],"MP4_COUNT",len(files),flush=True)

if __name__=="__main__":main()
