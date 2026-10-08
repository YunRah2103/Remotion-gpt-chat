#!/usr/bin/env python3
"""PyBullet DIRECT collision-proxy sweeps using the exact contractual deltas.
Primitive envelopes, NOT triangle-accurate OEM mechanical clearance.
Pre-release assembled parts intentionally touch; report signed margins and sample stage.
"""
import json,pathlib
import pybullet as pb
from generate_motion import offset
OUT=pathlib.Path(__file__).resolve().parent.parent/"assets"
# +Z-front primitive envelope centers (model units) and physical thickness.
PARTS={
 "FAN_CENTER":([.86,.86,.060],[0,.025,.211]),
 "FRONT_SHROUD":([2.9,1.24,.075],[0,0,.176]),
 "HEATSINK":([2.65,1.02,.145],[0,0,.040]),
 "PCB_ASSEMBLY":([2.3,1.06,.023],[-.18,.01,-.090]),
 "BACKPLATE":([2.90,1.20,.018],[0,0,-.234])
}
pairs=[("FAN_CENTER","HEATSINK"),("HEATSINK","PCB_ASSEMBLY"),
       ("PCB_ASSEMBLY","BACKPLATE"),("FRONT_SHROUD","HEATSINK")]
id=pb.connect(pb.DIRECT)
objs={}
for name,(sizes,base) in PARTS.items():
 shape=pb.createCollisionShape(pb.GEOM_BOX,halfExtents=[x/2 for x in sizes])
 objs[name]=pb.createMultiBody(baseMass=0,baseCollisionShapeIndex=shape,basePosition=base)
reports=[]
for frame in [90,135,180,240,330,449]:
 for name,obj in objs.items():
  base=PARTS[name][1]
  d=offset(name,frame)
  pb.resetBasePositionAndOrientation(obj,[base[i]+d[i] for i in range(3)],[0,0,0,1])
 pb.performCollisionDetection()
 checks=[]
 for a,b in pairs:
  pos_a=[PARTS[a][1][i]+offset(a,frame)[i] for i in range(3)]
  pos_b=[PARTS[b][1][i]+offset(b,frame)[i] for i in range(3)]
  dist=abs(pos_a[2]-pos_b[2])-(PARTS[a][0][2]+PARTS[b][0][2])/2
  hit=pb.getClosestPoints(objs[a],objs[b],distance=0)
  checks.append({"pair":[a,b],"signedZGap":round(dist,4),"proxyCollision":bool(hit)})
 if frame==449:assert all(v["signedZGap"]>.025 and not v["proxyCollision"] for v in checks),checks
 reports.append({"frame":frame,"checks":checks})
pb.disconnect()
OUT.mkdir(parents=True,exist_ok=True)
(OUT/"clearance.json").write_text(json.dumps({"schemaVersion":1,
 "method":"Real PyBullet DIRECT rigid collision proxies (AABB/box, not actual mesh)",
 "earlierContact":"Some joined parts intentionally touch before release; only fully separated stage required collision-free",
 "finalClearancePass":True,"samples":reports},indent=2))
print("PYBULLET_CLEARANCE_PASS",len(reports),"sampled frames; final layers collision-free")
