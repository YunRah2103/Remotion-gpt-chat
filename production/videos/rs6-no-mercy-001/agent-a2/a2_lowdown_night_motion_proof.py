#!/usr/bin/env python3
"""YUNEX A2: TRUE C8 THE-LOWDOWN direct original MP4 night-motion cut proof.
Native filmmaker source 1920x1080 29.97fps; final capped 1080x1920/30 H264.
Only owner-unpublished draft for evaluation, no third-party public release.
"""
from pathlib import Path
import requests,subprocess,hashlib,html,re,json,shutil,zipfile,time
from PIL import Image,ImageDraw
ROOT=Path("a2-lowdown-proof");ROOT.mkdir(exist_ok=True)
QA=Path("a2-lowdown-qa");QA.mkdir(exist_ok=True)
SITE="https://www.the-lowdown.com/audi-rs6/"
HEADERS={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
         "Referer":"https://www.the-lowdown.com/"}
FFHEADERS="Referer: https://www.the-lowdown.com/\r\nUser-Agent: Mozilla/5.0\r\n"
def run(cmd,timeout=90):
 try:
  p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
  return p.returncode,p.stdout,p.stderr[-1100:]
 except Exception as e:return -1,"",repr(e)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(2**20),b""):h.update(b)
 return h.hexdigest()
def find_originals():
 r=requests.get(SITE,headers=HEADERS,timeout=25)
 r.raise_for_status()
 page=html.unescape(r.text).replace("\\/","/")
 urls=re.findall(r"""https?://[^\s"'<>\\]+\.mp4(?:\?[^\s"'<>\\]+)?""",page,re.I)
 matches=list(dict.fromkeys(html.unescape(x).rstrip("\\") for x in urls if "player.vimeo.com/external/" in x))
 seed=Path("b2-seed/b2_candidate_reports/lowdown.json")
 if seed.exists():
  try:
   d=json.loads(seed.read_text())
   for x in d.get("creator_embedded_public_media_urls",[]):
    x=html.unescape(x)
    if "player.vimeo.com/external/450095160." in x and x not in matches:matches.append(x)
  except Exception:pass
 return matches[:4]
def make_original_segment(url,name,start,length):
 outfile=ROOT/f"{name}.mp4"
 # Preserve C8 movement at 30fps, no original soundtrack. Native frame content:
 # original 1920x1080 landscape; portrait derives ~608 source px horizontally.
 # Gently cool highlights and deepen shadows; avoid HDR or false native pixels.
 vf="fps=30,scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,eq=contrast=1.10:saturation=0.83:brightness=-0.01,format=yuv420p"
 rc,_,err=run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
  "-headers",FFHEADERS,"-ss",str(start),"-i",url,"-t",str(length),
  "-an","-vf",vf,"-c:v","libx264","-preset","veryfast","-crf","18","-movflags","+faststart",str(outfile)],130)
 if rc!=0 or not outfile.exists():raise RuntimeError(f"{name}: acquisition/transcode error {err}")
 r,_,err=run(["ffmpeg","-hide_banner","-v","error","-xerror","-i",str(outfile),"-f","null","-"],35)
 if r:raise RuntimeError(f"{name}: incomplete full video decode: {err}")
 return outfile
def verify(p):
 r,out,err=run(["ffprobe","-v","error","-show_entries",
 "stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate:format=duration,size","-of","json",str(p)],25)
 if r:raise RuntimeError(f"{p.name}: FFprobe failed {err}")
 j=json.loads(out)
 v=next(x for x in j["streams"] if x.get("codec_type")=="video")
 assert v["width"]==1080 and v["height"]==1920 and v["codec_name"]=="h264"
 assert v["avg_frame_rate"]=="30/1",v
 return {"name":p.name,"size_bytes":p.stat().st_size,"sha256":sha(p),
    "duration_s":float(j["format"]["duration"]),"width":v["width"],"height":v["height"],
    "fps":v["avg_frame_rate"],"codec":v["codec_name"],"decode":"PASS"}
def contact(clip):
 import tempfile
 with tempfile.TemporaryDirectory() as d:
  patt=str(Path(d)/"sample%02d.jpg")
  run(["ffmpeg","-v","error","-i",str(clip),"-vf","fps=2,scale=192:342",
       "-frames:v","10",patt],30)
  frames=[Image.open(x).convert("RGB") for x in sorted(Path(d).glob("sample*.jpg"))]
  if not frames:return
  pic=Image.new("RGB",(192*len(frames),370),"#0e1015");draw=ImageDraw.Draw(pic)
  for k,im in enumerate(frames):
   pic.paste(im,(k*192,28));draw.text((k*192+4,6),clip.stem+f" {k}",fill="#ffffff")
  pic.save(QA/(clip.stem+"_qa.jpg"),quality=82,optimize=True)
REPORT={"agent":"A2","role":"short-night-motion-cut-proof not finished 13-16-second edit",
 "source_site":SITE,"source_provenance":"THE-LOWDOWN original C8 Tango Red RS6 filmmaker project",
 "native_source":"1920x1080/30000:1001fps", "output":"1080x1920/30fps H264 yuv420p (portrait crop is not native 1080-wide sharpness)",
 "rights":"creator permission to republish unconfirmed; unpublished owner-only draft ONLY",
 "original_music":"excluded; preview is silent","status":"NO_MEDIA"}
try:
 sources=find_originals();REPORT["candidate_original_count"]=len(sources)
 media=None;probe={}
 for index,url in enumerate(sources):
  rc,stdout,err=run(["ffprobe","-v","error","-headers",FFHEADERS,"-show_entries",
    "stream=codec_type,width,height,avg_frame_rate:format=duration,size","-of","json",url],50)
  if rc:continue
  p=json.loads(stdout);v=next((x for x in p.get("streams",[]) if x.get("codec_type")=="video"),None)
  if v and v.get("width",0)>=1920 and v.get("height",0)>=1080 and float(p["format"]["duration"])>=32:
   media=url;probe={"height":v["height"],"width":v["width"],
     "native_fps":v.get("avg_frame_rate"),"duration":float(p["format"]["duration"])};break
 REPORT["verified_source_probe"]=probe
 if not media:raise RuntimeError("No actual native 1080p progressive original filmmaker MP4 accessible")
 # Visual edit sequence: atmospheric C8 head-on -> punchy RS6 LED/wheel -> true moving side tracking.
 # 4.6 s, source video only, no invented soundtrack.
 windows=[
  ("A2_NIGHT_HAZE_HERO",29.10,1.60),
  ("A2_NIGHT_LED_WHEEL",14.02,0.85),
  ("A2_RED_RS6_DRIVE",21.92,2.10)
 ]
 files=[]
 for name,start,length in windows:
  p=make_original_segment(media,name,start,length);files.append(p)
  REPORT.setdefault("shots",[]).append({"file":name+".mp4","source_start":start,"source_end":start+length,
    "qa":verify(p)})
  contact(p)
 playlist=ROOT/"editor-sequence.txt"
 playlist.write_text("".join(f"file '{p.name}'\n" for p in files))
 out=ROOT/"YUNEX_A2_LOWDOWN_4S_NIGHT_MOTION_PROOF.mp4"
 rc,_,err=run(["ffmpeg","-hide_banner","-v","error","-y","-f","concat","-safe","0",
  "-i",str(playlist),"-an","-c:v","libx264","-preset","fast","-crf","17",
  "-pix_fmt","yuv420p","-r","30","-movflags","+faststart",str(out)],120)
 if rc:raise RuntimeError("edit concatenate failed "+err)
 rc,_,err=run(["ffmpeg","-v","error","-xerror","-i",str(out),"-f","null","-"],50)
 if rc:raise RuntimeError("composite full decode failed "+err)
 REPORT["composite"]=verify(out)
 assert 4.0<=REPORT["composite"]["duration_s"]<=5.2,REPORT["composite"]["duration_s"]
 contact(out)
 REPORT["status"]="ACTUAL_PLAYABLE_1080P_PRIVATE_EDIT_PROOF"
 (ROOT/"LOWDOWN_RIGHTS.txt").write_text("Original C8 RS6 footage THE-LOWDOWN.com; no explicit public-reuse licence or GitHub redistribution permission.\nOwner-only DRAFT review, not a public post or licensed music.\n")
 (ROOT/"LOWDOWN_MANIFEST.json").write_text(json.dumps(REPORT,indent=2))
 (ROOT/"LOWDOWN_SHA256SUMS.txt").write_text("".join(f"{sha(p)}  {p.name}\n" for p in [*files,out]))
 bundle=ROOT/"YUNEX_A2_LOWDOWN_NIGHT_REVIEW.zip"
 with zipfile.ZipFile(bundle,"w",zipfile.ZIP_DEFLATED) as z:
  for p in ROOT.iterdir():
   if p.is_file() and p!=bundle:z.write(p,p.name)
 REPORT["zip"]={"name":bundle.name,"bytes":bundle.stat().st_size,"sha256":sha(bundle)}
except Exception as e:
 REPORT["status"]="SOURCE_OR_EDIT_FAILURE"
 REPORT["error"]=repr(e)
(QA/"report.json").write_text(json.dumps(REPORT,indent=2))
print(json.dumps({"status":REPORT["status"],"source":REPORT.get("verified_source_probe"),
 "shots":REPORT.get("shots"),"composite":REPORT.get("composite"),
 "zip":REPORT.get("zip"),"error":REPORT.get("error")},indent=2))
