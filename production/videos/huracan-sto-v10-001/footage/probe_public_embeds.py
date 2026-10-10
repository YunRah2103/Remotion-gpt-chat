#!/usr/bin/env python3
"""Attempt public Vimeo embed progressive MP4s, no signed-in requests or bypass.
Records failed authorization and rejects below-FHD/portrait sources.
"""
from pathlib import Path
import urllib.request,urllib.parse,json,subprocess,hashlib,zipfile
from PIL import Image,ImageDraw
OUT=Path("out/sto-vimeo-public-embeds");OUT.mkdir(parents=True,exist_ok=True)
targets=[("directors-cut","585861142"),("sto-charlotte","566128123"),("sto-cinematic","808787211"),("sto-second-film","659374941"),("sto-campaign","513872033")]
records=[];used=0;obtained=0
def request(url):return urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; public-embed-qa/1.0)","Referer":"https://player.vimeo.com/"})
def probe(f):
 r=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],capture_output=True,text=True,timeout=45)
 if r.returncode:raise ValueError("Invalid ffprobe")
 j=json.loads(r.stdout);v=next(x for x in j["streams"] if x["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"duration":float(j["format"]["duration"]),"bytes":f.stat().st_size,"sha256":hashlib.sha256(f.read_bytes()).hexdigest()}
def sheet(f,info,slug):
 dur=info["duration"]; im=Image.new("RGB",(960,6*152),"#0b0d12");drawer=ImageDraw.Draw(im)
 for i in range(24):
  t=max(.04,min(dur-.06,dur*(i+.5)/24));p=OUT/"tmp.jpg"
  run=subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-ss",str(t),"-i",str(f),"-vf","scale=240:135","-frames:v","1",str(p)],capture_output=True,timeout=45)
  if p.exists():
   with Image.open(p) as a: im.paste(a.convert("RGB"),((i%4)*240,(i//4)*152+17))
   p.unlink()
  drawer.text(((i%4)*240+3,(i//4)*152+2),f"{t:.1f}s",fill="white")
 im.save(OUT/(slug+"_contact.jpg"),quality=85)
for name,vid in targets:
 rec={"name":name,"vimeo_page":"https://vimeo.com/"+vid,"rights":"not-cleared","state":"NO_VIDEO"}
 records.append(rec)
 if obtained>=2 or used>500_000_000:
  rec["state"]="SKIPPED_PACKAGE_LIMIT";continue
 try:
  with urllib.request.urlopen(request("https://player.vimeo.com/video/"+vid+"/config"),timeout=20) as resp:
   cfg=json.loads(resp.read(2_000_000))
  pr=cfg.get("request",{}).get("files",{}).get("progressive",[])
  if not pr:rec["state"]="NO_PUBLIC_PROGRESSIVE_DOWNLOAD";continue
  valid=[v for v in pr if v.get("width",0)>=1920 and v.get("height",0)>=1080 and v.get("width",0)>v.get("height",0) and v.get("url","").startswith("https://")]
  if not valid:
   rec.update(state="NO_FULL_HD_LANDSCAPE",available=[{"width":v.get("width"),"height":v.get("height")} for v in pr]);continue
  chosen=sorted(valid,key=lambda r:(r["width"],r["height"]),reverse=True)[0]
  rec["listed_resolution"]=[chosen["width"],chosen["height"]]
  f=OUT/(name+".mp4");count=0
  with urllib.request.urlopen(request(chosen["url"]),timeout=25) as response:
   if int(response.headers.get("Content-Length","0") or 0)>280_000_000:raise ValueError("Master exceeds filesize limit")
   with f.open("wb") as dest:
    while True:
     chunk=response.read(1024*1024)
     if not chunk:break
     count+=len(chunk)
     if count>280_000_000:raise ValueError("Master exceeds filesize limit")
     dest.write(chunk)
  meta=probe(f)
  if meta["width"]<1920 or meta["height"]<1080:raise ValueError("Not actual full HD")
  sheet(f,meta,name);rec.update(state="ORIGINAL_MP4_DOWNLOADED_PENDING_VISUAL_REVIEW",ffprobe=meta);obtained+=1;used+=count
 except Exception as e:
  rec.update(state="PUBLIC_ACCESS_FAILED",error=str(e)[:500])
  (OUT/(name+".mp4")).unlink(missing_ok=True)
 (OUT/"manifest.json").write_text(json.dumps(records,indent=2))
(OUT/"manifest.json").write_text(json.dumps(records,indent=2))
with zipfile.ZipFile("out/STO_VIMEO_PUBLIC_HD_MASTERS.zip","w",zipfile.ZIP_STORED,allowZip64=True) as z:
 for x in OUT.rglob("*"):
  if x.is_file():z.write(x,x.relative_to(OUT))
print(json.dumps([{k:v for k,v in x.items() if k!="ffprobe"} for x in records],indent=2))
