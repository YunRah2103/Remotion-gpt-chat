#!/usr/bin/env python3
"""Independent creator-first RS6 hero sourcing.
Only publicly advertised playback or documented progressive MP4 endpoints.
Never bypass authentication/DRM; source clips remain ephemeral, not in artifacts.
"""
from pathlib import Path
from urllib.parse import urlparse
import hashlib,json,re,subprocess,time,requests
OUT=Path("a2_new_creators_qa");OUT.mkdir(exist_ok=True)
CANDIDATES=[
 {"key":"inject_byron_rs6_performance","url":"https://vimeo.com/1013148551",
  "original":"inJECT Inspiration / director LEEBO / editor YIPING WANG",
  "evidence":"Original production credits including precision driver and Ronin2; RS 6 Avant performance",
  "role":"premium rolling/full-car hero candidate, new source not previously probed by A2"},
 {"key":"fume_art_garage_rs6_c8","url":"https://vimeo.com/761014676",
  "original":"Fume Studio / ART Garage",
  "evidence":"Fume Studio's original RS6 C8 customizing project teaser",
  "role":"dark cinematic C8 whole-car hero candidate"},
 {"key":"2n2_rs6_c8","url":"https://vimeo.com/803836362",
  "original":"2n2",
  "evidence":"Uploader identifies genuine RS6 C8 in title; further generation/frame proof required",
  "role":"secondary modern RS6 beauty film candidate"}
]
headers={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"}
def proc(args,timeout):
 try:
  r=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
  return {"ok":r.returncode==0,"code":r.returncode,"stdout":r.stdout[:450000],"stderr":r.stderr[-1400:]}
 except Exception as exc:return {"ok":False,"error":repr(exc)}
def display_url(url):
 p=urlparse(url)
 # Trim CDN secrets/auth query strings; exact media URLs not written into public artifacts.
 return f"{p.scheme}://{p.netloc}{p.path[:170]}"
def inspect(v):
 x={"key":v["key"],"page":v["url"],"original":v["original"],"evidence":v["evidence"],"role":v["role"],
   "source_rights":"no explicit verified re-edit/republication licence; transient evaluation only"}
 try:
  o=requests.get("https://vimeo.com/api/oembed.json",params={"url":v["url"]},
     headers=headers,timeout=22)
  x["oembed_http"]=o.status_code
  if o.ok:
   oj=o.json();x["oembed"]={k:oj.get(k) for k in ("title","author_name","duration","width","height","is_plus")}
 except Exception as exc:x["oembed_error"]=repr(exc)
 # First independent route: standard user-facing player config (public API, no auth/cookie).
 vid=v["url"].rsplit("/",1)[-1]
 try:
  r=requests.get(f"https://player.vimeo.com/video/{vid}/config",headers=headers,timeout=20)
  x["public_player_config_http"]=r.status_code
  if r.ok:
   z=r.json()
   x["public_player_meta"]={"title":z.get("video",{}).get("title"),
       "duration":z.get("video",{}).get("duration"),
       "width":z.get("video",{}).get("width"),
       "height":z.get("video",{}).get("height")}
   f=z.get("request",{}).get("files",{})
   x["public_config_progressives"]=[{"width":p.get("width"),"height":p.get("height"),
     "fps":p.get("fps"),"mime":p.get("mime"),"address":display_url(p.get("url",""))}
    for p in f.get("progressive",[])[:6]]
 except Exception as exc:x["public_player_error"]=repr(exc)
 # Second route: public page yt-dlp metadata with no cookies or credentials.
 r=proc(["yt-dlp","--skip-download","--no-playlist","--no-warnings",
    "--no-check-certificates","--socket-timeout","22",
    "--dump-single-json",v["url"]],timeout=55)
 x["ytdlp_metadata_ok"]=r["ok"];x["ytdlp_diagnostic"]=r.get("stderr","")[-700:]
 choices=[]
 if r["ok"]:
  try:
   j=json.loads(r["stdout"])
   x["ytdlp_summary"]={k:j.get(k) for k in ("id","title","duration","uploader","width","height","license")}
   choices=[f for f in j.get("formats",[]) if f.get("url") and f.get("vcodec") not in (None,"none") and f.get("protocol") in ("http","https")]
   x["formats"]=[{"id":f.get("format_id"),"width":f.get("width"),"height":f.get("height"),
       "fps":f.get("fps"),"vcodec":f.get("vcodec"),"protocol":f.get("protocol")}
         for f in choices[-12:]]
  except Exception as exc:x["meta_parse_error"]=repr(exc)
 if choices:
  best=sorted(choices,key=lambda f:((f.get("height") or 0),(f.get("tbr") or 0)))[-1]
  url=best["url"];out=OUT/("temp_"+v["key"]+".mp4")
  # No DRM, no authentication, only public FFmpeg-readable progressive format.
  a=proc(["ffmpeg","-hide_banner","-nostdin","-v","error","-rw_timeout","18000000",
     "-ss","3","-i",url,"-t","2.0","-an","-c:v","libx264","-preset","fast",
     "-pix_fmt","yuv420p","-y",str(out)],timeout=100)
  x["sample_capture_success"]=a["ok"] and out.exists() and out.stat().st_size>100000
  x["sample_capture_error"]=a.get("stderr","")[-450:]
  if x["sample_capture_success"]:
   x["sample_bytes"]=out.stat().st_size
   x["sample_sha256"]=hashlib.sha256(out.read_bytes()).hexdigest()
   p=proc(["ffprobe","-v","error","-show_entries",
     "format=duration,size:stream=width,height,codec_name,codec_type,r_frame_rate","-of","json",str(out)],timeout=22)
   if p["ok"]:
    x["sample_probe"]=json.loads(p["stdout"])
    d=proc(["ffmpeg","-v","error","-i",str(out),"-f","null","-"],timeout=25)
    x["full_sample_decode_success"]=d["ok"]
  out.unlink(missing_ok=True)
 return x
report={"agent":"A2","purpose":"independent original C8 RS6 creator visual footage leads, ephemeral acquisition probes",
 "source_review_not_redistribution":True,"sources":[]}
for v in CANDIDATES:
 report["sources"].append(inspect(v))
report["completed_utc"]=time.strftime("%FT%TZ",time.gmtime())
(OUT/"source_report.json").write_text(json.dumps(report,indent=2))
(OUT/"RIGHTS.txt").write_text("Sources are creator/property owners' works. Reuse rights unverified. NO MP4/frames published.\n")
print(json.dumps([{k:x.get(k) for k in ("key","oembed_http","public_player_config_http","ytdlp_metadata_ok",
 "sample_capture_success","full_sample_decode_success","source_rights")} for x in report["sources"]],indent=2))
