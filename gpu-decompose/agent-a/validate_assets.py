#!/usr/bin/env python3
"""Validate GLB binary structurally, required exported glTF anchor names and reference envelope."""
import pathlib,struct,json,hashlib,os
root=pathlib.Path(__file__).resolve().parent.parent/"polish3"/"assets"
f=root/"xfx_swift_rx9060xt_polish3.glb";data=f.read_bytes()
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
assert "M_BACKPLATE_THERMAL_PAD" in materials
assert "Backplate_machined_one_piece" in nodes
assert "Rear_vent_rib" not in nodes
assert sum(n.startswith("VRM_inductor_L") for n in nodes)==8
assert "M_P3_STATOR_CAST_GRAPHITE" in materials
assert sum(1 for n in nodes if n.startswith("OpenSCAD_FanHub_"))==3
assert sum(1 for n in nodes if n.startswith("BroadRotorBlade_"))==27
assert "M_MONOLITHIC_XFX_FASCIA" in materials
# Polish 03 structural assertions: recognizable hardware, not object spam.
assert len([n for n in nodes if n.startswith("P3_L_fin_")])==27
assert len([n for n in nodes if n.startswith("P3_C_fin_")])==27
assert len([n for n in nodes if n.startswith("P3_R_fin_")])==27
assert sum(n.startswith("P3_Heatpipe_") for n in nodes)==6
assert sum(n.startswith("P3_Regulator_inductor_") for n in nodes)==5
assert sum(n.startswith("P3_VRM_bulk_cap_body_") for n in nodes)==8
assert sum(n.startswith("P3_Stator_open_well_ring_") for n in nodes)==3
assert not any(n.startswith("Recessed_black_cooler_well_") for n in nodes)
assert "M_P3_FIN_FOLDED_ALUMINIUM" in materials
assert "M_P3_COPPER_WINDING" in materials
assert "P3_GPU_BGA_footprint" in nodes

motion=json.loads((root/"decomposition.json").read_text())
assert motion["durationInFrames"]==450 and motion["fps"]==30
assert set(motion["nodes"])<=nodes
# GLB created at rest: animated JSON deltas are ONLY applied by Agent B.
h=hashlib.sha256(data).hexdigest()
manifest={"model":"XFX Swift AMD Radeon RX 9060 XT OC Triple Fan 16GB",
 "sku":"RX-96TS316B7","accurateExternalBoundsMM":[290,124,49],
 "sceneUnitsPerMillimetre":.01,
 "polish3ManagerContractSha":"8d4748af2d239177a9a6f44f07e9472b95f33d9f",
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
