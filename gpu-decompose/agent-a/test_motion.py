#!/usr/bin/env python3
import json, pathlib, sys
from generate_motion import FRAMES,PARTS,offset
root=pathlib.Path(__file__).resolve().parent
assert FRAMES==450
assert len(PARTS)==11
assert all(offset(k,0)==[0,0,0] for k in PARTS)
assert all(offset(k,89)==[0,0,0] for k in PARTS)
assert all(offset(k,449)==PARTS[k]["delta"] for k in PARTS)
for k in PARTS:
 prev=offset(k,0)
 for f in range(1,FRAMES):
  now=offset(k,f)
  # monotonic displacement per axis
  for i in range(3):
   d=PARTS[k]["delta"][i]
   if d>0: assert now[i]>=prev[i]-1e-6,(k,f,i)
   if d<0: assert now[i]<=prev[i]+1e-6,(k,f,i)
  prev=now
print("MOTION_TEST_PASS 450 frames, 11 monotonic transforms")
