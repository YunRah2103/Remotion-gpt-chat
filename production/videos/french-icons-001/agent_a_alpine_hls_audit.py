#!/usr/bin/env python3
"""Only test regular publicly readable adaptive HLS from officially embedded Alpine press video.
This does not attempt to defeat Vimeo authentication, DRM or anti-access restrictions.
"""
import urllib.request,urllib.parse,json,subprocess,hashlib,zipfile
from pathlib import Path
ROOT=Path("out/alpine-a110-publisher-hls"); (ROOT/"originals").mkdir(parents=True,exist_ok=True)
(BASE:=ROOT/"proof").mkdir(exist_ok=True)
url="https://player.vimeo.com/video/825657442/config"
hdr={"User-Agent":"Mozilla/5.0","Referer":"https://presse.alpinecars.de/","Origin":"https://presse.alpinecars.de"}
result={"status":"NO_VIDEO","verified_native_hd":False}
try:
 with urllib.request.urlopen(urllib.request.Request(url,headers=hdr),timeout=28) as f:
  config=json.loads(f.read(3000000))
 files=config.get("request",{}).get("files",{})
 print("FILE_KEYS",list(files.keys()),flush=True)
 for k in ["hls","dash"]:
  node=files.get(k) or {}; print("FORMAT_KEYS",k,list(node.keys()),flush=True)
  if k=="hls":
   print("CDNS",[(key,{"url_present":bool(value.get("url"))}) for key,value in (node.get("cdns") or {}).items()],flush=True)
 manifest_urls=[]
 for k in ("hls","dash"):
  for key,node in (files.get(k) or {}).get("cdns",{}).items():
   if node.get("url"):manifest_urls.append((k,key,node["url"]))
 if not manifest_urls:raise RuntimeError("PUBLIC_EMBED_NO_ADAPTIVE_STREAM_URLS")
 # Public adaptive stream availability is checked without changing credentials or bypassing site gates.
 for kind,name,src in manifest_urls[:3]:
  try:
   req=urllib.request.Request(src,headers={"User-Agent":"Mozilla/5.0","Referer":"https://player.vimeo.com/"})
   with urllib.request.urlopen(req,timeout=25) as r:
    body=r.read(140000); ctype=r.headers.get("Content-Type","")
   print("HLS_RESPONSE",kind,name,"bytes",len(body),"ctype",ctype,"first",body[:80],flush=True)
   if not(body.startswith(b"#EXTM3U") or b"<MPD" in body[:300]):continue
   # Download at most 18 seconds to check native stream pixels; long film not needed to prove format.
   dest=ROOT/"originals"/"alpine-a110-official-sample.mp4"
   cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-headers",
        "Referer: https://player.vimeo.com/\r\nUser-Agent: Mozilla/5.0\r\n",
        "-i",src,"-t","18","-map","0:v:0","-map","0:a?","-c:v","libx264","-crf","19","-pix_fmt","yuv420p","-c:a","aac",str(dest)]
   p=subprocess.run(cmd,capture_output=True,text=True,timeout=155)
   if p.returncode:raise RuntimeError("FFMPEG_HLS: "+p.stderr[-500:])
   r=subprocess.run(["ffprobe","-v","error","-show_entries","stream=codec_type,width,height,avg_frame_rate",
       "-of","json",str(dest)],capture_output=True,text=True,check=True,timeout=25)
   j=json.loads(r.stdout);stream=next(x for x in j["streams"] if x["codec_type"]=="video")
   result["ffprobe"]=stream
   if stream.get("height",0)<1080 or stream.get("width",0)<1920:raise RuntimeError("NATIVE_HLS_BELOW_1080")
   from PIL import Image,ImageDraw
   canvas=Image.new("RGB",(1320,760),"#151515")
   for i,t in enumerate([1,3,5,7,9,11,13,15,17]):
    f=BASE/(f"{i}.png");p=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),
      "-i",str(dest),"-frames:v","1","-vf","scale=440:-2",str(f)],capture_output=True,timeout=40)
    if f.exists():
     with Image.open(f) as im:
      im=im.convert("RGB");im.thumbnail((430,232));canvas.paste(im,((i%3)*440,(i//3)*250))
     f.unlink()
   canvas.save(BASE/"alpine-review.jpg",quality=90)
   digest=hashlib.sha256(dest.read_bytes()).hexdigest()
   result.update({"status":"REAL_FULL_HD_18S_EXTRACT_ID_AND_VISUAL_REVIEW_PENDING",
      "verified_native_hd":True,"sha256":digest,"source":"Official Alpine public Vimeo player embedded URL"})
   break
  except Exception as e:
   print("SOURCE_REJECTED",kind,name,str(e)[:450],flush=True)
 if not result["verified_native_hd"]:raise RuntimeError("ALL_PUBLIC_ADAPTIVE_STREAMS_BLOCKED_OR_BELOW_NATIVE_1080")
except Exception as e:
 result["error"]=str(e)[:800]
 print("EXTRACTION_RESULT",result["error"],flush=True)
(ROOT/"manifest.json").write_text(json.dumps(result,indent=2))
(ROOT/"README.md").write_text("Official Alpine historic A110 public embedded adaptive stream assessment; no access controls bypassed. HLS stream source rights are unconfirmed. Cannot count final clips without independent visual QA.\n")
z=Path("out/fr-legends-alpine-a110-public-hls-proof.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as arc:
 for f in ROOT.rglob("*"):
  if f.is_file():arc.write(f,f.relative_to(ROOT))
print("HLS_FINAL",json.dumps({**result,"zip_size":z.stat().st_size})[:1500],flush=True)
