#!/usr/bin/env python3
"""A2: public Vimeo PLAYER config probe, not yt-dlp logged-in web client.

Only public embed config/renditions; any disallowed/download-disabled/DRM source
is rejected. Downloads an actual 12-second native-video file and contact-sheet
if and only if the publisher's public configuration exposes a playable stream.
"""
import requests,subprocess,json,zipfile,hashlib,re
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageDraw
OUT=Path("out/gt3-a2-vimeo-public-embed"); MEDIA=OUT/"media_native_for_visual_qa"; SHEETS=OUT/"contact_sheets"
for p in (OUT,MEDIA,SHEETS):p.mkdir(parents=True,exist_ok=True)
sources=[
 ("ferrari_ravenol_2023_n24",844209222,"2023 RAVENOL Nordschleife documentary, Ferrari #30 scene not proven"),
 ("ferrari_nurburgring_2025",1116173597,"Nürburgring Ferrari film, GT3 race model/circuit must verify"),
]
def cmd(args,timeout=80):
 r=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 if r.returncode:raise RuntimeError(r.stderr[-500:])
 return r.stdout
def sha(f):
 h=hashlib.sha256()
 with f.open("rb") as i:
  for b in iter(lambda:i.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
session=requests.Session();session.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36","Referer":"https://player.vimeo.com/"})
results=[]
for key,id,note in sources:
 row={"id":key,"vimeo_id":id,"note":note,"status":"NOT_ACQUIRED","verified_gt3_shots":0}
 tries=[f"https://player.vimeo.com/video/{id}/config",f"https://player.vimeo.com/video/{id}?app_id=122963",
        f"https://player.vimeo.com/video/{id}?autoplay=1"]
 urls=[]
 for ep in tries:
  try:
   r=session.get(ep,timeout=(8,15))
   row.setdefault("http",[]).append({"endpoint":ep,"status":r.status_code,"content_type":r.headers.get("content-type",""),"bytes":len(r.content)})
   if r.status_code!=200:continue
   if "json" in r.headers.get("content-type",""):
    j=r.json()
    urls += [x.get("link") for x in j.get("request",{}).get("files",{}).get("progressive",[]) if x.get("link")]
    hls=j.get("request",{}).get("files",{}).get("hls",{}).get("cdns",{})
    urls += [v.get("url") for v in hls.values() if v.get("url")]
    row["public_config_name"]=j.get("video",{}).get("title")
    row["public_progressive_formats"]=[{"quality":x.get("quality"),"width":x.get("width"),"height":x.get("height")} for x in j.get("request",{}).get("files",{}).get("progressive",[])]
  except Exception as e:row.setdefault("errors",[]).append(str(e)[-250:])
 # Verify actual media type / resolution, do not count embedded player URLs alone
 for i,url in enumerate(list(dict.fromkeys([u for u in urls if isinstance(u,str)]))[:6]):
  f=MEDIA/(f"{key}_{i}.mkv")
  try:
   cmd(["ffmpeg","-nostdin","-v","error","-y","-i",url,"-t","12",
        "-map","0:v:0","-map","0:a?","-c","copy",str(f)],110)
   j=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)],25))
   v=next(x for x in j["streams"] if x["codec_type"]=="video")
   w,h=int(v["width"]),int(v["height"])
   dur=float(j["format"].get("duration",0))
   if w<1920 or h<1080 or dur<2:raise RuntimeError(f"LOW_RES_OR_DURATION_{w}x{h}_{dur}")
   cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(f),"-f","null","-"],75)
   im=Image.new("RGB",(1200,720),"#171717");d=ImageDraw.Draw(im)
   for n in range(8):
    sec=round(dur*(n+.4)/8,2)
    dest=SHEETS/(key+f"_{n}.jpg")
    cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(sec),"-i",str(f),
         "-frames:v","1","-vf","scale=300:225:force_original_aspect_ratio=decrease,pad=300:225:(ow-iw)/2:(oh-ih)/2",
         str(dest)],20)
    with Image.open(dest) as frame:im.paste(frame.convert("RGB"),((n%4)*300,(n//4)*345+32))
    d.text(((n%4)*300+5,(n//4)*345+5),f"{key} t={sec}",fill="white")
    dest.unlink()
   sheet=SHEETS/(key+"_8FRAME_QA.jpg");im.save(sheet,quality=86)
   row.update(status="PUBLIC_PLAYER_ACTUAL_NATIVE_HD_DECODED_GT3_VISUAL_QA_PENDING",
              media_file=str(f.relative_to(OUT)),sha256=sha(f),bytes=f.stat().st_size,
              source_resolution=[w,h],duration_s=dur,ffprobe=j,contact_sheet=str(sheet.relative_to(OUT)))
   print("VIMEO_PUBLIC_NATIVE_SUCCESS",key,row["source_resolution"],row["sha256"],flush=True)
   break
  except Exception as e:
   row.setdefault("errors",[]).append(str(e)[-220:])
   f.unlink(missing_ok=True)
 if row["status"]=="NOT_ACQUIRED":row["status"]="FAILED_PUBLIC_VIMEO_EMBED_NO_ORIGINAL_MEDIA"
 print("EMBED_RESULT",key,row["status"],len(urls),row.get("public_progressive_formats"),flush=True)
 results.append(row)
report={"method":"Vimeo public player HTTP config, no login/cookies", "source_count":len(sources),
        "original_native_films":sum(r["status"].startswith("PUBLIC_PLAYER_ACTUAL") for r in results),
        "approved_gt3_camera_views":0,"status":"REVIEW_REQUIRED_OR_BLOCKED","sources":results}
(OUT/"manifest.json").write_text(json.dumps(report,indent=2)+"\n")
(OUT/"README.md").write_text("# Agent A2 Vimeo public embedded original source test\n"
 f"Real decoded >=1080p source video files: {report['original_native_films']}; "
 "Ferrari/McLaren model and Nürburgring racing status NOT automatically confirmed. "
 "Diagnostics are not video.\n")
pack=OUT/"GT3_A2_VIMEO_PUBLIC_EMBED_ACTUAL_MEDIA_OR_DIAGNOSTICS.zip"
with zipfile.ZipFile(pack,"w",zipfile.ZIP_STORED,allowZip64=True) as z:
 for f in OUT.rglob("*"):
  if f.is_file() and f!=pack:z.write(f,str(f.relative_to(OUT)))
with zipfile.ZipFile(pack) as z:
 assert z.testzip() is None
 for r in results:
  if r["status"].startswith("PUBLIC_PLAYER_ACTUAL"):
   assert hashlib.sha256(z.read(r["media_file"])).hexdigest()==r["sha256"]
print("VIMEO_PUBLIC_PROBE_COMPLETE",report["original_native_films"],"zip_bytes",pack.stat().st_size,"sha",sha(pack),flush=True)
