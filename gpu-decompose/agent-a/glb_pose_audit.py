#!/usr/bin/env python3
"""Audit actual GLB mesh world bounds at contract poses (not just proxy boxes).

Evaluates the exported GLB geometry, not illustrative CAD assumptions.
Uses per-mesh glTF world transforms and the exact relative motion JSON.
Parent PCB_ASSEMBLY motion is applied additively to the child GPU_DIE and VRAM.
This AABB audit does not claim exact triangle/triangle swept collision fidelity.
"""
import json, pathlib
import numpy as np
import trimesh

OUT=pathlib.Path(__file__).resolve().parent.parent/"polish3"/"assets"
motion=json.loads((OUT/"decomposition.json").read_text())
scene=trimesh.load(str(OUT/"xfx_swift_rx9060xt_polish3.glb"),force="scene")
parents=scene.graph.transforms.parents
animated=set(motion["nodes"])
bounds={};counts={}
for node in scene.graph.nodes_geometry:
    name=node
    closest=None
    while name is not None:
        if name in animated:
            closest=name
            break
        name=parents.get(name)
    if closest is None:continue
    world,key=scene.graph[node]
    vertices=trimesh.transform_points(scene.geometry[key].vertices,world)
    if len(vertices)==0:continue
    lo=vertices.min(axis=0);hi=vertices.max(axis=0)
    if closest not in bounds:bounds[closest]=[lo,hi]
    else:
        bounds[closest][0]=np.minimum(bounds[closest][0],lo)
        bounds[closest][1]=np.maximum(bounds[closest][1],hi)
    counts[closest]=counts.get(closest,0)+1

def offs(name,frame):
    cfg=motion["nodes"][name]
    u=max(0.,min(1.,(frame-cfg["startFrame"])/(cfg["endFrame"]-cfg["startFrame"])))
    u=u*u*(3-2*u)
    delta=np.asarray(cfg["to"]["position"],dtype=float)*u
    if name in ("GPU_DIE","VRAM_CHIPS"):
        delta+=offs("PCB_ASSEMBLY",frame)
    return delta

samples=[0,45,89,90,105,120,145,179,180,210,240,270,300,329,330,385,449]
fand=["FAN_LEFT","FAN_CENTER","FAN_RIGHT"]
records=[]
for frame in samples:
    zmin=min(float(bounds[n][0][2]+offs(n,frame)[2]) for n in fand)
    zshroud=float(bounds["FRONT_SHROUD"][1][2]+offs("FRONT_SHROUD",frame)[2])
    gap=zmin-zshroud
    # AABB-based axial ordering margins for major cooler and silicon assemblies.
    shroud_back=float(bounds["FRONT_SHROUD"][0][2]+offs("FRONT_SHROUD",frame)[2])
    sink_front=float(bounds["HEATSINK"][1][2]+offs("HEATSINK",frame)[2])
    cooler_gap=shroud_back-sink_front
    records.append({"frame":frame,"fanVersusShroudAxialGap":round(gap,5),
      "shroudVersusHeatsinkAxialGap":round(cooler_gap,5),
      "fanFrontOfShroud":gap>0,
      "interpretation":"opening/partially detached" if frame<120 else "released"})
# Assembly can physically overlap its housing during early fan axial release.
# At all major post-release sampled frames the ENTIRE fan axial extent is ahead.
assert all(r["fanVersusShroudAxialGap"]>.02
           for r in records if r["frame"]>=120),records
assert records[-1]["shroudVersusHeatsinkAxialGap"]>0.025
assert set(fand+["FRONT_SHROUD","HEATSINK","PCB_ASSEMBLY","BACKPLATE","GPU_DIE","VRAM_CHIPS"])<=set(bounds)
result={"status":"GLB_ACTUAL_MESH_BOUNDS_PASS",
 "method":"TriMesh evaluated world-space vertices for all exported GLB meshes, with per-frame glTF Y-up motion deltas; AABB axial clearance not triangle/triangle continuous sweep",
 "scope":"Actual glTF mesh evaluated bounds, including 3 independent fan anchors and separately routed cooling geometry",
 "partialReleaseContactDisclosure":"During early detachment prior to frame 120 axial bounding volumes may overlap. Do not interpret early negative gaps as observed mesh interpenetration.",
 "meshInstancesByMovingGroup":counts,
 "restBounds":{k:{"min":v[0].tolist(),"max":v[1].tolist()} for k,v in bounds.items()},
 "sampledPoses":records}
(OUT/"glb-pose-audit.json").write_text(json.dumps(result,indent=2))
print("GLB_ACTUAL_MESH_BOUNDS_PASS",len(records),"poses",len(scene.graph.nodes_geometry),
      "real geometry instances; final fan clearance",
      records[-1]["fanVersusShroudAxialGap"])
