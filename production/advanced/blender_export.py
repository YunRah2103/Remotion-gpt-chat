"""Blender 3.x/4.x -b source.blend --python blender_export.py -- contract.json output_dir.

Exports true original Blender project to GLB with object hierarchy, custom extras,
animation actions, and a machine readable pivot manifest. Does not access other repos.
"""
import hashlib
import json
import sys
from pathlib import Path
import bpy

def main(contract,output):
    config=json.loads(Path(contract).read_text())
    out=Path(output);out.mkdir(parents=True,exist_ok=True)
    # Caller validates contract using asset_contract.py (also validate here).
    if config.get("schemaVersion")!=1:raise ValueError("Unrecognised contract")
    expected=config.get("movingParts",[])
    found={o.name:o for o in bpy.data.objects}
    absent=[p["name"] for p in expected if p["name"] not in found]
    if absent:raise ValueError("Missing named objects: "+",".join(absent))
    if not any(o.type=="MESH" for o in bpy.context.scene.objects):raise ValueError("Scene contains no meshes")
    # Keep transforms and origins: do not apply object transforms before exporting.
    pivots=[]
    for part in expected:
        obj=found[part["name"]]
        axis=part["axis"]
        obj["ae_role"]="mechanical-moving-part"
        obj["ae_mode"]=part["mode"]
        obj["ae_axis"]=axis
        obj["ae_frame_start"]=part["frameStart"]
        obj["ae_frame_end"]=part["frameEnd"]
        pivots.append({"name":obj.name,"mode":part["mode"],"axis":axis,
                       "origin":list(obj.location),"frameStart":part["frameStart"],
                       "frameEnd":part["frameEnd"],"start":part["start"],"end":part["end"]})
    output_file=out/(config["id"]+".glb")
    bpy.ops.export_scene.gltf(filepath=str(output_file.resolve()),export_format="GLB",
        export_extras=True,export_animations=True,export_yup=True,
        export_texcoords=True,export_normals=True)
    if not output_file.exists() or output_file.stat().st_size<200:
        raise RuntimeError("No valid GLB emitted")
    report={"schemaVersion":1,"asset":config["id"],"units":config["units"],
            "source":config["source"],"blenderVersion":bpy.app.version_string,
            "glb":output_file.name,"sha256":hashlib.sha256(output_file.read_bytes()).hexdigest(),
            "bytes":output_file.stat().st_size,
            "movingParts":pivots,
            "note":"Object origins preserved; actual glTF Y-up conversion applied. GLB is not yet visual/engineering-approved."}
    (out/"rig-manifest.json").write_text(json.dumps(report,indent=2)+"\n")
    print("BLENDER_GLB_EXPORT_PASS",output_file, len(pivots))

if __name__=="__main__":
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    if len(argv)!=2:raise SystemExit("Expected contract.json output_dir")
    main(*argv)
