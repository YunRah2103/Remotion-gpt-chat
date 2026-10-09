"""Run under Blender on a local .blend; export world-space evaluated AABBs for selected objects."""
import json
import sys
from mathutils import Vector
from pathlib import Path
import bpy

def main(config_file,out):
    cfg=json.loads(Path(config_file).read_text())
    names=cfg.get("objects")
    if not isinstance(names,list) or not 2<=len(names)<=140 or len(names)!=len(set(names)):
        raise ValueError("Specify 2–140 distinct named moving/clearance objects")
    frames=cfg.get("frames")
    if not isinstance(frames,list) or not 1<=len(frames)<=240 or not all(type(n)==int for n in frames):
        raise ValueError("Specify 1–240 Blender frames")
    wanted={}
    for name in names:
        obj=bpy.data.objects.get(name)
        if obj is None or obj.type!="MESH":raise ValueError("Missing mesh "+name)
        wanted[name]=obj
    output=[]
    scene=bpy.context.scene
    old=scene.frame_current
    try:
        for frame in frames:
            scene.frame_set(frame)
            dg=bpy.context.evaluated_depsgraph_get()
            shapes={}
            for name,obj in wanted.items():
                evaluated=obj.evaluated_get(dg)
                coords=[evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box]
                lo=[min(p[i] for p in coords) for i in range(3)]
                hi=[max(p[i] for p in coords) for i in range(3)]
                # Thin planes need tiny nonzero thickness for valid finite AABBs.
                shapes[name]=[lo[i] for i in range(3)]+[max(hi[i],lo[i]+1e-7) for i in range(3)]
            output.append({"frame":frame,"parts":shapes})
    finally:
        scene.frame_set(old)
    report={"schemaVersion":1,"frames":output,
            "allowedContactPairs":cfg.get("allowedContactPairs",[]),
            "tolerance":cfg.get("tolerance",.001)}
    target=Path(out);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(report,indent=2)+"\n")
    print("BLENDER_AABB_FRAMES_PASS",len(output),len(names))

if __name__=="__main__":
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    if len(args)!=2:raise SystemExit("Expected clearance-config.json output.json")
    main(*args)
