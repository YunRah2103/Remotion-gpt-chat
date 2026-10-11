#!/usr/bin/env python3
"""Acquire original 1080p Alpine A110 documentary from the OFFICIAL publicly embedded HLS playlist.
No login, cookies, paywall or protected content bypass; stop on restricted/unavailable streams.
The original manufacturer press page explicitly lists 1080p; master manifest confirms 1920x1080.
"""
import urllib.request,urllib.parse,json,re,subprocess,hashlib,zipfile
from pathlib import Path
from fractions import Fraction
from PIL import Image,ImageDraw
OUT=Path("out/agent-a-alpine-real1080");SRC=OUT/"clips";PROOF=OUT/"contact_sheets"
for p in (SRC,PROOF):p.mkdir(parents=True,exist_ok=True)
PRESS="https://presse.alpinecars.de/video-alpine-a110-bei-der-rallye-monte-carlo-historique/?lang=deu"
HEAD={"User-Agent":"Mozilla/5.0","Referer":PRESS}
def fetch(url,limit=300000):
 with urllib.request.urlopen(urllib.request.Request(url,headers=HEAD),timeout=40) as r:return r.read(limit)
def sh(args,t=160):
 p=subprocess.run(args,timeout=t,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[-550:])
 return p.stdout
def digest(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def probe(p):
 d=json.loads(sh(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
 s=next(x for x in d["streams"] if x.get("codec_type")=="video")
 fps=s.get("avg_frame_rate","0/1")
 return {"width":int(s["width"]),"height":int(s["height"]),"fps":round(float(Fraction(fps)),3),
   "duration_sec":float(d["format"].get("duration") or 0),"codec":s.get("codec_name"),
   "bytes":p.stat().st_size,"bitrate":int(d["format"].get("bit_rate") or 0),
   "audio":any(x.get("codec_type")=="audio" for x in d["streams"])}
status={"status":"NOT_ACQUIRED","target":"classic 1960s-1970s original Alpine A110 in 2013 Rallye Monte Carlo Historique",
        "page":PRESS,"vimeo_embed_id":"825657442","real_1080_decoded":False}
try:
 cfg=json.loads(fetch("https://player.vimeo.com/video/825657442/config",3_000_000))
 cdns=(cfg.get("request",{}).get("files",{}).get("hls") or {}).get("cdns") or {}
 results=[]
 target=None
 for cdn,entry in cdns.items():
  try:
   url=entry.get("url")
   if not url:continue
   master=fetch(url).decode("utf-8","replace")
   lines=master.splitlines()
   variants=[]
   for i,line in enumerate(lines[:-1]):
    if line.startswith("#EXT-X-STREAM-INF:") and "RESOLUTION=" in line:
     res=re.search(r"RESOLUTION=(\d+)x(\d+)",line)
     if res:
      variants.append({"width":int(res.group(1)),"height":int(res.group(2)),
                       "url":urllib.parse.urljoin(url,lines[i+1].strip()),
                       "cdn":cdn,"codec_tag":line[:160]})
   print("MASTER_REAL_RESOLUTIONS",cdn,[(x["width"],x["height"]) for x in variants],flush=True)
   results += [{"cdn":v["cdn"],"width":v["width"],"height":v["height"]} for v in variants]
   candidates=[v for v in variants if v["height"]==1080 and v["width"]==1920]
   if candidates:
    target=candidates[0];break
  except Exception as e:print("CDN_SOURCE_FAILED",cdn,str(e)[:150],flush=True)
 status["master_formats"]=results
 if not target:raise RuntimeError("ACTUAL_MASTER_MANIFEST_NO_1080_STREAM")
 status["selected_cdn"]=target["cdn"]
 sample=SRC/"alpine-a110-historic-rally-1080p.mp4"
 # Exact 1080p playlist selected. Video stream copied wherever possible without resampling.
 proc=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
       "-headers","Referer: https://player.vimeo.com/\r\nUser-Agent: Mozilla/5.0\r\n",
       "-i",target["url"],"-t","96","-map","0:v:0","-map","0:a?","-c","copy",
       "-movflags","+faststart",str(sample)],capture_output=True,text=True,timeout=240)
 if proc.returncode:
  print("NATIVE_REMUX_FAILED_TRY_EDITOR_H264",proc.stderr[-180:],flush=True)
  sh(["ffmpeg","-hide_banner","-loglevel","error","-y","-headers",
       "Referer: https://player.vimeo.com/\r\nUser-Agent: Mozilla/5.0\r\n",
       "-i",target["url"],"-t","96","-map","0:v:0","-map","0:a?","-c:v","libx264",
       "-crf","19","-preset","fast","-c:a","aac","-b:a","160k",str(sample)],240)
 p=probe(sample)
 if (p["width"],p["height"])!=(1920,1080) or p["fps"]<23 or p["duration_sec"]<8:
  raise RuntimeError("DECODED_ORIGINAL_NOT_FULL_HD_OR_TOO_SHORT: "+str(p))
 sh(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(sample),"-map","0:v:0","-f","null","-"],180)
 duration=p["duration_sec"]
 # Actual video frames from selected 1080 version; human inspect for car and bars before accepting clips.
 canvas=Image.new("RGB",(1460,1420),"#10151a");draw=ImageDraw.Draw(canvas)
 draw.text((8,6),"Real publisher Alpine A110 1080p film: 12 source time samples",fill="white")
 for i in range(12):
  t=duration*(i+.5)/12
  f=PROOF/(f"frame{i:02}.jpg")
  sh(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(round(t,3)),"-i",str(sample),
    "-frames:v","1","-vf","scale=720:-2",str(f)],75)
  with Image.open(f) as image:
   image=image.convert("RGB");image.thumbnail((712,228))
   canvas.paste(image,((i%2)*728+6,(i//2)*235+25))
  f.unlink()
 canvas.save(PROOF/"alpine-a110-publisher-12-frames.jpg",quality=87)
 status.update({"status":"PUBLIC_1080P_MEDIA_ACQUIRED_VISUAL_PENDING","real_1080_decoded":True,
                "probe":p,"sha256":digest(sample),"current_gate":"NOT_PASS_UNTIL_VISUAL_QA"})
 print("ALPINE_REAL_NATIVE1080",json.dumps({"probe":p,"sha":status["sha256"]}),flush=True)
except Exception as e:
 status["status"]="BLOCKED"
 status["error"]=str(e)[:800]
 print("FAILED_NATIVE1080",status["error"],flush=True)
(OUT/"manifest.json").write_text(json.dumps(status,indent=2))
(OUT/"README.md").write_text("Officially embedded original 2013 Alpine A110 historical rally film (selected true 1080p master playlist variant). Film and 12-frame actual contact sheet are technical leads until exact car, visual bars, moving shot and permission inspection. No final Gate A pass by mere FFprobe. Credit Alpine press/film owner, permission not confirmed.\n")
z=Path("out/FR-LEGENDS-A-ALPINE-HISTORIC-REAL-1080.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_STORED) as arc:
 for f in OUT.rglob("*"):
  if f.is_file():arc.write(f,f.relative_to(OUT))
print("ALPINE_FINAL",json.dumps({"status":status["status"],"hd":status["real_1080_decoded"],"zip_bytes":z.stat().st_size}),flush=True)
