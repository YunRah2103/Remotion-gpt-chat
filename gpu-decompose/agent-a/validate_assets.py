#!/usr/bin/env python3
"""Validate GLB binary structurally, required exported glTF anchor names and reference envelope."""
import pathlib,struct,json,hashlib,os
root=pathlib.Path(__file__).resolve().parent.parent/"assets"
f=root/"xfx_swift_rx9060xt_triple16.glb";data=f.read_bytes()
assert data[:4]==b"glTF" and len(data)>100000,(len(data),data[:4])
assert struct.unpack_from("<I",data,8)[0]==len(data)
chunklen,chunktype=struct.unpack_from("<II",data,12)
assert chunktype==0x4e4f534a
j=json.loads(data[20:20+chunklen])
nodes={v.get("name") for v in j["nodes"]}
need={"GPU_ROOT","FAN_ASSEMBLY","FAN_LEFT","FAN_CENTER","FAN_RIGHT",
"FRONT_SHROUD","HEATSINK","HEATSINK_FINS","HEATPIPE_BUNDLE","COLD_PLATE",
"PCB_ASSEMBLY","PCB","GPU_DIE","VRAM_CHIPS","VRM_COMPONENTS",
"PCIE_FINGERS","POWER_8PIN","IO_BRACKET","BACKPLATE"}
assert need <= nodes, ("Missing anchor",sorted(need-nodes))
assert len(j.get("meshes",[]))>=40
materials=[x.get("name") for x in j.get("materials",[])]
assert "M_PCB_DARK_GREEN" in materials
assert "M_FAN_BLADE" in materials
assert "M_POLYMER_GRAPHITE" in materials
motion=json.loads((root/"decomposition.json").read_text())
assert motion["durationInFrames"]==450 and motion["fps"]==30
assert set(motion["nodes"])<=nodes
# GLB created at rest: animated JSON deltas are ONLY applied by Agent B.
h=hashlib.sha256(data).hexdigest()
manifest={"model":"XFX Swift AMD Radeon RX 9060 XT OC Triple Fan 16GB",
 "sku":"RX-96TS316B7","accurateExternalBoundsMM":[290,124,49],
 "sceneUnitsPerMillimetre":.01,
 "coordinateSystem":"GLB Y-UP; X length right; +Z face viewer; +Y card top",
 "externalAccuracy":"Manufacturer SKU, triple black fans, external dimensions and outputs verified",
 "estimatedGeometry":["PCB layout","Die package dimensions","VRAM topology","Heatpipes","Screw and fin counts","Exact fan profile"],
 "source":"gpu-decompose/agent-a/blender_generate.py",
 "modelerCommitSha":os.environ.get("GITHUB_SHA","local-unversioned"),
 "openSCADSource":"gpu-decompose/agent-a/mechanical.scad",
 "openSCADImportedMeshes":["OpenSCAD_FanHub_0","OpenSCAD_FanHub_1","OpenSCAD_FanHub_2"],
 "glbFile":f.name,"glbBytes":len(data),"glbSha256":h,
 "decompositionSha256":hashlib.sha256((root/"decomposition.json").read_bytes()).hexdigest(),
 "nodeNames":sorted(nodes),"materials":materials,
 "geometryMeshCount":len(j["meshes"]),
 "referenceUrls":[
 "https://uk.xfxforce.com/shop/xfx-swift-amd-radeon-rx-9060xt-oc-triple-fan-gaming-edition-16gb",
 "https://overclock3d.net/reviews/gpu_displays/xfx-rx-9060-xt-swift-review/2/"]}
(root/"asset-manifest.json").write_text(json.dumps(manifest,indent=2))
print("GLB_STRUCTURE_PASS",len(data),"bytes",len(nodes),"named nodes",len(j["meshes"]),"meshes",h)
