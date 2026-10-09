"""Blender CPU-rendered six-angle GLB turntable proofs."""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

def main(path, output):
    out=Path(output);out.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(Path(path).resolve()))
    meshes=[o for o in bpy.context.scene.objects if o.type=="MESH"]
    if not meshes: raise RuntimeError("GLB contains no mesh geometry")
    bpy.context.view_layer.update()
    coords=[o.matrix_world @ Vector(corner) for o in meshes for corner in o.bound_box]
    lo=Vector([min(v[i] for v in coords) for i in range(3)])
    hi=Vector([max(v[i] for v in coords) for i in range(3)])
    centre=(lo+hi)*.5
    radius=max(.05,(hi-lo).length*.65)
    scene=bpy.context.scene
    scene.render.engine="CYCLES"
    scene.cycles.samples=12
    scene.render.resolution_x=640
    scene.render.resolution_y=640
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"
    if scene.world is None: scene.world=bpy.data.worlds.new("Studio World")
    scene.world.use_nodes=True
    bg=scene.world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value=(.07,.1,.14,1)
    bg.inputs["Strength"].default_value=.7
    bpy.ops.object.camera_add()
    camera=bpy.context.object
    scene.camera=camera
    camera.data.type="ORTHO"
    camera.data.ortho_scale=radius*3.0
    for position,strength in (((1,-2,3),900),((-2,1,2),400)):
        bpy.ops.object.light_add(type="AREA",location=tuple(centre[i]+radius*position[i] for i in range(3)))
        light=bpy.context.object
        light.data.energy=strength
        light.data.shape="DISK"
        light.data.size=radius*4
    for i in range(6):
        angle=math.tau*i/6
        camera.location=centre+Vector((math.cos(angle)*radius*2.6,math.sin(angle)*radius*2.6,radius*.95))
        camera.rotation_euler=(centre-camera.location).to_track_quat("-Z","Y").to_euler()
        scene.render.filepath=str(out/f"view-{i:02d}.png")
        bpy.ops.render.render(write_still=True)
    print("NATIVE_MODEL_PROOF_PASS",len(meshes))

if __name__=="__main__":
    params=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    if len(params)!=2:raise SystemExit("Expected input.glb output-dir")
    main(*params)
