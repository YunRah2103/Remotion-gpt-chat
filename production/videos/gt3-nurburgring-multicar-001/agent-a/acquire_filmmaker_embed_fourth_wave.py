#!/usr/bin/env python3
"""Targeted public Vimeo PLAYER embed route - independent from blocked public Vimeo page route.

Acquire actual video bytes in native 1080p+ at bounded source time.
No car identities or qualifying shot counts until manual enlarged-frame QA.
No YouTube requests; Vimeo embeds only. This is not a repeated site-page request. Reject simulator, sub-HD, non-race and wrong-circuit content.
"""
import hashlib,json,subprocess,sys,time,traceback
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path("out/gt3-agent-a-filmmaker-embed-fourth-wave")
V=ROOT/"native_unapproved"
S=ROOT/"contact_sheets"
for p in [ROOT,V,S]:p.mkdir(parents=True,exist_ok=True)
TARGETS=[
 {"id":"ravenol_n24_2024_doc","url":"https://player.vimeo.com/video/1070985279?app_id=122963","title_hint":"RAVENOL Nuerburgring 24h 2024 documentary","make_hint":"Multi-car, unknown GT3 models","note":"Race documentary not assumed all driving shots"},
 {"id":"n24_2024_michael_lee","url":"https://player.vimeo.com/video/1052136279?app_id=122963","title_hint":"Nuerburgring 2024 behind scenes film","make_hint":"Multi-car GT3 unknown","note":"May be paddock rather than track"},
 {"id":"audi_r8_lms_2014_aerial","url":"https://player.vimeo.com/video/97624690?app_id=122963","title_hint":"Felix Baumgartner from Heaven to Green Hell, Audi R8 LMS","make_hint":"Audi R8 LMS ultra GT3 (2014)","note":"Race car identity and action need visual check"},
 {"id":"sonic_equipment_n24_filmmaker","url":"https://player.vimeo.com/video/179177250?app_id=122963","title_hint":"NURBURGRING 24H Sonic Equipment original","make_hint":"Unknown","note":"Possible N24 real film, historic GT3 makes"},
 {"id":"red_bull_driftbros_2020","url":"https://player.vimeo.com/video/455315028?app_id=122963","title_hint":"Red Bull Driftbrothers 24h Nurburgring","make_hint":"Unknown","note":"REJECT if only drift road cars, not GT3"},
]
def call(a,t):
 try:return subprocess.run(a,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=t)
 except subprocess.TimeoutExpired:return subprocess.CompletedProcess(a,124,"","PER_SOURCE_TIMEOUT")
 except Exception as e:return subprocess.CompletedProcess(a,125,"",str(e))
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def ff(a,t=40):
 p=call(a,t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-600:])
 return p.stdout
for x in TARGETS:
 started=time.monotonic()
 x['status']='NO_ACCEPTED_MEDIA'
 p=call([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist","--no-warnings","--socket-timeout","12","--retries","0","--fragment-retries","0","--skip-download","--dump-single-json",x['url']],45)
 if p.returncode:
  x['failure']='METADATA_'+(p.stderr or p.stdout)[-600:]
  x['duration_seconds']=round(time.monotonic()-started,1)
  print("META REJECTED",x["id"],x["failure"][-220:],flush=True)
  continue
 try:
  j=json.loads(p.stdout)
  x["resolved_title"]=j.get("title");x["uploader"]=j.get("uploader")
  x["listed_duration_seconds"]=j.get("duration")
  accepted=[f for f in j.get("formats",[]) if (f.get("width") or 0)>=1920 and (f.get("height") or 0)>=1080]
  x["hd_formats"]=[{k:f.get(k) for k in ("format_id","ext","width","height","protocol","vcodec")} for f in accepted][-12:]
  if not accepted:raise RuntimeError("NO_ADVERTISED_NATIVE_LANDSCAPE_1080P")
  # Avoid full 1h downloads. Download first 24 seconds, max about 200MB.
  cmd=[sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
    "--no-warnings","--socket-timeout","13","--retries","0","--fragment-retries","0",
    "--max-filesize","200M","--download-sections","*0-24",
    "-f","bv*[width>=1920][height>=1080]/b[width>=1920][height>=1080]",
    "--merge-output-format","mp4","--force-overwrites",
    "-o",str(V/(x["id"]+".%(ext)s")),x['url']]
  z=call(cmd,120)
  x["download_stderr_tail"]=z.stderr[-850:];x["download_stdout_tail"]=z.stdout[-600:]
  files=[f for f in V.glob(x["id"]+".*") if f.is_file() and f.stat().st_size>100000]
  if z.returncode or not files:raise RuntimeError("NO_PLAYABLE_SOURCE_ACQUIRED "+z.stderr[-220:])
  target=max(files,key=lambda f:f.stat().st_size)
  raw=json.loads(ff(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(target)]))
  video=next(v for v in raw["streams"] if v["codec_type"]=="video")
  w,h=int(video["width"]),int(video["height"])
  if w<1920 or h<1080 or w<=h:raise RuntimeError("ACTUAL_SOURCE_BELOW_1080P_OR_PORTRAIT")
  duration=float(raw["format"].get("duration") or 0)
  if duration<2:raise RuntimeError("SOURCE_TOO_SHORT")
  ff(["ffmpeg","-nostdin","-loglevel","error","-i",str(target),"-f","null","-"],80)
  pic=Image.new("RGB",(4*460,3*280),(8,8,8));d=ImageDraw.Draw(pic)
  for k in range(12):
   sec=round(duration*(k+.45)/12,3)
   tmp=S/(x["id"]+"_"+str(k)+".jpg")
   ret=call(["ffmpeg","-nostdin","-loglevel","error","-y","-ss",str(sec),
      "-i",str(target),"-frames:v","1","-vf",
      "scale=460:260:force_original_aspect_ratio=decrease,pad=460:260:(ow-iw)/2:(oh-ih)/2",
      "-q:v","5",str(tmp)],25)
   if ret.returncode==0 and tmp.exists():
    with Image.open(tmp) as img:pic.paste(img.convert("RGB"),((k%4)*460,(k//4)*280+20))
    tmp.unlink()
   d.text(((k%4)*460+5,(k//4)*280+2),f"{sec:.1f}s {w}x{h}",fill="white")
  sheet=S/(x["id"]+"_12frames.jpg");pic.save(sheet,quality=89)
  x.update(status="ACTUAL_NATIVE_HD_FULL_DECODE_GT3_MODEL_AND_RACE_QA_PENDING",
      bytes=target.stat().st_size,sha256=sha(target),file=str(target.relative_to(ROOT)),
      dimensions=[w,h],actual_duration_seconds=duration,ffprobe=raw,
      contact_sheet=str(sheet.relative_to(ROOT)),
      full_decode="PASS",editor_status="REVIEW_ONLY_NO_QUALIFYING_SHOT_YET")
  print("REAL VIDEO",x["id"],w,h,x["bytes"],x["sha256"],flush=True)
 except Exception as exc:
  x["status"]="REJECTED_OR_BLOCKED";x["failure"]=str(exc)[-900:]
  for f in V.glob(x["id"]+".*"):f.unlink(missing_ok=True)
  print("REJECTED",x["id"],x["failure"][-350:],flush=True)
 x['elapsed_seconds']=round(time.monotonic()-started,1)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps({"gate":"BLOCKED_PENDING_VISUAL_REAL_GT3_MAKE_VERIFY","sources":TARGETS,"qa_note":"Vimeo movie title, film publisher and technical 1080p format list alone are NOT scene qualification. Each extracted frame must be visually verified."},indent=2,ensure_ascii=False)+"\n")
(ROOT/"README_FIRST.md").write_text("# Third-wave real Nürburgring film acquisition\nThis is an UNAPPROVED footage scout, not a GT3 montage release. See SOURCE_MANIFEST.json, physical native_video files and 12-frame contact sheets. Identical filmed camera angles must not be counted repeatedly.\n")
print("ACTUAL_NATIVE_VIDEO_COUNT",sum(x["status"].startswith("ACTUAL_NATIVE_HD") for x in TARGETS),flush=True)
