#!/usr/bin/env python3
"""Validate true GLB world bounds against 290 x 124 x 49 mm manufacturer envelope."""
import json,pathlib,trimesh
base=pathlib.Path(__file__).resolve().parent.parent/"polish3"/"assets"
scene=trimesh.load(str(base/"xfx_swift_rx9060xt_polish3.glb"),force="scene")
actual=scene.bounds.tolist()
target=[[-1.45,-.62,-.245],[1.45,.62,.245]]
tol=[.0435,.0186,.00735] # ±3% of each nominal HALF axis extent
checks={}
for i,axis in enumerate(["x","y","z"]):
 for p,edge in enumerate(["min","max"]):
  err=abs(actual[p][i]-target[p][i])
  checks[axis+"_"+edge]={"actual":actual[p][i],"target":target[p][i],
                           "allowed":tol[i],"pass":err<=tol[i]}
assert all(c["pass"] for c in checks.values()), ("GLB envelope exceeded",checks)
result={"status":"GLB_BOUNDS_PASS","measuredBoundsYUp":actual,
        "nominalDimensionsMillimetres":[290,124,49],
        "sceneUnitsPerMillimetre":.01,"checks":checks,
        "geometryCount":len(scene.geometry)}
(base/"bounds-validation.json").write_text(json.dumps(result,indent=2))
print("GLB_BOUNDS_PASS",actual,len(scene.geometry),"mesh instances")
