#!/usr/bin/env python3
"""A2 whole-film storyboard scout: download official 4K press material to /tmp only.
Inspect roughly every 5s of C8 RS6 manufacturer footage. No source video emitted.
Contact JPEGs are downsampled internal critique/reference assets only.
"""
import io,hashlib,json,os,subprocess,time,math
from pathlib import Path
import requests
from PIL import Image,ImageDraw
SRC="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
DST=Path("/tmp/audi-rs6-c8-a2-full-4k-temporary.mp4")
OUT=Path("a2_wholefilm_qa");OUT.mkdir(exist_ok=True)
REPORT={"source_page":"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874",
 "source_url":SRC,"scope":"technical visual source review only; NO public MP4 redistribution",
 "started_utc":time.strftime("%FT%TZ",time.gmtime()),"frames":[]}
t0=time.monotonic()
expected=788872228
def download():
 for k in range(3):
  offset=DST.stat().st_size if DST.exists() else 0
  heads={"User-Agent":"Mozilla/5.0","Accept":"video/mp4"}
  if offset:heads["Range"]=f"bytes={offset}-"
  try:
   with requests.get(SRC,headers=heads,stream=True,timeout=(18,45)) as r:
    if offset and r.status_code==200:offset=0
    r.raise_for_status()
    if r.status_code not in (200,206):raise RuntimeError(f"unusable HTTP {r.status_code}")
    with open(DST,"ab" if offset else "wb") as f:
     for b in r.iter_content(chunk_size=1024*512):
      if b:f.write(b)
      if f.tell()>830_000_000:raise RuntimeError("video larger than safety cap 830MB")
      if time.monotonic()-t0>550:raise TimeoutError("global download budget exhausted")
   n=DST.stat().st_size
   if n==expected:return {"bytes":n,"attempts":k+1}
   REPORT.setdefault("download_retry_notes",[]).append(f"try{k+1} got {n} vs expected {expected}")
  except Exception as e:REPORT.setdefault("download_retry_notes",[]).append(f"try{k+1}: {repr(e)}")
 raise RuntimeError("source download not complete")
def frame(t):
 p=subprocess.run(["ffmpeg","-hide_banner","-v","error","-ss",str(t),"-i",str(DST),
     "-frames:v","1","-vf","scale=480:270:flags=fast_bilinear",
     "-q:v","6","-vcodec","mjpeg","-f","image2pipe","-"],
     capture_output=True,timeout=35)
 if p.returncode!=0:raise RuntimeError(p.stderr.decode(errors="replace")[-250:])
 im=Image.open(io.BytesIO(p.stdout)).convert("RGB");im.load();return im
def save_page(frames,part):
 cols=5;rows=math.ceil(len(frames)/cols)
 w=480;h=295
 out=Image.new("RGB",(cols*w,rows*h),(9,11,14)); d=ImageDraw.Draw(out)
 for i,(t,im) in enumerate(frames):
  x=(i%cols)*w;y=(i//cols)*h
  out.paste(im,(x,y+25));d.text((x+8,y+6),f"RS6 C8  |  {t//60:02d}:{t%60:02d}",fill=(250,250,245))
 path=OUT/(f"4k-original-storyboard-{part:02}.jpg");out.save(path,quality=78,optimize=True)
 return {"file":path.name,"size_bytes":path.stat().st_size}
try:
 REPORT["source_download"]=download()
 result=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=width,height,codec_type,r_frame_rate","-of","json",str(DST)],capture_output=True,text=True,timeout=30)
 REPORT["ffprobe"]=json.loads(result.stdout) if result.returncode==0 else {"error":result.stderr[-700:]}
 REPORT["sha256"]=hashlib.sha256(DST.read_bytes()).hexdigest()
 dur=float(REPORT["ffprobe"]["format"]["duration"])
 times=[int(t) for t in range(3,int(dur)-2,5)]
 page=[];page_no=0
 for j,t in enumerate(times):
  entry={"second":t};REPORT["frames"].append(entry)
  try:
   image=frame(t);entry["decoded"]=True;page.append((t,image))
  except Exception as e:entry["error"]=repr(e)
  if len(page)==35 or j==len(times)-1:
   page_no+=1
   if page:
    REPORT.setdefault("contact_sheet_pages",[]).append(save_page(page,page_no))
   page=[]
 REPORT["decoded_count"]=sum(x.get("decoded",False) for x in REPORT["frames"])
 REPORT["error_count"]=sum(bool(x.get("error")) for x in REPORT["frames"])
except Exception as e:REPORT["error"]=repr(e)
finally:
 DST.unlink(missing_ok=True)
 REPORT["elapsed_sec"]=round(time.monotonic()-t0,2)
 REPORT["finished_utc"]=time.strftime("%FT%TZ",time.gmtime())
 (OUT/"report.json").write_text(json.dumps(REPORT,indent=2))
 print(json.dumps({"source_download":REPORT.get("source_download"),
 "decoded":REPORT.get("decoded_count"),"errors":REPORT.get("error_count"),
 "pages":REPORT.get("contact_sheet_pages"),"error":REPORT.get("error"),
 "elapsed_sec":REPORT["elapsed_sec"]},indent=2))
