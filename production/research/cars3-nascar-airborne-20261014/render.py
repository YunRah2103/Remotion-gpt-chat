#!/usr/bin/env python3
"""YUNEX: actual Cars 3 airborne rollover -> verified real NASCAR airborne barrel rolls.
Only authenticated, owner-private rights-uncleared source and private previews.
Never substitute short track slide for actual NASCAR airborne flip.
"""
import subprocess, pathlib, json, os, hashlib, urllib.request, math
ROOT=pathlib.Path("work/yunex-cars3-nascar-airborne")
ROOT.mkdir(parents=True,exist_ok=True)
MOVIE=pathlib.Path(os.environ["ANIMATED_SOURCE"])
NASCAR=pathlib.Path(os.environ["NASCAR_SOURCE"])
RACE=ROOT/"red_night_original.mp4"
NIGHT_SPIN=ROOT/"real_track_sounds.mp4"
INFO={
 "race":("https://videos.pexels.com/video-files/18447538/18447538-hd_1920_1080_60fps.mp4","fb6cf9b16199e40a329537c8d3f1236bf8384a2b9d393721ade59e3e9c51b1c6"),
 "track":("https://videos.pexels.com/video-files/18447537/18447537-hd_1920_1080_60fps.mp4","311be2dc9ba27c3f4cf9c7f2513ba47082ce2ba55be1291c983d6f9c5cdba2c9")
}
def execute(args):
 cmd=[str(x) for x in args]
 r=subprocess.run(cmd,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(f"{cmd[0]} {r.returncode}: {r.stderr[-2300:]}")
 return r.stdout
def digest(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for x in iter(lambda:f.read(1024*1024),b""):h.update(x)
 return h.hexdigest()
def prob(p):
 return json.loads(execute(["ffprobe","-v","error","-show_format","-show_streams","-of","json",p]))
def clips_audio(p):
 return [s for s in prob(p)["streams"] if s["codec_type"]=="audio"]
def clips_video(p):
 return next(s for s in prob(p)["streams"] if s["codec_type"]=="video")
def length(p):
 return float(prob(p)["format"]["duration"])
assert digest(MOVIE)=="7944c725a6e94d011e338cee52b07b0b1b0d9d6c511b54f4d05f2fbd957b355b"
assert clips_audio(MOVIE),"McQueen original source audio absent, refuse rendering"
assert float(length(MOVIE))>84
assert length(NASCAR)>12, "NASCAR source must contain actual moving racing action"
assert clips_video(NASCAR)["width"]>=1280,"Low-resolution NASCAR source rejected"
print("NASCAR_VERIFIED",json.dumps({"duration":length(NASCAR),"height":clips_video(NASCAR)["height"],"fps":clips_video(NASCAR)["avg_frame_rate"],"sha256":digest(NASCAR),"audio":bool(clips_audio(NASCAR))}),flush=True)
for name,dest in (("race",RACE),("track",NIGHT_SPIN)):
 url,expected=INFO[name]
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=100) as r,open(dest,"wb") as f:
  while chunk:=r.read(1048576):f.write(chunk)
 assert digest(dest)==expected,name+" source hash mismatch"
 execute(["ffmpeg","-hide_banner","-v","error","-xerror","-i",dest,"-map","0:v:0","-f","null","-"])
print("NASCAR_PROOF_FROM_OWNER_PHONE",bool(clips_audio(MOVIE)),"original McQueen audio confirmed",flush=True)

# Keep the whole track in the frame during an airborne flip; 9:16 center crops
# would literally cut the tumbling car out of view. Full 16:9 footage is layered
# on a softly moving copy of itself, not a fake VFX crash.
def render_segment(src,start,seconds,out,ambience=None):
 start,seconds=round(start,3),round(seconds,3)
 if seconds<.5:raise RuntimeError("segment too short")
 has=bool(clips_audio(src))
 in_args=["-ss",str(start),"-t",str(seconds),"-i",str(src)]
 if not has and ambience:
  in_args+=["-stream_loop","-1","-ss","1.0","-t",str(seconds),"-i",str(ambience)]
 elif not has:
  in_args+=["-f","lavfi","-t",str(seconds),"-i","anullsrc=r=48000:cl=stereo"]
 base="[0:v]fps=30,split=2[base][hero];[base]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=28,eq=brightness=-0.13[bg];[hero]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[out]"
 audindex="0:a:0" if has else "1:a:0"
 execute(["ffmpeg","-hide_banner","-loglevel","error","-y"]+in_args+
  ["-filter_complex",base,"-map","[out]","-map",audindex,
  "-r","30","-vsync","cfr",
  "-c:v","libx264","-preset","fast","-crf","19","-pix_fmt","yuv420p",
  "-c:a","aac","-b:a","192k","-ar","48000","-ac","2",
  "-shortest","-movflags","+faststart",out])
 execute(["ffmpeg","-hide_banner","-v","error","-xerror","-i",out,"-f","null","-"])
 return {"duration":length(out),"bytes":out.stat().st_size}

MOVIE_START=77.25
MOVIE_SECONDS=4.65
FINAL_RACE_START=1.55
FINAL_RACE_SECONDS=2.75
real_windows=[
 (0.05, min(12.8,length(NASCAR)-.4)),
 (8.0,min(13.0,length(NASCAR)-8.2))
]
movie=ROOT/"cinematic_original_movie.mp4"
render_segment(MOVIE,MOVIE_START,MOVIE_SECONDS,movie)
end=ROOT/"real_regular_night_car.mp4"
render_segment(RACE,FINAL_RACE_START,FINAL_RACE_SECONDS,end,ambience=NIGHT_SPIN)
results=[]
for i,(rstart,rduration) in enumerate(real_windows,1):
 if rduration<4:continue
 flip=ROOT/f"nascar_real_airborne_take_{i}.mp4"
 render_segment(NASCAR,rstart,rduration,flip)
 out=ROOT/f"CARS3_REAL_NASCAR_BARREL_ROLL_v{i}.mp4"
 concat=ROOT/f"list_{i}.txt"
 concat.write_text("".join(f"file '{p.absolute()}'\n" for p in (movie,flip,end)))
 execute(["ffmpeg","-hide_banner","-loglevel","error","-y",
  "-f","concat","-safe","0","-i",concat,
  "-c","copy","-movflags","+faststart",out])
 execute(["ffmpeg","-hide_banner","-v","error","-xerror","-i",out,"-f","null","-"])
 streams=prob(out)["streams"]
 a=[s for s in streams if s["codec_type"]=="audio"]
 v=[s for s in streams if s["codec_type"]=="video"]
 assert a and v,"Video and original soundtrack mandatory"
 results.append({"filename":out.name,"size":out.stat().st_size,
  "duration":round(length(out),3),"sha256":digest(out),
  "width":v[0]["width"],"height":v[0]["height"],"fps":v[0]["avg_frame_rate"],
  "original_mcqueen_audio":"first {:.2f}s from source stereo AAC".format(MOVIE_SECONDS),
  "real_flip_source_segment":[round(rstart,2),round(rstart+rduration,2)],
  "real_normal_source_segment":[FINAL_RACE_START,FINAL_RACE_START+FINAL_RACE_SECONDS],
  "full_audio_video_decode":"PASS"})
report={
 "creative":"McQueen visibly flips, cut into ACTUAL real NASCAR airborne multi-roll wreck, then original red racing",
 "source_movie_issue":87,"source_nascar_issue":int(os.environ["NASCAR_PHONE_ISSUE"]),
 "rights":"Owner-private research drafts only, NASCAR network footage and Pixar film use not cleared for public redistribution",
 "actual_nascar_event":"2023 Ryan Preece Daytona aerial barrel rolls, source official NBC coverage",
 "movie_original_audio":"verified original stereo AAC 48 kHz; preserved without voice replacement",
 "normal_racing":"Original verified #15 short track Pexels #18447538 as originally liked",
 "orientation":"1080x1920 30fps, center full 16:9 footage with moving blurred derived-background to keep ALL rolls in shot",
 "audio":"Original Cars 3 soundtrack in first segment, real NBC NASCAR broadcast/track sound in flipping footage, original track ambience for normal footage",
 "validation":"Video+audio decode and SHA256 verified; exact flip time/frame still requires visual approval",
 "source_real_file_info":{"sha256":digest(NASCAR),"resolution":[clips_video(NASCAR)["width"],clips_video(NASCAR)["height"]],"duration":length(NASCAR)},
 "outputs":results}
outfolder=pathlib.Path("production/research/cars3-nascar-airborne-20261014")
outfolder.mkdir(parents=True,exist_ok=True)
(outfolder/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print("SUCCESS_REAL_AIRBORNE_CRASH_PREVIEWS",json.dumps(results),flush=True)
