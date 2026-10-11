#!/usr/bin/env python3
"""Download original Alpine-Renault Classic press film through its PUBLIC download endpoint.

The official 2013 Monte-Carlo Historique 1080p video is listed at:
https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/?lang=deu
This is not scraping the Vimeo player, bypassing authentication or DRM.
"""
import hashlib,json,zipfile,urllib.request,urllib.parse,subprocess,shutil,re,time
from pathlib import Path
from fractions import Fraction
BASE=Path("out/fr-agent-a-official-alpine");RAW=BASE/"originals";PRE=BASE/"contact_sheets";CLIPS=BASE/"clips"
for p in [RAW,PRE,CLIPS]:p.mkdir(parents=True,exist_ok=True)
URLS=[("alpine-2013-monte-carlo-historique","https://presse.alpinecars.de/download?vid=1&aid=5761","Alpine Renault 1960s/70s A110 at 2013 rally"),
      ("alpine-1973-period-archive","https://presse.alpinecars.de/download?vid=1&aid=4123","1973 rally 480p listed; REJECT under native HD contract")]
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def cmd(a,timeout=120):
 p=subprocess.run(a,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-600:])
 return p.stdout
def probe(p):
 d=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
 v=next(x for x in d.get("streams",[]) if x["codec_type"]=="video")
 fr=v.get("avg_frame_rate","0/1")
 return {"width":int(v["width"]),"height":int(v["height"]),
         "fps":float(Fraction(fr)) if fr!="0/0" else 0,
         "codec":v.get("codec_name"),"duration":float(d["format"].get("duration") or 0),
         "size_bytes":p.stat().st_size,"bit_rate":int(d["format"].get("bit_rate") or 0),
         "audio":any(x.get("codec_type")=="audio" for x in d.get("streams",[]))}
def download(url,path):
 request=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Referer":"https://presse.alpinecars.de/"})
 with urllib.request.urlopen(request,timeout=75) as resp:
  length=int(resp.headers.get("Content-Length") or 0);kind=resp.headers.get("Content-Type","")
  final=resp.geturl()
  print("HTTP",resp.status,"TYPE",kind,"SIZE_HEADER",length,"REDIRECT",final[:320],flush=True)
  if length>460_000_000: raise RuntimeError("ORIGINAL_OVER_MAX_BYTELIMIT_"+str(length))
  count=0
  with path.open("wb") as f:
   while True:
    chunk=resp.read(1<<20)
    if not chunk:break
    count+=len(chunk)
    if count>460_000_000:raise RuntimeError("MAX_BYTES")
    f.write(chunk)
  return {"bytes":count,"content_type":kind,"final_url":final}
def make_sheet(p,slug,duration):
 from PIL import Image,ImageDraw
 canvas=Image.new("RGB",(1460,1050),"#111218")
 draw=ImageDraw.Draw(canvas);draw.text((12,8),slug+" / 10 real source frames",fill="white")
 for i in range(10):
  at=min(duration-.1, duration*(i+.5)/10)
  f=PRE/(slug+"-"+str(i)+".jpg")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(at),"-i",str(p),
       "-frames:v","1","-vf","scale=700:-2",str(f)],100)
  with Image.open(f) as im:
   im=im.convert("RGB");im.thumbnail((700,190))
   canvas.paste(im,((i%2)*728+8,(i//2)*206+23))
  f.unlink(missing_ok=True)
 out=PRE/(slug+"-full-source-contact.jpg");canvas.save(out,quality=86)
 return str(out.relative_to(BASE))
results=[]
for slug,url,note in URLS[:1]:
 row={"id":slug,"official_source_page":"https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/?lang=deu",
      "download_link":url,"claimed_identity":note,"verified_model_identity":False,"original_res_native_verified":False,
      "unique_driving_shots_verified":0,"publication_permission_checked":False,
      "status":"UNAVAILABLE"}
 try:
  target=RAW/(slug+"-download")
  meta=download(url,target)
  row["response"]=meta;row["download_sha256"]=sha(target)
  if target.stat().st_size<200000:raise RuntimeError("NOT_A_REAL_VIDEO")
  # Publisher may serve an actual video, or a ZIP containing a media MP4.
  candidates=[]
  if zipfile.is_zipfile(target):
   with zipfile.ZipFile(target) as archive:
    for x in archive.infolist():
     if x.filename.lower().endswith((".mp4",".mov",".mkv",".webm")) and not x.is_dir() and x.file_size<450_000_000:
      path=RAW/(slug+"-"+Path(x.filename).name)
      with archive.open(x) as src,open(path,"wb") as dest:shutil.copyfileobj(src,dest,1<<20)
      candidates.append(path)
  else:
   suffix=".mp4" if target.read_bytes()[:12].find(b"ftyp")>=0 else ".media"
   real=target.with_suffix(suffix);target.rename(real);candidates=[real]
  for i,f in enumerate(candidates):
   m=probe(f);row["probe"]=m
   if not (m["width"]>=1920 and m["height"]>=1080 and m["height"]<=2160 and m["fps"]>=23):
    raise RuntimeError("NATIVE_RESOLUTION_TOO_LOW_"+str(m))
   cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(f),"-map","0:v:0","-f","null","-"],300)
   row.update({"original_res_native_verified":True,"original_sha256":sha(f),
     "original_file":str(f.relative_to(BASE)),
     "contact_sheet":make_sheet(f,slug,m["duration"]),
     "status":"REAL_1080P_SOURCE_DOWNLOADED_FFMPEG_PASS_HUMAN_VISUAL_REVIEW_PENDING"})
   print("REAL_OFFICIAL_ALPINE_FULL_HD_VIDEO",json.dumps({"id":slug,"probe":m,"source_sha256":sha(f)}),flush=True)
 except Exception as ex:
  row.update({"status":"DOWNLOAD_OR_QUALITY_FAILED","error":str(ex)[:800]})
  print("SOURCE_FAIL",slug,row["error"],flush=True)
 results.append(row);(BASE/"manifest.json").write_text(json.dumps(results,indent=2))
 (BASE/"README.md").write_text("Official Alpine 2013 historical A110 film direct download check. All files in originals are real fetched bytes, not fake media. Visual identity and moving-camera angle review required before Gate A approval. Press publisher reuse terms may limit usage.\n")
z=Path("out/fr-legends-a-official-alpine-montecarlo.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED,compresslevel=0) as archive:
 for f in BASE.rglob("*"):
  if f.is_file():archive.write(f,f.relative_to(BASE))
print("OFFICIAL_ALPINE_RESULT",json.dumps({"status":results[0]["status"],"zip_size":z.stat().st_size,
                                          "zip_sha256":sha(z),"verified_full_hd":results[0]["original_res_native_verified"]}),flush=True)
