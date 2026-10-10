#!/usr/bin/env python3
"""Optional real source-time ramp preprocessor for high-fps authentic video clips.

This remaps VIDEO TIME using FFmpeg trim/setpts/concat. It never invents
optical-flow frames and never pretends to add genuine high-FPS slow motion.
"""
import argparse
import json
import math
import subprocess
from pathlib import Path

def validate(parts):
    if not isinstance(parts,list) or not 1<=len(parts)<=20:raise ValueError("1–20 segments required")
    prev=0.0
    for i,s in enumerate(parts):
        if not isinstance(s,dict) or any(k not in s for k in ("start","end","speed")):raise ValueError("Missing segment fields")
        start,end,speed=(float(s[k]) for k in ("start","end","speed"))
        if not all(math.isfinite(v) for v in (start,end,speed)):raise ValueError("Nonfinite segment")
        if abs(start-prev)>.005 or end<=start or not .3<=speed<=3:raise ValueError("Non-contiguous/invalid speeds")
        prev=end
    return sum((float(s["end"])-float(s["start"]))/float(s["speed"]) for s in parts)

def filtergraph(parts,fps=30):
    if type(fps)!=int or fps not in (24,25,30,60):raise ValueError("Invalid output fps")
    validate(parts)
    expr=[]
    for i,s in enumerate(parts):
        expr.append(f"[0:v:0]trim=start={float(s['start']):.6f}:end={float(s['end']):.6f},setpts=(PTS-STARTPTS)/{float(s['speed']):.6f}[part{i}]")
    expr.append("".join(f"[part{i}]" for i in range(len(parts)))+
                f"concat=n={len(parts)}:v=1:a=0,fps={fps},format=yuv420p[v]")
    return ";".join(expr)

def run(inp,out,parts,fps=30,crf=16):
    duration=validate(parts)
    if Path(inp).resolve()==Path(out).resolve():raise ValueError("Cannot overwrite source")
    if not Path(inp).is_file():raise ValueError("Source video missing")
    graph=filtergraph(parts,fps)
    Path(out).parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
      "-i",str(inp),"-filter_complex",graph,"-map","[v]","-an",
      "-c:v","libx264","-preset","slow","-crf",str(crf),"-pix_fmt","yuv420p",
      "-movflags","+faststart",str(out)],check=True,timeout=1200)
    return {"status":"PASS","predictedDuration":duration,"output":out,
            "sourceAudioRemoved":True,
            "note":"At low source fps, slow segments repeat frames; only high-fps sources give smooth slow motion."}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--input",required=True);p.add_argument("--output",required=True)
    p.add_argument("--plan",required=True);p.add_argument("--fps",type=int,default=30)
    p.add_argument("--dry-run",action="store_true")
    args=p.parse_args()
    segments=json.loads(Path(args.plan).read_text())["segments"]
    if args.dry_run:print(json.dumps({"duration":validate(segments),"filter":filtergraph(segments,args.fps)},indent=2))
    else:print(json.dumps(run(args.input,args.output,segments,args.fps),indent=2))
