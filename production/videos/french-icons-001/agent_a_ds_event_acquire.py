#!/usr/bin/env python3
"""True-HD-only ingestion of DIRECT published French-classic rally/event media.

No video is marked French-classic model ID approved before watching real frames.
Searches disclosed source URLs; does not access logins, restricted content, or DRM.
"""
import hashlib,json,csv,subprocess,urllib.request,urllib.parse,zipfile,os
from pathlib import Path
from fractions import Fraction
ROOT=Path("out/fr-a-ds-direct");RAW=ROOT/"originals"; SHEETS=ROOT/"contact_sheets";CLIPS=ROOT/"clips"
for d in [RAW,SHEETS,CLIPS]:d.mkdir(parents=True,exist_ok=True)
URLS=[
("historic-rally-start-1","https://www.salonkyhk.cz/wp-salonkyhk/wp-content/uploads/2025/05/WhatsApp-Video-2025-05-03-at-12.11.10.mp4","1963 Citroën DS possibility in mixed 2025 rally"),
("historic-rally-start-2","https://www.salonkyhk.cz/wp-salonkyhk/wp-content/uploads/2025/05/WhatsApp-Video-2025-05-03-at-13.53.16-kopie.mp4","1963 Citroën DS possibility in mixed 2025 rally"),
("historic-rally-day-1","https://www.salonkyhk.cz/wp-salonkyhk/wp-content/uploads/2025/05/Video-prvni-den-cesty.mp4","1963 Citroën DS possibility in mixed 2025 rally"),
("historic-rally-day-2","https://www.salonkyhk.cz/wp-salonkyhk/wp-content/uploads/2025/05/WhatsApp-Video-2025-05-04-at-13.26.45-kopie.mp4","1963 Citroën DS possibility in mixed 2025 rally"),
("historic-rally-cut","https://www.salonkyhk.cz/wp-salonkyhk/wp-content/uploads/2025/05/da6c586a-622c-4e57-85f3-6b18b95f7e8c-online-video-cutter.com_.mp4","1963 Citroën DS possibility in mixed 2025 rally"),
]
def call(cmd,timeout=100):
 p=subprocess.run(cmd,timeout=timeout,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[-400:])
 return p.stdout
def digest(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def probe(f):
 j=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)]))
 v=next(x for x in j.get("streams",[]) if x.get("codec_type")=="video")
 n=v.get("avg_frame_rate","0/1");w,h=int(v["width"]),int(v["height"])
 return {"width":w,"height":h,"fps":float(Fraction(n)) if n!="0/0" else 0,
         "duration":float(j.get("format",{}).get("duration") or 0),"codec":v.get("codec_name"),
         "bit_rate":int(j.get("format",{}).get("bit_rate") or 0),"audio":any(x.get("codec_type")=="audio" for x in j.get("streams",[]))}
def native(p):
 w,h=p["width"],p["height"]
 return ((w>=1920 and h>=1080 and w<=3840 and h<=2160 and abs(w/h-16/9)<.04)
   or (w>=1080 and h>=1920 and w<=2160 and h<=3840 and abs(w/h-9/16)<.04)) and p["fps"]>=23
def fetch(url,path):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=45) as r:
  typ=r.headers.get("Content-Type","")
  if not ("video/" in typ or "application/octet-stream" in typ):
   raise RuntimeError("NOT_VIDEO_CONTENT_TYPE_"+typ)
  size=int(r.headers.get("Content-Length") or 0)
  if size>110_000_000:raise RuntimeError("OVER_MAX_BYTES_"+str(size))
  n=0
  with path.open("wb") as f:
   while True:
    b=r.read(1<<20)
    if not b:break
    n+=len(b)
    if n>110_000_000:raise RuntimeError("OVER_MAX_BYTES")
    f.write(b)
  return n
rows=[]
for slug,url,comment in URLS:
 record={"id":slug,"source_url":url,"source_creator":"Salonky editorial / actual videographer unknown",
    "identity_note":comment,"rights_status":"UNVERIFIED","automated_technical_status":"NOT_TESTED",
    "manual_motion_and_vehicle_qa":"PENDING","gate_counted":False}
 original=RAW/(slug+".mp4")
 try:
  record["bytes"]=fetch(url,original)
  record["original_sha256"]=digest(original)
  m=probe(original); record["original_probe"]=m
  print("SOURCE_PROBE",slug,json.dumps(m),flush=True)
  if not native(m):raise RuntimeError("NATIVE_HD_GATE_FAILED")
  call(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(original),"-map","0:v:0","-f","null","-"],150)
  frames=[]
  for i,fraction in enumerate((.09,.3,.5,.7,.91)):
   dest=SHEETS/(slug+"-"+str(i)+".jpg")
   call(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(m["duration"]*fraction),"-i",str(original),
      "-frames:v","1","-vf","scale=640:-2","-y",str(dest)],40)
   frames.append(dest)
  from PIL import Image,ImageDraw
  sheet=Image.new("RGB",(1300,760),"#0b1015");painter=ImageDraw.Draw(sheet)
  painter.text((20,10),slug+" (REAL source decoded five frames)",fill="white")
  for i,f in enumerate(frames):
   with Image.open(f) as image:
    im=image.convert("RGB");im.thumbnail((410,350))
   sheet.paste(im,((i%3)*425+10,(i//3)*370+37))
   f.unlink()
  proof=SHEETS/(slug+".jpg");sheet.save(proof,quality=86)
  excerpt=CLIPS/(slug+".mp4")
  start=min(3,max(0,m["duration"]*.12))
  length=min(8,m["duration"]-start-.1)
  if length<3:raise RuntimeError("TOO_SHORT")
  call(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(original),"-t",str(length),
        "-c:v","libx264","-crf","18","-preset","veryfast","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k",str(excerpt)],180)
  record.update({"automated_technical_status":"NATIVE_HD_DECODE_PASS_IDENTITY_UNVERIFIED",
    "probe_extract":probe(excerpt),"clip_sha256":digest(excerpt),
    "source_in_sec":start,"source_out_sec":round(start+length,3),"clip_path":"clips/"+excerpt.name,
    "proof":"contact_sheets/"+proof.name})
 except Exception as e:
  record.update({"automated_technical_status":"REJECTED_OR_UNAVAILABLE","reason":str(e)[:500]})
  original.unlink(missing_ok=True)
  (CLIPS/(slug+".mp4")).unlink(missing_ok=True)
  print("REJECT",slug,record["reason"],flush=True)
 rows.append(record);(ROOT/"manifest.json").write_text(json.dumps(rows,indent=2))
 (ROOT/"manifest.csv").write_text("id,technical_status,source_url,make_model_identity_verified\n"+
   "\n".join(f"{r['id']},{r['automated_technical_status']},{r['source_url']},false" for r in rows))
n=sum(r["automated_technical_status"].startswith("NATIVE_HD") for r in rows)
(ROOT/"README.md").write_text(f"Source audit: {len(rows)} original videos examined; {n} native 1080p+ valid, identity pending. Raw originals and contact sheets in this technical-candidate pack. None accepted to YUNEX until clip visual QA. No rights claimed.\n")
z=Path("out/fr-legends-a-direct-event-candidates.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as archive:
 for p in ROOT.rglob("*"):
  if p.is_file():archive.write(p,p.relative_to(ROOT))
print("EVENT_ZIP",json.dumps({"technical_candidates":n,"zip_bytes":z.stat().st_size,"sha256":digest(z),"gate_pass":False}),flush=True)
