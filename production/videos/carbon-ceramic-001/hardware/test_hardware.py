#!/usr/bin/env python3
"""Agent A source contract test and OPTIONAL real glTF2 binary inspection.

Source mode is never represented as native GLB proof.
Use --glb PATH after running actual Blender. No external pip dependencies.
"""
import argparse
import json
import math
import struct
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
REQUIRED={"RotorAssembly","FrictionRing","RotorHat","Hub","CaliperBody",
          "PadInner","PadOuter","UprightSupport"}

def check_source():
    contract=json.loads((HERE/"asset-contract.json").read_text())
    manifest=json.loads((HERE/"rig-manifest.json").read_text())
    assert contract["schemaVersion"]==1
    assert manifest["schemaVersion"]==1
    assert contract["id"]==manifest["asset"]=="carbon-ceramic-brake"
    assert set(manifest["nodes"])==REQUIRED
    assert [1,0,0]==manifest["coordinateSystem"]["rotorAxis"]
    assert contract["units"]=="metres"
    assert math.isclose(manifest["dimensions"]["rotorDiameter"],.39,abs_tol=1e-9)
    assert manifest["dimensions"]["ventCount"]>=36
    assert manifest["dimensions"]["drilledHolesPerFace"]>=48
    parts={part["name"]:part for part in contract["movingParts"]}
    assert set(parts)=={"RotorAssembly","PadInner","PadOuter"}
    assert parts["RotorAssembly"]["axis"]==[1,0,0]
    assert parts["PadInner"]["axis"]==[1,0,0]
    assert parts["PadOuter"]["axis"]==[-1,0,0]
    assert manifest["nodes"]["CaliperBody"]["motion"]=="stationary"
    assert manifest["nodes"]["UprightSupport"]["motion"]=="stationary"
    assert manifest["nodes"]["RotorHat"]["parent"]=="RotorAssembly"
    assert manifest["nodes"]["Hub"]["parent"]=="RotorAssembly"
    assert manifest["nodes"]["FrictionRing"]["parent"]=="RotorAssembly"
    x_negative=-.0155
    x_positive=.0155
    pad_gap=manifest["nodes"]["PadInner"]["restGapMetres"]
    assert math.isclose(pad_gap,.0025,abs_tol=1e-9)
    assert math.isclose(-.018+pad_gap,x_negative,abs_tol=1e-8)
    assert math.isclose(.018-pad_gap,x_positive,abs_tol=1e-8)
    print("SOURCE_CONTRACT_PASS axis=X, diameter=.390m, rest gap=.0025m, 8 names")
    return manifest

def inspect_glb(path):
    raw=Path(path).read_bytes()
    if len(raw)<10240 or raw[:4]!=b"glTF":
        raise ValueError("Not a substantial glTF2 binary")
    version,total=struct.unpack_from("<II",raw,4)
    if version!=2 or total!=len(raw):
        raise ValueError("glTF header version/byte-count mismatch")
    jsonLength,chunkType=struct.unpack_from("<I4s",raw,12)
    if chunkType!=b"JSON":
        raise ValueError("Missing GLB JSON chunk")
    gltf=json.loads(raw[20:20+jsonLength].decode("utf-8"))
    assert gltf["asset"]["version"]=="2.0"
    nodes=gltf.get("nodes",[])
    names=[n.get("name") for n in nodes]
    missing=REQUIRED.difference(names)
    assert not missing,f"Missing native GLB pivots: {missing}"
    positions={name:i for i,name in enumerate(names) if name}
    children={i for i in nodes[positions["RotorAssembly"]].get("children",[])}
    for n in ("FrictionRing","RotorHat","Hub"):
        assert positions[n] in children,f"{n} not a rotor child"
    assert positions["CaliperBody"] not in children,"Caliper mistakenly spins with rotor"
    assert positions["PadInner"] not in children,"PadInner mistakenly spins with rotor"
    assert positions["PadOuter"] not in children,"PadOuter mistakenly spins with rotor"
    meshes=gltf.get("meshes",[])
    assert len(meshes)>=65,f"Expected real detailed geometry, only {len(meshes)} meshes"
    for token in ["CoolingVane","Piston","CarbonCeramicFace"]:
        assert any(token in (name or "") for name in names),f"Missing {token} geometry"
    materials=gltf.get("materials",[])
    assert len(materials)>=9, f"Expected nine separated PBR materials, found {len(materials)}"
    assert len(meshes)>=130, f"Polish02 requires additional real hardware geometry: {len(meshes)}"
    # A forged cheek should be a dense closed sculpt, not the earlier
    # flat sector / cuboid stand-in (usually under 120 vertices).
    accessors=gltf.get("accessors",[])
    cheeks={}
    for cheek in ("ForgedCaliperCheek_Inboard","ForgedCaliperCheek_Outboard"):
        ni=positions.get(cheek)
        assert ni is not None, f"Missing sculpted cheek: {cheek}"
        mi=nodes[ni].get("mesh")
        assert mi is not None, f"No mesh for {cheek}"
        counts=[accessors[p["attributes"]["POSITION"]]["count"]
                for p in meshes[mi].get("primitives",[])
                if "POSITION" in p.get("attributes",{})]
        assert counts and sum(counts)>=400, f"Non-sculpted cheek {cheek}: {counts}"
        cheeks[cheek]=sum(counts)
    for name in ("InnerAntiSquealShim","OuterAntiSquealShim",
                 "OuterAxialCaliperBridge","BridgeSatinCrown"):
        assert name in positions, f"Missing pad/bridge detail: {name}"
    print(f"NATIVE_GLB_STRUCTURE_PASS meshes={len(meshes)} nodes={len(nodes)} "
          f"materials={len(materials)} cheeks={cheeks} bytes={len(raw)}")
    return {"native":True,"nodes":len(nodes),"meshes":len(meshes),
            "materials":len(materials),"sculptedCheeks":cheeks,
            "bytes":len(raw)}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--glb",type=Path,help="True Blender-generated GLB to inspect")
    ap.add_argument("--report",type=Path,help="Optional native Blender rig report")
    ap.add_argument("--proof-dir",type=Path,
                    help="Require genuine generated 900x900 Blender PNG views")
    args=ap.parse_args()
    check_source()
    if args.glb:
        result=inspect_glb(args.glb)
        if args.report:
            report=json.loads(args.report.read_text())
            assert report.get("hashes",{}).get("glbSha256")
        if args.proof_dir:
            images=("rotor-front.png","ventilation.png",
                    "exploded.png","pad-contact.png")
            for name in images:
                p=args.proof_dir/name
                blob=p.read_bytes()
                assert len(blob)>4000 and blob[:8]==b"\\x89PNG\\r\\n\\x1a\\n", (
                    f"Native PNG missing or invalid: {p}")
                width,height=struct.unpack_from(">II",blob,16)
                assert width>=900 and height>=900,(name,width,height)
            build=json.loads((args.proof_dir/"build-report.json").read_text())
            assert build["status"]=="REAL_BLENDER_BUILD_PASS"
            assert build["renderDenoisingDisabled"] is True
            result["blenderProofImages"]=list(images)
            print("BLENDER_CLOSEUP_PNG_PASS",",".join(images))
        print("HARDWARE_NATIVE_PASS",json.dumps(result))
    else:
        print("HARDWARE_SOURCE_ONLY_PASS native Blender/GLB proof NOT EXECUTED")

if __name__=="__main__":
    main()
