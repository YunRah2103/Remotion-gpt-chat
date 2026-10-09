#!/usr/bin/env python3
"""Measure or opt-in normalise audio without re-encoding the video stream."""
import argparse
import subprocess
from pathlib import Path

def run(src,dst=None):
    src=Path(src)
    if not src.is_file():raise FileNotFoundError(src)
    if dst:
        dst=Path(dst)
        if src.resolve()==dst.resolve():raise ValueError("Never overwrite master")
        dst.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(src),
                        "-map","0:v:0","-map","0:a:0","-c:v","copy",
                        "-af","loudnorm=I=-16:TP=-1.5:LRA=9",
                        "-c:a","aac","-b:a","192k","-ar","48000",str(dst)],check=True)
        return str(dst)
    p=subprocess.run(["ffmpeg","-hide_banner","-i",str(src),"-af","volumedetect",
                      "-f","null","-"],capture_output=True,text=True)
    if p.returncode:raise RuntimeError(p.stderr[-4000:])
    return "\n".join(x.strip() for x in p.stderr.splitlines() if "mean_volume:" in x or "max_volume:" in x)

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("input");p.add_argument("--normalize-to")
    args=p.parse_args();print(run(args.input,args.normalize_to))
