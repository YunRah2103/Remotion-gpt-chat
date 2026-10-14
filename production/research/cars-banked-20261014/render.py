#!/usr/bin/env python3
"""YUNEX private banking-section test. No master edit or public Pixar derivatives."""
from pathlib import Path
import os, urllib.request, hashlib,subprocess,json
root=Path("work/banked-preview");root.mkdir(parents=True,exist_ok=True)
source=Path(os.environ["CARS_SOURCE"])
real=root/"red_night.mp4"
url="https://videos.pexels.com/video-files/18447538/18447538-hd_1920_1080_60fps.mp4"
with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=85) as r, open(real,"wb") as f:
 while c:=r.read(2**20):f.write(c)
def sha(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for c in iter(lambda:f.read(2**20),b""):h.update(c)
 return h.hexdigest()
assert sha(source)=="752c6f1feedd973baa10a2c071d2ebef4b84f2d70f4ce020f36eb4603d378bd2"
assert sha(real)=="fb6cf9b16199e40a329537c8d3f1236bf8384a2b9d393721ade59e3e9c51b1c6"
def run(cmd):
 p=subprocess.run(cmd,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[-1200:])
 return p.stdout
def render_segment(src,start,duration,name,mode):
 result=root/(name+".mp4")
 if mode=="tight":
  args=["-vf","fps=30,scale=-2:1280,crop=720:1280:(iw-720)/2:0,setsar=1,format=yuv420p"]
 else:
  args=["-filter_complex","[0:v]fps=30,split=2[b][f];[b]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,gblur=sigma=22[bg];[f]scale=720:-2,setsar=1,format=yuv420p[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[out]","-map","[out]"]
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-t",str(duration),"-i",str(src)]+args+["-an","-r","30","-c:v","libx264","-preset","medium","-crf","19","-pix_fmt","yuv420p","-movflags","+faststart",str(result)])
 return result
# Banked McQueen on night turn based on index-derived source timing: 10:35.6 to 10:38.1 official compilation.
pixar_start=11.55;pixar_len=2.5
real_start=1.72;real_len=2.2
results=[]
for style in ("tight","wide"):
 a=render_segment(source,pixar_start,pixar_len,"banked_pixar_"+style,style)
 b=render_segment(real,real_start,real_len,"stockcar_"+style,style)
 concat=root/("list_"+style+".txt")
 concat.write_text("file '"+str(a.resolve())+"'\nfile '"+str(b.resolve())+"'\n")
 out=root/("yunex_banked_to_real_"+style+".mp4")
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(concat),"-c","copy","-movflags","+faststart",str(out)])
 # Every preview decoded across whole duration
 run(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(out),"-map","0:v:0","-f","null","-"])
 probe=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(out)]))
 stream=next(s for s in probe["streams"] if s["codec_type"]=="video")
 results.append({"style":style,"file":out.name,"pixar_offset":[pixar_start,pixar_start+pixar_len],"pixar_official_upload_time":[624+pixar_start,624+pixar_start+pixar_len],"real_time":[real_start,real_start+real_len],"duration":float(probe["format"]["duration"]),"width":stream["width"],"height":stream["height"],"fps":stream["avg_frame_rate"],"sha256":sha(out),"bytes":out.stat().st_size,"full_decode":"PASS"})
# Store metrics ONLY on public branch: not source frame contact sheets.
report={"user_correction":"Preserve previously liked real footage. Show Lightning McQueen DRIVING on steeply banked Piston Cup oval before transforming to real stock car.",
"source":"Private original Disney Jr excerpt job #79, 18s from 10:24; not public",
"selected_scene_note":"#79 11.55-14.05 covers source-indexed McQueen rear tracking at 10:35.7-10:36.7 and forward tracking at 10:36.7-10:38.1; exact banked angle still subject to end-user visual confirmation.",
"results":results,"music":"none; transition-only preview","rights":"copyrighted source in owner-only draft; no public film bytes",
"note":"This does NOT imply final match is seamless. Use user's visual review; do not restore old rejected cut."}
public=Path("production/research/cars-banked-20261014");public.mkdir(parents=True,exist_ok=True)
(public/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print("BANKED_QA",json.dumps(results),flush=True)
