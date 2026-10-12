#!/usr/bin/env python3
"""Agent B: deliver one authentic camera-shot modern IndyCar close-pass from a government-filmed DVIDS original.
No fake camera angles, speed changes, 720p upscale, third-party broadcast clips or simulated 4K.
"""
from pathlib import Path
import subprocess,hashlib,json,zipfile,sys
from PIL import Image,ImageDraw,ImageChops,ImageStat

BASE=Path("out/agent-b-2026-pitwall");RAW=BASE/"source";VIDEO=BASE/"clips";SHEETS=BASE/"contact_sheets"
for p in (RAW,VIDEO,SHEETS):p.mkdir(parents=True,exist_ok=True)
SOURCE="https://www.dvidshub.net/video/1008379/us-armed-forces-participate-indy-500-2026-b-roll-package"
NAME="B26_01_modern_indycar_smoke_near_pitwall"
START=290.5; LENGTH=3.10
RIGHTS="DVIDS labels government-created recording public domain; check https://www.dvidshub.net/about/copyright and INDYCAR/event/trademark/third-party rights before publishing."
def run(cmd,timeout=100):
 p=subprocess.run(cmd,text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError(f'{cmd[0]} failed: '+p.stderr[-1100:])
 return p.stdout
def probe(p):
 obj=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
 v=next(s for s in obj["streams"] if s["codec_type"]=="video")
 return dict(width=v["width"],height=v["height"],codec=v["codec_name"],fps=v["avg_frame_rate"],duration=float(obj["format"]["duration"]))
def digest(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def main():
 tmpl=str(RAW/"source2026.%(ext)s")
 run(["yt-dlp","--no-playlist","--socket-timeout","20","--retries","2","--fragment-retries","2","-f","best","-o",tmpl,SOURCE],600)
 files=list(RAW.glob("source2026.*"))
 if not files:raise RuntimeError("No video bytes actually downloaded")
 src=max(files,key=lambda f:f.stat().st_size);original=probe(src)
 assert original["width"]>=3840 and original["height"]>=2160, "not actual native 4K source"
 assert original["duration"]>START+LENGTH
 target=VIDEO/(NAME+".mp4")
 run(["ffmpeg","-hide_banner","-nostdin","-y","-loglevel","error","-ss",str(START),"-i",str(src),"-t",str(LENGTH),"-map","0:v:0","-an","-c:v","libx264","-crf","18","-preset","veryfast","-pix_fmt","yuv420p","-movflags","+faststart",str(target)],180)
 v=probe(target)
 assert v["width"]==3840 and v["height"]==2160 and v["duration"]>2.9, "4K MP4 rejected"
 run(["ffmpeg","-nostdin","-v","error","-i",str(target),"-f","null","-"],100)
 samples=[];deltas=[]
 for i,t in enumerate([.15,.55,.95,1.35,1.75,2.15,2.65,3.0]):
  f=SHEETS/(f"f{i}.jpg")
  run(["ffmpeg","-hide_banner","-nostdin","-y","-v","error","-ss",str(t),"-i",str(target),"-frames:v","1","-vf","scale=720:-2","-q:v","3",str(f)],30)
  im=Image.open(f).convert("RGB")
  if samples:
   d=sum(ImageStat.Stat(ImageChops.difference(im,samples[-1][1])).mean)/3
   deltas.append(round(d,2))
  samples.append((t,im.copy()));f.unlink()
 sheet=Image.new("RGB",(1440,8*435//2),(12,14,17));d=ImageDraw.Draw(sheet)
 for i,(t,im) in enumerate(samples):
  x=(i%2)*720;y=(i//2)*435
  sheet.paste(im,(x,y+30))
  d.text((x+9,y+7),f'{NAME} — original {START+t:.2f}s',fill=(255,255,255))
 sheetpath=SHEETS/(NAME+"_contact.jpg");sheet.save(sheetpath,quality=87)
 assert min(deltas)>1.0, "Motion check failed"
 entry={
   "file":str(target.relative_to(BASE)),
   "source_url":SOURCE,
   "source_title":"U.S. Armed Forces participate in Indy 500 2026 (B-Roll Package)",
   "creator":"Indiana National Guard / Staff Sgt. Hector Tinoco",
   "date_recorded":"2026-05-24",
   "original":original,"delivered":v,
   "start_s":START,"duration_s":LENGTH,
   "sha256":digest(target),"bytes":target.stat().st_size,
   "contact_sheet":str(sheetpath.relative_to(BASE)),
   "motion_pixel_deltas":deltas,
   "direction":"Car moves screen-right to screen-left in a lateral near-pitwall pass (verify across decoded frames)",
   "angle":"Near-pitwall elevated/telephoto side tracking, not ground-mounted lens",
   "camera_match":"Partial tyre/open-wheel/pitwall/smoke motif vs Turbo Agent A A01/A05; rejected as exact lens/banking match",
   "rights":RIGHTS,
   "status":"PASS real camera-filmed native 4K moving IndyCar; NOT approved seamless cut; reuse rights review"
 }
 (BASE/"manifest.json").write_text(json.dumps([entry],indent=2)+"\n")
 (BASE/"SHA256SUMS.txt").write_text(entry["sha256"]+"  "+entry["file"]+"\n")
 (BASE/"REPORT.md").write_text("# YUNEX Agent B — 2026 4K IndyCar authentic source\n\n"
 "One distinct real modern IndyCar near pit-wall clip, 3.1s at source t290.5–293.6. Shot moves past smoke. Original native 3840x2160; decoded and verified in 4K, no 720p upscale. This differs from D's 322.5s distant race pass and C's close onboard finish.\n\n"
 "Creative status: **PARTIAL**, not the exact A01 low-lens banked curve match. Crowd/pitwall distractions, different lens angle. Archive is footage research, not cleared publishable stock.\n\nSource: "+SOURCE+"\nRights: "+RIGHTS+"\n")
 arc=Path("out/YUNEX_AGENT_B_INDY_2026_NATIVE4K_CLIP.zip")
 with zipfile.ZipFile(arc,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for p in sorted(BASE.rglob("*")):
   if p.is_file() and RAW not in p.parents:z.write(p,p.relative_to(BASE))
 assert zipfile.ZipFile(arc).testzip() is None
 src.unlink()
 print("PASS_VIDEO",json.dumps({k:entry[k] for k in ("file","original","delivered","sha256","bytes","motion_pixel_deltas","camera_match")}),flush=True)
 print("ZIP_READY",arc,arc.stat().st_size,flush=True)
if __name__=="__main__":
 try:main()
 except Exception as e:print("ACQUISITION_FAIL",repr(e),file=sys.stderr);raise
