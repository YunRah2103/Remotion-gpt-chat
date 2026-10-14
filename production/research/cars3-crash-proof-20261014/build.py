#!/usr/bin/env python3
"""Private proof: official Cars 3 McQueen crash with ORIGINAL FILM AUDIO,
match into genuine real stock-car spin and retained racing footage.
All copyrighted frames/MP4s stay in owner-only GitHub draft releases.
"""
import os, subprocess, json, hashlib, urllib.request, pathlib, math
import cv2, numpy as np
W,H=720,1280
ROOT=pathlib.Path("work/yunex-cars3-crash")
ROOT.mkdir(parents=True,exist_ok=True)
ANIMATED=pathlib.Path(os.environ["CARS3_SOURCE"])
EXPECTED={
"night_impact":("https://videos.pexels.com/video-files/18447537/18447537-hd_1920_1080_60fps.mp4","311be2dc9ba27c3f4cf9c7f2513ba47082ce2ba55be1291c983d6f9c5cdba2c9"),
"red_night":("https://videos.pexels.com/video-files/18447538/18447538-hd_1920_1080_60fps.mp4","fb6cf9b16199e40a329537c8d3f1236bf8384a2b9d393721ade59e3e9c51b1c6"),
}
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(f"{args[0]} returned {p.returncode}\n{p.stderr[-2000:]}")
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for c in iter(lambda:f.read(1048576),b""):h.update(c)
 return h.hexdigest()
def probe(path):
 return json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]))
def streams(p):
 z=probe(p)
 return z,z["streams"]
m,ms=streams(ANIMATED)
duration=float(m["format"]["duration"])
audiostreams=[s for s in ms if s["codec_type"]=="audio"]
if not audiostreams:
 raise RuntimeError("STOP: McQueen's original audio missing from acquired video; request matching original sound before rendering.")
assert duration>38,"Source is too short for actual crash"
print("PRIVATE_CARS3_SOURCE",json.dumps({"duration":duration,"video":[{"width":s.get("width"),"height":s.get("height"),"codec":s.get("codec_name")} for s in ms if s["codec_type"]=="video"],"original_audio":[{"codec":s.get("codec_name"),"sample_rate":s.get("sample_rate"),"channels":s.get("channels")} for s in audiostreams]}),flush=True)

for name,(url,digest) in EXPECTED.items():
 dest=ROOT/f"{name}.mp4"
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=100) as r,open(dest,"wb") as f:
  while c:=r.read(1048576):f.write(c)
 assert sha(dest)==digest,f"{name} SHA mismatch"
 run(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(dest),"-f","null","-"])
 print("REAL_SOURCE_OK",name,sha(dest),flush=True)
# Detect a likely flip/spin: unusual orientation of largest saturated red contour
# in night-race portion. This is only a *selection heuristic*, not visual QA proof.
cap=cv2.VideoCapture(str(ANIMATED))
samples=[]
lo=max(12,duration*.25)
hi=min(duration-9,duration*.91)
prev=None
for t in np.arange(lo,hi,.33):
 cap.set(cv2.CAP_PROP_POS_MSEC,float(t)*1000)
 ok,bgr=cap.read()
 if not ok:continue
 sm=cv2.resize(bgr,(480,270),interpolation=cv2.INTER_AREA)
 hsv=cv2.cvtColor(sm,cv2.COLOR_BGR2HSV)
 mask=cv2.bitwise_or(cv2.inRange(hsv,(0,85,48),(14,255,255)),cv2.inRange(hsv,(170,85,48),(179,255,255)))
 cnt,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 big=max(cnt,key=cv2.contourArea) if cnt else None
 if big is None or cv2.contourArea(big)<170:continue
 x,y,w,h=cv2.boundingRect(big)
 largest=cv2.contourArea(big)
 # A crash/flip often makes the red car more vertical in frame.
 vertical=min(2.7,h/max(w,1))
 gray=cv2.cvtColor(sm,cv2.COLOR_BGR2GRAY)
 motion=float(np.mean(cv2.absdiff(gray,prev))/255) if prev is not None else 0.
 prev=gray
 scene_ratio=(w*h)/(480*270)
 score=vertical*.9+min(motion,0.35)*3.5+min(scene_ratio,.38)*1.5
 samples.append((float(score),round(float(t),2),round(vertical,3),round(motion,3),round(scene_ratio,3)))
cap.release()
if not samples:raise RuntimeError("Could not find frame geometry for crash analysis")
# Look for flips after the pit-race setup and avoid final aftermath.
rank=sorted(samples,reverse=True)
print("CRASH_MOTION_TOP",json.dumps(rank[:26]),flush=True)
# Ensure at least a few preview points; if automatically chosen peak is wrong, give a
# second clip 5 seconds earlier for transparent visual choice, rather than claim certainty.
best_t=rank[0][1]
cand_times=sorted(set([min(duration-4,max(7,best_t)),min(duration-4,max(7,best_t-5))]))
# Unverified source crash phase, not automatically guaranteed.
def mkvideo(src,start,seconds,out):
 run(["ffmpeg","-hide_banner","-loglevel","error","-y",
  "-ss",round(start,3),"-t",round(seconds,3),"-i",str(src),"-vf",
  "fps=30,scale=-2:1280,crop=720:1280:(iw-720)/2:0,setsar=1,format=yuv420p",
  "-an","-c:v","libx264","-preset","medium","-crf","18","-r","30","-movflags","+faststart",str(out)])
def append_preview(i,impact_t):
 # Build-up McQueen driving, actual McQueen crash, real crash/smoke, normal racing
 movie_start=max(0,impact_t-4.35)
 movie_len=impact_t-movie_start+.4
 real_impact_start=1.32
 real_impact_len=2.65
 real_race_start=1.4
 real_race_len=2.8
 pieces=[
 (ANIMATED,movie_start,movie_len,ROOT/f"v{i}_animated.mp4"),
 (ROOT/"night_impact.mp4",real_impact_start,real_impact_len,ROOT/f"v{i}_real_impact.mp4"),
 (ROOT/"red_night.mp4",real_race_start,real_race_len,ROOT/f"v{i}_real_race.mp4"),
 ]
 for src,st,sec,out in pieces:mkvideo(src,st,sec,out)
 playlist=ROOT/f"concat_{i}.txt"
 playlist.write_text("".join(f"file '{p[3].resolve()}'\n" for p in pieces))
 mute=ROOT/f"v{i}_muted.mp4"
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(playlist),"-c","copy","-movflags","+faststart",str(mute)])
 # Original McQueen audio remains 1:1 synced; continue up to 0.8 sec into REAL impact
 # to bridge crash in a purposeful sound-led cut. Never synthesize McQueen dialogue.
 original_audio_len=min(duration-movie_start,movie_len+.83)
 orig_sound=ROOT/f"v{i}_mcqueen_original_sound.wav"
 fade_start=max(.1,original_audio_len-.44)
 run(["ffmpeg","-hide_banner","-loglevel","error","-y",
  "-ss",round(movie_start,3),"-t",round(original_audio_len,3),"-i",str(ANIMATED),
  "-vn","-af",f"aresample=48000,afade=t=out:st={fade_start:.3f}:d=.44",
  "-ac","2","-ar","48000",str(orig_sound)])
 # Does real #15 recording itself have real audio?
 real_a=[s for s in probe(ROOT/"night_impact.mp4")["streams"] if s["codec_type"]=="audio"]
 if real_a:
  impact_sound=ROOT/f"v{i}_real_track.wav"
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",real_impact_start,
   "-t",real_impact_len,"-i",str(ROOT/"night_impact.mp4"),"-vn","-ac","2","-ar","48000",str(impact_sound)])
  mix=(f"[1:a]adelay=0|0,apad[a0];[2:a]adelay={round(movie_len*1000)}|{round(movie_len*1000)},volume=0.8,apad[a1];[a0][a1]amix=inputs=2:normalize=0[aout]")
  inputs=["-i",str(orig_sound),"-i",str(impact_sound)]
 else:
  mix="[1:a]apad[aout]"
  inputs=["-i",str(orig_sound)]
 out=ROOT/f"cars3_to_real_crash_original_audio_{i}.mp4"
 length=round(movie_len+real_impact_len+real_race_len,3)
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(mute)]+inputs+
 ["-filter_complex",mix,"-map","0:v:0","-map","[aout]",
  "-c:v","copy","-c:a","aac","-b:a","192k","-ac","2","-ar","48000",
  "-t",length,"-movflags","+faststart",str(out)])
 run(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(out),"-f","null","-"])
 data=probe(out)
 a=[x for x in data["streams"] if x["codec_type"]=="audio"]
 assert a,"Music approval aside, original film audio is mandatory"
 return {"filename":out.name,"movie_start":round(movie_start,2),"movie_cut_impact":round(impact_t,2),
 "real_spin":[real_impact_start,round(real_impact_start+real_impact_len,2)],
 "real_race":[real_race_start,round(real_race_start+real_race_len,2)],
 "duration":round(float(data["format"]["duration"]),3),"bytes":out.stat().st_size,
 "sha256":sha(out),"audio_codec":a[0]["codec_name"],"real_source_audio":bool(real_a),
 "full_audio_video_decode":"PASS"}
rendered=[append_preview(i,t) for i,t in enumerate(cand_times,1)]
report={"source_issue":87,"animated_duration":duration,"animated_original_audio_streams":len(audiostreams),
"original_audio_preserved":True,"real_crash_type":"nighttime short-track multi-car spin with smoke; physical collision point unverified",
"red_car":"Pexels 18447538 original night stock-car, user previously approved footage",
"candidate_impact_analysis":rank[:30],"candidates":rendered,
"editorial_qualification":"Automatic scene-rotation heuristic guesses candidate times; actual movie crash visual QA must be confirmed before publishing or final edit.",
"rights":"Pixar source and previews are in private owner-only draft release. Public redistribution not authorized.",
"music":"No music supplied for Cars concept; transition preview retains original McQueen audio and actual real audio if present."}
outdir=pathlib.Path("production/research/cars3-crash-proof-20261014")
outdir.mkdir(parents=True,exist_ok=True)
(outdir/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print("CRASH_PROOFS_VERIFIED",json.dumps(rendered),flush=True)
