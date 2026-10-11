#!/usr/bin/env python3
"""Extract REAL HRT Ford 2026 GT3 film targeted candidate scenes for independent Nürburgring inspection.
Native full-HD from real original 84.12s, byte provenance verified, no automatic GT3 scene credits.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import zipfile,shutil,subprocess,hashlib,json,base64,io
R=Path("out/gt3-a-hrt-ford-2026-targeted-originals")
C=R/"physical_1080_video_review";S=R/"real_source_frames"
for q in (R,C,S):q.mkdir(parents=True,exist_ok=True)
Z=next(p for p in Path("inputs/hrt-2026-full-original").rglob("*.zip") if p.stat().st_size>20_000_000)
def sha(f):
 h=hashlib.sha256()
 with f.open('rb') as src:
  for block in iter(lambda:src.read(1<<20),b""):h.update(block)
 return h.hexdigest()
def cmd(args,t=90):
 x=subprocess.run(args,timeout=t,text=True,capture_output=True)
 if x.returncode:raise RuntimeError(x.stderr[-400:])
 return x.stdout
with zipfile.ZipFile(Z) as z:
 assert z.testzip() is None
 m=json.loads(z.read("SOURCE_MANIFEST.json"))
 src=next(x for x in m["sources"] if x["source_id"]=="hrt_ford_2026_entire_original")
 original=R/"TEMP_actual_84_second_original.mp4"
 with z.open(src["file"]) as inp,original.open("wb") as out:shutil.copyfileobj(inp,out)
 assert sha(original)==src["sha256"]
 clips=[
  {"id":"FORD_N24_2026_GT3_PIT_TO_NORDSCHLEIFE_CANDIDATE","source_start":22.0,"duration":7.5,"QA_note":"2025 or 2026 race GT3 Mustang yellow-blue branded Nürburgring pit to Nordschleife drive, determine if clean moving shot ~26s"},
  {"id":"FORD_BLUE_64_DTM_GT3_TRACK_CANDIDATE","source_start":59.3,"duration":5.8,"QA_note":"Blue Ford #64 DTM racer on live racetrack; location MUST prove Nürburgring, otherwise reject"},
  {"id":"FORD_NIGHT_RACE_MUSTANG_GT3_CANDIDATE","source_start":70.5,"duration":7.7,"QA_note":"Publisher mixed-events nighttime Ford Mustang GT3 action, identify circuit; do not automatically claim Nürburgring"},
  {"id":"FORD_FINAL_RACING_GT3_CANDIDATE","source_start":78.0,"duration":6.0,"QA_note":"Last Ford race shots; multiple makes/class and circuits, separate only legitimate Nürburgring GT3"}
 ]
 for entry in clips:
  st=float(entry["source_start"]);dur=float(entry["duration"])
  name=entry["id"]
  out=C/(name+".mp4")
  cmd(["ffmpeg","-nostdin","-loglevel","error","-y","-ss",str(st),"-i",str(original),"-t",str(dur),
   "-map","0:v:0","-an","-c:v","libx264","-crf","17","-preset","faster","-pix_fmt","yuv420p",str(out)],160)
  raw=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(out)],40))
  v=next(x for x in raw['streams'] if x['codec_type']=='video')
  assert (int(v['width']),int(v['height']))==(1920,1080)
  cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(out),"-f","null","-"],80)
  actual_len=float(raw['format'].get('duration') or 0)
  assert actual_len>1.
  board=Image.new("RGB",(3*720,4*432),(5,5,5));draw=ImageDraw.Draw(board)
  for i in range(12):
   ts=min(dur-.05,(i+.4)*dur/12)
   frame=S/(name+f"_tmp{i}.jpg")
   cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(out),
      "-frames:v","1","-vf","scale=720:405","-q:v","3",str(frame)],40)
   with Image.open(frame) as picture:board.paste(picture.convert("RGB"),((i%3)*720,(i//3)*432+26))
   frame.unlink(missing_ok=True)
   draw.text(((i%3)*720+5,(i//3)*432+5),f"ORIGINAL {st+ts:.2f}s",fill="white")
  sheet=S/(name+"_12_ACTUAL_FRAMES.jpg");board.save(sheet,quality=92,optimize=True)
  downsized=io.BytesIO();board.resize((1440,1152)).save(downsized,"JPEG",quality=84,optimize=True)
  print("FORD_TARGETED_"+name+"_BASE64_START:"+base64.b64encode(downsized.getvalue()).decode("ascii")+
        ":FORD_TARGETED_"+name+"_BASE64_END",flush=True)
  entry.update(actual_native_pixels=[1920,1080],output_video=str(out.relative_to(R)),
  output_video_sha256=sha(out),physical_bytes=out.stat().st_size,
  real_frame_contact_sheet=str(sheet.relative_to(R)),duration_actual_s=actual_len,full_decode="PASS",
  is_approved_GT3_nurburgring_camera=False)
  print("REAL_FULL_HD_SOURCE_EXTRACT",name,"SHA256",entry["output_video_sha256"],"size",entry["physical_bytes"],flush=True)
 R.joinpath("SOURCE_MANIFEST.json").write_text(json.dumps({"film":"HRT Ford Racing Highlights",
 "publisher_page":src["publisher_page"],"original_shares_sha256":src["sha256"],
 "native_original_pixels":[1920,1080],"source_original_duration":84.12,
 "source_excerpt_video_records":clips,"independently_verified_GT3_NBR_shots_additionally_counted":0,
 "rule":"A Ford GT3 at Spa/DTM or in pits is not 24H Nürburgring on-track; filmmaker movie compilation has multiple different circuit years. Visually inspect each."},indent=2))
 original.unlink(missing_ok=True)
