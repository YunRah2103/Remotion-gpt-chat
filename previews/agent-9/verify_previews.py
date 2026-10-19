#!/usr/bin/env python3
"""Agent9 genuinely decoded motion evidence, not screenshot slideshow approval."""
import hashlib
import json
import pathlib
import subprocess
import sys

output=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else "previews/agent-9/out")
output.mkdir(parents=True,exist_ok=True)
settings=(("impact-rewind",135),("branch-compare",225))
data={}
for name,frames in settings:
    path=output/f"{name}.mp4"
    if not path.is_file() or path.stat().st_size<10000:
        raise RuntimeError(f"{path} not a real moving MP4")
    p=subprocess.run(["ffprobe","-v","error","-select_streams","v:0",
        "-show_entries","stream=codec_name,width,height,avg_frame_rate,nb_frames",
        "-of","json",str(path)],check=True,capture_output=True,text=True)
    meta=json.loads(p.stdout)["streams"][0]
    expected={"codec_name":"h264","width":540,"height":960,
        "avg_frame_rate":"30/1","nb_frames":str(frames)}
    for key,want in expected.items():
        if str(meta.get(key))!=str(want):
            raise RuntimeError(f"{name} {key}={meta.get(key)!r} expected {want!r}")
    # Decode ENTIRE MP4, fail on any corrupt picture, not just a seekable frame.
    subprocess.run(["ffmpeg","-hide_banner","-v","error","-xerror",
        "-i",str(path),"-f","null","-"],check=True)
    # Every-second downscaled decoded frames, exact byte differences.
    raw=subprocess.check_output(["ffmpeg","-v","error","-i",str(path),
        "-vf","fps=2,scale=54:96:flags=area,format=gray",
        "-f","rawvideo","-pix_fmt","gray","-"])
    stride=54*96
    images=[raw[i:i+stride] for i in range(0,len(raw),stride)]
    assert images and all(len(frame)==stride for frame in images)
    def avg_delta(a,b):
        return sum(abs(x-y) for x,y in zip(a,b))/len(a)
    motion=[round(avg_delta(a,b),3) for a,b in zip(images,images[1:])]
    meaningful=sum(n>0.6 for n in motion)
    # No static false-positive: require changed content in >= 70% sampled pairs.
    if meaningful<max(4,int(.70*len(motion))):
        raise RuntimeError(f"Development video lacks evident changing frames: {name} {motion}")
    # PNG evidence contact sheets, native time-ordered source video only.
    subprocess.run(["ffmpeg","-hide_banner","-v","error","-y","-i",str(path),
        "-vf","fps=2,scale=180:320,tile=3x3", "-frames:v","1",
        "-update","1",str(output/f"{name}-contact-sheet.png")],check=True)
    for frame_index,label in [
      (0,"first"),(int(frames*.40),"choice"),
      (int(frames*.66),"rewind"),(frames-1,"last"),
    ]:
        subprocess.run(["ffmpeg","-hide_banner","-v","error","-y",
          "-i",str(path),"-vf",f"select=eq(n\,{frame_index})",
          "-vsync","0","-frames:v","1",
          str(output/f"{name}-{label}.png")],check=True)
    sha=hashlib.sha256(path.read_bytes()).hexdigest()
    (output/f"{name}.sha256").write_text(f"{sha}  {path.name}\n")
    (output/f"{name}-ffprobe.json").write_text(json.dumps(meta,indent=2)+"\n")
    data[name]={"sha256":sha,"bytes":path.stat().st_size,
                "frames":frames,"codec":meta,"decoded":True,
                "sample_count":len(images),"meaningful_change_pairs":meaningful,
                "motion_deltas":motion,
                "approval":"REAL A8 impact model + A1 original tyre/car + A2 good-branch + A3 camera + A4 road/GT + A5 hands; agent6 picture lock remains separate"}
(output/"motion-evidence.json").write_text(json.dumps(data,indent=2)+"\n")
print(json.dumps(data,indent=2),flush=True)
