#!/usr/bin/env python3
"""POLISH04 structural, material, dimensional, native-proof and GLB pose QA.

Native visual judgement remains a separate manual requirement. Image tests here
only reject blank/flat/overexposed previews and cannot certify aesthetics.
"""
import hashlib
import json
import os
import pathlib
import struct
import sys

ROOT=pathlib.Path(__file__).resolve().parent/"assets"
PATH=ROOT/"xfx_swift_rx9060xt_polish4.glb"
data=PATH.read_bytes()
assert data[:4]==b"glTF" and struct.unpack_from("<I",data,8)[0]==len(data)
n,kind=struct.unpack_from("<II",data,12)
assert kind==0x4e4f534a,"Missing glTF JSON chunk"
scene=json.loads(data[20:20+n])
nodes={obj.get("name") for obj in scene["nodes"]}
required={
 "GPU_ROOT","FAN_ASSEMBLY","FAN_LEFT","FAN_CENTER","FAN_RIGHT",
 "FRONT_SHROUD","HEATSINK","HEATSINK_FINS","HEATPIPE_BUNDLE",
 "COLD_PLATE","PCB_ASSEMBLY","PCB","GPU_DIE","VRAM_CHIPS",
 "VRM_COMPONENTS","PCIE_FINGERS","POWER_8PIN","IO_BRACKET","BACKPLATE"}
assert required.issubset(nodes),(required-nodes)
for anchor in required:
    assert sum(obj.get("name")==anchor for obj in scene["nodes"])==1,("Duplicate anchor",anchor)
assert sum(s.startswith("BroadRotorBlade_") for s in nodes)==27
assert sum(s.startswith(("P3_L_fin_","P3_C_fin_","P3_R_fin_")) for s in nodes)==81
assert sum(s.startswith("P3_Heatpipe_") for s in nodes)==6
assert sum(s.startswith("P4_Hub_outer_tooling_ring_") for s in nodes)==3
assert sum(s.startswith("P4_VRAM_package_etch_") for s in nodes)==4
assert sum(s.startswith("OpenSCAD_FanHub_") for s in nodes)==3
assert "Backplate_machined_one_piece" in nodes
assert not any(s.startswith("Recessed_black_cooler_well_") for s in nodes)
assert len(scene.get("meshes",[]))>=779
materials={m["name"]:m for m in scene["materials"]}
for name in [
    "M_FAN_BLADE","M_MONOLITHIC_XFX_FASCIA","M_PCB_DARK_GREEN",
    "M_P3_FIN_FOLDED_ALUMINIUM","M_NICKEL_COPPER",
    "M_P4_HUB_MACHINED_GUNMETAL","M_P4_FIN_INTERIOR_SHADOW",
    "M_P4_PACKAGE_LASER_INK","M_P4_NICKEL_CONTACT",
]:
    assert name in materials,name
def pbr(name):
    return materials[name]["pbrMetallicRoughness"]
assert pbr("M_FAN_BLADE")["roughnessFactor"]<.50
assert pbr("M_MONOLITHIC_XFX_FASCIA")["metallicFactor"]<.20
assert pbr("M_PCB_DARK_GREEN")["roughnessFactor"]>=.65
assert pbr("M_P3_FIN_FOLDED_ALUMINIUM")["metallicFactor"]>=.80
assert pbr("M_NICKEL_COPPER")["metallicFactor"]>=.85
assert pbr("M_P4_HUB_MACHINED_GUNMETAL")["metallicFactor"]>=.65

# Required canonical GLB axes and hierarchy are stable, no new animation
# primitives or invented motion anchors.
motion=json.loads((ROOT/"PROOF_ONLY_POLISH03_MOTION.json").read_text())
assert motion["durationInFrames"]==450 and motion["fps"]==30
assert set(motion["nodes"]) == {
  "FAN_LEFT","FAN_CENTER","FAN_RIGHT","FRONT_SHROUD","HEATSINK",
  "GPU_DIE","VRAM_CHIPS","PCB_ASSEMBLY","BACKPLATE"}
assert motion["positionsAreRelativeDeltas"] is True

try:
    import trimesh
    import numpy as np
except ImportError as exc:
    raise RuntimeError("Install numpy and trimesh for real GLB bounds") from exc
geometry=trimesh.load(str(PATH),force="scene")
bounds=np.array(geometry.bounds)
dimensions=bounds[1]-bounds[0]
expected=np.array([2.90,1.24,.49])
# Axis order GLB: X card length, Y card height, Z card depth.
assert np.all(abs(dimensions-expected)/expected<.030),(dimensions,expected)
assert len(geometry.graph.nodes_geometry)>=779,len(geometry.graph.nodes_geometry)

from PIL import Image, ImageStat
prooftypes={
 "assembled.png":(960,640),"fans_shroud_detail.png":(960,640),
 "heatsink_heatpipe_detail.png":(960,640),
 "heatpipe_bundle_detail.png":(960,640),
 "pcb_silicon_detail.png":(960,640),
 "rear_backplate_polish3.png":(960,640),
 "backplate_detail.png":(960,640),
 "exploded.png":(960,640),
 "exploded_film_camera.png":(720,1280)}
proofstats={}
for filename,size in prooftypes.items():
    p=ROOT/filename
    assert p.stat().st_size>12000,(filename,p.stat().st_size)
    with Image.open(p) as im:
        assert im.size==size,(filename,im.size,size)
        grey=im.convert("L")
        stat=ImageStat.Stat(grey)
        lo,hi=grey.getextrema()
        assert stat.stddev[0]>6 and hi-lo>70,(filename,stat.stddev,lo,hi)
        proofstats[filename]={"bytes":p.stat().st_size,
          "luminanceMean":round(stat.mean[0],2),
          "luminanceStdDev":round(stat.stddev[0],2),
          "minMax":[lo,hi]}
# Important: the cutaways are proof-only hidden geometry. GLB is never
# altered for shots; required anchor/mesh assertions are made on GLB above.

digest=hashlib.sha256(data).hexdigest()
asset={
    "sourceCommit":os.environ.get("GITHUB_SHA","local-unversioned"),
    "format":"GLB glTF 2.0",
    "product":"XFX SWIFT RX 9060 XT OC 16GB Triple Fan",
    "manufacturerSKU":"RX-96TS316B7",
    "model":"xfx_swift_rx9060xt_polish4.glb",
    "glbSha256":digest,
    "glbBytes":len(data),
    "proofOnlyPolish03MotionSha256":hashlib.sha256((ROOT/"PROOF_ONLY_POLISH03_MOTION.json").read_bytes()).hexdigest(),
    "canonicalAnchors":sorted(required),
    "meshCount":len(scene["meshes"]),
    "graphGeometryInstances":len(geometry.graph.nodes_geometry),
    "materialCount":len(materials),
    "worldBounds":bounds.tolist(),
    "measuredDimensionsSceneUnits":dimensions.tolist(),
    "referenceDimensionsMillimeters":[290,124,49],
    "renderer":"native Blender Cycles stills; not the final Remotion MP4",
    "limitations":"Internal VRAM, die, VRM, heatpipes and PCB trace layouts are approximate",
    "proofImageStats":proofstats,
}
(ROOT/"asset-manifest.json").write_text(json.dumps(asset,indent=2))
(ROOT/"SHA256SUMS.txt").write_text(
    "\n".join(hashlib.sha256(p.read_bytes()).hexdigest()+"  "+p.name
      for p in sorted(ROOT.glob("*.glb"))+sorted(ROOT.glob("*.json"))) +"\n")
print("POLISH4_GLTF_PASS",len(scene["meshes"]),"meshes",len(materials),
      "materials",len(required),"preserved anchors")
print("POLISH4_BOUNDING_PASS",dimensions.tolist())
print("POLISH4_NATIVE_PROOF_IMAGE_SANITY_PASS",len(proofstats),"PNGs")
print("POLISH4_GLB_SHA256",digest)
