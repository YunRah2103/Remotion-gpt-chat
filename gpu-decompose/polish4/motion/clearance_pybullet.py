#!/usr/bin/env python3
"""Deterministic PyBullet proxy audit, explicitly NOT a mesh-level collision proof.
Y-up glTF convention, approximate major-layer envelopes inferred from old Blender source;
retry with actual evaluated POLISH04 GLB mesh bounds before release approval.
"""
import json
from pathlib import Path
from generate_motion import load,local_delta
import pybullet as p

# proxy size/centre in [x,y,z] GLTF coordinates, NOT OEM collision meshes
BOX={
 "FRONT_SHROUD":((2.90,1.24,.075),(0.,0.,.215)),
 "FAN_LEFT":((.82,.82,.07),(-.94,.025,.265)),
 "FAN_CENTER":((.82,.82,.07),(0.,.025,.265)),
 "FAN_RIGHT":((.82,.82,.07),(.94,.025,.265)),
 "HEATSINK":((2.68,1.02,.150),(0.,0.,.085)),
 "PCB_ASSEMBLY":((2.20,1.05,.025),(-.18,0.,-.080)),
 "BACKPLATE":((2.90,1.24,.018),(0.,0.,-.235)),
}
# Test only mechanically disconnected major layers. Attachments (fan-to-shroud,
# cooling-to-board etc.) legitimately sit very close in assembled rest pose.
PAIRS=[("FAN_LEFT","FRONT_SHROUD"),("FAN_CENTER","FRONT_SHROUD"),
("FAN_RIGHT","FRONT_SHROUD"),("FRONT_SHROUD","HEATSINK"),
("HEATSINK","PCB_ASSEMBLY"),("PCB_ASSEMBLY","BACKPLATE")]
FRAMES=[0,45,89,90,99,108,120,143,160,179,183,202,216,238,252,267,281,304,320,329,330,385,449]
def main():
    cid=p.connect(p.DIRECT)
    bodies={}
    for name,(dim,_) in BOX.items():
        cs=p.createCollisionShape(p.GEOM_BOX,halfExtents=[d*.5 for d in dim])
        bodies[name]=p.createMultiBody(baseMass=0,baseCollisionShapeIndex=cs,basePosition=[0,0,0])
    points=[]
    bad=[]
    for f in FRAMES:
        for name,bid in bodies.items():
            center=BOX[name][1]
            delta=local_delta(name,f)
            p.resetBasePositionAndOrientation(bid,[center[k]+delta[k] for k in range(3)],[0,0,0,1])
        p.performCollisionDetection()
        row={"frame":f,"penetrations":[],"clearances":{}}
        for aa,bb in PAIRS:
            cp=p.getClosestPoints(bodies[aa],bodies[bb],distance=3.5)
            if not cp: continue
            distance=min(v[8] for v in cp)
            row["clearances"][aa+"/"+bb]=round(distance,6)
            if f>=329 and distance<-.001:
                bad.append({"frame":f,"pair":[aa,bb],"penetration":distance})
            if distance<-.001:
                row["penetrations"].append([aa,bb,round(distance,6)])
        points.append(row)
    p.disconnect()
    result={"kind":"approximate-PyBullet-box-proxies","source":"polish03 estimated bounds, replace with measured A geometry",
    "meshCollisionProof":False,"allFinalMajorLayerProxiesClear":not bad,
    "lateViolations":bad,"frames":points}
    path=Path(__file__).with_name("clearance_report.json")
    path.write_text(json.dumps(result,indent=2)+"\n")
    print("PYBULLET_PROXIES",len(points),"samples",len(PAIRS),"pairs","LATE_PASS" if not bad else "LATE_FAIL")
    if bad:raise SystemExit("Late major-layer proxy penetrations: "+str(bad))
if __name__=="__main__":main()
