#!/usr/bin/env python3
"""Agent B: alternative REAL IndyCar roadside close pass.
Source: independent US National Guard 2026 Freedom 250 event recording, not Indianapolis oval.
Output must NEVER count as a banked oval transition match or rights-cleared Indy 500 footage.
"""
from pathlib import Path
import hashlib,json,zipfile,subprocess,sys
from PIL import Image,ImageDraw,ImageChops,ImageStat
ROOT=Path("out/agent-b-alt-indycar-street");SRC=ROOT/"original";CLIPS=ROOT/"clips";SHEETS=ROOT/"contact_sheets"
for x in [SRC,CLIPS,SHEETS]:x.mkdir(parents=True,exist_ok=True)
URL="https://www.dvidshub.net/video/1020299/jtf-dc-national-guardsmen-assist-with-freedom-250-grand-prix"
NAME="B_ALT1_2026_Freedom250_low_corner_indycar_pack"
START=5.7;LENGTH=1.7
def run(a,timeout=140):
 r=subprocess.run(a,capture_output=True,text=True,timeout=timeout)
 if r.returncode: raise RuntimeError(str(a[:2])+" failed: "+r.stderr[-1200:])
 return r.stdout
def probe(p):
 d=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
 v=next(x for x in d["streams"] if x["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"fps":v["avg_frame_rate"],"codec":v["codec_name"],"duration_s":float(d["format"]["duration"])}
def sha(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def main():
 pattern=str(SRC/"freedom2026.%(ext)s")
 run(["yt-dlp","--no-playlist","--socket-timeout","15","--retries","2","--fragment-retries","2","-f","best","-o",pattern,URL],220)
 vfiles=list(SRC.glob("freedom2026.*"))
 if not vfiles:raise RuntimeError("no actual source video")
 source=max(vfiles,key=lambda x:x.stat().st_size);p=probe(source)
 assert p["width"]>=1920 and p["height"]>=1080,"native HD required"
 assert p["duration_s"]>START+LENGTH,"Source too short"
 out=CLIPS/(NAME+".mp4")
 run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(START),"-i",str(source),"-t",str(LENGTH),"-map","0:v:0","-an","-c:v","libx264","-crf","18","-preset","fast","-pix_fmt","yuv420p","-movflags","+faststart",str(out)],140)
 delivered=probe(out)
 assert delivered["width"]>=1920 and delivered["height"]>=1080,"clip below HD"
 run(["ffmpeg","-nostdin","-v","error","-i",str(out),"-f","null","-"],100)
 times=[.10,.30,.50,.70,.90,1.10,1.35,1.55]
 pics=[];diffs=[]
 for i,t in enumerate(times):
  pic=SRC/"tmp.jpg"
  run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(t),"-i",str(out),"-frames:v","1","-vf","scale=640:-2","-q:v","3",str(pic)],35)
  im=Image.open(pic).convert("RGB")
  if pics:
   diff=sum(ImageStat.Stat(ImageChops.difference(im,pics[-1])).mean)/3
   diffs.append(round(diff,2))
  pics.append(im.copy());pic.unlink()
 sheet=Image.new("RGB",(640*2,400*4),(11,12,16))
 d=ImageDraw.Draw(sheet)
 for i,(t,im) in enumerate(zip(times,pics)):
  x=(i%2)*640;y=(i//2)*400;sheet.paste(im,(x,y+29))
  d.text((x+12,y+7),f"2026 Freedom 250 | source time {START+t:.2f}s",fill=(255,255,255))
 contact=SHEETS/(NAME+"_contact.jpg");sheet.save(contact,quality=87)
 entry={
  "clip":str(out.relative_to(ROOT)),"contact_sheet":str(contact.relative_to(ROOT)),
  "video_event":"2026 Freedom 250 Grand Prix, Washington DC STREET COURSE, NOT 2026 Indianapolis 500 banked oval",
  "source_url":URL,"credit":"US National Guard / Sgt. Carlos Parra, August 23 2026, DVIDS",
  "source_original":p,"delivered":delivered,"source_start_s":START,"clip_duration_s":LENGTH,
  "original_sha256":sha(source),"clip_sha256":sha(out),"clip_bytes":out.stat().st_size,
  "pixel_motion_differences":diffs,"angle":"Roadside corner, car pass under overhead orange sponsor banner, multiple real modern IndyCars",
  "visual_status":"PROVISIONAL; Verified cut from 5.70s through 7.40s excludes earlier fence shot and later soldier interview; independent replay review still required",
  "contract_status":"NOT a valid Indianapolis banked oval match; substitute would REQUIRE USER APPROVAL",
  "rights":"DVIDS public-domain government creation statement. IndyCar/event/third-party footage and logo rights are not confirmed; internal review only."
 }
 (ROOT/"manifest.json").write_text(json.dumps([entry],indent=2)+"\n")
 (ROOT/"SHA256SUMS.txt").write_text(entry["clip_sha256"]+"  "+entry["clip"]+"\n")
 (ROOT/"REPORT.md").write_text("# YUNEX Agent B — Alternative contemporary IndyCar racing footage\n\nGenuine native 1080p camera recording from DC Freedom 250, **not Indianapolis oval**. The roadside camera is lower, with bigger racing cars and speed texture than past banked oval spectator footage. An explicit substitute and not a claimed 1:1 Turbo banking match. No licence clearance for republishing INDYCAR footage is inferred from public access.\n\n"+URL+"\n")
 dest=Path("out/YUNEX_AGENT_B_FREEDOM250_REAL_INDYCAR_1080P.zip")
 with zipfile.ZipFile(dest,"w",zipfile.ZIP_DEFLATED,compresslevel=2) as z:
  for p in ROOT.rglob("*"):
   if p.is_file() and SRC not in p.parents:z.write(p,p.relative_to(ROOT))
 assert zipfile.ZipFile(dest).testzip() is None
 source.unlink()
 print("DELIVERY",json.dumps({"clip":entry["clip"],"source":entry["source_original"],"encoded":entry["delivered"],"bytes":entry["clip_bytes"],"sha256":entry["clip_sha256"],"motion_deltas":diffs,"contract":entry["contract_status"]}),flush=True)
 print("ZIP_READY",str(dest),dest.stat().st_size,flush=True)
if __name__=="__main__":
 try:main()
 except Exception as e:print("FAILED",repr(e),file=sys.stderr);raise
