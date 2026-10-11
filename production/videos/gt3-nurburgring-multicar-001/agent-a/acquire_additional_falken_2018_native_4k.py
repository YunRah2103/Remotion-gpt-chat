#!/usr/bin/env python3
"""Extract new authentic 4K Nürburgring race angles from source intervals absent in V4.

Source: Falken 2018 full 3840x2160 HDR director's cut; never call a segment
a new camera angle or a GT3 model until original full-frame visual QA.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,subprocess
U="https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4"
ROOT=Path("out/gt3-a-falken-2018-unseen-race-angles")
C=ROOT/"native_4k_clips";P=ROOT/"contact_sheets"
for x in (ROOT,C,P):x.mkdir(parents=True,exist_ok=True)
CLIPS=[
 ("PORSCHE_GT3_TRACKSIDE_190_CANDIDATE",190,7.5,"on-track racing GT3 Porsche at about 192s; duplicate audit against 195s candidate"),
 ("PORSCHE_GT3_TRACKSIDE_198_CANDIDATE",198,6.5,"on-track Porsche GT3 at 201s; may be same longer camera movement as 190, dedup"),
 ("FALKEN_NIGHT_RACING_270_CANDIDATE",269,8,"night racing / onboard 273s, car/make identity needs review"),
 ("FALKEN_WET_NIGHT_RACING_280_CANDIDATE",278,10,"headlights through rain/fog, make identity unverified"),
]
def run(args,timeout):
 z=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if z.returncode:raise RuntimeError((z.stderr or z.stdout)[-450:])
 return z.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for bit in iter(lambda:f.read(2**20),b""):h.update(bit)
 return h.hexdigest()
results=[]
for cid,start,duration,note in CLIPS:
 f=C/(cid+".mkv")
 rec={"id":cid,"original_video_url":U,"source_start":start,"requested_duration":duration,"note":note,"status":"NOT_PROVEN"}
 try:
  run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(start),"-i",U,"-t",str(duration),"-map","0:v:0",
       "-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(f)],150)
  j=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],25))
  v=next(x for x in j["streams"] if x["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  if (w,h)!=(3840,2160):raise ValueError("Not native original 4K HDR")
  actual_duration=float(j["format"].get("duration") or 0)
  if actual_duration<2:raise ValueError("Playable source too short")
  run(["ffmpeg","-nostdin","-v","error","-i",str(f),"-f","null","-"],110)
  rec.update(status="REAL_NATIVE_4K_FULL_DECODE_APPROVED_ORIGINAL_MODEL_AND_UNIQUE_CAMERA_REVIEW_PENDING",
             bytes=f.stat().st_size,sha256=sha(f),native_width=w,native_height=h,actual_duration=actual_duration,
             pixel_format=v.get("pix_fmt"),color_transfer=v.get("color_transfer"),
             source_file=str(f.relative_to(ROOT)),ffprobe=j)
  board=Image.new("RGB",(3*480,2*290),(8,8,8));d=ImageDraw.Draw(board)
  for k in range(6):
   ts=(k+.4)*actual_duration/6
   thumb=P/(cid+"_"+str(k)+".jpg")
   run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(f),"-frames:v","1",
        "-vf","zscale=t=linear:npl=100,format=gbrpf32le,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:p=bt709,format=yuv420p,scale=480:-2",
        "-q:v","4",str(thumb)],35)
   with Image.open(thumb) as im:board.paste(im.convert("RGB"),((k%3)*480,(k//3)*290+20))
   d.text(((k%3)*480+5,(k//3)*290+3),f"source t~{start+ts:.1f}s",fill="white")
   thumb.unlink()
  preview=P/(cid+"_6FRAME.jpg");board.save(preview,quality=89)
  rec["contact_sheet"]=str(preview.relative_to(ROOT))
  print("NEW_REAL_NATIVE_4K",cid,w,h,f.stat().st_size,sha(f),flush=True)
 except Exception as e:
  rec.update(status="FAILED_OR_REJECTED",failure=str(e)[-450:])
  f.unlink(missing_ok=True)
  print("4K_REJECTED",cid,rec['failure'],flush=True)
 results.append(rec)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps({"producer":"Falken 2018 original 4K HDR","gate":"BLOCKED_UNTIL_DISTINCT_GT3_ANGLE_VISUAL_AUDIT","original_url":U,"candidate_sections":results,"do_not_double_count_existing_v4_source_ranges":"~34,~150,~170-182,~240-252","note":"Downloaded sections are independent bytes but may be repeated viewpoint or non identifiable, so GT3 shot quota remains unchanged until frame review"},indent=2)+"\n")
print("REAL_NATIVE4K_SOURCE_SECTION_COUNT",sum(x["status"].startswith("REAL_NATIVE") for x in results),flush=True)
