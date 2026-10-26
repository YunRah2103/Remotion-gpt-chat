#!/usr/bin/env python3
"""2025 Indianapolis 500 extra lead: actual moving Dailymotion footage; no faked approval."""
import subprocess,json,hashlib,zipfile,os,io
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops,ImageStat

OUT=Path("out/agent-c-extra-qualifying"); RAW=OUT/"raw"; S=OUT/"sheets"; CL=OUT/"clips"
for p in (OUT,RAW,S,CL):p.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {"id":"indy2025_herta_qualifying_crash","url":"https://www.dailymotion.com/video/x9jonew",
 "title":"Indy 500 2025 Qualifying 1 Herta Massive Crash Flip",
 "uploader":"Motorsports56","identity":"2025 Indy500 qualifying / NOT race pack",
 "rights":"Third-party edited/broadcast IndyCar highlights, no reposting permission established."},
 {"id":"indy2025_palou_onboard_qualifying","url":"https://www.dailymotion.com/video/x9k137e",
 "title":"2025 Indianapolis 500 Carb Day Palou Onboard Helmet Cam",
 "uploader":"Motorsports56","identity":"Indy500 2025 Carb Day onboard; Agent D speciality",
 "rights":"Third-party IndyCar broadcast/copyright, internal research only; no publication license."}
]
def run(cmd,timeout=120):
 return subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
def sh(path):
 h=hashlib.sha256()
 with open(path,"rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
def probe(path):
 r=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],40)
 if r.returncode:raise RuntimeError("ffprobe failed:"+r.stderr[-600:])
 x=json.loads(r.stdout);v=next(a for a in x['streams'] if a['codec_type']=="video")
 return {"width":int(v["width"]),"height":int(v["height"]),"fps":v.get("avg_frame_rate"),"duration":float(x["format"].get("duration",0)),"codec":v.get("codec_name")}
def img(video,t,path):
 r=run(["ffmpeg","-y","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(video),"-frames:v","1","-vf","scale=640:-2",str(path)],50)
 if r.returncode:raise RuntimeError(r.stderr[-350:])
 return Image.open(path).convert("RGB")
def sheet(video,duration,title,output):
 times=[round(.5+(duration-1.5)*i/17,2) for i in range(18)]
 canvas=Image.new("RGB",(320*6,215*3),(12,12,17));draw=ImageDraw.Draw(canvas)
 for i,t in enumerate(times):
  tmp=S/("tmp_"+str(i)+".jpg")
  pic=img(video,t,tmp);pic.thumbnail((310,174))
  x=(i%6)*320;y=(i//6)*215
  canvas.paste(pic,(x,y+28));draw.text((x+8,y+6),f"{title} @ {t:.2f}s",fill="white")
  tmp.unlink()
 canvas.save(output,quality=90)
 return times
def main():
 manifest={"title":"IndyCar Agent C alternate racing/high-impact source QA","status":"NO_VERIFIED_EXTRA_YET","sources":[],"files":[]}
 for s in SOURCES:
  log=dict(s)
  try:
   outname=str(RAW/(s["id"]+".%(ext)s"))
   args=["yt-dlp","--no-playlist","--no-check-certificates","--socket-timeout","18","--retries","1","--fragment-retries","1",
   "--max-filesize","400M","--match-filter","duration < 1500",
   "-f","bv*[height>=1080]+ba/b[height>=1080]/bestvideo+bestaudio/best","--merge-output-format","mp4","-o",outname,s["url"]]
   dl=run(args,210)
   vids=[p for p in RAW.glob(s["id"]+".*") if p.suffix.lower() in [".mp4",".webm",".mkv"]]
   if dl.returncode or not vids:raise RuntimeError("DOWNLOAD:"+dl.stderr[-900:])
   video=max(vids,key=lambda p:p.stat().st_size)
   props=probe(video);log.update({"status":"DOWNLOADED","source_file_bytes":video.stat().st_size,"source_sha256":sh(video),"probe":props})
   if props["width"]<1920 or props["height"]<1080: 
    log["status"]="REJECT_BELOW_1080P"; print(s["id"],log["status"],props,flush=True)
    continue
   if props["duration"]<5:raise RuntimeError("Too short")
   # Full source visual overview from actual decoded video.
   times=sheet(video,props["duration"],s["id"],S/(s["id"]+"_contact.jpg"))
   log["contact_sheet"]=str(S/(s["id"]+"_contact.jpg"))
   # three spread excerpts; do not declare different camera angles merely because they differ by timestamp.
   anchors=[max(0.,min(props["duration"]-3.0,a)) for a in [1.5,props["duration"]*.4,props["duration"]*.7]]
   for i,st in enumerate(anchors):
    p=CL/(s["id"]+f"_{i+1}.mp4")
    z=run(["ffmpeg","-y","-hide_banner","-loglevel","error","-ss",str(st),"-i",str(video),"-t","2.5","-map","0:v:0","-an","-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p","-movflags","+faststart",str(p)],90)
    if z.returncode:raise RuntimeError("encode:"+z.stderr[-500:])
    pa=probe(p)
    assert pa["width"]>=1920 and pa["height"]>=1080
    assert pa["duration"]>=2.0
    dc=run(["ffmpeg","-v","error","-xerror","-i",str(p),"-f","null","-"],50)
    assert dc.returncode==0
    manifest["files"].append({"path":str(p.relative_to(OUT)),"time_start_s":round(st,2),
         "duration":pa["duration"],"source_id":s["id"],"sha256":sh(p),"native_video_source_resolution":props,"rights":s["rights"],
         "status":"VISUAL_REVIEW_REQUIRED_NOT_APPROVED_FOR_EDIT"})
   log["status"]="SOURCE_VERIFIED_FRAMES_AND_CLIPS_CREATED"
   print("SOURCE_OK",s["id"],props,flush=True)
  except Exception as exc:
   log["status"]="FAILED";log["error"]=str(exc)[:1200]
   print("SOURCE_FAIL",s["id"],log["error"],flush=True)
  finally:
   manifest["sources"].append(log)
   for p in RAW.glob(s["id"]+".*"):p.unlink(missing_ok=True)
 manifest["status"]="CANDIDATES_ACQUIRED_PENDING_MANUAL_SHOT_QA" if manifest["files"] else "BLOCKED_NO_NEW_USABLE_SOURCE"
 (OUT/"manifest.json").write_text(json.dumps(manifest,indent=2))
 (OUT/"REPORT.md").write_text("# Agent C alternate 2025 Indy500 sourcing\n\n"+
 "\n".join(f"* {x['id']} — {x['status']} — {x.get('probe',{}).get('width','?')}x{x.get('probe',{}).get('height','?')}" for x in manifest["sources"])+
 "\n\nThese two sources are QUALIFYING CRASH and ONBOARD CARB DAY, respectively, not aggressive oval race packs. Never count as race pack until contact sheets are manually reviewed. Rights for broadcast re-use NOT established.\n")
 (OUT/"SHA256SUMS.txt").write_text("\n".join(f"{x['sha256']}  {x['path']}" for x in manifest["files"])+"\n")
 with zipfile.ZipFile(OUT/"agent-c-extra-shots.zip","w",compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for p in OUT.rglob("*"):
   if p.is_file() and p!=OUT/"agent-c-extra-shots.zip" and RAW not in p.parents:z.write(p,p.relative_to(OUT))
 print(json.dumps({"status":manifest["status"],"source_count":len(manifest["sources"]),"actual_clips":len(manifest["files"]),"zip_bytes":(OUT/"agent-c-extra-shots.zip").stat().st_size}),flush=True)
 if not manifest["files"]:raise SystemExit(2)
if __name__=="__main__":main()
