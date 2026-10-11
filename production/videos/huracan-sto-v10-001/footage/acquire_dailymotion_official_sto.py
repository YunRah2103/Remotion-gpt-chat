#!/usr/bin/env python3
"""Actual native MP4 acquisition from publicly viewable Dailymotion publisher films.
No login bypass, no force-resize. Media is research until manual visual QA.
"""
import pathlib,subprocess,hashlib,zipfile,json,re
from PIL import Image,ImageDraw
ROOT=pathlib.Path("out/sto-dailymotion");ROOT.mkdir(parents=True,exist_ok=True)
V=ROOT/"sources";V.mkdir(exist_ok=True)
P=ROOT/"contact_sheets";P.mkdir(exist_ok=True)
SOURCES=[
 ("sto-vallelunga-test-drive","https://www.dailymotion.com/video/x836c2s","Official 2021 Huracan STO first test drives Vallelunga/Rome"),
 ("sto-launch-2020","https://www.dailymotion.com/video/x7xlmyw","Official Lamborghini Huracan STO Racetrack to Road launch film"),
 ("sto-vallelunga-italian","https://www.dailymotion.com/video/x836bjb","Italian edition STO Rome & Autodromo Piero Taruffi, duplicate-source check"),
 ("sto-lamborghini-road-review","https://www.dailymotion.com/video/x8pul1x","CarExpert 2023 Huracan STO road review; verify producer overlays"),
]
def cmd(args,timeout=180):
 return subprocess.run(args,text=True,capture_output=True,timeout=timeout)
def ffprobe(f):
 r=cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],timeout=35)
 if r.returncode:raise ValueError("ffprobe: "+r.stderr[-250:])
 d=json.loads(r.stdout);v=next(x for x in d["streams"] if x["codec_type"]=="video")
 return {"resolution":[v["width"],v["height"]],"fps":v.get("avg_frame_rate"),"duration_seconds":float(d["format"].get("duration") or 0),"container_bitrate":int(d["format"].get("bit_rate") or 0),"bytes":f.stat().st_size,
         "codec":v.get("codec_name"),"sha256":hashlib.sha256(f.read_bytes()).hexdigest()}
def sheet(f,meta,name):
 n=24;W=4;h=155;dur=meta["duration_seconds"];im=Image.new("RGB",(960,6*h),"#101015");draw=ImageDraw.Draw(im)
 for i in range(n):
  t=max(.06,min(dur-.08,dur*(i+.4)/n))
  pic=P/".tmp.jpg"
  p=cmd(["ffmpeg","-v","error","-nostdin","-y","-ss",f"{t:.3f}","-i",str(f),
      "-vf","scale=240:135:force_original_aspect_ratio=decrease,pad=240:135:(ow-iw)/2:(oh-ih)/2",
      "-frames:v","1",str(pic)],40)
  if pic.exists():
   with Image.open(pic) as fr:im.paste(fr.convert("RGB"),((i%W)*240,(i//W)*h+18))
   pic.unlink()
  draw.text(((i%W)*240+3,(i//W)*h+3),f"{t:.1f}s",fill="white")
 im.save(P/(name+"_contact.jpg"),quality=88)
def main():
 rows=[];total=0
 for slug,url,title in SOURCES:
  row={"id":slug,"url":url,"title":title,"state":"NOT_ACQUIRED","watermark_visual_verified":False,"approved_road_sto_shots":0}
  rows.append(row)
  target=V/(slug+".mp4")
  if total>=520_000_000:row["state"]="SKIP_TOTAL_SIZE_LIMIT";continue
  command=[
    "yt-dlp","--no-playlist","--no-progress","--ignore-errors","--socket-timeout","18",
    "--retries","1","--fragment-retries","1","--concurrent-fragments","3","--max-filesize","220M",
    "-f","bv*[height>=1080]+ba/best[height>=1080]/bv*+ba/best",
    "--merge-output-format","mp4","--remux-video","mp4","--output",str(target),url
  ]
  try:
   result=cmd(command,timeout=320)
   if result.returncode or not target.exists():
    row.update(state="DOWNLOAD_BLOCKED_OR_FAILED",error=(result.stderr+"\n"+result.stdout)[-1000:]);continue
   meta=ffprobe(target);row["ffprobe"]=meta
   w,h=meta["resolution"]
   if w<1920 or h<1080 or w<=h:
    row["state"]="REJECT_BELOW_1920X1080";target.unlink();continue
   if meta["bytes"]>225_000_000:
    row["state"]="REJECT_OVER_SIZE";target.unlink();continue
   row.update(state="REAL_NATIVE_FHD_MASTER_NEEDS_VISUAL_STO_WATERMARK_REVIEW",source_filename=target.name)
   sheet(target,meta,slug)
   total+=meta["bytes"]
  except Exception as e:
   row.update(state="SOURCE_ERROR",error=str(e)[-600:]);target.unlink(missing_ok=True)
  (ROOT/"manifest.json").write_text(json.dumps({"sources":rows,"verified_unique_moving_angles":0,"format":"LANDSCAPE 1920x1080 native or greater"},indent=2))
 (ROOT/"manifest.json").write_text(json.dumps({"sources":rows,"verified_unique_moving_angles":0,"format":"LANDSCAPE 1920x1080 native or greater"},indent=2))
 with zipfile.ZipFile("out/STO_DAILYMOTION_NATIVE_HD_MASTERS.zip","w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
  for f in ROOT.rglob("*"):
   if f.is_file():z.write(f,f.relative_to(ROOT))
 for row in rows:
  print("AUDIT",row["id"],row["state"],row.get("ffprobe",{}).get("resolution"),row.get("ffprobe",{}).get("duration_seconds"),row.get("error","")[-140:])
if __name__=="__main__":main()
