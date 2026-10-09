#!/usr/bin/env python3
"""Detect shot gaps, overlaps, impossible frame windows and rough narration overruns."""
import argparse
import json
from pathlib import Path

def validate(brief,shots,narration=None):
    total=int(brief["durationInFrames"]); fps=int(brief["fps"])
    if total<1 or fps<1:raise ValueError("Invalid duration / fps")
    if not shots:raise ValueError("Missing shots")
    ordered=sorted(shots,key=lambda s:int(s["startFrame"]))
    cursor=0
    for s in ordered:
        a,b=int(s["startFrame"]),int(s["endFrame"])
        if a!=cursor or b<a:raise ValueError(f"Frame gap/overlap near {cursor}: {a}..{b}")
        cursor=b+1
    if cursor!=total:raise ValueError(f"Shots cover {cursor} of {total} frames")
    words=len((narration or "").split())
    rate=words/(total/fps)
    return {"frames":total,"fps":fps,"shots":len(shots),"narrationWords":words,
            "approxWordsPerSecond":round(rate,2),
            "advisory":"Review voiceover pacing" if rate>2.8 else "Pacing plausible"}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("video_directory")
    x=p.parse_args();d=Path(x.video_directory)
    report=validate(json.loads((d/"brief.json").read_text()),
                    json.loads((d/"shots.json").read_text()),
                    (d/"voiceover.txt").read_text() if (d/"voiceover.txt").exists() else None)
    print(json.dumps(report,indent=2))
