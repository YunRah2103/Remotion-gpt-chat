#!/usr/bin/env python3
"""Prepare third-party CC0 human shape for the IceCube reference-faithful recreation.

RUN: blender -b --python scripts/prepare_icecube_human.py -- <in.glb> <out.glb>
Source: Innerscene human-base-rigged.glb (MakeHuman/MPFB CC0),
fallback: UMRAM-Bilkent human_posed.glb (Quaternius CC0).
Geometry, materials and world transforms normalized in Blender.
"""
import bpy, sys
from mathutils import Vector
from pathlib import Path

argv=sys.argv[sys.argv.index('--')+1:]
source,output=argv[:2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(Path(source).resolve()))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes:
    raise RuntimeError('Import had no meshes')

# Put the actual human rig into the relaxed reference-video pose,
# instead of exporting the manufacturer's spread-arm A-pose.
# Rotation occurs on the upper-arm bones; the forearms/hands follow naturally.
for rig in (o for o in bpy.context.scene.objects if o.type=='ARMATURE'):
    names=[pb.name for pb in rig.pose.bones]
    print('HUMAN RIG BONES',names)
    lowered=0
    for pb in rig.pose.bones:
        n=pb.name.lower().replace('-', '').replace('_', '').replace(' ', '')
        if 'upperarm' not in n:
            continue
        rest=(pb.bone.tail_local-pb.bone.head_local).normalized()
        sign=1 if pb.bone.head_local.x >= 0 else -1
        direction=Vector((0.12*sign, 0, -0.993)).normalized()
        delta=rest.rotation_difference(direction)
        basis=pb.bone.matrix_local.to_quaternion()
        pb.rotation_mode='QUATERNION'
        pb.rotation_quaternion=basis.inverted() @ delta @ basis
        lowered+=1
        print('LOWERED ARM', pb.name, 'from',tuple(round(v,3) for v in rest),'to',tuple(round(v,3) for v in direction))
    print('RELAXED A-POSE ARMS MODIFIED',lowered)
    bpy.context.view_layer.update()

# High-quality shade; smooth anatomical shape while preserving facial topology.
for o in meshes:
    for poly in o.data.polygons:
        poly.use_smooth=True
    if len(o.data.polygons)<26000:
        mod=o.modifiers.new("Silhouette refinement",type='SUBSURF')
        mod.levels=1
        mod.render_levels=1

# Bake the adjusted pose and all skin/subdivision deformers into an
# independent static mesh. A non-animated glTF exports bind poses otherwise,
# causing the arms to pop back to A-pose in the Remotion render.
bpy.context.view_layer.update()
depsgraph=bpy.context.evaluated_depsgraph_get()
baked=[]
for old in meshes:
    ev=old.evaluated_get(depsgraph)
    baked_mesh=bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=depsgraph)
    baked_obj=bpy.data.objects.new(old.name+'_POSE_BAKED',baked_mesh)
    bpy.context.scene.collection.objects.link(baked_obj)
    baked_obj.matrix_world=old.matrix_world.copy()
    for polygon in baked_obj.data.polygons:
        polygon.use_smooth=True
    baked.append(baked_obj)
    print('POSE BAKED',old.name,len(baked_obj.data.vertices),'vertices')
for old in list(bpy.context.scene.objects):
    if old not in baked:
        bpy.data.objects.remove(old,do_unlink=True)
meshes=baked
bpy.context.view_layer.update()

def bounds():
    points=[]
    for obj in meshes:
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))
    return Vector((min(p.x for p in points),min(p.y for p in points),min(p.z for p in points))),Vector((max(p.x for p in points),max(p.y for p in points),max(p.z for p in points)))

bpy.context.view_layer.update()
lo,hi=bounds()
extent=hi-lo
long_axis=max(range(3),key=lambda i:extent[i])
if long_axis==2:
    up=2
elif long_axis==1:
    # GLB importer normally makes Y-up source into Blender Z-up, but detect fallback.
    up=1
else:
    raise RuntimeError(f'Unexpected human long axis in Blender: {tuple(extent)}')

height=extent[up]
if height<=0:
    raise RuntimeError('Human height cannot be zero')
factor=1.75/height

# Reparent imported root objects to an identity wrapper: keep rigs intact.
imported=list(bpy.context.scene.objects)
roots=[o for o in imported if o.parent is None]
root=bpy.data.objects.new('ICECUBE_MASTER_ROOT',None)
bpy.context.scene.collection.objects.link(root)
for obj in roots:
    tm=obj.matrix_world.copy()
    obj.parent=root
    obj.matrix_world=tm
root.scale=(factor,)*3
bpy.context.view_layer.update()
lo,hi=bounds()
centre=(lo+hi)*.5
# The human is centred in world space, including height, so orbit requires no offsets.
root.location=-centre
bpy.context.view_layer.update()
lo,hi=bounds()
print("ICECUBE HUMAN CHECK",len(meshes),"meshes; bounds",tuple(round(x,3) for x in (hi-lo)))
for o in meshes:
    o.select_set(True)
# glTF conversion exports imported hierarchy, now normalized in real-world metres.
Path(output).parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(Path(output).resolve()), export_format='GLB',use_selection=False,export_apply=False,export_yup=True,export_materials='NONE',export_animations=False)
print('EXPORTED',output,Path(output).stat().st_size)
