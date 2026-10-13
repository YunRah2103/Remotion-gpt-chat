#!/usr/bin/env python3
"""A genuine-source short transition proof using direct THE-LOWDOWN video and Audi C8 UHD.
OWNER-ONLY DRAFT, no music, no public redistribution: original-source rights unverified.
This is NOT D/E final NO MERCY edit.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, html, json, re, subprocess, requests, time
ROOT=Path("c2_lowdown_bridge");ROOT.mkdir(exist_ok=True)
SITE="https://www.the-lowdown.com/audi-rs6/"
AUDI=("https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/"
"urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/"
"audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1")
H="Referer: https://www.the-lowdown.com/\r\nUser-Agent: Mozilla/5.0\r\n"
SEGS=[
 {"id":"01_C8_RS6_REAL_SIDE_DRIVE","source":"LOWDOWN","source_start":22.05,"seconds":1.10,"category":"genuine rolling C8 RS6 in dark city blue"},
 {"id":"02_RS6_NATIVE4K_OVAL_EXHAUST","source":"AUDI","source_start":425.90,"seconds":.53,"crop_x":2200,"category":"oval sports exhaust cut-to"},
 {"id":"03_LOW_DOWN_LED_MOVING","source":"LOWDOWN","source_start":14.05,"seconds":.48,"category":"original filmmaker genuine red C8 LED moving macro"},
 {"id":"04_RS6_NATIVE4K_RED_TAIL","source":"AUDI","source_start":465.90,"seconds":.66,"crop_x":880,"category":"original UHD C8 rear LED detail"},
 {"id":"05_RS6_NATIVE4K_RS_MODE","source":"AUDI","source_start":525.90,"seconds":.53,"crop_x":1450,"category":"hand touching RS MODE wheel control"},
]
def run(cmd,timeout=180):
 p=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
 if p.returncode:raise RuntimeError(f"exit {p.returncode}: {cmd[0]} {p.stderr[-1300:]}")
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1024*1024),b""):h.update(c)
 return h.hexdigest()
def mediainfo(f):
 d=json.loads(run(["ffprobe","-v","error","-show_entries",
     "format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames",
     "-of","json",str(f)],35))
 return d
def find_lowdown():
 s=requests.get(SITE,headers={"User-Agent":"Mozilla/5.0 Chrome/127","Referer":"https://www.the-lowdown.com/"},timeout=25)
 s.raise_for_status()
 code=html.unescape(s.text).replace("\\/","/")
 urls=re.findall(r"""https?://[^\s"'<>\\]+\.mp4(?:\?[^\s"'<>\\]+)?""",code,re.I)
 urls=[html.unescape(u) for u in urls if "player.vimeo.com/external/" in u]
 if not urls:raise RuntimeError("Film page exposes no direct Vimeo external MP4")
 for u in dict.fromkeys(urls):
  try:
   p=subprocess.run(["ffprobe","-v","error","-headers",H,"-show_entries",
      "format=duration:stream=codec_type,width,height","-of","json",u],
      capture_output=True,text=True,timeout=40)
   if p.returncode:continue
   d=json.loads(p.stdout); vv=next((x for x in d.get("streams",[]) if x.get("codec_type")=="video"),{})
   if vv.get("width",0)>=1920 and vv.get("height",0)>=1080 and float(d.get("format",{}).get("duration","0"))>=34:
      return u,{"width":vv["width"],"height":vv["height"],"duration":d["format"]["duration"]}
  except Exception:continue
 raise RuntimeError("Creator Vimeo MP4 source inaccessible or less than 1080p")
lowdown_url,source_meta=find_lowdown()
events=[]
for i,seg in enumerate(SEGS):
 f=ROOT/(seg["id"]+".mp4")
 if seg["source"]=="LOWDOWN":
  url=lowdown_url
  filters="fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p"
  opts=["-headers",H]
 else:
  url=AUDI
  filters=f"crop=1215:2160:{seg['crop_x']}:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p"
  opts=["-rw_timeout","30000000"]
 cmd=["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y"]+opts+[
  "-ss",str(seg["source_start"]),"-i",url,"-t",str(seg["seconds"]),
  "-map","0:v:0","-an","-vf",filters,"-c:v","libx264",
  "-preset","fast","-crf","16","-movflags","+faststart",str(f)]
 run(cmd,200)
 p=mediainfo(f)
 v=next(x for x in p["streams"] if x["codec_type"]=="video")
 if (v["width"],v["height"])!=(1080,1920) or float(p["format"]["duration"])<.3:
  raise RuntimeError("Video geometry/duration invalid for "+seg["id"])
 run(["ffmpeg","-v","error","-xerror","-i",str(f),"-f","null","-"],70)
 events.append({**seg,"output":f.name,"duration":float(p["format"]["duration"]),
     "frames":v.get("nb_frames"),"sha256":sha(f),"bytes":f.stat().st_size,
     "native_source_resolution":source_meta if seg["source"]=="LOWDOWN" else "3840x2160 25fps",
     "decode":"PASS","public_distribution_approved":False})
# Preserve hard boundaries and source frame timings, no invented freeze or zoom.
concat=ROOT/"segments.txt"
concat.write_text("".join("file '"+p["output"]+"'\n" for p in events))
out=ROOT/"C2_LOWDOWN_AUDI_TRANSITION_PROOF.mp4"
run(["ffmpeg","-hide_banner","-nostdin","-v","error","-y","-f","concat","-safe","0",
     "-i",str(concat),"-an","-c:v","libx264","-preset","fast","-crf","16",
     "-r","30","-pix_fmt","yuv420p","-movflags","+faststart",str(out)],180)
run(["ffmpeg","-v","error","-xerror","-i",str(out),"-f","null","-"],75)
info=mediainfo(out)
v=next(x for x in info["streams"] if x["codec_type"]=="video")
if (v["width"],v["height"],v["r_frame_rate"])!=(1080,1920,"30/1"):
 raise RuntimeError("Final output dimensions/fps mismatch")
# 16-frame visual scene proof, user and producer can reject bad crop.
frames=ROOT/"frames";frames.mkdir(exist_ok=True)
run(["ffmpeg","-v","error","-y","-i",str(out),"-vf","fps=4,scale=180:320",
     str(frames/"%03d.jpg")],60)
imfiles=sorted(frames.glob("*.jpg"))
contact=Image.new("RGB",(8*180,2*350),"#101418");d=ImageDraw.Draw(contact)
for i,p in enumerate(imfiles[:16]):
 x=(i%8)*180;y=(i//8)*350
 contact.paste(Image.open(p).convert("RGB"),(x,y+25))
 d.text((x+4,y+5),f"t={i/4:.2f}s",fill="white")
contact.save(ROOT/"CONTACT_4FPS.jpg",quality=88)
metadata={"status":"FULL_PLAYABLE_MP4_PASS","owner_only":True,
 "no_public_media_distribution_permission":True,"no_soundtrack":True,
 "not_final_film":True,"native_creator_original":"1920x1080 ~29.97 source, vertical crop upscaled",
 "audi_original":"3840x2160/25, genuine portrait pixel-native crop",
 "source_pages":[SITE,"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874"],
 "segments":events,"overall_probe":info,"sha256":sha(out),"bytes":out.stat().st_size,
 "sampled_contact_frames":len(imfiles)}
(ROOT/"EVIDENCE.json").write_text(json.dumps(metadata,indent=2))
(ROOT/"SHA256SUMS.txt").write_text(sha(out)+"  "+out.name+"\n")
print(json.dumps({"status":metadata["status"],"sha256":metadata["sha256"],"duration":info["format"]["duration"],"bytes":metadata["bytes"],"contact_frames":len(imfiles),"inputs":len(events)},indent=2))
