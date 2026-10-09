#!/usr/bin/env python3
"""Production render recovery: exact frame intervals, validation of reusable chunks.

Remote artifact inventory/download uses gh CLI only inside explicitly dispatched
GitHub Actions workflow, from a matching same-repository source workflow run.
"""
import argparse
import json
import math
import re
import subprocess
from pathlib import Path

def slices(frames,count=5):
    if type(frames)!=int or frames<count or frames>12000:
        raise ValueError("Need 5–12,000 frames for fixed five-part pipeline")
    size=math.ceil(frames/count)
    return [{"part":i,"start":i*size,"end":min(frames-1,(i+1)*size-1)}
            for i in range(count)]

def evaluate(frames,available):
    chunks=slices(frames)
    if not isinstance(available,list) or any(type(p)!=int or p not in range(5) for p in available):
        raise ValueError("Invalid completed chunk IDs")
    present=set(available)
    return {"reusableParts":sorted(present),
            "missingParts":[p["part"] for p in chunks if p["part"] not in present],
            "chunks":chunks}

def probe(path,expected_frames,expected_fps):
    video=Path(path)
    if not video.is_file() or video.stat().st_size<1000:return False
    try:
        raw=subprocess.run(["ffprobe","-v","error","-select_streams","v:0",
                            "-show_entries","stream=nb_frames,r_frame_rate,width,height",
                            "-of","json",str(video)],check=True,capture_output=True,text=True,timeout=30)
        rows=json.loads(raw.stdout).get("streams",[])
        if len(rows)!=1:return False
        item=rows[0]
        num,den=map(int,item["r_frame_rate"].split("/"))
        return (int(item["nb_frames"])==expected_frames and
                num/den==expected_fps and int(item["width"])==1080 and int(item["height"])==1920)
    except (ValueError,KeyError,ZeroDivisionError,subprocess.CalledProcessError,subprocess.TimeoutExpired):
        return False

def source_run(record,repository,number):
    if not isinstance(record,dict) or record.get("id")!=number:
        raise ValueError("Source run metadata mismatch")
    if record.get("repository",{}).get("full_name")!=repository:
        raise ValueError("Run came from another repository")
    if record.get("name")!="Production - automated preflight, 3D proofs and final master":
        raise ValueError("Run did not originate in approved full production pipeline")
    sha=record.get("head_sha")
    if not isinstance(sha,str) or not re.fullmatch("[0-9a-f]{40}",sha):
        raise ValueError("Missing immutable source commit")
    return sha

def gh(*args):
    result=subprocess.run(["gh",*args],check=True,text=True,capture_output=True,timeout=90)
    return result.stdout

def analyse_run(run,repo,dest):
    if type(run)!=int or run<=0:raise ValueError("Invalid Actions run id")
    out=Path(dest);out.mkdir(parents=True,exist_ok=True)
    record=json.loads(gh("api",f"repos/{repo}/actions/runs/{run}"))
    sha=source_run(record,repo,run)
    inventory=json.loads(gh("api",f"repos/{repo}/actions/runs/{run}/artifacts?per_page=100"))
    names={p["name"] for p in inventory.get("artifacts",[]) if not p.get("expired") and
           p.get("size_in_bytes",0)>0}
    stage=f"production-stage-{run}"
    if stage not in names:
        raise ValueError("Source preflight artifact unavailable or expired: "+stage)
    directory=out/"stage";directory.mkdir(exist_ok=True)
    gh("run","download",str(run),"-n",stage,"-D",str(directory),"-R",repo)
    meta=json.loads((directory/"preflight.json").read_text())
    n=int(meta["frames"]);fps=int(meta["fps"])
    if meta.get("status")!="PASS" or fps!=30:
        raise ValueError("Original preflight did not establish expected native 30 fps")
    slices(n)
    parts=[]
    for p in slices(n):
        i=p["part"];name=f"production-chunk-{run}-{i}"
        if name not in names:continue
        root=out/"original"/str(i);root.mkdir(parents=True,exist_ok=True)
        gh("run","download",str(run),"-n",name,"-D",str(root),"-R",repo)
        if probe(root/f"chunk-{i}.mp4",p["end"]-p["start"]+1,fps):
            parts.append(i)
    result={"sourceSha":sha,"run":run,"repository":repo,"project":meta["project"],
            "composition":meta["renderCompositionId"],"frames":n,"fps":fps,
            **evaluate(n,parts)}
    (out/"recovery-plan.json").write_text(json.dumps(result,indent=2)+"\n")
    return result

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--run",type=int,required=True)
    parser.add_argument("--repo",required=True)
    parser.add_argument("--out",required=True)
    args=parser.parse_args()
    print(json.dumps(analyse_run(args.run,args.repo,args.out),indent=2))
