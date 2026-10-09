"""Creates an ORIGINAL toy rotor and caliper Blender scene for CI, not real manufacturer geometry."""
from pathlib import Path
import bpy
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.70,depth=.11,location=(0,0,0))
rotor=bpy.context.object;rotor.name="Rotor"
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.708,depth=.112,location=(0,0,0))
high=bpy.context.object;high.name="RotorHigh"
bpy.ops.mesh.primitive_cube_add(size=1,location=(.88,.15,0))
caliper=bpy.context.object;caliper.name="Caliper"
caliper.scale=(.18,.27,.22)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
rotor.rotation_euler.z=0
rotor.keyframe_insert("rotation_euler",frame=1)
rotor.rotation_euler.z=6.283185
rotor.keyframe_insert("rotation_euler",frame=120)
scene=bpy.context.scene
scene.frame_start=1;scene.frame_end=120
scene.frame_set(1)
target=Path("out/advanced-ci")
target.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str((target/"original-demo.blend").resolve()))
print("NATIVE_BLENDER_TEST_SCENE_PASS")
