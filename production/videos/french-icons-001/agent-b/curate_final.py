#!/usr/bin/env python3
"""Select manually inspected dynamic source windows, never copy weak complete films."""
from pathlib import Path
import csv,hashlib,json,subprocess,io,base64
from PIL import Image,ImageDraw,ImageStat,ImageChops
SOURCE=Path("out/source-b")
DEST=Path("out/fr-legends-agent-b-curated-v2")
for p in [DEST,DEST/"clips",DEST/"contact_sheets"]:p.mkdir(parents=True,exist_ok=True)
MANIFEST={Path(r["file"]).name:r for r in json.loads((SOURCE/"manifest.json").read_text())}
# Visual review: only original real driving scenes, no Bugatti mislabels, Alpine Miami CGI,
# 3D technical simulations, static showreel, intro titles, or telemetry.
# Source and timecodes are audited; segment contact proofs are generated below.
CUTS=[
 ("alpine-a110-ultime_4.mp4","alpine-a110-r-ultime-orange",[(9,17),(33,41),(54,62)]),
 ("alpine-a110-ultime_1.mp4","alpine-a110-r-ultime-blue",[(9,17),(29,36)]),
 ("alpine-a110-r_1.mp4","alpine-a110-r-blue-track",[(8,15),(27,34)]),
 ("alpine-a110-le-mans_1.mp4","alpine-a110-r-le-mans",[(6,12),(22,29),(36,44)]),
 ("alpine-a110_4.mp4","alpine-a110-orange-rolling",[(4,10)]),
 ("renault-megane_1.mp4","renault-megane-trophy-r-monaco",[(16,24),(28,35),(39,46)]),
 ("alpine-a290-rallye-release_1.mp4","alpine-a290-rallye-4k-action",[(14,21),(23,30),(38,46)]),
 ("alpine-a290-rallye-release_2.mp4","alpine-a290-rallye-4k-details",[(9,16)]),
]

def cmd(a,t=70):
 r=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if r.returncode:raise RuntimeError((r.stderr or r.stdout)[-450:])
 return r.stdout
def probe(f):
 j=json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],25))
 v=next((s for s in j["streams"] if s["codec_type"]=="video"),None)
 if not v:raise RuntimeError("missing video stream")
 return {"width":v.get("width"),"height":v.get("height"),"fps":v.get("avg_frame_rate"),"duration":float(j["format"].get("duration",0)),"video_codec":v.get("codec_name"),"bitrate":int(j["format"].get("bit_rate") or 0),"has_audio":any(s.get("codec_type")=="audio" for s in j["streams"])}
def sha(f):
 h=hashlib.sha256()
 with f.open("rb") as fp:
  for chunk in iter(lambda:fp.read(1048576),b""):h.update(chunk)
 return h.hexdigest()
out=[]
for source,group,windows in CUTS:
 source_file=SOURCE/"clips"/source
 if not source_file.exists():raise FileNotFoundError(source_file)
 origin=MANIFEST[source]
 for idx,(start,end) in enumerate(windows,1):
  name=group+"-"+str(idx)+".mp4"
  path=DEST/"clips"/name
  cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(start),"-i",str(source_file),"-t",str(end-start),"-map","0:v:0","-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(path)],70)
  props=probe(path)
  if props["width"]<1920 or props["height"]<1080 or props["duration"]<3:raise ValueError("invalid segment "+name+str(props))
  frames=[]
  for idx2,timepart in enumerate((.2,.5,.8)):
   temp=DEST/"contact_sheets"/("frame_"+name+str(idx2)+".jpg")
   cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(props["duration"]*timepart),"-i",str(path),"-frames:v","1","-vf","scale=480:-2",str(temp)],45)
   frames.append(Image.open(temp).convert("RGB").copy());temp.unlink()
  differences=[sum(ImageStat.Stat(ImageChops.difference(a.resize((160,90)),b.resize((160,90)))).mean)/3 for a,b in zip(frames,frames[1:])]
  motion=round(sum(differences)/len(differences),2)
  if motion<2:raise ValueError("static or low motion scene "+name)
  sheet=Image.new("RGB",(480,frames[0].height*3+36),"#202020")
  ImageDraw.Draw(sheet).text((5,6),name,fill="white")
  for i,f in enumerate(frames):sheet.paste(f,(0,36+i*frames[0].height))
  sheet.save(DEST/"contact_sheets"/(name.replace(".mp4","")+"_sheet.jpg"),quality=75)
  out.append({"file":"clips/"+name,"model":origin["model"],"source_url":origin["source_url"],"source_page":origin["source_page"],"source_original_file":source,"source_sha256":origin["sha256"],"source_in_seconds":start,"source_out_seconds":end,"creator":origin["creator"],"license":origin["license"],"sha256":sha(path),"motion_score":motion,"qa":"PROVISIONAL: segment chosen from reviewed film; decoded contact sheet included; watermark/identity each segment still needs final manual inspection",**props})
  print("CURATED",name,props["width"],props["height"],"bytes",path.stat().st_size,"motion",motion,flush=True)
(DEST/"manifest.json").write_text(json.dumps(out,indent=2))
fields=sorted(set(k for r in out for k in r))
with (DEST/"manifest.csv").open("w",newline="") as f:
 w=csv.DictWriter(f,fields);w.writeheader();w.writerows(out)
(DEST/"README.md").write_text("# FR Legends 001 — Agent B clean selected French-car shots\n\n"+"Selected from decoded original real manufacturer video, stripped of the mislabelled Bugatti, Miami CGI and telemetry-covered long onboard video. Original dimensions and audio streams preserved by stream copy; no upscale. Each source timecode and SHA in manifest. Source video terms need separate clearance. No final five-model PASS claim.\n\nActually curated selected shots: "+str(len(out))+".\n")
print("CURATED_SUMMARY",json.dumps({"count":len(out),"models":list(sorted(set(x["model"] for x in out)))}),flush=True)
for i in range(0,len(out),3):
 group=out[i:i+3];ims=[]
 for r in group:
  f=Image.open(DEST/"contact_sheets"/(Path(r["file"]).stem+"_sheet.jpg")).convert("RGB")
  f.thumbnail((320,560));ims.append(f)
 if not ims:continue
 combo=Image.new("RGB",(max(f.width for f in ims),sum(f.height for f in ims)),"#161616");y=0
 for im in ims:combo.paste(im,(0,y));y+=im.height
 b=io.BytesIO();combo.save(b,"JPEG",quality=45,optimize=True)
 print("YUNEX_CURATED_IMAGE:"+str(i//3)+":"+base64.b64encode(b.getvalue()).decode(),flush=True)
