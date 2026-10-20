#!/usr/bin/env python3
"""Honest native EP003 Agent 10 preview verification. Not a crash-physics validator."""
from __future__ import annotations
import argparse
import json
import hashlib
import subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps

EXPECTED={"crash-impact-rewind.mp4":(180,6.0),
          "moving-recovery.mp4":(210,7.0)}
TIMES={"crash-impact-rewind.mp4":[.25,.85,1.45,2.10,2.43,2.63,2.85,3.05,3.35,3.85,4.45,5.20,5.85],
       "moving-recovery.mp4":[.25,1.20,1.85,3.10,3.50,4.70,5.40,5.85,6.35,6.75]}

def run(*args:str)->str:
    result=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(f"{' '.join(args)} failed: {result.stderr.decode(errors='replace')[-1800:]}")
    return result.stdout.decode(errors='replace')

def motion(video:Path)->dict:
    raw=subprocess.run(["ffmpeg","-v","error","-i",str(video),
         "-vf","fps=5,scale=72:128:flags=area,format=gray",
         "-pix_fmt","gray","-f","rawvideo","-"],
         stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
    pixels=72*128
    frames=[raw[i:i+pixels] for i in range(0,len(raw)-pixels+1,pixels)]
    means=[]
    for a,b in zip(frames,frames[1:]):
        means.append(sum(abs(x-y) for x,y in zip(a,b))/pixels)
    active=sum(d>.75 for d in means)
    if len(frames)<25 or active<max(8,int(len(means)*.22)):
        raise AssertionError(f"Too little actual per-frame motion: {active}/{len(means)}")
    return {"frames_reviewed":len(frames),"moving_pairs":active,
            "sampled_mean_difference":round(sum(means)/len(means),3)}

def verify(video:Path,expected_frames:int,expected_duration:float):
    meta=json.loads(run("ffprobe","-v","error","-count_frames",
         "-show_streams","-show_format","-of","json",str(video)))
    stream=next(s for s in meta["streams"] if s["codec_type"]=="video")
    assert stream["codec_name"]=="h264",stream["codec_name"]
    assert stream["width"]==540 and stream["height"]==960,(stream["width"],stream["height"])
    assert stream["avg_frame_rate"]=="30/1",stream["avg_frame_rate"]
    assert int(stream.get("nb_read_frames",0))==expected_frames,stream.get("nb_read_frames")
    duration=float(meta["format"]["duration"])
    assert abs(duration-expected_duration)<.06,duration
    run("ffmpeg","-v","error","-xerror","-i",str(video),"-f","null","-")
    evidence=motion(video)
    out=video.parent/(video.stem+"-frames")
    out.mkdir(parents=True,exist_ok=True)
    tile_w,tile_h=270,515
    thumbs=[]
    for t in TIMES[video.name]:
        frame=out/f"t-{t:.2f}.png"
        run("ffmpeg","-y","-v","error","-ss",str(t),"-i",str(video),
            "-frames:v","1",str(frame))
        img=Image.open(frame).convert("RGB").resize((270,480))
        thumbs.append((t,img))
    sheet=Image.new("RGB",(tile_w*len(thumbs),tile_h),(18,24,32))
    draw=ImageDraw.Draw(sheet)
    for i,(sec,img) in enumerate(thumbs):
        sheet.paste(img,(i*tile_w,0))
        draw.text((i*tile_w+9,489),f"{sec:.2f}s",fill="white")
    contact=video.parent/(video.stem+"-contact-sheet.jpg")
    sheet.save(contact,quality=91,subsampling=0)
    return {"file":video.name,"sha256":hashlib.sha256(video.read_bytes()).hexdigest(),
      "fps":30,"frames":expected_frames,
      "durationSec":duration,"codec":"h264","width":540,"height":960,
      "fullFFmpegDecode":True,"motion":evidence,"contactSheet":contact.name,
      "claim":"native A8 collision + A9 reverse-time camera proof (engineering still illustrative)"
      if "crash" in video.name else "A2 safe-response moving camera proof"}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--dir",type=Path,required=True)
    args=parser.parse_args()
    data=[]
    for name,(frames,secs) in EXPECTED.items():
        video=args.dir/name
        if not video.is_file() or video.stat().st_size<20000:
            raise AssertionError(f"Missing real playable MP4: {video}")
        data.append(verify(video,frames,secs))
    (args.dir/"verification.json").write_text(json.dumps(data,indent=2)+"\n")
    print(json.dumps(data,indent=2))

if __name__=="__main__":main()
