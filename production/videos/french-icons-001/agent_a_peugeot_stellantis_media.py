#!/usr/bin/env python3
"""Try direct, public Stellantis archival Peugeot 205 GTI media source and native-HD variants.
Source discovered on Stellantis 15 October 2020 official 205 GTI restoration press release.
Do not invent clips when publisher responds with HTML/403 or serves <1080p.
"""
import pathlib,urllib.request,urllib.error,subprocess,json,hashlib,zipfile,shutil
from fractions import Fraction
P=pathlib.Path("out/fr-agent-a-peugeot-205-official");(P/"clips").mkdir(parents=True,exist_ok=True)
URLS=[
 ("psa-old-720","https://media-psa.groupe-psa.com/pm_1_2976_2976686-tnlu8x5amt-720.mp4"),
 ("stellantis-current-720","https://stellantis.dam-broadcast.com/pm_12034_2976_2976686-tnlu8x5amt-720.mp4"),
 ("stellantis-current-1080","https://stellantis.dam-broadcast.com/pm_12034_2976_2976686-tnlu8x5amt-1080.mp4"),
 ("psa-1080","https://media-psa.groupe-psa.com/pm_1_2976_2976686-tnlu8x5amt-1080.mp4"),
]
H={"User-Agent":"Mozilla/5.0","Accept":"video/mp4,*/*",
   "Referer":"https://www.media.stellantis.com/it-it/peugeot/press/una-peugeot-205-gti-e-la-prima-auto-restaurata-da-l-aventure-peugeot"}
def cmd(a):
 r=subprocess.run(a,timeout=130,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr[-400:])
 return r.stdout
def probe(p):
 j=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
 v=next(x for x in j["streams"] if x.get("codec_type")=="video"); f=v.get("avg_frame_rate","0/1")
 return {"width":int(v["width"]),"height":int(v["height"]),
    "fps":float(Fraction(f)),"duration_sec":float(j.get("format",{}).get("duration") or 0)}
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
rows=[]
for name,url in URLS:
 r={"id":name,"url":url,"status":"NOT_AVAILABLE","model_identity_verified":False}
 try:
  q=urllib.request.Request(url,headers={**H,"Range":"bytes=0-1048575"})
  with urllib.request.urlopen(q,timeout=30) as response:
   ct=response.headers.get("Content-Type","")
   code=response.status; length=int(response.headers.get("Content-Length") or 0)
   header=response.read(200_000)
   final=response.geturl()
  print("SOURCE_REQUEST",name,code,ct,length,"head",header[:24],flush=True)
  r.update({"http_code":code,"content_type":ct,"reported_content_bytes":length,
            "redirected_to":final})
  if not (b"ftyp" in header[:80] or b"moov" in header[:80]):
   raise RuntimeError("NOT_MP4_HEADER_OR_HTML_PAGE")
  if name.endswith("720"):
   r["status"]="PUBLIC_MP4_720_VARIANT_EXISTS_UNPROVEN_HD"
   continue
  # Don't download if huge; original 1080 expected under 150MB
  with urllib.request.urlopen(urllib.request.Request(url,headers=H),timeout=50) as response:
   if int(response.headers.get("Content-Length") or 0)>200_000_000:raise RuntimeError("ABOVE_MAX_FILE_BYTES")
   target=P/"clips"/"official-peugeot-205-gti-restoration-1080.mp4"
   n=0
   with target.open("wb") as f:
    while True:
     blob=response.read(1<<20)
     if not blob:break
     n+=len(blob)
     if n>200_000_000:raise RuntimeError("ABOVE_MAX_BYTES")
     f.write(blob)
  p=probe(target)
  if (p["width"],p["height"])!=(1920,1080):raise RuntimeError("NOT_NATIVE_1920X1080")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(target),"-map","0:v:0","-f","null","-"])
  from PIL import Image,ImageDraw
  sheet=Image.new("RGB",(1440,1250),"#131519")
  for i in range(10):
   t=p["duration_sec"]*(i+.5)/10
   frame=P/(str(i)+".jpg")
   cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),"-i",str(target),
     "-frames:v","1","-vf","scale=700:-2",str(frame)])
   with Image.open(frame) as im:
    im=im.convert("RGB");im.thumbnail((700,245));sheet.paste(im,((i%2)*720,(i//2)*246))
   frame.unlink()
  sheet.save(P/"peugeot-205-10-frame-preview.jpg",quality=86)
  r.update({"status":"NATIVE_HD_ORIGINAL_AVAILABLE_REVIEW_PENDING","probe":p,"sha256":sha(target)})
  print("ACTUAL_PEUGEOT_HD",json.dumps({"size":n,"probe":p,"sha256":r["sha256"]}),flush=True)
  break
 except Exception as e:
  r["error"]=str(e)[:450]
  print("SOURCE_REJECT",name,r["error"],flush=True)
 rows.append(r);(P/"manifest.json").write_text(json.dumps(rows,indent=2))
(P/"README.md").write_text("Official Peugeot/Stellantis 205 GTI restoration source, public technical test. DO NOT count clip without visual driving and exact model QA; press licensing not automatically authorising use.\n")
z=pathlib.Path("out/FR-LEGENDS-A-PEUGEOT-205-STELLANTIS-TECHNICAL.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_STORED) as arc:
 for f in P.rglob("*"):
  if f.is_file():arc.write(f,f.relative_to(P))
print("PEUGEOT_TEST_FINAL",json.dumps({"native_files":sum(x["status"].startswith("NATIVE_HD") for x in rows),"zip_bytes":z.stat().st_size}),flush=True)
