#!/usr/bin/env python3
"""Run real PyBullet DIRECT-mode deterministic collision-envelope checks at late explode frames."""
import json, pathlib, math
import pybullet as p
from generate_motion import PARTS,offset
ROOT=pathlib.Path(__file__).resolve().parent
# collision envelopes ONLY: omit nested subparts that intentionally touch PCB/cooler.
BOXES={
 "SHROUD":([2.90,.075,1.24],[0,-.215,0]),
 "FAN_LEFT":([.82,.07,.82],[-.94,-.265,0]),
 "FAN_CENTER":([.82,.07,.82],[0,-.265,0]),
 "FAN_RIGHT":([.82,.07,.82],[.94,-.265,0]),
 "HEATSINK":([2.68,.15,1.02],[0,-.085,0]),
 "BACKPLATE":([2.90,.018,1.24],[0,.235,0]),
 "PCB":([2.2,.025,1.05],[-.18,.080,0])
}
id=p.connect(p.DIRECT)
bodies={}
for n,(size,base) in BOXES.items():
 cs=p.createCollisionShape(p.GEOM_BOX,halfExtents=[v/2 for v in size])
 bod=p.createMultiBody(baseMass=0,baseCollisionShapeIndex=cs,basePosition=base)
 bodies[n]=bod
results=[]
for f in [0,89,90,140,179,220,300,380,449]:
 for name,bod in bodies.items():
  base=BOXES[name][1]; d=offset(name,f)
  p.resetBasePositionAndOrientation(bod,[base[i]+d[i] for i in range(3)],[0,0,0,1])
 p.performCollisionDetection()
 late_pairs=[]
 if f>=380:
  ids=list(bodies)
  for i,a in enumerate(ids):
   for b in ids[i+1:]:
    hits=p.getClosestPoints(bodies[a],bodies[b],distance=.0)
    if hits: late_pairs.append((a,b))
  assert not late_pairs, ("Late-stage major-part envelope collision",f,late_pairs)
 results.append({"frame":f,"checked_groups":len(bodies),"late_collisions":late_pairs})
p.disconnect()
path=ROOT/"pybullet_validation.json"
path.write_text(json.dumps({"status":"PYBULLET_PASS","samples":results},indent=2))
print("PYBULLET_PASS",len(results),"samples",len(BOXES),"actual rigid bodies")
