#!/usr/bin/env python3
"""Agent B: deliver distinct real-camera moving IndyCar 4K trackside candidates with frame QA.
No fake 1080 upscaling; no Agent D 322.5-326.5s duplicate. Candidate clips NOT artistically approved until manual visual review."""
from pathlib import Path
import subprocess,json,hashlib,zipfile,sys
from PIL import Image,ImageChops,ImageStat,ImageDraw
BASE=Path("out/agent-b-2026-trackside-4k")
RAW=BASE/"original";CLIPS=BASE/"clips";SHEETS=BASE/"contact_sheets"
for p in (RAW,CLIPS,SHEETS):p.mkdir(parents=True,exist_ok=True)
URL="https://www.dvidshub.net/video/1008379/us-armed-forces-participate-indy-500-2026-b-roll-package"
SOURCE_CREDIT="Indiana National Guard, Staff Sgt. Hector Tinoco, May 24 2026, DVIDS."
RIGHTS="Marked public domain by DVIDS; review https://www.dvidshub.net/about/copyright and possible INDYCAR/third-party event rights before online publication."
CUTS=[
 ("B26_01_original_real_car_trackside",47.0,5.0,"Movement along Speedway front straight; 49.5s shows actual filmed open-wheel car. Check actual real race vs procession before approval.","A02 optional angle/pan only, not A01 wheel-match."),
 ("B26_02_original_real_car_close_pass",290.5,5.0,"Fast close trackside approach/passing at approx 293.5s, modern IndyCars. This is a separate camera composition to Agent D 322.5.","A02 fast passing car frame may align; A01 very-low lens still unmatched.")
]
def run(args,timeout=90):
 x=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
 if x.returncode:raise RuntimeError(str(args[0])+": "+x.stderr[-700:])
 return x.stdout
def digest(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def probe(p):
 return json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
def main():
 template=str(RAW/"indy500_2026.%(ext)s")
 run(["yt-dlp","--no-playlist","-f","best","--socket-timeout","25","--retries","2","--fragment-retries","2","-o",template,URL],600)
 originals=list(RAW.glob("indy500_2026.*"))
 if not originals:raise RuntimeError("No real video original downloaded")
 original=max(originals,key=lambda p:p.stat().st_size)
 data=probe(original);stream=next(s for s in data["streams"] if s["codec_type"]=="video")
 if stream["width"]!=3840 or stream["height"]!=2160:raise RuntimeError("Source not true native 4K")
 manifest=[]
 for ident,start,sec,desc,match in CUTS:
  dest=CLIPS/(ident+".mp4")
  run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(start),"-i",str(original),"-t",str(sec),"-map","0:v:0","-an",
       "-c:v","libx264","-preset","fast","-crf","19","-pix_fmt","yuv420p","-movflags","+faststart",str(dest)],130)
  metadata=probe(dest);v=next(s for s in metadata["streams"] if s["codec_type"]=="video")
  assert (v["width"],v["height"])==(3840,2160),"No fake 1080/4K"
  # Decode *entire* clip, not only a probe header.
  run(["ffmpeg","-nostdin","-v","error","-i",str(dest),"-f","null","-"],70)
  shots=[]; diffs=[]
  for n,dt in enumerate([.2,.65,1.1,1.55,2.0,2.45,3.2,4.2]):
   p=SHEETS/(ident+f"_frame{n:02}.jpg")
   run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(dt),"-i",str(dest),"-frames:v","1",
        "-vf","scale=720:-2","-q:v","4",str(p)],30)
   shots.append((dt,Image.open(p).convert("RGB")))
  for i in range(len(shots)-1):
   d=ImageStat.Stat(ImageChops.difference(shots[i][1],shots[i+1][1])).mean
   diffs.append(round(sum(d)/3,2))
  sheet=Image.new("RGB",(720*2,430*4),(12,12,12));draw=ImageDraw.Draw(sheet)
  for n,(dt,img) in enumerate(shots):
   x=n%2*720;y=n//2*430
   img.thumbnail((720,405));sheet.paste(img,(x,y+22))
   draw.text((x+12,y+6),f"{ident}: source {start+dt:.2f}s",fill="white")
  cp=SHEETS/(ident+"_contact.jpg");sheet.save(cp,quality=86)
  for p in SHEETS.glob(ident+"_frame*.jpg"):p.unlink()
  item={"clip":str(dest.relative_to(BASE)),"source_url":URL,"title":"U.S. Armed Forces participate in Indy 500 2026 (B-Roll Package)",
        "credit":SOURCE_CREDIT,"source_w":stream["width"],"source_h":stream["height"],
        "codec":v["codec_name"],"fps":v.get("avg_frame_rate"),"duration":sec,"start_time_s":start,
        "contact_sheet":str(cp.relative_to(BASE)),"license_note":RIGHTS,"shot_interpretation":desc,
        "potential_turbo_match":match,"motion_pixel_deltas":diffs,"sha256":digest(dest),"bytes":dest.stat().st_size,
        "approval":"Actual source decode PASS. Human close-up/transition and rights clearance NOT YET APPROVED."}
  manifest.append(item);print("CLIP_DECODED",json.dumps(item),flush=True)
 (BASE/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
 (BASE/"SHA256SUMS.txt").write_text("".join(x["sha256"]+"  "+x["clip"]+"\n" for x in manifest))
 (BASE/"REPORT.md").write_text("# Agent B 2026 4K Trackside Original Video Candidates\n\nSource DVIDS public-domain marked "+URL+
     "\n\nBoth sourced from one original film shot at different points, not two independent recording authors or guaranteed distinct camera angles. \n\nAll clips actual 4K video, fully decoded and checked SHA256. Reference Agent A A01 (wheel, low lens) and A02 (pack corner). Needs human QA and licensing review. No duplicated Agent D selected 322.5s material.\n\n"+RIGHTS+"\n")
 archive=Path("out/YUNEX_AGENT_B_2026_4K_TRACKSIDE_CANDIDATES.zip")
 with zipfile.ZipFile(archive,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for p in BASE.rglob("*"):
   if p.is_file() and RAW not in p.parents:z.write(p,p.relative_to(BASE))
 print("ARCHIVE",archive,archive.stat().st_size,flush=True)
 print("RESULTS",len(manifest),flush=True)
if __name__=="__main__":main()
