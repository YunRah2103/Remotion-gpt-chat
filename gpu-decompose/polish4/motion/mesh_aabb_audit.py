#!/usr/bin/env python3
"""Measure actual exported glTF MESH world bounds under POLISH04 animated hierarchy.

This evaluates real GLB mesh vertices with trimesh. It is a conservative
axis-aligned envelope/axial ordering audit, NOT exact triangle-vs-triangle
continuous collision detection. Each mesh belongs to its NEAREST moving
anchor, so nested GPU_DIE/VRAM or HEATPIPE_BUNDLE movement is never counted
twice inside the exclusive parent group. World offsets include GLB hierarchy.
"""
import json
import sys
from pathlib import Path
import numpy as np
import trimesh
from generate_motion import load,local_delta

MOTION=load()
moving=set(MOTION["nodes"])
samples=sorted(set([0,30,60,89,90,100,115,135,150,180,210,225,250,270,
                    280,310,329,365,415,449]+list(range(90,330,5))))
PATH=Path(sys.argv[1])
scene=trimesh.load(str(PATH),force="scene")
parent=scene.graph.transforms.parents
bounds={}
members={}
for node in scene.graph.nodes_geometry:
    cur=node
    closest=None
    while cur is not None:
        if cur in moving:
            closest=cur
            break
        cur=parent.get(cur)
    if closest is None:continue
    transform,key=scene.graph[node]
    verts=scene.geometry[key].vertices
    if not len(verts):continue
    xyz=trimesh.transform_points(verts,transform)
    lo=np.min(xyz,axis=0)
    hi=np.max(xyz,axis=0)
    if closest not in bounds:
        bounds[closest]=[lo,hi]
    else:
        bounds[closest][0]=np.minimum(bounds[closest][0],lo)
        bounds[closest][1]=np.maximum(bounds[closest][1],hi)
    members[closest]=members.get(closest,0)+1

# Each named anchor has exactly one additive LOCAL offset. This uses the
# POLISH03/04 GLB's aligned export axes for conservative AABB translation;
# if A changes rotations or pivots, D MUST use true animated mesh bounds.
def total_delta(name,f):
    v=np.zeros(3)
    node=name
    seen=set()
    while node is not None:
        assert node not in seen,("cycle",name,node)
        seen.add(node)
        if node in moving:
            v+=np.asarray(local_delta(node,f),dtype=float)
        node=parent.get(node)
    return v

# Relation is A's closest point "in front" of B's farthest point on glTF +Z.
# These are signed axial ordering margins, not Euclidean or mesh clearances.
pairs=[
 ("FAN_LEFT","FRONT_SHROUD"),
 ("FAN_CENTER","FRONT_SHROUD"),
 ("FAN_RIGHT","FRONT_SHROUD"),
 ("FRONT_SHROUD","HEATPIPE_BUNDLE"),
 ("FRONT_SHROUD","HEATSINK_FINS"),
 ("FRONT_SHROUD","COLD_PLATE"),
 ("COLD_PLATE","GPU_DIE"),
 ("GPU_DIE","PCB_ASSEMBLY"),
 ("VRAM_CHIPS","PCB_ASSEMBLY"),
 ("PCB_ASSEMBLY","BACKPLATE"),
]
records=[]
for frame in samples:
    rec={"frame":frame,"axialSeparation":{}}
    for a,b in pairs:
        if a not in bounds or b not in bounds:continue
        ma=bounds[a][0][2]+total_delta(a,frame)[2]
        mb=bounds[b][1][2]+total_delta(b,frame)[2]
        rec["axialSeparation"][a+"->"+b]=round(float(ma-mb),6)
    records.append(rec)
end=records[-1]["axialSeparation"]
keypairs=[
 "FAN_LEFT->FRONT_SHROUD","FAN_CENTER->FRONT_SHROUD",
 "FAN_RIGHT->FRONT_SHROUD","PCB_ASSEMBLY->BACKPLATE"
]
flags=[{"pair":p,"gap":end.get(p)} for p in keypairs if end.get(p,0)<=.015]
model={"glb":str(PATH),"method":"real GLB mesh vertices, trimesh world transforms + inherited additive offsets",
       "measurement":"conservative axis-aligned projected +Z envelopes; NOT triangle/triangle sweep",
       "meshInstancesByExclusiveAnchor":members,
       "restBounds":{k:{"lo":v[0].tolist(),"hi":v[1].tolist()} for k,v in bounds.items()},
       "finalKeyPairWarnings":flags,
       "samples":records,
       "provisional":True}
out=Path(__file__).with_name("glb_mesh_aabb_report.json")
out.write_text(json.dumps(model,indent=2)+"\n",encoding="utf-8")
print("GLB_ACTUAL_MESH_AABB",len(scene.graph.nodes_geometry),"mesh instances",
      len(bounds),"animated subassemblies",len(records),"sampled frames")
for a,b in pairs:print("FINAL_Z_MARGIN",a,b,end.get(a+"->"+b,"NO_MESH"))
print("AABB_REVIEW_FLAGS",json.dumps(flags))
# All final critical separate bounds need human review; do not conceal a warning
# but don't claim failures of approximate boxes are exact mesh collisions.
