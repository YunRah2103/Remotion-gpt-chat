#!/usr/bin/env python3
"""Inspect actual GLB hierarchy. This is NOT a mesh-to-mesh collision checker."""
import json,struct,sys
from collections import Counter
from pathlib import Path
b=Path(sys.argv[1]).read_bytes()
magic,version,length=struct.unpack_from("<III",b,0)
assert magic==0x46546c67 and version==2 and length==len(b)
n,kind=struct.unpack_from("<II",b,12)
assert kind==0x4e4f534a
g=json.loads(b[20:20+n])
nodes=g["nodes"];names=[x.get("name") for x in nodes]
required="GPU_ROOT FAN_ASSEMBLY FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE PCB_ASSEMBLY PCB GPU_DIE VRAM_CHIPS VRM_COMPONENTS PCIE_FINGERS POWER_8PIN IO_BRACKET BACKPLATE".split()
for a in required: assert names.count(a)==1,(a,names.count(a))
parents={}
for i,node in enumerate(nodes):
 for j in node.get("children",[]):
  assert j not in parents,(i,j,parents.get(j))
  parents[j]=i
out={"glb":sys.argv[1],"totalNodes":len(nodes),
"totalMeshes":len(g.get("meshes",[])),"totalMaterials":len(g.get("materials",[])),
"anchors":{a:{"index":names.index(a),"parent":names[parents[names.index(a)]] if names.index(a) in parents else None} for a in required}}
Path("gpu-decompose/polish4/motion/hierarchy_report.json").write_text(json.dumps(out,indent=2)+"\n")
print("GLB_HIERARCHY_PASS",len(nodes),len(g.get("meshes",[])),len(g.get("materials",[])))
for a in required:print("ANCHOR",a,"parent=",out["anchors"][a]["parent"])
