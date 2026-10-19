#!/usr/bin/env python3
"""Verify two real 9:16 Remotion MP4s with ffprobe, full decode and sampled motion."""
import argparse, hashlib, json, math, subprocess, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat

PREVIEWS = {
 "opening": {"frames": 150, "duration": 5., "samples": [0, 5, 14, 20, 22, 23, 30, 43, 45, 66, 67, 149]},
 "montage": {"frames": 264, "duration": 8.8, "samples": [0, 8, 19, 22, 23, 36, 67, 68, 100, 101, 135, 136, 171, 172, 221, 222, 263]}
}
def run(args):
 p=subprocess.run(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
 if p.returncode: raise RuntimeError(f"Exited {p.returncode}: {' '.join(args)}\n{p.stderr[-4000:]}")
 return p.stdout

def inspect(name, config, directory):
 movie=directory/(name+".mp4")
 if not movie.is_file() or movie.stat().st_size<2048: raise RuntimeError(f"Missing movie {movie}")
 data=json.loads(run(["ffprobe","-v","error","-count_frames","-select_streams","v:0",
  "-show_entries","stream=codec_name,width,height,r_frame_rate,nb_read_frames",
  "-show_entries","format=duration","-of","json",str(movie)]))
 stream=data["streams"][0]
 assert stream["codec_name"]=="h264",stream
 assert (stream["width"],stream["height"])==(540,960),stream
 assert stream["r_frame_rate"]=="30/1",stream
 assert int(stream["nb_read_frames"])==config["frames"],stream
 assert math.isclose(float(data["format"]["duration"]),config["duration"],abs_tol=.08),data
 run(["ffmpeg","-v","error","-xerror","-i",str(movie),"-f","null","-"])
 folder=directory/"frames"/name;folder.mkdir(parents=True,exist_ok=True)
 frames=[]
 for n in config["samples"]:
  path=folder/f"{name}-frame-{n:03d}.png"
  run(["ffmpeg","-y","-v","error","-xerror","-i",str(movie),
   "-vf",f"select=eq(n\\,{n})","-vsync","0","-frames:v","1",str(path)])
  if not path.is_file() or path.stat().st_size<1000: raise RuntimeError(f"Frame missing {n}")
  with Image.open(path) as im:
   frame=im.convert("RGB")
   lum=ImageStat.Stat(frame.convert("L")).mean[0]
   if lum<10: raise RuntimeError(f"Black frame {name} {n}: luminance {lum}")
   frames.append((n,frame.copy(),lum))
 early=[(n,im) for n,im,_ in frames if n<30]
 motion=[sum(ImageStat.Stat(ImageChops.difference(a[1],b[1])).mean)/3 for a,b in zip(early,early[1:])]
 if not motion or max(motion)<=.15:raise RuntimeError(f"Static first-second motion: {name} {motion}")
 cols=4;w,h=360,640
 sheet=Image.new("RGB",(cols*w,math.ceil(len(frames)/cols)*(h+32)),"#12181f")
 draw=ImageDraw.Draw(sheet)
 for i,(n,img,lum) in enumerate(frames):
  x=i%cols*w;y=i//cols*(h+32)
  sheet.paste(img.resize((w,h),Image.Resampling.LANCZOS),(x,y+32))
  draw.text((x+8,y+10),f"{name.upper()} frame {n:03d} / {n/30:.2f}s",fill="white")
 sheet.save(directory/(name+"-contact-sheet.jpg"),quality=90)
 return {"sha256":hashlib.sha256(movie.read_bytes()).hexdigest(),
  "bytes":movie.stat().st_size,"source_composition":"1080x1920 @30fps",
  "review_resolution":"540x960 (scale=0.5)","h264":True,"frames":int(stream["nb_read_frames"]),
  "duration_seconds":float(data["format"]["duration"]),"full_ffmpeg_decode":True,
  "motion_scores_first_second":motion,"sampled_frames":config["samples"],
  "sampled_luminance":[round(v[2],2) for v in frames],
  "limitations":"Camera-blocking fixture: NOT Agent 2 physics or Agent 1 damage."}

def main():
 p=argparse.ArgumentParser();p.add_argument("--dir",default="previews/agent-3/out")
 directory=Path(p.parse_args().dir);directory.mkdir(parents=True,exist_ok=True)
 results={};error=None
 try:
  for name,cfg in PREVIEWS.items():results[name]=inspect(name,cfg,directory)
  print(json.dumps(results,indent=2))
 except Exception as exc:
  error=str(exc)
  print("CAMERA PREVIEW QC FAILED",error,file=sys.stderr)
 (directory/"qc-report.json").write_text(json.dumps({
  "ok":error is None and len(results)==len(PREVIEWS),"previews":results,"error":error
 },indent=2)+"\n")
 return int(error is not None)
if __name__=="__main__":sys.exit(main())
