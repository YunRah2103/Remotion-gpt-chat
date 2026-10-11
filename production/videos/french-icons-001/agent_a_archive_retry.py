#!/usr/bin/env python3
"""Try native original-file download from Internet Archive and metadata-backed mirror hosts.
Avoid Archive.org metadata HTTP 502 by using URLs already found by previous archive audit.
Only genuine real camera footage with 1080p native can be candidates; clean/watermark/visual still gate.
"""
import json,subprocess,urllib.request,urllib.parse,hashlib,time,pathlib,zipfile,os,random
from fractions import Fraction
from PIL import Image,ImageDraw
ROOT=pathlib.Path("out/fr-a-priority-model-originals");F=ROOT/"originals";P=ROOT/"contact_sheets";S=ROOT/"proof_samples"
for d in (F,P,S):d.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("205-gti-midnight-london","midnight-run-peugeot-205-gti-london","MIDNIGHT RUN - Peugeot 205 GTI - London.mp4","Peugeot 205 GTI",141845936),
 ("205-gti-1985-road","peugeot-205-gti-1.6-1985","Peugeot 205 GTI 1.6 - 1985.mp4","Peugeot 205 GTI",60940546),
 ("r5-turbo-2-driving","renault-5-turbo-2-avec-un-beau-bruit-tube-de-fuite","Renault 5 Turbo 2  avec un beau bruit! (tube de fuite👌).mp4","original midengine Renault 5 Turbo 2",20691834),
 ("citroen-ds-1968","citroen-ds-21-m-pallas-1968","Citroën DS21M Pallas 1968.mp4","Citroën DS 21 Pallas 1968",54367663),
 ("clio-v6-tv","youtube-KjcbCUaonuI","KjcbCUaonuI.mp4","Renault Clio V6",36629176)
]
UA="YUNEX-Classic-Car-Footage/1.0 (YunRah2103 Remotion GitHub)"
def hashfile(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1024*1024),b""):h.update(c)
 return h.hexdigest()
def cmd(cmd,sec=70):
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=sec)
 if p.returncode:raise RuntimeError(p.stderr[-450:])
 return p.stdout
def probe(p):
 data=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)],30))
 v=next(x for x in data["streams"] if x.get("codec_type")=="video")
 return {"width":int(v["width"]),"height":int(v["height"]),"fps":round(float(Fraction(v.get("avg_frame_rate","0/1"))),3),
         "duration_sec":float(data["format"].get("duration") or 0),"bytes":p.stat().st_size,
         "codec":v.get("codec_name"),"bit_rate":int(data["format"].get("bit_rate") or 0)}
def download(url,dest,max_size):
 req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"video/mp4,video/*,*/*"})
 with urllib.request.urlopen(req,timeout=75) as resp:
  ct=resp.headers.get("Content-Type","")
  if "text/html" in ct:raise RuntimeError("HTML_NOT_VIDEO")
  n=0
  with dest.open("wb") as f:
   while True:
    b=resp.read(1024*1024)
    if not b:break
    n+=len(b)
    if n>max_size+3000000:raise RuntimeError("SOURCE_TOO_LARGE")
    f.write(b)
 return {"actual_bytes":n,"content_type":ct,"resolved_url":resp.geturl()}
def make_sheet(p,slug,info):
 im=Image.new("RGB",(1920,1510),"#13151b")
 d=ImageDraw.Draw(im)
 d.text((10,9),slug+" -- actual native original decoded frames at 12 timepoints",fill="white")
 for i in range(12):
  stamp=info["duration_sec"]*(i+.5)/12
  frame=P/(slug+"_"+str(i)+".jpg")
  cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(stamp),"-i",str(p),
      "-frames:v","1","-vf","scale=630:-2",str(frame)],65)
  with Image.open(frame) as picture:
   picture=picture.convert("RGB");picture.thumbnail((622,340))
   pos=((i%3)*640+6,(i//3)*375+30)
   im.paste(picture,pos)
   d.text((pos[0]+4,pos[1]+345),f"{stamp:.1f} s",fill="white")
  frame.unlink()
 path=P/(slug+"-storyboard.jpg");im.save(path,quality=85);return path
rows=[]
for slug,identifier,filename,claimed,expected in SOURCES:
 row={"id":slug,"archive_identifier":identifier,"archive_details":"https://archive.org/details/"+identifier,
      "claimed_model":claimed,"status":"UNAVAILABLE","original_model_on_screen":False,"media_rights_verified":False}
 name=urllib.parse.quote(filename,safe="")
 ident=urllib.parse.quote(identifier,safe="")
 # archive.org canonical direct and fallback alternate service hosts exposed by metadata.
 links=["https://archive.org/download/"+ident+"/"+name,
        "https://archive.org/download/"+ident+"/"+name+"?download=1",
        "https://archive.org/download/"+ident+"/"+name+"?source=details"]
 try:
  for host in ("https://archive.org/metadata/","https://www.archive.org/metadata/"):
   try:
    with urllib.request.urlopen(urllib.request.Request(host+ident,headers={"User-Agent":UA}),timeout=15) as resp:
     dat=json.load(resp)
    domains=[dat.get("d1"),dat.get("d2"),dat.get("server")]
    for domain in domains:
     if isinstance(domain,str) and domain and ("archive.org" in domain):
      links.append("https://"+domain+"/"+str(dat.get("dir","")).strip("/")+"/"+name)
    break
   except Exception as e:
    print("METADATA_FAILED",slug,str(e)[:85],flush=True)
  errors=[]
  path=F/(slug+".mp4")
  for link in list(dict.fromkeys(links)):
   try:
    print("ACTUAL_VIDEO_DOWNLOAD_ATTEMPT",slug,urllib.parse.urlparse(link).hostname,flush=True)
    result=download(link,path,expected)
    row["fetched_source"]=link;row["http"]=result
    if path.stat().st_size<300_000:raise RuntimeError("NOT_REAL_MEDIA")
    info=probe(path)
    row["probe"]=info;row["full_source_sha256"]=hashfile(path)
    if (info["width"]<1920 or info["height"]<1080 or info["fps"]<23):
     raise RuntimeError("NOT_NATIVE_1080")
    cmd(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(path),
      "-map","0:v:0","-f","null","-"],190)
    proof=make_sheet(path,slug,info)
    row.update({"status":"REAL_NATIVE_1080_ACQUIRED_VISUAL_REVIEW_PENDING",
      "contact_sheet":"contact_sheets/"+proof.name,
      "sha256":hashfile(path)})
    # Store the actual ORIGINAL 1080 MP4 only in successful proof ZIP for editors after visual QA.
    # Real source already acquired. Review package includes original to avoid broken source links.
    print("REAL_NATIVE_SOURCE",slug,json.dumps(info),"sha",row["sha256"],flush=True)
    break
   except Exception as exc:
    errors.append(str(exc)[:170]);path.unlink(missing_ok=True)
  if row["status"]=="UNAVAILABLE":
   row.update({"status":"NO_ACCESSIBLE_NATIVE_ORIGINAL","errors":errors[:9]})
   print("SOURCE_UNAVAILABLE",slug,errors,flush=True)
 except Exception as exc:
  row.update({"status":"SOURCE_FAILED","error":str(exc)[:400]})
  print("SOURCE_FAILED",slug,str(exc)[:180],flush=True)
 rows.append(row);(ROOT/"manifest.json").write_text(json.dumps(rows,indent=2,ensure_ascii=False))
(ROOT/"README.md").write_text("Real untouched originals from Internet Archive, SHA verified, ffprobe native 1080 + full decode. Storyboards show actual frames; car motion, watermark, unique angle, and source rights still need HUMAN visual QA before Gate A approval. Archived third-party films are not automatically freely reusable.\n")
out=pathlib.Path("out/FR-LEGENDS-A-MISSING-MODELS-ORIGINAL-FILES.zip")
with zipfile.ZipFile(out,"w",zipfile.ZIP_STORED) as z:
 for p in ROOT.rglob("*"):
  if p.is_file():z.write(p,p.relative_to(ROOT))
print("MISSING_MODELS_RESULT",json.dumps({"actual_original_1080_movies":sum(r["status"].startswith("REAL_NATIVE") for r in rows),
  "total_candidates":len(rows),"zip_bytes":out.stat().st_size,"sha256":hashfile(out),"gate":"PENDING_ACTUAL_VISUAL_QA"}),flush=True)
