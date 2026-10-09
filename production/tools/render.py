#!/usr/bin/env python3
"""Single-command Remotion previews, final output, and frame proof renders."""
import argparse
import re
import subprocess
from pathlib import Path

def safe_id(value):
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,80}",value):
        raise ValueError("Invalid composition ID")
    return value

def render(comp, mode, output, start=None, end=None, frames=None, scale=.4, concurrency=2):
    safe_id(comp)
    out=Path(output)
    out.parent.mkdir(parents=True,exist_ok=True)
    if not 0.1 <= scale <= 1: raise ValueError("Scale must be between 0.1 and 1")
    if not 1 <= concurrency <= 4: raise ValueError("Concurrency must be 1–4")
    base=["npx","--no-install","remotion"]
    if mode=="stills":
        if not frames: raise ValueError("stills mode needs --samples")
        out.mkdir(parents=True,exist_ok=True)
        for frame in frames:
            if frame < 0:raise ValueError("Negative frame number")
            subprocess.run(base+["still","src/index.ts",comp,str(out/f"frame-{frame:04d}.png"),
                                 f"--frame={frame}","--gl=swangle",f"--scale={scale}"],check=True)
        return
    if mode not in ("preview","final"):raise ValueError("Unknown render mode")
    cmd=base+["render","src/index.ts",comp,str(out),"--gl=swangle","--codec=h264",
              "--pixel-format=yuv420p",f"--concurrency={concurrency}"]
    if mode=="preview": cmd.append(f"--scale={scale}")
    if start is not None or end is not None:
        if start is None or end is None or start<0 or end<start:raise ValueError("Invalid frame range")
        cmd.append(f"--frames={start}-{end}")
    subprocess.run(cmd,check=True)

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--composition",required=True)
    p.add_argument("--mode",choices=["preview","final","stills"],default="preview")
    p.add_argument("--output",default="")
    p.add_argument("--start",type=int);p.add_argument("--end",type=int)
    p.add_argument("--samples",default="0,30,60,120")
    p.add_argument("--scale",type=float,default=.4)
    p.add_argument("--concurrency",type=int,default=2)
    x=p.parse_args()
    destination=x.output or ("out/production/frames" if x.mode=="stills" else "out/production/video.mp4")
    render(x.composition,x.mode,destination,x.start,x.end,
           [int(n) for n in x.samples.split(",") if n.strip()],x.scale,x.concurrency)
