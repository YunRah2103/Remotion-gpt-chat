#!/usr/bin/env python3
"""Source clean landscape Huracan STO research masters with truthful FFprobe QA.
No protected-bypass methods. Download only Vimeo public playback when accessible.
Rights/individual identity/shot quality MUST still be visually verified by Agent A.
"""
import hashlib,json,os,subprocess,sys,time,zipfile
from pathlib import Path
ROOT=Path("out/sto-editor-v2"); VIDS=ROOT/"original_mp4"; PRE=ROOT/"previews"
SOURCES=[
 ("sto-directors-cut","https://vimeo.com/585861142","Lamborghini commissioned directors cut, Overclock/Nicolo Bravetta"),
 ("sto-charlotte","https://vimeo.com/566128123","Clint Davis/John Schumacher Studios original"),
 ("sto-elias","https://vimeo.com/808787211","Elias Maria cinematic"),
 ("sto-federico","https://vimeo.com/659374941","Federico Gariboldi STO"),
 ("sto-recon","https://vimeo.com/811982853","STO reconnaissance mission film"),
 ("sto-behind-story","https://vimeo.com/513872033","Official campaign behind the story"),
]
def command(cmd,limit=130):
 return subprocess.run(cmd,capture_output=True,text=True,timeout=limit)
def probe(f):
 r=command(["ffprobe","-v","quiet","-print_format","json","-show_streams","-show_format",str(f)],30)
 if r.returncode: raise RuntimeError("ffprobe failed")
 x=json.loads(r.stdout); v=next(s for s in x["streams"] if s["codec_type"]=="video")
 n,d=(v.get("avg_frame_rate") or "0/1").split("/")
 return {"width":v["width"],"height":v["height"],"fps":round(int(n)/int(d),3) if int(d) else 0,
 "duration":float(x["format"].get("duration") or 0),"video_codec":v["codec_name"],
 "size_bytes":f.stat().st_size,"sha256":hashlib.sha256(f.read_bytes()).hexdigest()}
def frames(f,meta,slug):
 from PIL import Image,ImageDraw
 w,h=meta["width"],meta["height"]; dur=meta["duration"]
 thumb=Image.new("RGB",(960,((8+3)//4)*152),"#0b0f19")
 for i in range(8):
  t=min(dur-0.05,max(0.1,dur*(i+0.5)/8))
  p=PRE/(slug+"_"+str(i)+".jpg")
  x=command(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(f),
      "-vf","scale=240:135:force_original_aspect_ratio=decrease,pad=240:135:(ow-iw)/2:(oh-ih)/2",
      "-frames:v","1",str(p)],40)
  if x.returncode or not p.exists(): continue
  with Image.open(p) as im:thumb.paste(im.convert("RGB"),((i%4)*240,(i//4)*152+17))
  ImageDraw.Draw(thumb).text(((i%4)*240+3,(i//4)*152+2),f"{t:.1f}s",fill="white")
  p.unlink()
 thumb.save(PRE/(slug+"_contact.jpg"),quality=87)
def main():
 VIDS.mkdir(parents=True,exist_ok=True);PRE.mkdir(parents=True,exist_ok=True)
 rows=[]; used=0
 for slug,url,credit in SOURCES:
  row={"id":slug,"page_url":url,"credited_to":credit,"rights_status":"NOT_CLEARED","status":"NOT_DOWNLOADED"}
  rows.append(row)
  if used>770_000_000:row["status"]="SKIPPED_SIZE_BUDGET";continue
  filepath=VIDS/(slug+".mp4")
  fmt="bestvideo[height>=1080][height<=2160]+bestaudio/best[height>=1080][height<=2160]/bestvideo[height<=2160]+bestaudio/best[height<=2160]/best"
  options=["yt-dlp","--no-playlist","--no-progress","--socket-timeout","18","--retries","1",
    "--fragment-retries","1","--concurrent-fragments","2","--max-filesize","290M",
    "--merge-output-format","mp4","--remux-video","mp4","--format",fmt,
    "-o",str(filepath),url]
  try:
   r=command(options,200)
   if r.returncode or not filepath.exists():
    row.update(status="DOWNLOAD_FAILED",error=(r.stderr or r.stdout)[-650:]);continue
   p=probe(filepath);row.update(ffprobe=p)
   if p["width"]<1920 or p["height"]<1080 or p["width"]<=p["height"]:
    row["status"]="REJECT_NOT_FULL_HD_LANDSCAPE";filepath.unlink();continue
   if p["size_bytes"]>300_000_000:
    row["status"]="REJECT_OVERSIZE";filepath.unlink();continue
   frames(filepath,p,slug);row["status"]="NEEDS_VISUAL_REVIEW";used+=p["size_bytes"]
  except Exception as exc:row.update(status="ERROR",error=str(exc)[-300:]);filepath.unlink(missing_ok=True)
  finally:
   (ROOT/"manifest.json").write_text(json.dumps({"sources":rows,"approved_distinct_moving_shots":0,
      "final_output":"1920x1080,30fps,316frames LANDSCAPE","status":"RESEARCH_ONLY_NOT_GATE_PASS"},indent=2))
 manifest=ROOT/"manifest.json"
 manifest.write_text(json.dumps({"sources":rows,"approved_distinct_moving_shots":0,
      "final_output":"1920x1080,30fps,316frames LANDSCAPE","status":"RESEARCH_ONLY_NOT_GATE_PASS"},indent=2))
 with zipfile.ZipFile("out/HURACAN_STO_EDITOR_V2_RESEARCH.zip","w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
  for f in ROOT.rglob("*"):
   if f.is_file():z.write(f,f.relative_to(ROOT))
 for row in rows:print(row["id"],row["status"],row.get("ffprobe",{}).get("width"),row.get("error","")[:130])
if __name__=="__main__":main()
