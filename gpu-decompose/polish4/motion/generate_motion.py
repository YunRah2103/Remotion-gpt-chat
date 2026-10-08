#!/usr/bin/env python3
"""Versioned, pure-frame POLISH04 teardown. JSON is the locked runtime source of truth.
Anchor offsets are additive in the GLB parent-local coordinate frame. No state/physics integration.
"""
import json
from pathlib import Path

MOTION = Path(__file__).with_name("decomposition.v1.json")
def load():
    return json.loads(MOTION.read_text(encoding="utf-8"))
def smoothstep(t):
    t=max(0.,min(1.,float(t)))
    return t*t*(3.-2.*t)
def local_delta(node,frame):
    m=load()["nodes"][node]
    t=smoothstep((float(frame)-m["startFrame"])/(m["endFrame"]-m["startFrame"]))
    return tuple(m["from"]["position"][k]*(1-t)+m["to"]["position"][k]*t for k in range(3))
def resolved_offsets(frame, parents):
    """Illustrative translational resolution. Real runtime uses Object3D local transforms
    so rotated GLB parents are NOT folded into world-space sums.
    """
    data=load()["nodes"]
    cache={}
    def one(name):
        if name in cache:return cache[name]
        local=local_delta(name,frame) if name in data else (0.,0.,0.)
        parent=parents.get(name)
        prev=one(parent) if parent else (0.,0.,0.)
        cache[name]=tuple(local[k]+prev[k] for k in range(3))
        return cache[name]
    return {name:one(name) for name in data}
if __name__=="__main__":
    a=load()
    assert a["schemaVersion"]==1 and a["fps"]==30 and a["durationInFrames"]==450
    print("POLISH04_MOTION",len(a["nodes"]),"anchors",len(range(450)),"deterministic frames")
