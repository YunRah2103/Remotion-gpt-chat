#!/usr/bin/env python3
"""Reproducible preflight: link a real brief + contiguous shot plan to an EXISTING composition.
Refuses to turn preproduction data into a fictitious finished video.
"""
import argparse
import json
import re
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"studio"))
from shot_validator import validate
from voice_sync import validate_words

def compositions(root):
    content=(Path(root)/"src/Root.tsx").read_text()
    found={}
    for match in re.finditer(r'<Composition\b[^>]+/>',content,re.S):
        line=match.group()
        def field(key):
            m=re.search(r'\b'+key+r'=(?:\{(\d+)\}|"([^"]+)")',line)
            return (m.group(1) or m.group(2)) if m else None
        name=field("id")
        if name:
            found[name]={"fps":int(field("fps") or 0),"durationInFrames":int(field("durationInFrames") or 0),
                         "width":int(field("width") or 0),"height":int(field("height") or 0)}
    return found

def preflight(repo, project, composition=None, captions=None, audio_src=None, dest=None):
    if not re.fullmatch(r'[a-z][a-z0-9-]{1,63}',project):
        raise ValueError("Invalid project slug")
    home=Path(repo)
    folder=home/"production/videos"/project
    brief=json.loads((folder/"brief.json").read_text())
    shots=json.loads((folder/"shots.json").read_text())
    narration=(folder/"voiceover.txt").read_text() if (folder/"voiceover.txt").is_file() else ""
    if brief.get("slug")!=project or int(brief.get("schemaVersion",0))!=1:
        raise ValueError("Project metadata mismatch")
    source=brief.get("sourceCompositionId")
    if not source or brief.get("status")=="preproduction":
        raise ValueError("Preproduction project has no approved, registered Remotion composition")
    if composition and composition!=source:
        raise ValueError("Requested composition does not match the project")
    registry=compositions(home)
    entry=registry.get(source)
    if not entry:
        raise ValueError("Composition not registered in src/Root.tsx: "+source)
    expected={"fps":int(brief["fps"]),"durationInFrames":int(brief["durationInFrames"]),
              "width":int(brief["resolution"][0]),"height":int(brief["resolution"][1])}
    if entry!=expected:
        raise ValueError(f"Brief/composition mismatch: {entry} vs {expected}")
    storyboard=validate(brief,shots,narration)
    target=source
    words=[]
    if captions:
        doc=json.loads(Path(captions).read_text())
        words=validate_words(doc.get("words",[]) if isinstance(doc,dict) else doc)
        if words[-1]["end"]>brief["durationInFrames"]/brief["fps"]+.05:
            raise ValueError("Caption timings exceed film duration")
        target=source+"Captioned"
        if target not in registry or registry[target]!=entry:
            raise ValueError("Matching captioned composition not registered")
    if audio_src and not captions:
        raise ValueError("Approved word timings are required when staging narration into captioned master")
    if audio_src and (not isinstance(audio_src,str) or not re.fullmatch(r'production-narration/[a-z0-9-]+/approved\.(wav|m4a|mp3)',audio_src)):
        raise ValueError("Unsafe audio path")
    out={"status":"PASS","project":project,"sourceCompositionId":source,
         "renderCompositionId":target,"frames":expected["durationInFrames"],
         "fps":expected["fps"],"storyboard":storyboard,
         "narrationAudio":"supplied" if audio_src else "not supplied",
         "captionWords":len(words),
         "note":"A successful preflight does not equal a real render or engineering approval."}
    if dest:
        targetdir=Path(dest);targetdir.mkdir(parents=True,exist_ok=True)
        (targetdir/"preflight.json").write_text(json.dumps(out,indent=2)+"\n")
        (targetdir/"props.json").write_text(json.dumps({"words":words,"audioSrc":audio_src,
                                                        "enabled":bool(words)},indent=2)+"\n")
    return out

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--repo",default=".")
    p.add_argument("--project",required=True)
    p.add_argument("--composition")
    p.add_argument("--captions")
    p.add_argument("--audio-src")
    p.add_argument("--output",default="out/production-pipeline")
    x=p.parse_args()
    print(json.dumps(preflight(x.repo,x.project,x.composition,x.captions,x.audio_src,x.output),indent=2))
