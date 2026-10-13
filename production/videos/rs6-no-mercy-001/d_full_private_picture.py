#!/usr/bin/env python3
"""YUNEX RS6 NO MERCY - Agent D full 395-frame private picture cut.
Reads only authenticated, on-runner, 1080x1920/30fps real source MP4s.
Audio is *not* embedded here: reference is private in user's initiating chat.
Never upload third-party footage or reference soundtrack as public release.
"""
from pathlib import Path
import json, hashlib, math, subprocess, tempfile
from PIL import Image, ImageDraw, ImageStat

ROOT=Path("d-rs6-sources")
OUT=Path("d-rs6-picture")
OUT.mkdir(exist_ok=True)
FILM=OUT/"YUNEX_RS6_NO_MERCY_001_PICTURE.mp4"
FPS=30
FRAMES=395
# Actual original source clips delivered by A2/B2/C2. Timeline is in
# exact output frames, 0..394. Visual meaning of cut is described per beat.
SHOTS=[
 ("A2_C8_RS6_FAST_APPROACH.mp4",0.00,45,"cold","C8 frontal motion; opening impact"),
 ("B2_LOWDOWN_NIGHT_07.mp4",1.43,39,"night","red C8 night 3/4 atmospheric interruption"),
 ("A2_C8_RS6_HAIRPIN_REVEAL.mp4",0.08,30,"bw","hard monochrome switch at frame 84"),
 ("UHD_MATRIX_LED_FRONT_CORNER.mp4",0.03,24,"bw","real pixel-native Matrix LED macro"),
 ("RS6_C8_NATIVE4K_AUDI_GRILLE.mp4",0.15,22,"bw","chrome four-rings grille; 2f black punctuation"),
 ("UHD_RS6_STEERING_MODE_CONTROL.mp4",0.00,19,"bw","real RS MODE steering-button action; tactile launch cue"),
 ("A2_GT_LOW_FRONT_SPEED_PASS.mp4",0.06,22,"bw","distinct white/red C8 RS6 GT; first main drop"),
 ("A2_GT_LOW_REAR_TRACK.mp4",0.09,30,"bw","genuine GT low rear track; 2f negative pulse"),
 ("B2_LOWDOWN_NIGHT_03.mp4",2.04,22,"night","real filmmaker C8 Tango Red side tracking"),
 ("UHD_RS6_RED_BRAKE_CALIPER.mp4",0.04,22,"bw","real drilled rotor & RS caliper macro"),
 ("A2_C8_RS6_MOUNTAIN_SWEEP.mp4",0.02,22,"cold","grey C8 moving mountain bend"),
 ("A2_GT_LOW_FRONT_SPEED_PASS.mp4",0.30,22,"bw","GT front pass different window; second main bass drop"),
 ("UHD_RS6_OVAL_EXHAUST_REAR.mp4",0.03,11,"bw","authentic C8 oval exhaust beat"),
 ("UHD_RS6_REAR_LED_SIGNATURE.mp4",0.03,11,"night","authentic red rear LED hit"),
 ("A2_GT_FRONT_FAST_APPROACH.mp4",0.02,54,"cold","decisive GT moving front attack, hard end"),
]
# One purposefully replayed A2 GT video is used for different, NON-overlapping
# sections (0.06..0.79 and 0.30..1.03 overlap partially) - preferred to replace
# this second GT view with other real moving shot when visually ranked better.
# Output no titles, no logo, no fake car motion or background.
assert sum(s[2] for s in SHOTS)==FRAMES
def run(args,timeout=180):
 p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError("FFMPEG ERROR "+str(p.returncode)+"\n"+p.stderr[-2200:])
 return p.stdout
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
for fn,st,n,look,note in SHOTS:
 p=ROOT/fn
 if not p.is_file() or p.stat().st_size<60000:raise FileNotFoundError("Verified video missing "+str(p))
 j=json.loads(run(["ffprobe","-v","error","-show_entries","stream=codec_type,codec_name,width,height,r_frame_rate:format=duration","-of","json",str(p)],15))
 v=next(x for x in j["streams"] if x.get("codec_type")=="video")
 if v["width"]!=1080 or v["height"]!=1920 or v["r_frame_rate"]!="30/1":
  raise RuntimeError(f"Bad source resolution/rate {fn}: {v}")
 if st+min(n/30,float(j["format"]["duration"]))>float(j["format"]["duration"])+.17:
  raise RuntimeError("Invalid source trim "+fn)
filters=[]
for i,(fn,st,frames,look,note) in enumerate(SHOTS):
 grade={
  "cold":"eq=contrast=1.105:saturation=0.60:brightness=-0.009:gamma=1.045",
  "night":"eq=contrast=1.14:saturation=0.78:brightness=0.005:gamma=1.30",
  "bw":"hue=s=0,eq=contrast=1.23:brightness=-0.013:gamma=1.055",
  "bw_night":"hue=s=0,eq=contrast=1.15:gamma=1.34"
 }[look]
 if fn=="B2_LOWDOWN_NIGHT_03.mp4": grade="eq=contrast=1.18:saturation=0.94:brightness=0.012:gamma=1.52"
 # Actual temporal frames. 0.25s clone extension ONLY where raw source has
 # fewer than target output frames, avoiding any half-empty encoded clip.
 filters.append(f"[{i}:v]trim=start={st:.3f},setpts=PTS-STARTPTS,"
                f"fps=30,tpad=stop_mode=clone:stop_duration=0.25,"
                f"trim=end_frame={frames},setpts=N/(30*TB),"
                f"scale=1080:1920:flags=lanczos,{grade},"
                f"format=yuv420p,setsar=1[v{i}]")
filters.append("".join(f"[v{i}]" for i in range(len(SHOTS)))+
               f"concat=n={len(SHOTS)}:v=1:a=0[base]")
# 2f deliberately controlled black-frame punctuation, NOT half-second blank holds.
# Sparse authentic negative pulses exactly on onset hits. 395 output frames exact.
filters.append("[base]negate=enable='between(n,201,202)+eq(n,297)',"
               "drawbox=x=0:y=0:w=iw:h=ih:c=black:t=fill:"
               "enable='between(n,157,158)+between(n,231,232)',"
               "trim=end_frame=395,setpts=N/(30*TB)[out]")
cmd=["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y"]
for fn,*_ in SHOTS:cmd+=["-i",str(ROOT/fn)]
cmd+=["-filter_complex",";".join(filters),"-map","[out]", "-an",
      "-c:v","libx264","-preset","veryfast","-crf","16",
      "-r","30","-pix_fmt","yuv420p","-movflags","+faststart",str(FILM)]
run(cmd,240)
probe=json.loads(run(["ffprobe","-v","error","-show_entries",
 "stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames:"
 "format=duration,bit_rate,size","-of","json",str(FILM)],15))
video=next(s for s in probe["streams"] if s["codec_type"]=="video")
if (video["width"],video["height"],video["codec_name"],video["pix_fmt"],
    video["r_frame_rate"],int(video["nb_frames"])) != (1080,1920,"h264","yuv420p","30/1",395):
 raise RuntimeError("Output frame/dimension validation fail "+str(probe))
run(["ffmpeg","-nostdin","-hide_banner","-v","error","-xerror",
     "-i",str(FILM),"-f","null","-"],90)
with tempfile.TemporaryDirectory() as tmp:
 pattern=str(Path(tmp)/"f%03d.jpg")
 run(["ffmpeg","-nostdin","-hide_banner","-v","error","-y","-i",
      str(FILM),"-vf","fps=3,scale=180:320","-frames:v","40",pattern],65)
 frames=[Image.open(p).convert("RGB") for p in sorted(Path(tmp).glob("f*.jpg"))]
 if len(frames)<35:raise RuntimeError("QA sampling incomplete")
 columns=8;rows=math.ceil(len(frames)/columns); W,H=180,342
 sheet=Image.new("RGB",(W*columns,H*rows),"#0e1115")
 d=ImageDraw.Draw(sheet)
 lum=[]
 for idx,im in enumerate(frames):
  x=(idx%columns)*W;y=(idx//columns)*H
  sheet.paste(im,(x,y+22))
  brightness=round(ImageStat.Stat(im.convert("L")).mean[0],1)
  lum.append(brightness)
  d.text((x+3,y+4),f"{idx/3:.2f}s | {brightness}",fill="white")
 sheet.save(OUT/"FULL_CONTACT.jpg",quality=82)
report={"status":"COMPLETE_PICTURE_ONLY","rights":"OWNER-ONLY PRIVATE UNPUBLISHED WORKING CUT; Audi and filmmaker publication rights not established","audio":"Original reference audio intentionally withheld from public GitHub; local final mux required","duration_s":float(probe["format"]["duration"]),"video":probe,"sha256":sha(FILM),"bytes":FILM.stat().st_size,"full_decode":"PASS","shots":[],"luma_3fps":lum}
now=0
for f,st,n,grade,note in SHOTS:
 report["shots"].append({"first_frame":now,"last_frame":now+n-1,"in_seconds":now/30,"duration_frames":n,"file":f,"source_start_sec":st,"look":grade,"note":note})
 now+=n
(OUT/"EDIT_QA.json").write_text(json.dumps(report,indent=2))
(OUT/"SHA256SUMS.txt").write_text(report["sha256"]+"  "+FILM.name+"\n")
print(json.dumps({"status":report["status"],"duration":report["duration_s"],"bytes":report["bytes"],"sha256":report["sha256"],"shots":len(SHOTS),"frames":video["nb_frames"],"full_decode":"PASS"},indent=2))
