"""Real Blender solid-to-Cycles forest-road driving film, no substitute car meshes."""
import argparse
import math
import os
import random
import sys
from pathlib import Path

import bpy
import numpy as np  # Fail early if the Blender GLB import dependency is missing.
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--model', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--frames', default='0,180,213,214,270,319,369,418')
ap.add_argument('--scale', type=float, default=1)
ap.add_argument('--samples', type=int, default=32)
ap.add_argument('--save', action='store_true')
opt = ap.parse_args(args)
out = Path(opt.out)
out.mkdir(parents=True, exist_ok=True)
rng = random.Random(731031)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
s = bpy.context.scene
s.render.resolution_x = 1080
s.render.resolution_y = 1920
s.render.resolution_percentage = int(opt.scale * 100)
s.render.fps = 30
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGB'
s.render.film_transparent = False
s.render.engine = 'CYCLES'
s.cycles.samples = opt.samples
s.cycles.use_denoising = True
s.cycles.adaptive_threshold = 0.04
s.cycles.adaptive_min_samples = 8
s.cycles.max_bounces = 6
s.cycles.diffuse_bounces = 2
s.cycles.glossy_bounces = 3
s.cycles.transmission_bounces = 4
s.cycles.transparent_max_bounces = 4
s.cycles.sample_clamp_indirect = 3
s.render.threads_mode = 'FIXED'
s.render.threads = 4
s.view_settings.view_transform = 'AgX'
s.view_settings.look = 'AgX - Medium High Contrast'
s.view_settings.exposure = 0.1
s.world.use_nodes = True
w = s.world.node_tree
w.nodes.clear()
bg = w.nodes.new('ShaderNodeBackground')
bg.inputs['Strength'].default_value = 0.22
sky = w.nodes.new('ShaderNodeTexSky')
sky.sky_type = 'NISHITA'
sky.sun_elevation = math.radians(35)
sky.sun_rotation = math.radians(120)
sky.air_density = 1.0
sky.dust_density = 0.2
wo = w.nodes.new('ShaderNodeOutputWorld')
w.links.new(sky.outputs['Color'], bg.inputs['Color'])
w.links.new(bg.outputs['Background'], wo.inputs['Surface'])

def material(name, color, rough=0.6, noise=False, scale=10, bump=0.08):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    if noise:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = scale
        tex.inputs['Detail'].default_value = 3
        geo = nt.nodes.new('ShaderNodeNewGeometry')
        nt.links.new(geo.outputs['Position'],tex.inputs['Vector'])
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = (*[v * 0.45 for v in color], 1)
        ramp.color_ramp.elements[1].color = (*[min(v * 1.7, 1) for v in color], 1)
        nt.links.new(tex.outputs['Fac'], ramp.inputs[0])
        nt.links.new(ramp.outputs[0], p.inputs['Base Color'])
        bn = nt.nodes.new('ShaderNodeBump')
        bn.inputs['Strength'].default_value = bump
        bn.inputs['Distance'].default_value = 0.006 if 'asphalt' in name else 0.025
        nt.links.new(tex.outputs['Fac'], bn.inputs['Height'])
        nt.links.new(bn.outputs[0], p.inputs['Normal'])
    return m

asphalt = material('fine aggregate / dark damp asphalt', (0.036, 0.044, 0.048), 0.34, True, 95, 0.3)
paint = material('weathered ivory road markings', (0.65, 0.65, 0.54), 0.48, True, 70, 0.1)
earth = material('forest verge and moss', (0.047, 0.065, 0.026), 0.95, True, 3)
bark = material('textured bark', (0.085, 0.055, 0.027), 0.92, True, 9, 0.65)
leaves = [material('leaf canopy '+str(i), c, 0.8) for i, c in enumerate([
    (0.026, 0.067, 0.022), (0.062, 0.105, 0.036), (0.13, 0.15, 0.047)])]
for m in leaves:
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Subsurface Weight'].default_value = 0.08
    p.inputs['Subsurface Radius'].default_value = (0.3, 0.5, 0.2)
metal = material('guardrail brushed galvanized steel', (0.3, 0.34, 0.37), 0.4)
metal.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value = 0.7

def box(name, loc, scale, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-0.5,-0.5,-0.5),(0.5,-0.5,-0.5),(0.5,0.5,-0.5),(-0.5,0.5,-0.5),
                     (-0.5,-0.5,0.5),(0.5,-0.5,0.5),(0.5,0.5,0.5),(-0.5,0.5,0.5)],[],
                    [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    o = bpy.data.objects.new(name,mesh)
    s.collection.objects.link(o)
    o.location = loc
    o.scale = scale
    if mat:
        o.data.materials.append(mat)
    return o

def cylinder(name, a, b, radius, mat, vertices=8):
    d = Vector(b)-Vector(a)
    mesh = bpy.data.meshes.new(name)
    verts=[(radius*math.cos(i*math.tau/vertices),radius*math.sin(i*math.tau/vertices),z)
           for z in [-d.length/2,d.length/2] for i in range(vertices)]
    faces=[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
    faces += [tuple(reversed(range(vertices))),tuple(range(vertices,2*vertices))]
    mesh.from_pydata(verts,[],faces)
    o = bpy.data.objects.new(name,mesh)
    s.collection.objects.link(o)
    o.location = (Vector(a)+Vector(b))/2
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    o.data.materials.append(mat)
    return o

box('ROAD / 720 metres', (0,-160,-0.085), (8,720,0.15), asphalt)
box('forest floor', (0,-160,-0.15), (150,720,0.18), earth)
for x in [-3.65, 3.65]:
    box('continuous road edge', (x,-160,0.005), (0.085,720,0.007), paint)
for y in range(-500,201,8):
    box('broken centre line', (0,y,0.009), (0.095,3.1,0.007), paint)
for x in [-4.5,4.5]:
    for y in range(-490,201,20):
        box('roadside delineator', (x,y,0.4), (0.085,0.1,0.8), paint)

# Leaf clusters use thousands of actual small bent leaf polygons; linked meshes preserve memory.
cluster_meshes = []
for k in range(3):
    verts, faces = [], []
    for i in range(380):
        v = Vector((rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-0.8,0.8)))
        if v.length > 1:
            v.normalize()
            v *= rng.uniform(0.2, 1)
        n = Vector((rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-1,1))).normalized()
        a = n.cross(Vector((0,0,1)))
        if a.length < 0.01:
            a = Vector((1,0,0))
        a.normalize()
        b = n.cross(a).normalized()
        length = rng.uniform(0.07,0.16)
        width = length * rng.uniform(0.35,0.55)
        base = len(verts)
        verts += [tuple(v-a*length), tuple(v+b*width), tuple(v+a*length), tuple(v-b*width), tuple(v+n*length*0.16)]
        faces += [(base,base+1,base+4),(base+1,base+2,base+4),(base+2,base+3,base+4),(base+3,base,base+4)]
    mesh = bpy.data.meshes.new('botanical leaf cluster '+str(k))
    mesh.from_pydata(verts,[],faces)
    mesh.materials.append(leaves[k])
    cluster_meshes.append(mesh)

for side in [-1,1]:
    for i in range(210):
        y = -320 + i*2.65 + rng.uniform(-1,1)
        x = side*rng.uniform(6.5,22)
        h = rng.uniform(7.5,15)
        r = rng.uniform(0.13,0.27)
        cylinder('tree trunk', (x,y,0), (x+0.18,y,h*0.75), r, bark)
        for j in range(5):
            angle = j*math.tau/5 + rng.uniform(-0.3,0.3)
            bx, by = x+math.cos(angle)*2, y+math.sin(angle)*2
            z = h*rng.uniform(0.55,0.8)
            cylinder('tree branch', (x,y,z-1.8), (bx,by,z), r*0.36, bark, 6)
            for n in range(2):
                mesh = cluster_meshes[rng.randrange(3)]
                o = bpy.data.objects.new('layered leaf crown',mesh)
                s.collection.objects.link(o)
                o.location = (bx+rng.uniform(-0.7,0.7),by+rng.uniform(-0.7,0.7),z+n*1.3)
                size = rng.uniform(1.5,2.5)
                o.scale = (size,size,size*0.85)
                o.rotation_euler = (rng.random(),rng.random(),rng.random()*6)
        if i % 2 == 0:
            o = bpy.data.objects.new('understory fern canopy', cluster_meshes[i%3])
            s.collection.objects.link(o)
            o.location = (side*rng.uniform(5.2,8),y,0.4)
            o.scale = (0.8,0.8,0.8)

bpy.ops.import_scene.gltf(filepath=str(Path(opt.model).resolve()))
root = bpy.data.objects.get('YUNEX_Porsche_911_GT3_RS_992')
if root is None:
    raise RuntimeError('canonical GLB root missing')
root.location.x = -1.75
car_objs = [root] + list(root.children_recursive)
for o in car_objs:
    if o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True
# Preserve all approved source materials and livery. No recolouring/rebuilding the car.
spin = [bpy.data.objects.get('Spin_'+x) for x in ['FL','FR','RL','RR']]
assert all(spin), 'canonical wheel rigs missing'
for o in spin:
    local_rotation = o.matrix_basis.to_euler('XYZ')
    o.rotation_mode = 'XYZ'
    o.rotation_euler = local_rotation
base_rotations = [o.rotation_euler.copy() for o in spin]

sun = bpy.data.objects.new('sun',bpy.data.lights.new('sun','SUN'))
s.collection.objects.link(sun)
sun.location = (10,-20,16)
sun.name = 'late afternoon filtered sunlight'
sun.rotation_euler = (math.radians(57),math.radians(-17),math.radians(-35))
sun.data.energy = 1.35
sun.data.angle = math.radians(8)
sun.data.color = (0.92,0.96,1)

def area(name, loc, energy, size, color):
    l = bpy.data.objects.new(name,bpy.data.lights.new(name,'AREA'))
    s.collection.objects.link(l)
    l.location = loc
    l.data.energy = energy
    l.data.shape = 'DISK'
    l.data.size = size
    l.data.color = color
    return l
fill = area('open sky soft fill', (-4,-3,7), 1000, 9, (0.74,0.85,1))
rim = area('forest clearing soft edge', (5,2,5), 700, 7, (0.92,0.96,1))

cam = bpy.data.objects.new('camera',bpy.data.cameras.new('camera'))
s.collection.objects.link(cam)
cam.name = 'tracked cinematic camera'
s.camera = cam
cam.data.sensor_width = 36
cam.data.dof.use_dof = True
focus = bpy.data.objects.new('car focus target',None)
s.collection.objects.link(focus)
cam.data.dof.focus_object = focus
cam.data.dof.aperture_fstop = 5.6
s.frame_start, s.frame_end = 0, 478

# Cuts follow the supplied reference; motion is continuous across 213 -> 214.
cuts = [0,70,130,164,195,214,270,319,369,418,479]
poses = [
    ((3.9,-7.9,1.75),(2.9,-7.1,1.50),43),
    ((-2.4,-7.8,1.45),(-1.2,-7.0,1.2),45),
    ((3.8,7.4,2.0),(2.8,6.8,1.6),43),
    ((-5.0,3.9,1.35),(-4.4,3.0,1.15),45),
    ((3.5,-6.5,1.35),(2.3,-6.9,1.20),43),
    ((3.5,-6.5,1.35),(2.3,-6.9,1.20),43),
    ((-3.0,7.0,1.5),(-2.0,6.2,1.25),45),
    ((1.4,8.5,2.5),(0.5,8.2,2.2),48),
    ((0.9,-7.8,1.15),(-0.2,-7.5,1.05),48),
    ((-5.4,3.3,1.4),(-4.6,-2.2,1.1),43),
]

def frame_state(f, apply_render=True):
    # The viewport and first cinematic shot share one camera path, then beat-cut shots.
    idx = next(i for i in range(len(cuts)-1) if cuts[i] <= f < cuts[i+1])
    lo, hi = cuts[idx], cuts[idx+1]
    if idx in [4,5]:
        lo, hi = 195,270
    t = (f-lo)/max(1,hi-lo-1)
    a,b,lens = poses[idx]
    rel = Vector(a).lerp(Vector(b),t)
    pos = Vector((-1.75,-f/30*12.5,0))
    root.location = pos
    for o,r in zip(spin,base_rotations):
        o.rotation_euler = r.copy()
        o.rotation_euler.x += f/30*12.5/0.36
    focus.location = pos+Vector((0,0,0.67))
    cam.location = pos+rel
    target = pos+Vector((0,-0.1,0.70))
    cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.lens = lens
    # Frame the complete approved silhouette in portrait, including the rear wing.
    bpy.context.view_layer.update()
    bounds = [o.matrix_world @ Vector(v) for o in car_objs if o.type == 'MESH' for v in o.bound_box]
    for attempt in range(8):
        screen = [world_to_camera_view(s,cam,v) for v in bounds]
        if all(0.055 < v.x < 0.945 and 0.12 < v.y < 0.88 and v.z > 0 for v in screen):
            break
        factor = max(max(abs(v.x-0.5)/0.445,abs(v.y-0.5)/0.38) for v in screen)*1.01
        cam.location = target + (cam.location-target)*max(factor,1.01)
        bpy.context.view_layer.update()
    for l,offset in [(fill,(-4,-3,7)),(rim,(5,2,5))]:
        l.location = pos+Vector(offset)
        l.rotation_euler = (target-l.location).to_track_quat('-Z','Y').to_euler()
    if not apply_render:
        return
    s.render.engine = 'BLENDER_WORKBENCH' if f < 214 else 'CYCLES'
    s.display.shading.light = 'STUDIO'
    s.display.shading.studiolight_rotate_z = 0.5
    s.display.shading.color_type = 'SINGLE'
    s.display.shading.single_color = (0.48,0.49,0.5)
    s.display.shading.show_shadows = True
    s.display.shading.show_cavity = True
    s.display.shading.cavity_type = 'BOTH'
    s.display.shading.show_specular_highlight = True
    s.display.shading.background_type = 'WORLD'
    s.display.shading.show_object_outline = False
    s.display.render_aa = 'FXAA'
    s.world.color = (0.065,0.065,0.065)
    s.view_settings.view_transform = 'Standard' if f < 214 else 'AgX'
    s.view_settings.look = 'None' if f < 214 else 'AgX - Medium High Contrast'
    s.view_settings.exposure = 0 if f < 214 else 0.1
    s.render.use_motion_blur = f >= 214 and not any(abs(f-c) <= 1 for c in cuts if c != 214)
    s.render.motion_blur_shutter = 0.3
    bpy.context.view_layer.update()

if ':' in opt.frames:
    a,b = map(int,opt.frames.split(':'))
    frames = range(a,b+1)
else:
    frames = list(map(int,opt.frames.split(',')))
# Bake the real camera/car/wheel motion before rendering so Cycles samples motion blur.
for f in range(479):
    s.frame_set(f)
    frame_state(f,apply_render=False)
    for o in [root,cam,focus,fill,rim]+spin:
        o.keyframe_insert('location', frame=f)
        o.keyframe_insert('rotation_euler', frame=f)
    cam.data.keyframe_insert('lens',frame=f)
for o in [root,cam,focus,fill,rim]+spin:
    if o.animation_data and o.animation_data.action:
        for curve in o.animation_data.action.fcurves:
            for key in curve.keyframe_points:
                key.interpolation = 'LINEAR'
for f in frames:
    assert 0 <= f < 479
    s.frame_set(f)
    frame_state(f)
    s.render.filepath = str(out / ('frame_%04d.png'%f))
    bpy.ops.render.render(write_still=True)
    print('FRAME_PASS', f, flush=True)
if opt.save:
    frame_state(214)
    s.frame_set(214)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'Porsche_Blender_Reveal.blend'))
print('SCENE_PASS', flush=True)
