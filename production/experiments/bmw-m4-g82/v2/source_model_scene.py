"""BMW M4 G82 V2 orbit: real CC BY 4.0 SRT Performance BMW M4 model.
Original: https://sketchfab.com/3d-models/bmw-m4-competition-m-package-5c0a2dafb1ad408d9fc9eeef9aee531b
"""
import bpy, math, os
from mathutils import Vector, Matrix
OUT=os.environ.get("M4_OUTPUT", os.path.abspath("out/m4-v2"))
INPUT=os.environ.get("M4_MODEL",os.path.join(OUT,"car.glb"))
MODE=os.environ.get("M4_MODE","preview")
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=INPUT)
raw=list(bpy.context.scene.objects)
meshes=[o for o in raw if o.type=="MESH"]
if len(meshes)<10:
    raise RuntimeError("Only %d imported meshes"%len(meshes))
print("CAR_ASSET_MESHES",len(meshes))
root=bpy.data.objects.new("Detailed BMW M4 G82 [CC BY source]",None)
bpy.context.collection.objects.link(root)
for ob in raw:
    if ob.parent is None:
        ob.parent=root
        ob.matrix_parent_inverse=Matrix.Identity(4)
def bounds_world():
    bpy.context.view_layer.update()
    v=[o.matrix_world @ Vector(p) for o in meshes for p in o.bound_box]
    lo=[min(p[i] for p in v) for i in range(3)]
    hi=[max(p[i] for p in v) for i in range(3)]
    return lo,hi
lo,hi=bounds_world()
span=[hi[i]-lo[i] for i in range(3)]
print("RAW_BOUNDS",lo,hi,span)
if span[1]>span[0] and span[1]>span[2]:
    root.rotation_euler[2]=math.pi/2
elif span[2]>span[0] and span[2]>span[1]:
    root.rotation_euler[1]=math.pi/2
lo,hi=bounds_world()
span=[hi[i]-lo[i] for i in range(3)]
s=4.795/max(span[0],span[1])
root.scale=(s,s,s)
lo,hi=bounds_world()
centre=[(lo[i]+hi[i])/2 for i in range(3)]
root.location=(-centre[0],-centre[1],.055-lo[2])
lo,hi=bounds_world()
span=[hi[i]-lo[i] for i in range(3)]
print("NORMALIZED_BOUNDS",lo,hi,span)
if max(span[0],span[1])<4.7 or not .95<span[2]<2.8:
    raise RuntimeError("Implausible GLB dimensions: "+str(span))
def material(name,rgb,rough=.45,metal=0):
    ma=bpy.data.materials.new(name)
    ma.diffuse_color=(*rgb,1)
    ma.use_nodes=True
    bs=ma.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*rgb,1)
    bs.inputs["Roughness"].default_value=rough
    bs.inputs["Metallic"].default_value=metal
    return ma
# Preserve actual GLB painter/textures, no fake geometry or universal recolouring.
for ma in bpy.data.materials:
    if ma.use_nodes:
        bs=ma.node_tree.nodes.get("Principled BSDF")
        if bs:
            rough=bs.inputs["Roughness"].default_value
            if rough<.016:
                bs.inputs["Roughness"].default_value=.08
floor_mat=material("Charcoal seamless cyclorama",(.049,.051,.055),.36,.06)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0))
floor=bpy.context.object
floor.name="Infinity floor - real contact shadow"
floor.data.materials.append(floor_mat)
def area(name,xyz,power,rgb,sizex,sizey):
    ld=bpy.data.lights.new(name,"AREA")
    ld.energy=power
    ld.color=rgb
    ld.shape="RECTANGLE"
    ld.size=sizex
    ld.size_y=sizey
    ob=bpy.data.objects.new(name,ld)
    bpy.context.collection.objects.link(ob)
    ob.location=xyz
    ob.rotation_euler=(Vector((0,0,.72))-ob.location).to_track_quat('-Z','Y').to_euler()
area("Overhead automotive softbox",(-1.1,-2.3,6.3),2000,(.89,.94,1),6.8,3.2)
area("Blue white edge", (3.2,3.7,4.5),1600,(.82,.91,1),4,4.6)
area("Warm rear edge",(-3.8,1.1,4.5),1100,(1,.94,.89),3.8,4.4)
area("Low side strip",(2,-4,2.5),1200,(.8,.92,1),2,4)
w=bpy.data.worlds.new("Subtle studio ambience")
w.use_nodes=True
w.node_tree.nodes["Background"].inputs["Color"].default_value=(.072,.081,.094,1)
w.node_tree.nodes["Background"].inputs["Strength"].default_value=.6
sc=bpy.context.scene
sc.world=w
bpy.ops.object.camera_add()
cam=bpy.context.object
cam.name="Camera goes around BMW (stationary car)"
cam.data.type="ORTHO"
cam.data.ortho_scale=6.5
sc.camera=cam
sc.frame_start=1
sc.frame_end=144
sc.render.fps=24
sc.render.resolution_x=720 if MODE=="final" else 480
sc.render.resolution_y=1280 if MODE=="final" else 854
sc.render.resolution_percentage=100
sc.render.image_settings.file_format="PNG"
sc.render.engine="CYCLES"
sc.cycles.samples=8 if MODE=="final" else 5
sc.cycles.use_denoising=False
sc.view_settings.view_transform="Filmic"
sc.view_settings.look="Medium High Contrast"
for frame in range(1,145):
    a=math.radians(30)+2*math.pi*(frame-1)/144
    cam.location=(9.8*math.cos(a),9.8*math.sin(a),3.7)
    cam.rotation_euler=(Vector((0,0,.94))-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.keyframe_insert(data_path="location",frame=frame)
    cam.keyframe_insert(data_path="rotation_euler",frame=frame)
if cam.animation_data and cam.animation_data.action:
    for fcurve in cam.animation_data.action.fcurves:
        for key in fcurve.keyframe_points:
            key.interpolation="LINEAR"
bpy.ops.file.pack_all()
sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,"BMW_M4_G82_V2.blend"))
print("SAVED_EDITABLE_SCENE",len(bpy.data.objects))
if MODE=="preview":
    for frame in (1,37,73,109):
        sc.frame_set(frame)
        sc.render.filepath=os.path.join(OUT,"proof","angle_%03d.png"%frame)
        os.makedirs(os.path.dirname(sc.render.filepath),exist_ok=True)
        bpy.ops.render.render(write_still=True)
        print("PROOF_FRAME",frame)
elif MODE=="final":
    os.makedirs(os.path.join(OUT,"frames"),exist_ok=True)
    sc.render.filepath=os.path.join(OUT,"frames","f_")
    bpy.ops.render.render(animation=True)
    print("FULL_ANIMATION_COMPLETE")
else:
    raise RuntimeError("M4_MODE must be preview or final")
