#!/usr/bin/env python3
import json,pathlib
from generate_motion import FRAMES,PARTS,offset,make
root=pathlib.Path(__file__).resolve().parent.parent/"assets"
assert FRAMES==450
assert len(PARTS)==9
obj=make()
assert obj["schemaVersion"]==1
assert list(obj["nodes"])==list(PARTS)
assert all(offset(n,0)==[0,0,0] for n in PARTS)
assert all(offset(n,89)==[0,0,0] for n in PARTS)
assert all(offset(n,449)==PARTS[n]["delta"] for n in PARTS)
for n in PARTS:
 p=PARTS[n]
 assert p["startFrame"]<p["endFrame"]
 prev=offset(n,0)
 for f in range(1,FRAMES):
  now=offset(n,f)
  for i,d in enumerate(p["delta"]):
   assert now[i]+1e-6>=prev[i] if d>0 else (now[i]<=prev[i]+1e-6 if d<0 else now[i]==0)
  prev=now
assert (root/"decomposition.json").exists()
print("MOTION_TEST_PASS",FRAMES,"frames",len(PARTS),"pure, monotonic smoothstep tracks")
