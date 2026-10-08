#!/usr/bin/env python3
"""Strict POLISH04 timeline checks; does NOT claim mesh-to-mesh collision safety."""
import hashlib,json,sys
from pathlib import Path
from generate_motion import load,local_delta
MOTION=Path(__file__).with_name("decomposition.v1.json")
NEEDED={"FAN_LEFT","FAN_CENTER","FAN_RIGHT","FRONT_SHROUD","HEATSINK",
"HEATSINK_FINS","HEATPIPE_BUNDLE","COLD_PLATE","GPU_DIE","VRAM_CHIPS",
"VRM_COMPONENTS","PCB_ASSEMBLY","BACKPLATE"}
PARENT={"FAN_LEFT":"FAN_ASSEMBLY","FAN_CENTER":"FAN_ASSEMBLY",
"FAN_RIGHT":"FAN_ASSEMBLY","HEATSINK_FINS":"HEATSINK",
"HEATPIPE_BUNDLE":"HEATSINK","COLD_PLATE":"HEATSINK",
"GPU_DIE":"PCB_ASSEMBLY","VRAM_CHIPS":"PCB_ASSEMBLY",
"VRM_COMPONENTS":"PCB_ASSEMBLY"}
def main():
    b=MOTION.read_bytes();a=load()
    assert a["schemaVersion"]==1 and a["fps"]==30 and a["durationInFrames"]==450
    assert a["positionsAreRelativeDeltas"] is True
    assert set(a["nodes"])==NEEDED
    for name,m in a["nodes"].items():
        s,e=m["startFrame"],m["endFrame"]
        assert isinstance(s,int) and isinstance(e,int) and 90<=s<e<=329,(name,s,e)
        assert m["easing"]=="smoothstep"
        assert m["from"]=={"position":[0,0,0],"rotation":[0,0,0]},name
        assert m["to"]["rotation"]==[0,0,0],name
        final=m["to"]["position"]
        assert len(final)==3 and all(isinstance(x,(int,float)) and abs(x)<2 for x in final)
        assert local_delta(name,0)==(0,0,0) and local_delta(name,89)==(0,0,0)
        for k in range(3):
            assert abs(local_delta(name,449)[k]-final[k])<1e-9
        previous=local_delta(name,0)
        for f in range(1,450):
            cur=local_delta(name,f)
            for k in range(3):
                sign=1 if final[k]>0 else (-1 if final[k]<0 else 0)
                assert (cur[k]-previous[k])*sign>=-1e-9,(name,f,k,previous,cur)
                assert abs(cur[k]-previous[k])<.085,(name,f,k,"teleport")
            previous=cur
    # Assembled hero/finished exploded tableau are stable when sampled directly.
    assert all(local_delta(n,89)==(0,0,0) for n in NEEDED)
    assert all(local_delta(n,330)==local_delta(n,449) for n in NEEDED)
    assert a["nodes"]["FRONT_SHROUD"]["startFrame"]>a["nodes"]["FAN_LEFT"]["startFrame"]
    assert a["nodes"]["BACKPLATE"]["endFrame"]==329
    # Hierarchical children have own local deltas; no parent motion is copied to child keys.
    assert all(PARENT[n] not in ("FAN_ASSEMBLY",) or n.startswith("FAN_") for n in PARENT)
    print("PASS_POLISH04_MOTION 450 frames 13 named anchors; no discontinuities")
    print("JSON_SHA256",hashlib.sha256(b).hexdigest())
if __name__=="__main__":main()
