#!/usr/bin/env python3
"""French Legends C: native FFmpeg picture-render fallback from the REAL 42-clip archive.

Remotion remains the editable source of truth. This alternate export normalizes actual
selected frames, honours exact 30fps shotmap and graceful 0.2s dissolves, and checks
all 1800 decoded output frames. It NEVER substitutes CGI/stills/audio.
"""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, os, subprocess, hashlib
from pathlib import Path

PROJECT=Path("production/videos/french-icons-001/agent-c")
MAP=json.loads((PROJECT/"shotmap.json").read_text())
CLIPS=Path("out/fr-legends-fast/source")
TEMP=Path("out/fr-legends-fast/working")
OUT=Path("out/fr-legends-fast/FRENCH_LEGENDS_C_MUTED_FAST_1080P.mp4")
FPS=30
def run(args):
    subprocess.run([str(i) for i in args],check=True)

def probe(p):
    return json.loads(subprocess.check_output([
       "ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)
    ],text=True))
def hash_file(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for buf in iter(lambda:f.read(1024*1024),b""):h.update(buf)
    return h.hexdigest()

def normalize(s):
    path=CLIPS/s["sourcePath"]
    if not path.exists():raise FileNotFoundError(path)
    n=s["durationFrames"]
    scale=float(s["cinematicCropScale"])
    focus=float(s["cinematicFocusXPercent"])/100
    w=2*int((1920*scale+1)/2)
    h=2*int((1080*scale+1)/2)
    era=s["era"]
    grade={
       "heritage":"eq=contrast=1.045:saturation=0.92:brightness=0.010,colorbalance=rs=0.015:bs=-0.008",
       "modern":"eq=contrast=1.035:saturation=1.035:brightness=0.010",
       "hypercar":"eq=contrast=1.05:saturation=1.015:brightness=0.012",
    }[era]
    # Crop the native picture (no distorted aspect). This removes embedded bars.
    vf=(
      f"fps=fps=30,scale={w}:{h}:flags=lanczos,"
      f"crop=1920:1080:(iw-1920)*{focus:.4f}:(ih-1080)/2,"
      f"{grade},format=yuv420p,trim=end_frame={n},setpts=PTS-STARTPTS"
    )
    tgt=TEMP/f"shot_{s['shot']:02d}.mp4"
    run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
         "-ss",s["sourceInSeconds"],"-i",path,"-an",
         "-vf",vf,"-frames:v",n,
         "-c:v","libx264","-preset","fast","-crf","17",
         "-pix_fmt","yuv420p","-r","30","-g","60",
         "-video_track_timescale","15360",tgt])
    v=next(st for st in probe(tgt)["streams"] if st["codec_type"]=="video")
    actual=int(v.get("nb_frames",0))
    if actual!=n:raise ValueError(f"shot {s['shot']} expected {n} frames; got {actual}")
    return tgt

def main():
    assert MAP["durationFrames"]==1800 and MAP["fps"]==30
    TEMP.mkdir(parents=True,exist_ok=True)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    shots=MAP["shots"]
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=[pool.submit(normalize,s) for s in shots]
        for fut in as_completed(results):fut.result()
    segments=[]
    i=0
    while i<len(shots):
        s=shots[i]
        one=TEMP/f"shot_{s['shot']:02d}.mp4"
        overlap=s["exitDissolveFrames"]
        if overlap:
            following=shots[i+1]
            assert overlap==following["enterDissolveFrames"]==6
            two=TEMP/f"shot_{following['shot']:02d}.mp4"
            output=TEMP/f"paired_{s['shot']:02d}_{following['shot']:02d}.mp4"
            total=s["durationFrames"]+following["durationFrames"]-overlap
            offset=(s["durationFrames"]-overlap)/FPS
            run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
                 "-i",one,"-i",two,
                 "-filter_complex",f"[0:v][1:v]xfade=transition=fade:duration={overlap/FPS:.6f}:offset={offset:.6f},format=yuv420p,trim=end_frame={total},setpts=PTS-STARTPTS[v]",
                 "-map","[v]","-an","-frames:v",total,
                 "-c:v","libx264","-preset","fast","-crf","17",
                 "-pix_fmt","yuv420p","-r","30","-g","60",
                 "-video_track_timescale","15360",output])
            frames=int(next(v for v in probe(output)["streams"] if v["codec_type"]=="video").get("nb_frames",0))
            if frames!=total:raise RuntimeError(f"Bad dissolve {s['shot']}: {frames} != {total}")
            segments.append(output)
            i+=2
        else:
            segments.append(one);i+=1
    playlist=TEMP/"playlist.txt"
    playlist.write_text("\n".join("file '"+str(p.resolve())+"'" for p in segments)+"\n")
    merged=TEMP/"assembled.mp4"
    run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
         "-f","concat","-safe","0","-i",playlist,"-an","-c:v","copy",merged])
    # Re-encode once to guarantee a consistent 30fps zero-based 1800-frame master.
    run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
         "-i",merged,"-an","-vf","fps=30,trim=end_frame=1800,setpts=PTS-STARTPTS,format=yuv420p",
         "-frames:v","1800","-c:v","libx264","-preset","fast","-crf","18",
         "-pix_fmt","yuv420p","-r","30",OUT])
    meta=probe(OUT)
    st=next(x for x in meta["streams"] if x["codec_type"]=="video")
    assert (st["width"],st["height"],st["r_frame_rate"],int(st.get("nb_frames",0)))==(1920,1080,"30/1",1800),st
    assert abs(float(meta["format"]["duration"])-60.0)<0.05
    assert not any(x["codec_type"]=="audio" for x in meta["streams"])
    run(["ffmpeg","-nostdin","-v","error","-xerror","-i",OUT,"-f","null","-"])
    (OUT.parent/"ffprobe.json").write_text(json.dumps(meta,indent=2))
    run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
         "-i",OUT,"-vf","fps=1/3,scale=320:180,tile=5x4","-frames:v","1",
         OUT.parent/"decoded_60sec_contact.jpg"])
    report={"type":"Agent C MUTED fast-picture fallback — not a music-synchronised final",
      "source":"actual verified combined 42-clip artifact 11713925779",
      "shotmap":str(PROJECT/"shotmap.json"),"clips_used":len(shots),
      "duration_s":60,"frames":1800,"dimensions":"1920x1080","fps":30,
      "sha256":hash_file(OUT),"format":"H264 yuv420p",
      "audio":"none (Agent D owns exact-original soundtrack)",
      "quality":"Full decode and sampled contact sheet created. Human visual acceptance required.",
      "publication_rights":"uncleared"}
    (OUT.parent/"FAST_FILM_QA.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2))
if __name__=="__main__":main()
