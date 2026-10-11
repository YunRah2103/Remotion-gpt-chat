#!/usr/bin/env python3
"""Real cinematic 2CV stock footage source: public Pixabay 125177, publisher-original HD.
Only actual decoded footage; no guessed quality, cars, or permissions.
"""
import json,pathlib,subprocess,urllib.request,re,hashlib,time,zipfile
from PIL import Image,ImageDraw
OUT=pathlib.Path("out/fr-a-2cv-cinematic-pixabay-test")
OUT.mkdir(parents=True,exist_ok=True)
URL="https://pixabay.com/videos/woman-ride-weekend-school-holidays-125177/"
LOG={"url":URL,"publisher":"Pixabay/JuliusH","status":"NOT_FETCHED","approved_shots":0}
def run(a,t=80):
 p=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-1000:])
 return p.stdout
def hash_file(f):
 h=hashlib.sha256()
 with f.open("rb") as fd:
  for chunk in iter(lambda:fd.read(1048576),b""):h.update(chunk)
 return h.hexdigest()
def probe(f):
 d=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],60))
 v=next(s for s in d["streams"] if s["codec_type"]=="video")
 return {"width":int(v["width"]),"height":int(v["height"]),
  "fps":v.get("avg_frame_rate"),"duration":float(d["format"].get("duration") or 0),
  "bytes":f.stat().st_size,"codec":v["codec_name"]}
try:
 info=json.loads(run(["yt-dlp","--no-warnings","--no-playlist","--socket-timeout","18",
  "-J",URL],80))
 LOG["title"]=info.get("title")
 fmts=info.get("formats",[])
 LOG["available_formats"]=[{"format":x.get("format_id"),"height":x.get("height"),
  "width":x.get("width"),"ext":x.get("ext")} for x in fmts if x.get("height")]
 print("CINEMATIC_2CV_SOURCE_FORMATS",LOG["available_formats"],flush=True)
 filename=OUT/"pixabay-2cv-125177-original.mp4"
 run(["yt-dlp","--no-warnings","--no-playlist","--socket-timeout","20",
  "-f","bv*[height>=1080]+ba/b[height>=1080]","--merge-output-format","mp4",
  "-o",str(filename),URL],300)
 if not filename.exists():raise RuntimeError("VIDEO_NOT_PHYSICALLY_DOWNLOADED")
 info=probe(filename)
 LOG["probe"]=info;LOG["sha256"]=hash_file(filename)
 if info["width"]<1920 or info["height"]<1080:raise RuntimeError("FAIL_NATIVE_1080")
 LOG["status"]="ACTUAL_1080_MP4_SOURCE_FETCHED_VISUAL_QA"
 print("PIXABAY_REAL_CITROEN_CINEMATIC",json.dumps(info),flush=True)
 n=24;dur=info["duration"]
 cols=4;cw=475;ch=300
 board=Image.new("RGB",(cols*cw,6*ch),"#16181b")
 d=ImageDraw.Draw(board)
 for j in range(n):
  sec=(j+.5)*dur/n
  thumb=OUT/f"__thumb-{j}.jpg"
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(sec),"-i",str(filename),
   "-frames:v","1","-vf","scale=450:-2",str(thumb)],60)
  with Image.open(thumb) as im:
   im=im.convert("RGB");im.thumbnail((450,265))
   board.paste(im,((j%cols)*cw+(cw-im.width)//2,(j//cols)*ch+(ch-28-im.height)//2))
  d.text(((j%cols)*cw+6,(j//cols)*ch+270),f"{sec:.1f}s",fill="white")
  thumb.unlink()
 board.save(OUT/"pixabay-125177-real-source-24-frame-contact.jpg",quality=87)
 filename.unlink()  # license video only download again when approved after cinematic visual QA
except Exception as e:
 LOG["status"]="SOURCE_UNAVAILABLE";LOG["error"]=str(e)[:800]
 print("CINEMATIC_2CV_REJECTED",LOG["error"],flush=True)
finally:
 (OUT/"manifest.json").write_text(json.dumps(LOG,indent=2))
 print("CINEMATIC_CANDIDATE_RESULT",json.dumps(LOG)[:4000],flush=True)
