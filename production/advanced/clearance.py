#!/usr/bin/env python3
"""Conservative AABB overlap audit on explicit real scene-frame bounds.

Not narrow-phase triangle collision, physical force simulation or full clearance
proof. Use frame-sampled world AABBs exported by Blender; ignore declared contacts.
"""
import argparse
import json
import math
from pathlib import Path

def box(value):
    if not isinstance(value,list) or len(value)!=6 or any(type(x) not in (int,float) or not math.isfinite(x) for x in value):
        raise ValueError("Bounds must have six finite coordinates")
    if any(value[i]>=value[i+3] for i in range(3)):
        raise ValueError("Empty/reversed volume")
    return value

def shared(a,b):
    return [max(0,min(a[i+3],b[i+3])-max(a[i],b[i])) for i in range(3)]

def audit(doc):
    if doc.get("schemaVersion")!=1 or not isinstance(doc.get("frames"),list):
        raise ValueError("Frame bounds schemaVersion 1 required")
    frames=doc["frames"]
    if not 1<=len(frames)<=240:raise ValueError("1–240 sampled frames supported")
    ignore=set()
    for pair in doc.get("allowedContactPairs",[]):
        if not isinstance(pair,list) or len(pair)!=2 or not all(isinstance(v,str) for v in pair):
            raise ValueError("Invalid allowed contact pair")
        ignore.add(tuple(sorted(pair)))
    eps=float(doc.get("tolerance",.001))
    if not 0<=eps<=.1:raise ValueError("Invalid tolerance")
    warnings=[]
    for frame in frames:
        n=frame.get("frame")
        parts=frame.get("parts")
        if not isinstance(n,int) or not isinstance(parts,dict) or not 1<=len(parts)<=140:
            raise ValueError("Invalid frame parts")
        names=sorted(parts)
        for i,a in enumerate(names):
            A=box(parts[a])
            for b in names[i+1:]:
                if tuple(sorted((a,b))) in ignore:continue
                B=box(parts[b])
                spans=shared(A,B)
                if min(spans)>eps:
                    warnings.append({"frame":n,"a":a,"b":b,
                        "overlapAabb":round(math.prod(spans),8),
                        "note":"Broadphase AABB overlap only; real meshes can be disjoint."})
                if len(warnings)>5000:raise ValueError("Too many overlaps; refine candidate selection")
    return {"framesChecked":len(frames),"potentialIntersections":warnings,
            "ignoredPairs":[list(x) for x in sorted(ignore)],
            "method":"axis-aligned world-space bounding box overlap, not geometry collision",
            "signoff":"MECHANICAL_REVIEW_REQUIRED"}

def run(input_path,out):
    data=json.loads(Path(input_path).read_text())
    result=audit(data)
    dest=Path(out);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,indent=2)+"\n")
    return result

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("samples");p.add_argument("output")
    x=p.parse_args();r=run(x.samples,x.output)
    print(json.dumps({"framesChecked":r["framesChecked"],"warnings":len(r["potentialIntersections"]),
                      "signoff":r["signoff"]}))
