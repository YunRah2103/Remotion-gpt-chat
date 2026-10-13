#!/usr/bin/env python3
"""Independent Vimeo direct-MP4/CDN pathway for B2 (PRIVATE TECHNICAL QA).

Never upload footage, still images, extracted manifests containing signed CDN URLs,
or downloads without uploader's redistribution permission. No DRM bypass.
"""
from pathlib import Path
import json, hashlib, subprocess, requests, re
from urllib.parse import urlsplit
from tempfile import TemporaryDirectory

SOURCES = [
    ("vimeo-c8-2n2", "803836362", "https://vimeo.com/803836362"),
    ("vimeo-c8-press", "513862676", "https://vimeo.com/513862676"),
    ("vimeo-rs6-dealer", "530331809", "https://vimeo.com/530331809"),
]
UA = "Yunex-B2-C8-TechnicalReview/1.0"
OUT=Path("b2-vimeo-evidence")
OUT.mkdir(exist_ok=True)

def get(url):
    r=requests.get(url,headers={"User-Agent":UA,"Accept":"application/json"},
                   timeout=(8,18))
    r.raise_for_status()
    return r.json()

def safe_title(t):
    return re.sub(r"\s+"," ",t or "")[:150]

def record(k,vid,page):
    result=dict(source=page,video_id=vid,key=k,
                editorial_status="UNVERIFIED_C8_AND_DRIVING",
                rights="UNVERIFIED; NO PUBLIC MEDIA REHOSTING",
                distributed_media=False,source_license=None)
    try:
        info=get("https://vimeo.com/api/v2/video/"+vid+".json")
        video=info[0] if isinstance(info,list) and info else {}
        result.update(title=safe_title(video.get("title")), uploader=video.get("user_name"),
            source_duration=video.get("duration"), description=safe_title(video.get("description")),
            source_license=video.get("license"))
    except Exception as e:
        result["api_error"]=str(e)[:250]
    try:
        config=get("https://player.vimeo.com/video/"+vid+"/config")
        files=config.get("request",{}).get("files",{})
        prog=files.get("progressive") or []
        result["progressive_renditions"]=[
            {"width":x.get("width"),"height":x.get("height"),"fps":x.get("fps"),
             "mime":x.get("mime"),"quality":x.get("quality")} for x in prog]
        candidates=sorted(
           (x for x in prog if x.get("url","").startswith("https://")),
           key=lambda x:(x.get("height") or 0,x.get("width") or 0),reverse=True)
        if not candidates:
            result["status"]="NO_DIRECT_MP4_RENDITION"; return result
        # Native resolution originates in the server metadata. Each media URL stays PRIVATE.
        candidate=candidates[0]
        result["declared_best_height"]=candidate.get("height")
        # By testing a short *transient* clip we avoid caching/redistributing source media.
        with TemporaryDirectory(prefix="yunex-b2-") as d:
            file=Path(d)/"sample.mp4"
            import urllib.request
            cmd=["ffmpeg","-hide_banner","-nostdin","-loglevel","error",
                 "-ss","0","-i",candidate["url"],"-t","4",
                 "-map","0:v:0","-an","-vf","scale=iw:ih",
                 "-c:v","libx264","-preset","ultrafast","-crf","25","-movflags","+faststart",str(file)]
            p=subprocess.run(cmd,stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,timeout=70)
            if p.returncode or not file.exists() or file.stat().st_size<10000:
                result.update(status="DOWNLOAD_OR_ENCODE_FAILED",
                              error=p.stderr.decode("utf-8",errors="replace")[-300:])
                return result
            pp=subprocess.run(["ffprobe","-v","error","-show_entries",
              "stream=width,height,codec_name,r_frame_rate,codec_type:format=duration,size",
              "-of","json",str(file)],text=True,capture_output=True,timeout=15)
            dec=subprocess.run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-xerror",
              "-i",str(file),"-f","null","-"],text=True,capture_output=True,timeout=40)
            result.update(status="PRIVATE_MP4_PROBED" if not pp.returncode and not dec.returncode else "MEDIA_QA_FAILED",
               probe=json.loads(pp.stdout) if pp.returncode==0 else None,
               full_decode_ok=dec.returncode==0,
               sha256_of_temporary_transcode=hashlib.sha256(file.read_bytes()).hexdigest())
        return result
    except Exception as e:
        result.update(status="NETWORK_OR_SOURCE_ERROR",error=str(e)[-350:])
        return result

def main():
    result=[]
    for source in SOURCES:
        try: rec=record(*source)
        except Exception as e: rec={"key":source[0],"status":"UNEXPECTED_ERROR","error":str(e)[-300:]}
        print(rec["key"],rec["status"],rec.get("title"),rec.get("error",""),flush=True)
        result.append(rec)
    (OUT/"vimeo_probe.json").write_text(json.dumps(result,indent=2))
    (OUT/"README.txt").write_text(
        "Transient source inspection ONLY. Artifact contains neither video nor stills nor signed CDN URLs. "
        "Native dimensions in Vimeo rendition metadata are only asserted as reported; "
        "FFprobe fields, when present, pertain to a 4-second transcode. "
        "A creator redistribution licence and manager frame check are mandatory before handoff.\n")
if __name__=="__main__":
    main()
