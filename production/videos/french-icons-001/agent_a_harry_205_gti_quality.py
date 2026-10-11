#!/usr/bin/env python3
"""Download, decode and visually QA ORIGINAL clean 205 GTI video (Harry's Garage)
plus rally circuit backup. Sources are public archived copies, reuse unverified.
Do not count a clip until actual screenshot QA and licensing review.
"""
import json, urllib.request, urllib.parse, hashlib, subprocess, pathlib, zipfile, shutil,time
from PIL import Image,ImageDraw
from fractions import Fraction
ROOT=pathlib.Path("out/fr-a-peugeot-clean-hero-qa")
ORIG=ROOT/"originals"; SHEETS=ROOT/"sheets"
for folder in [ORIG,SHEETS]:folder.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("peugeot-205-gti-harrys-garage",
  "peugeot-205-gti-1.9.-is-this-the-best-hot-hatch-ever",
  "Peugeot 205 GTI 1.9 (classic)","Original Harry's Garage long-form road test; expected clean visual"),
 ("peugeot-205-gti-circuit-lap",
  "record-hunt-at-alastaro-circuit-my-track-record-peugeot-205-gti-1.9",
  "Peugeot 205 GTI 1.9 (classic)","Potential real circuit driving shots, cockpit risk")
]
UA="Mozilla/5.0 (compatible; YUNEX-video-quality-review)"
def hashfile(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
def cmd(args,t=140):
 p=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-550:])
 return p.stdout
def probe(p):
 j=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)],50))
 v=next(x for x in j["streams"] if x.get("codec_type")=="video")
 return {"width":v["width"],"height":v["height"],"fps":round(float(Fraction(v["avg_frame_rate"])),3),
  "duration":float(j["format"].get("duration") or 0),"codec":v.get("codec_name"),
  "original_bytes":p.stat().st_size,"original_bitrate":int(j["format"].get("bit_rate") or 0)}
def jsonreq(url,t=26):
 with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":UA}),timeout=t) as r:return json.load(r)
def download(url,target,cap):
 req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"video/*,*/*"})
 with urllib.request.urlopen(req,timeout=90) as r:
  count=0
  with target.open("wb") as f:
   while True:
    block=r.read(1<<20)
    if not block:break
    count+=len(block)
    if count>cap:raise RuntimeError("FILE_TOO_LARGE")
    f.write(block)
 return count
def frames(p,slug,duration):
 # Full longform inspection: one decoded frame every ~12 seconds, max 48 frames, each source segment independently.
 n=min(48,max(16,int(duration/12)))
 for start in range(0,n,16):
  end=min(n,start+16)
  board=Image.new("RGB",(1920,1510),"#12161c")
  dr=ImageDraw.Draw(board)
  dr.text((15,10),f"{slug} | Real original source frames {start+1}-{end} / {n}",fill="white")
  for i in range(start,end):
   sec=duration*(i+.5)/n
   jpg=SHEETS/(slug+f"_{i:02d}.jpg")
   cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(sec),"-i",str(p),
    "-frames:v","1","-vf","scale=468:-2",str(jpg)],75)
   with Image.open(jpg) as pic:
    pic=pic.convert("RGB");pic.thumbnail((463,325))
    x=((i-start)%4)*480+5
    y=((i-start)//4)*370+32
    board.paste(pic,(x,y))
    dr.text((x+3,y+340),f"{sec:.1f}s",fill="#ffffff")
   jpg.unlink()
  board.save(SHEETS/(slug+f"-frames-{start:02d}-{end:02d}.jpg"),quality=88)
rows=[]
for slug,ident,model,desc in SOURCES:
 row={"id":slug,"identifier":ident,"target":model,"description":desc,
  "status":"NOT_FETCHED","usable_approved_shots":0,"clean_watermark_verified":False,
  "visual_car_motion_verified":False,"license_confirmed":False}
 p=ORIG/(slug+".mp4")
 try:
  data=None
  for attempt in range(3):
   try:data=jsonreq("https://archive.org/metadata/"+urllib.parse.quote(ident));break
   except Exception as e:
    print("META_RETRY",slug,attempt,str(e)[:150],flush=True);time.sleep(2+attempt)
  if data is None:raise RuntimeError("METADATA_SERVER_UNAVAILABLE")
  files=[x for x in data.get("files",[]) if x.get("name","").lower().endswith(".mp4") and x.get("source")=="original"]
  files.sort(key=lambda x:int(x.get("size") or 0),reverse=True)
  if not files:raise RuntimeError("NO_PUBLISHER_ORIGINAL")
  chosen=files[0];expected=int(chosen.get("size") or 0)
  if expected>650_000_000:raise RuntimeError("SOURCE_TOO_LARGE_650MB_CAP")
  url="https://archive.org/download/"+urllib.parse.quote(ident)+"/"+urllib.parse.quote(chosen["name"])
  row.update({"source_url":url,"archive_page":"https://archive.org/details/"+ident,
    "original_filename":chosen["name"],"expected_original_bytes":expected,
    "archive_license_url":data.get("metadata",{}).get("licenseurl")})
  for attempt in range(3):
   try:
    n=download(url+("" if attempt==0 else "?download=1"),p,650_000_000)
    if expected and n!=expected:raise RuntimeError("TRUNCATED_ORIGINAL")
    break
   except Exception as e:
    p.unlink(missing_ok=True)
    print("DOWNLOAD_RETRY",slug,attempt,str(e)[:170],flush=True)
    if attempt==2:raise
    time.sleep(attempt+2)
  row["sha256"]=hashfile(p)
  info=probe(p);row["probe"]=info
  print("SOURCE_ACTUAL_HD_QA",slug,json.dumps(info),row["sha256"],flush=True)
  if int(info["width"])<1920 or int(info["height"])<1080 or info["fps"]<23:
   raise RuntimeError("FAIL_NATIVE_1080_HD")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(p),
      "-map","0:v:0","-f","null","-"],650)
  frames(p,slug,info["duration"])
  row.update({"status":"REAL_NATIVE_FULLHD_HUMAN_VISUAL_QA_PENDING","screenshots":sorted(str(x.relative_to(ROOT)) for x in SHEETS.glob(slug+"-*.jpg"))})
 except Exception as e:
  row.update({"status":"NO_ELIGIBLE_VIDEO","error":str(e)[:450]})
  print("SOURCE_REJECTED",slug,row["error"],flush=True)
 finally:
  # Keep full source only in runner ephemeral, original available at recorded direct URI.
  p.unlink(missing_ok=True)
  rows.append(row)
  (ROOT/"manifest.json").write_text(json.dumps(rows,indent=2,ensure_ascii=False))
(ROOT/"README.md").write_text("This ZIP has real decoded original frame contact sheets, full file SHA256, bitrate/resolution/duration. Quality/source rights and clean shots need human review, 0 approved until visual/editor gate. No fake upscaling or gameplay. Original full source files are accessible via direct URL in manifest but NOT bundled in QA ZIP.\n")
Z=pathlib.Path("out/FR-A-PEUGEOT-HERO-SOURCE-VIDEO-QA.zip")
with zipfile.ZipFile(Z,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as archive:
 for p in ROOT.rglob("*"):
  if p.is_file():archive.write(p,p.relative_to(ROOT))
print("REAL_205_GTI_HERO_SEARCH",json.dumps({"films_native_hd":sum(x["status"].startswith("REAL_NATIVE") for x in rows),
 "films_tested":len(rows),"zip_bytes":Z.stat().st_size,"gate":"PENDING_VISUAL_QA"}),flush=True)
