#!/usr/bin/env python3
"""YUNEX Audi RS6 NO MERCY 001 — replacement director's coherent private film.
Usage: RS6_SOURCE_DIR=/path/to/rs6-full-sources RS6_ORIGINAL_REFERENCE=/path/to/193955.mp4 python g_cohesive_private_film.py
INPUTS: authentic Audi Daytona Grey C8 native 4K-derived excerpts, no GT/red model switching.
Never copy reference track to public repository. OUTPUT intended owner-only; source rights pending.
"""
import os, subprocess, json, hashlib
from pathlib import Path
ROOT=Path(os.environ.get("RS6_SOURCE_DIR","rs6-owner-sources"))
REF=Path(os.environ.get("RS6_ORIGINAL_REFERENCE","193955.mp4"))
OUT=Path(os.environ.get("RS6_OUTPUT_DIR","rs6-g-final-review"))
OUT.mkdir(parents=True,exist_ok=True)
FPS=30
SHOTS=[
("g/G_RS6_C8_119_FRONTAL_CORNER.mp4",54, "cold mountain-front approach"),
("g/G_RS6_C8_143_ROAD_REVEAL.mp4",31, "moving car follows turn"),
("g/G_RS6_C8_175_GRILLE_SURGE.mp4",31, "frontal aggressive rush"),
("g/G_RS6_C8_436_TAIL_FOLLOW.mp4",21, "taillight real vehicle tracking"),
("c2/UHD_RS6_STEERING_MODE_CONTROL.mp4",21, "physical RS mode, anticipation"),
("g/G_RS6_C8_031_HILLSIDE_LUNGE.mp4",44, "DROP A: true hard frontal bend"),
("g/G_RS6_C8_085_LOW_CORNER.mp4",29, "native real road motion"),
("c2/UHD_RS6_REAR_LED_SIGNATURE.mp4",15, "brief taillight punctuation"),
("a2/A2_C8_RS6_HAIRPIN_REVEAL.mp4",30,"car visibly rounds road bend"),
("g/G_RS6_C8_043_ROLLING_DRIVEBY.mp4",55,"DROP B: genuine fast moving side follow"),
("g/G_RS6_C8_278_COASTAL_REAR.mp4",28,"unbroken flowing rear full-car driving"),
("a2/A2_C8_RS6_FAST_APPROACH.mp4",36, "conclusive full-car direct acceleration"),
]
assert sum(n for _,n,_ in SHOTS)==395
def run(args,timeout=180):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode: raise RuntimeError(" ".join(args[:4])+"\n"+p.stderr[-1600:])
 return p.stdout
for fn,frames,note in SHOTS:
 if not (ROOT/fn).is_file():raise FileNotFoundError(str(ROOT/fn))
if not REF.exists():raise FileNotFoundError("PRIVATE musical reference missing; do not substitute synthesized audio")
# Mild filmic low-chroma steel grade across *all* source shots; deliberate continuity.
# Keep actual source motion. No generic zooms/animated shakes, text or letterboxing.
GRADE="eq=contrast=1.10:brightness=-0.013:saturation=0.72,colorbalance=rs=-0.015:bs=0.032:rm=-0.005:bm=0.016"
inputs=["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y"]
for fn,frames,note in SHOTS:inputs+=["-i",str(ROOT/fn)]
inputs+=["-i",str(REF)]
filters=[]
for i,(_,frames,note) in enumerate(SHOTS):
 filters.append(f"[{i}:v]fps=30,tpad=stop_mode=clone:stop_duration=0.12,trim=end_frame={frames},"
                f"setpts=N/(30*TB),scale=1080:1920:flags=lanczos,{GRADE},format=yuv420p,setsar=1[v{i}]")
filters.append("".join(f"[v{i}]" for i in range(len(SHOTS)))+f"concat=n={len(SHOTS)}:v=1:a=0[main]")
# Sparse 1 frame visual negatives at reference audio’s 6.734 and 9.927 peaks; black only on 7.715 onset.
# 395 frames precisely. A black intentional frame may be 0.0333s, no black runs.
filters.append("[main]negate=enable='eq(n,202)+eq(n,298)',"
               "drawbox=x=0:y=0:w=iw:h=ih:c=black:t=fill:enable='eq(n,231)',"
               "trim=end_frame=395,setpts=N/(30*TB)[picture]")
FILM=OUT/"YUNEX_RS6_NO_MERCY_001_G_RESCUED_PRIVATE.mp4"
inputs+=["-filter_complex",";".join(filters),"-map","[picture]","-map",f"{len(SHOTS)}:a:0",
 "-c:v","libx264","-preset","veryfast","-crf","17","-r","30","-pix_fmt","yuv420p",
 "-c:a","aac","-b:a","256k","-ar","48000","-ac","2",
 "-t","13.166667","-movflags","+faststart",str(FILM)]
run(inputs,230)
QA=json.loads(run(["ffprobe","-v","error","-show_entries","stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration,size","-of","json",str(FILM)],15))
v=next(s for s in QA["streams"] if s["codec_type"]=="video")
audio=next(s for s in QA["streams"] if s["codec_type"]=="audio")
assert v["codec_name"]=="h264" and v["width"]==1080 and v["height"]==1920 and v["r_frame_rate"]=="30/1" and int(v["nb_frames"])==395
assert audio["codec_name"]=="aac" and audio["channels"]==2 and audio["sample_rate"]=="48000"
run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(FILM),"-f","null","-"],140)
run(["ffmpeg","-nostdin","-v","error","-y","-i",str(FILM),"-vf","fps=3,scale=180:320,tile=8x5:padding=4","-frames:v","1",str(OUT/"FRAME_QA_STORYBOARD.jpg")],45)
report={"status":"TECHNICAL_QA_PASS__CREATIVE_REVIEW_STILL_REQUIRED",
"private_use_only":True,"source_rights":"Audi original C8 footage has no confirmed YUNEX public release permission; DO NOT PUBLISH",
"music":"original user's uploaded reference audio used only in local private rendering, NOT committed to Github","frames":395,
"video":QA,"bytes":FILM.stat().st_size,"sha256":hashlib.sha256(FILM.read_bytes()).hexdigest(),
"full_decode":"PASS","shots":[]}
now=0
for filename,n,description in SHOTS:
 report["shots"].append({"first_frame":now,"last_frame":now+n-1,"source_clip":filename,"note":description})
 now+=n
(OUT/"QA_PRIVATE.json").write_text(json.dumps(report,indent=2))
print(json.dumps({"movie":str(FILM),"sha256":report["sha256"],"bytes":report["bytes"],"technical_qa":"PASS","frames":395,"audio":"AAC stereo 48k"}))
