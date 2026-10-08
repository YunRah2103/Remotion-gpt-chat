"""Small original CPU-rendered Blender geometry + studio light proof."""
import os
import math
import bpy
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
os.makedirs("toolkit/out", exist_ok=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 8
bpy.context.view_layer.cycles.use_denoising = False  # Ubuntu Blender lacks OpenImageDenoiser
scene.render.resolution_x = 192
scene.render.resolution_y = 192
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = os.path.abspath("toolkit/out/blender-wheel.png")
scene.world = bpy.data.worlds.new("Studio World")
scene.world.color = (0.05, 0.05, 0.05)

mat = bpy.data.materials.new("Emerald metallic")
mat.diffuse_color = (0.02, 0.32, 0.18, 1)
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0.015, 0.34, 0.17, 1)
bsdf.inputs["Metallic"].default_value = 0.6
bsdf.inputs["Roughness"].default_value = 0.3

bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=12, location=(0, 0, 0.9), major_radius=0.75, minor_radius=0.22)
bpy.context.object.data.materials.append(mat)
bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.37, depth=0.24, location=(0, 0, 0.9))
bpy.context.object.data.materials.append(mat)

bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, -0.25))
floor = bpy.context.object
floor.name = "Studio floor"
floor.scale=(3, 3, 0.2)

bpy.ops.object.light_add(type="AREA", location=(1, -3, 5))
bpy.context.object.data.energy = 600
bpy.context.object.data.shape = "DISK"
bpy.context.object.data.size = 5

bpy.ops.object.camera_add(location=(2.5, -4, 2.4))
cam = bpy.context.object
direction = Vector((0, 0, 0.8)) - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
scene.camera = cam
bpy.ops.render.render(write_still=True)
assert os.path.getsize(scene.render.filepath) > 2000, "Blender did not render a real PNG"
print("BLENDER_SMOKE_PASS", scene.render.filepath)
