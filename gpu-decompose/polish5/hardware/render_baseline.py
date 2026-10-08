#!/usr/bin/env python3
"""Matched camera/lighting POLISH04 comparison, using POLISH05 proof-studio .blend.
Does NOT export or overwrite the source GLB; render-only, identical studio and angles.
"""
import bpy,sys,pathlib
from mathutils import Vector
here=pathlib.Path(__file__).resolve().parent
assets=here/"assets"
base=assets/"polish4_locked.glb"
assert base.is_file()
bpy.ops.wm.open_mainfile(filepath=str(assets/"xfx_swift_rx9060xt_polish5.blend"))
keep=("P5_Camera","P5_Key","P5_Fill","P5_Rim")
for obj in list(bpy.data.objects):
    if obj.name not in keep:
        bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(base))
camera=bpy.data.objects["P5_Camera"]
sc=bpy.context.scene;sc.camera=camera
sc.render.engine="CYCLES";sc.cycles.samples=14
sc.render.resolution_percentage=100
sc.render.resolution_x=960;sc.render.resolution_y=640
sc.render.image_settings.file_format="PNG"
def aim(o,target):
    o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
for name,eye,target,scale in (
    ("P4_matched_assembled.png",(3.2,-5.0,2.1),(0,0,0),3.65),
    ("P4_matched_fans.png",(.95,-3.0,.70),(.89,-.20,.04),1.38),
    ("P4_matched_backplate.png",(.3,2.2,1.1),(.10,.23,0),2.2)):
    camera.location=eye;aim(camera,target);camera.data.ortho_scale=scale
    sc.render.filepath=str(assets/name)
    bpy.ops.render.render(write_still=True)
    assert (assets/name).stat().st_size>7000
print("POLISH04_MATCHED_BASELINE_PROOF_PASS")
