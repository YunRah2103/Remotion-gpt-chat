#!/usr/bin/env python3
"""3-second original RS6 moving-car transition proof from existing private footage.

Inputs are already proven real playable MP4s from A2's original Audi 4K and
B2's real THE-LOWDOWN filmmaking release. The complete short edit is only a
PRIVATE OWNER-REVIEW MOTION PROOF, not a finished sound-synced NO MERCY film.
"""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path("b2-motion-proof")
ROOT.mkdir(exist_ok=True)
SRC=Path("private-footage")
OUTPUT=ROOT/"YUNEX_RS6_NO_MERCY_3S_MOTION_PROOF.mp4"
FRAME=ROOT/"PROOF_12_FRAME_CONTACT.jpg"
SPECS=[
    {"name":"A2_FAST_APPROACH","file":"A2_C8_RS6_FAST_APPROACH.mp4","start":0.05,"duration":0.92,
     "purpose":"real native-4K Audi frontal driving / fast approach"},
    {"name":"B2_NIGHT_HEADLIGHT","file":"B2_LOWDOWN_NIGHT_07.mp4","start":1.30,"duration":0.79,
     "purpose":"cold night red RS6 front three-quarter, real film"},
    {"name":"B2_LED_ROLLING_MACRO","file":"B2_LOWDOWN_NIGHT_04.mp4","start":2.00,"duration":0.52,
     "purpose":"genuine bright RS6 front headlamp / rolling macro without dead frames"},
    {"name":"A2_MOUNTAIN_SWEEP","file":"A2_C8_RS6_MOUNTAIN_SWEEP.mp4","start":0.10,"duration":0.82,
     "purpose":"genuine original Audi native-4K moving bend"},
]
def execute(cmd,timeout=100):
    r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                     text=True,timeout=timeout)
    if r.returncode:
        raise RuntimeError("FAILED "+str(r.returncode)+": "+r.stderr[-1500:])
    return r.stdout
def hashfile(path):
    h=hashlib.sha256()
    with open(path,"rb") as stream:
        for part in iter(lambda:stream.read(1024*1024),b""):h.update(part)
    return h.hexdigest()
# Authenticity of input source files and provenance comes from A2/B2 independent
# FFmpeg/release QA; this proof does not certify publishing rights.
inputs=[SRC/x["file"] for x in SPECS]
for p in inputs:
    if not p.is_file() or p.stat().st_size<100000:
        raise FileNotFoundError("missing real video input "+str(p))
args=["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y"]
for f in inputs:args.extend(["-i",str(f)])
filters=[]
for i,item in enumerate(SPECS):
    # Avoid shaky fake camera moves, speed warp or cheap RGB HUD.
    # Entire sources are 1080x1920 portrait, so no arbitrary re-cropping.
    filters.append(f"[{i}:v]trim=start={item['start']}:duration={item['duration']},"
       "setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,"
       "eq=contrast=1.10:brightness=-0.014:saturation=0.78,"
       "colorbalance=bs=0.045:rs=-0.025,format=yuv420p,"
       f"setsar=1[v{i}]")
filters.append("".join(f"[v{i}]" for i in range(len(SPECS)))+
               f"concat=n={len(SPECS)}:v=1:a=0[vout]")
args+=["-filter_complex",";".join(filters),"-map","[vout]","-an",
       "-c:v","libx264","-preset","fast","-crf","17","-r","30",
       "-pix_fmt","yuv420p","-movflags","+faststart",str(OUTPUT)]
execute(args,140)
probe=json.loads(execute(["ffprobe","-v","error","-show_entries",
  "stream=codec_type,width,height,r_frame_rate,codec_name,pix_fmt:"
  "format=duration,size","-of","json",str(OUTPUT)],20))
video=next(x for x in probe["streams"] if x["codec_type"]=="video")
duration=float(probe["format"]["duration"])
if not(3.0<duration<3.5 and video["width"]==1080 and
       video["height"]==1920 and video["r_frame_rate"]=="30/1" and
       video["pix_fmt"]=="yuv420p"):
    raise RuntimeError("invalid required 1080p 30fps portrait proof: "+str(probe))
execute(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
         "-xerror","-i",str(OUTPUT),"-f","null","-"],80)
with tempfile.TemporaryDirectory(prefix="b2-motion-check") as folder:
    p=Path(folder)
    execute(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
       "-y","-i",str(OUTPUT),"-vf","fps=4,scale=180:320",
       "-frames:v","14",str(p/"frame_%02d.jpg")],60)
    images=[Image.open(x).convert("RGB") for x in sorted(p.glob("frame_*.jpg"))]
    if len(images)<11:raise RuntimeError("contact proof insufficient frames")
    columns=7;rows=(len(images)+columns-1)//columns
    sheet=Image.new("RGB",(columns*180,rows*347),"#101217")
    draw=ImageDraw.Draw(sheet)
    for i,img in enumerate(images):
        xx=(i%columns)*180; yy=(i//columns)*347
        sheet.paste(img,(xx,yy+25))
        draw.text((xx+5,yy+6),f"t={i*0.25:.2f}s",fill="#FFFFFF")
    sheet.save(FRAME,quality=90)
sha=hashfile(OUTPUT)
result={"status":"PLAYABLE_FULL_DECODE_PASS","purpose":"PRIVATE MOTION RHYTHM PROOF",
    "not_final_yunex_film":True,"no_reference_audio_attached":True,
    "copyright_release":"UNPUBLISHED OWNER REVIEW ONLY", "source_rights_unverified":True,
    "inputs":SPECS,"technical":probe,"duration":duration,
    "final_sha256":sha,"frame_count":len(images),"bytes":OUTPUT.stat().st_size}
(ROOT/"MANIFEST.json").write_text(json.dumps(result,indent=2))
(ROOT/"SHA256SUMS.txt").write_text(sha+"  "+OUTPUT.name+"\n")
print(json.dumps({"status":result["status"],"file":OUTPUT.name,"duration":duration,
  "sha256":sha,"bytes":OUTPUT.stat().st_size,
  "frames":len(images)},indent=2))
