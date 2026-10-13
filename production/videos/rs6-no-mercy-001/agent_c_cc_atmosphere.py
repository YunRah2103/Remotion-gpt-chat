#!/usr/bin/env python3
"""Prepare Creative Commons atmospheric cutaways for review; never label generic footage as RS6."""
import hashlib, json, pathlib, subprocess, tempfile, urllib.request
SOURCE="https://commons.wikimedia.org/wiki/Special:Redirect/file/Cars_driving_at_night.webm"
CREDIT="https://commons.wikimedia.org/wiki/File:Cars_driving_at_night.webm"
LICENSE="https://creativecommons.org/licenses/by/3.0/"
out=pathlib.Path("c-night-road-qa");out.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory() as td:
 src=pathlib.Path(td)/"source.webm"
 with urllib.request.urlopen(urllib.request.Request(SOURCE,headers={"User-Agent":"YUNEXVideoResearch/1.0 (research)"}),timeout=80) as r, src.open("wb") as f:
  while data:=r.read(1<<20):f.write(data)
 with src.open("rb") as f: sha=hashlib.file_digest(f,"sha256").hexdigest()
 p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate","-of","json",str(src)],capture_output=True,text=True,check=True)
 meta=json.loads(p.stdout)
 (out/"source-metadata.json").write_text(json.dumps({"url":CREDIT,"license":LICENSE,"author":"YouTube user Editor (credited on Commons)","source_sha256":sha,"source_ffprobe":meta,"identity":"GENERIC night road, NOT Audi RS6","rights":"CC BY 3.0, attribution required"},indent=2))
 for index,start in enumerate([10,65,120],1):
  target=out/f"night-road-{index}.mp4"
  subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(src),"-t","2","-map","0:v:0","-an","-c:v","libx264","-crf","18","-preset","veryfast","-pix_fmt","yuv420p",str(target)],check=True,timeout=70)
  subprocess.run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(target),"-f","null","-"],check=True,timeout=40)
  for n,t in enumerate([0.3,1.0,1.7],1):
   subprocess.run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(target),"-frames:v","1","-vf","scale=400:-1",str(out/f"night-road-{index}-frame-{n}.jpg")],check=True,timeout=30)
  print("DELIVERED",target, "bytes",target.stat().st_size,flush=True)
 (out/"ATTRIBUTION.txt").write_text("Night road cutaways: Cars driving at night, credited to YouTube user Editor, via Wikimedia Commons. Original: "+CREDIT+"\nLicense: Creative Commons Attribution 3.0 Unported, "+LICENSE+"\nAdaptation: 2-second extracts, re-encoded to H.264, silent; no Audi RS6 is depicted.\n")
