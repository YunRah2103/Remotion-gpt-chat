#!/usr/bin/env python3
"""New video spec scaffold: does NOT edit Root.tsx or claim a film exists."""
import argparse
import json
import re
from pathlib import Path

def create(slug,title,seconds=25,fps=30,root="production/videos"):
    if not re.fullmatch(r"[a-z][a-z0-9-]{1,63}",slug):raise ValueError("Use lowercase kebab-case slug")
    if not title.strip() or seconds<1 or fps<1: raise ValueError("Invalid title/duration")
    folder=Path(root)/slug
    if folder.exists():raise FileExistsError(str(folder))
    folder.mkdir(parents=True)
    meta={"schemaVersion":1,"slug":slug,"title":title,"fps":fps,"durationSeconds":seconds,
          "durationInFrames":seconds*fps,"resolution":[1080,1920],"status":"preproduction",
          "narrationPath":"voiceover.txt","mechanicalAssets":[],"sourceCompositionId":None}
    (folder/"brief.json").write_text(json.dumps(meta,indent=2)+"\n")
    shots=[{"startFrame":0,"endFrame":seconds*fps-1,"visual":"Outline the main mechanical sequence; break into shots before rendering","narrationCue":""}]
    (folder/"shots.json").write_text(json.dumps(shots,indent=2)+"\n")
    (folder/"voiceover.txt").write_text("Add the approved voiceover here. Do not generate replacement narration automatically.\n")
    (folder/"ASSETS.md").write_text("# Assets\n\nDocument original GLBs, licensing, real-world accuracy and reusable components here.\n")
    return folder

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("slug");p.add_argument("title")
    p.add_argument("--seconds",type=int,default=25);p.add_argument("--fps",type=int,default=30)
    x=p.parse_args();print(create(x.slug,x.title,x.seconds,x.fps))
