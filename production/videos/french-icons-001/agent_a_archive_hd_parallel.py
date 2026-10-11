#!/usr/bin/env python3
"""Concurrency-limited *real* Internet Archive original film acquisition.

Retries transient 500/502 and resolved archive mirror. Download only real physical MP4s,
verify 1920x1080+ and screen-grab real frames. No auto approvals or false ZIP claims.
"""
import concurrent.futures,json,urllib.request,urllib.parse,subprocess,hashlib,zipfile,shutil,os,time,pathlib
from fractions import Fraction
from PIL import Image,ImageDraw
ROOT=pathlib.Path("out/fr-legends-a-priority-hd-retry"); MEDIA=ROOT/"originals";PROOFS=ROOT/"contact_sheets"; SAMPLES=ROOT/"samples"
for x in (MEDIA,PROOFS,SAMPLES):x.mkdir(parents=True,exist_ok=True)
SOURCES=[
("205-gti-1985","peugeot-205-gti-1.6-1985","Peugeot 205 GTI 1.6 - 1985.mp4","Peugeot 205 GTI",60940546),
("205-gti-vs-turbo","peugeot-205-gti-1.9-renault-5-gt-turbo-english-subtitled","Peugeot 205 GTi 1.9 - Renault 5 GT Turbo English subtitled.mp4","Peugeot 205 GTI",190745889),
("205-gti-mi16-competition","peugeot-205-mi-16-vs-205-gti","Peugeot 205 Mi16 vs 205 GTI.mp4","Peugeot 205 GTI",40562646),
("clio-v6-topgear","youtube-KjcbCUaonuI","KjcbCUaonuI.mp4","Renault Clio V6",36629176),
("205-gti-classic-review","owning-a-peugeot-205-1.9-gti-classic-car-review","Owning A Peugeot 205 1.9 GTI    Classic Car Review.mp4","Peugeot 205 GTI",157035943),
("205-gti-midnight","midnight-run-peugeot-205-gti-london","MIDNIGHT RUN - Peugeot 205 GTI - London.mp4","Peugeot 205 GTI",141845936),
("r5-turbo-2","renault-5-turbo-2-avec-un-beau-bruit-tube-de-fuite","Renault 5 Turbo 2  avec un beau bruit! (tube de fuite👌).mp4","Renault 5 Turbo 2",20691834),
("ds-1968-pallas","citroen-ds-21-m-pallas-1968","Citroën DS21M Pallas 1968.mp4","Citroën DS21 Pallas",54367663)
]
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1<<20),b""):h.update(c)
 return h.hexdigest()
def command(a,t=120):
 x=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if x.returncode:raise RuntimeError(x.stderr[-500:])
 return x.stdout
def details(p):
 d=json.loads(command(["ffprobe","-v","error","-show_entries","format=duration,size,bit_rate:stream=codec_type,width,height,avg_frame_rate,codec_name","-of","json",str(p)],60))
 st=next(x for x in d["streams"] if x.get("codec_type")=="video")
 return {"width":int(st["width"]),"height":int(st["height"]),"fps":float(Fraction(st.get("avg_frame_rate","0/1"))),
         "duration":float(d["format"]["duration"]),"bitrate":int(d["format"].get("bit_rate") or 0),
         "codec":st.get("codec_name")}
def try_download(url,target,maximum):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Accept":"video/mp4,*/*"})
 with urllib.request.urlopen(req,timeout=42) as r:
  ct=r.headers.get("Content-Type","")
  if ct.startswith("text/"):raise RuntimeError("HTML_NOT_VIDEO")
  if int(r.headers.get("Content-Length") or 0)>maximum:raise RuntimeError("REMOTE_FILE_OVER_CAP")
  count=0
  with target.open("wb") as dest:
   for b in iter(lambda:r.read(1<<20),b""):
    count+=len(b)
    if count>maximum:raise RuntimeError("OVER_CAP")
    dest.write(b)
 return count
def sample(p,label,seconds):
 canvas=Image.new("RGB",(1420,880),"#12151a")
 draw=ImageDraw.Draw(canvas);draw.text((10,5),label+" 8 frames decoded from real full video",fill="white")
 for i in range(8):
  tick=(i+.5)/8*seconds
  shot=PROOFS/(label+str(i)+".jpg")
  command(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(tick),
    "-i",str(p),"-frames:v","1","-vf","scale=700:-2",str(shot)],60)
  with Image.open(shot) as im:
   im=im.convert("RGB");im.thumbnail((700,198))
   x=(i%2)*710+5;y=(i//2)*211+26
   canvas.paste(im,(x,y))
  shot.unlink()
 canvas.save(PROOFS/(label+"-8-original-real-frames.jpg"),quality=86)
def get(item):
 slug,ident,name,model,size=item
 result={"id":slug,"identifier":ident,"source":"https://archive.org/details/"+ident,"model_claimed":model,
   "status":"NOT_ACQUIRED","on_screen_model_verified":False,"shots_approved":0}
 dest=MEDIA/(slug+".mp4")
 enc_ident=urllib.parse.quote(ident);enc_name=urllib.parse.quote(name)
 url=f"https://archive.org/download/{enc_ident}/{enc_name}"
 endpoints=[url,url+"?download=1",url+"?download=1&refresh=1",
    f"https://www.archive.org/download/{enc_ident}/{enc_name}"]
 errors=[]
 for attempt,source in enumerate(endpoints):
  try:
   n=try_download(source,dest,230_000_000)
   info=details(dest)
   print("REAL_FILE_PROBE",slug,"attempt",attempt,json.dumps(info),flush=True)
   result["probe"]=info;result["sha256"]=digest(dest)
   if info["width"]<1920 or info["height"]<1080 or info["fps"]<23:
    raise RuntimeError("REAL_SOURCE_BELOW_NATIVE_1080")
   command(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(dest),"-map","0:v:0","-f","null","-"],170)
   sample(dest,slug,info["duration"])
   result.update({"status":"NATIVE_HD_ACQUIRED_HUMAN_REVIEW_PENDING","source_url":source,
      "physical_original_bytes":n,"contact_sheet":"contact_sheets/"+slug+"-8-original-real-frames.jpg"})
   print("REAL_FILM_DOWNLOADED",slug,"bytes",n,"sha",result["sha256"],flush=True)
   # Unapproved original is not eligible for editor-ready pack; QA samples and hashes first
   dest.unlink()
   return result
  except Exception as e:
   errors.append(str(e)[:200]);dest.unlink(missing_ok=True)
   print("ATTEMPT_REJECTED",slug,attempt,str(e)[:150],flush=True)
   time.sleep(min(1+attempt,4))
 result["errors"]=errors; result["status"]="BLOCKED_NO_TRUE_NATIVE_SOURCE"
 return result
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 futures=[pool.submit(get,x) for x in SOURCES]
 for task in concurrent.futures.as_completed(futures):
  rows.append(task.result())
  (ROOT/"manifest.json").write_text(json.dumps(rows,indent=2))
(ROOT/"README.md").write_text("Only full original MP4 files from archive, ffprobe + real contact sheet QA. Downloaded original bytes discarded after exact video fingerprint and frame sampling; editors should download original from recorded source URL only if rights cleared. Unapproved footage never added to Editor ZIP. Preserve accurate counts.\n")
zipfile_out=pathlib.Path("out/FR-LEGENDS-A-PRIORITY-HD-CAR-REVIEW.zip")
with zipfile.ZipFile(zipfile_out,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for p in ROOT.rglob("*"):
  if p.is_file():z.write(p,p.relative_to(ROOT))
print("PRIORITY_RETRY_SUMMARY",json.dumps({"tested":len(rows),"native_HD_actual":sum(x["status"].startswith("NATIVE_HD") for x in rows),
    "zip_bytes":zipfile_out.stat().st_size,"gate":"NOT_PASSED"}),flush=True)
