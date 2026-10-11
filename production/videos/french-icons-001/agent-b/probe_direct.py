#!/usr/bin/env python3
"""Probe real direct MP4s for the missing Bugatti / Peugeot family.
No upscaling or mislabeled sources; contact sheets of decoded actual frames.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat,ImageChops
import csv,json,hashlib,io,base64,subprocess,requests,os,re
OUT=Path("out/fr-b-direct-probe");(OUT/"clips").mkdir(parents=True,exist_ok=True);(OUT/"contact_sheets").mkdir(exist_ok=True)
SOURCES=[
 ("Bugatti Chiron","Bugatti original 2016 hero film","https://assets.bugatti.com/fileadmin/user_upload/Web/Pages/Home/Ultimate_Final_h264_v02.mp4"),
 ("Bugatti Chiron L Ultime","Haberjet Chiron L Ultime car press video","https://www.haberjet.com/wp-content/uploads/2024/05/bugatti-chiron-soyunun-500-ve-sonuncusu-olan-lultime-modelini-tanitti-11601-2.mp4"),
 ("Bugatti Chiron","Datron Technology independent Nürburgring testing","https://www.datrontechnology.co.uk/wp-content/uploads/2020/06/IMG_3546-2.mp4"),
 ("Peugeot 208 T16 Pikes Peak","ABC Moteur 2013 Loeb event","https://abcmoteur.fr/wp-content/uploads/2013/07/sebastien-loeb-pikes-peak-2013.mp4")
]
sess=requests.Session();sess.headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
def cmd(args,timeout=70):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-500:])
 return p.stdout
def ffprobe(path):
 d=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],20))
 v=next((x for x in d["streams"] if x["codec_type"]=="video"),None)
 if not v:raise RuntimeError("no video")
 return {"width":int(v["width"]),"height":int(v["height"]),"duration":float(d["format"].get("duration") or 0),"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),"bitrate":int(d["format"].get("bit_rate") or 0),"audio":any(x["codec_type"]=="audio" for x in d["streams"])}
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for block in iter(lambda:f.read(1048576),b""):h.update(block)
 return h.hexdigest()
def proof(p,m,stem):
 frames=[]
 for t in [m["duration"]*0.15,m["duration"]*0.42,m["duration"]*0.72]:
  dest=OUT/"contact_sheets"/"temp.jpg"
  cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(round(t,2)),"-i",str(p),"-frames:v","1","-vf","scale=480:-2",str(dest)],35)
  im=Image.open(dest).convert("RGB").copy();frames.append(im);dest.unlink()
 diffs=[sum(ImageStat.Stat(ImageChops.difference(a.resize((160,90)),b.resize((160,90)))).mean)/3 for a,b in zip(frames,frames[1:])]
 sheet=Image.new("RGB",(480,frames[0].height*3+24),"#141414")
 ImageDraw.Draw(sheet).text((10,4),stem,fill="white")
 for i,im in enumerate(frames):sheet.paste(im,(0,24+i*im.height))
 dest=OUT/"contact_sheets"/(stem+".jpg");sheet.save(dest,quality=76,optimize=True)
 return round(sum(diffs)/len(diffs),2),dest
diagnostic=[];accepted=[]
for n,(model,credit,url) in enumerate(SOURCES):
 rec={"model":model,"credit":credit,"url":url}
 dest=OUT/"clips"/("source-"+str(n+1)+".mp4")
 try:
  head=sess.head(url,allow_redirects=True,timeout=18)
  rec["head_status"]=head.status_code;rec["content_type"]=head.headers.get("Content-Type")
  rec["content_length"]=int(head.headers.get("Content-Length") or 0)
  if head.status_code>=400:raise RuntimeError("publisher unavailable HTTP "+str(head.status_code))
  if rec["content_length"]>280*1024*1024:
   cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",url,"-t","55","-c","copy",str(dest)],135)
  else:
   size=0
   with sess.get(url,stream=True,timeout=(15,45)) as response:
    response.raise_for_status()
    with dest.open("wb") as f:
     for chunk in response.iter_content(1024*1024):
      if chunk:
       f.write(chunk);size+=len(chunk)
       if size>280*1024*1024:raise RuntimeError("over 280MB cap")
  m=ffprobe(dest);rec.update(m)
  if m["width"]<1920 or m["height"]<1080 or m["width"]>3840 or m["height"]>2160:
   raise RuntimeError("REJECT: actual resolution "+str(m["width"])+"x"+str(m["height"]))
  if m["duration"]<3:raise RuntimeError("REJECT: too brief")
  motion,sheet=proof(dest,m,"source-"+str(n+1))
  rec.update({"file":"clips/"+dest.name,"sha256":sha(dest),"motion_score":motion,"status":"DECODED_PENDING_MANUAL_VISUAL"})
  if motion<2:raise RuntimeError("REJECT near-static video")
  accepted.append(rec.copy())
 except Exception as exc:
  rec["status"]="BLOCKED_OR_REJECTED";rec["reason"]=str(exc)[:450]
  dest.unlink(missing_ok=True)
 diagnostic.append(rec)
 print("DIRECT_PROBE",json.dumps(rec),flush=True)
(OUT/"diagnostics.json").write_text(json.dumps(diagnostic,indent=2,ensure_ascii=False))
(OUT/"manifest.json").write_text(json.dumps(accepted,indent=2,ensure_ascii=False))
keys=sorted(set(k for rec in accepted for k in rec))
with (OUT/"manifest.csv").open("w",newline="") as f:
 w=csv.DictWriter(f,keys);w.writeheader();w.writerows(accepted)
(OUT/"README.md").write_text(f"# FR Legends Agent B direct original probe\n\n{len(accepted)} decoded, geometrically validated MP4 files. **All video identity, watermark, camera originality and scene usefulness pending independent review.** Publisher links were found publicly, but permission to reuse is not established.\n")
print("DIRECT_SUMMARY",json.dumps({"downloaded":len(accepted),"models":list(sorted(set(x['model'] for x in accepted)))}),flush=True)
for a in accepted:
 stem=Path(a["file"]).stem
 im=Image.open(OUT/"contact_sheets"/(stem+".jpg"));im.thumbnail((380,980))
 mem=io.BytesIO();im.save(mem,"JPEG",quality=57,optimize=True)
 print("YUNEX_DIRECT_IMAGE:"+stem+":"+base64.b64encode(mem.getvalue()).decode(),flush=True)
