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
sys.path.insert(0, str(Path(__file__).parent))
from wheel_motion import prepare_wheels, set_wheel_distance

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
s.cycles.adaptive_min_samples = 16
s.cycles.max_bounces = 6
s.cycles.diffuse_bounces = 2
s.cycles.glossy_bounces = 4
s.cycles.volume_bounces = 0
s.cycles.volume_step_rate = 2.0
s.cycles.transmission_bounces = 4
s.cycles.transparent_max_bounces = 4
s.cycles.sample_clamp_indirect = 3
s.render.threads_mode = 'FIXED'
s.render.threads = 8
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

from rain_environment import build_environment
update_weather = build_environment(s, material, box, cylinder)

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
wheel_specs = prepare_wheels()
static_bounds = [o.matrix_world @ Vector(v) for o in car_objs if o.type == 'MESH'
                 and not o.name.startswith('Wheel_') for v in o.bound_box]
static_bounds = [v-root.location for v in static_bounds]

sun = bpy.data.objects.new('sun',bpy.data.lights.new('sun','SUN'))
s.collection.objects.link(sun)
sun.location = (10,-20,16)
sun.name = 'late afternoon filtered sunlight'
sun.rotation_euler = (math.radians(57),math.radians(-17),math.radians(-35))
sun.data.energy = 0.06
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
fill = area('rain sky hero softbox', (-4,-3,7), 1900, 9, (0.64,0.78,1))
rim = area('warm reflected hero edge', (5,2,5), 1800, 7, (1,0.72,0.43))

# Real headlights illuminate rain and leave streaked pools on the wet tarmac.
for side in [-1,1]:
    data = bpy.data.lights.new('Porsche dipped beam', 'SPOT')
    data.energy = 140
    data.color = (0.82,0.90,1.0)
    data.spot_size = math.radians(55)
    data.spot_blend = 0.65
    data.shadow_soft_size = 0.10
    light = bpy.data.objects.new('wet road headlight beam',data)
    s.collection.objects.link(light)
    light.parent = root
    light.location = (side*0.66,-1.93,0.65)
    light.rotation_euler = Vector((side*0.06,-1,-0.14)).to_track_quat('-Z','Y').to_euler()

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
    ((-4.2,3.2,0.8),(-3.7,-2.9,0.85),28),
]

# Fit each problematic orbit once for its widest silhouette, not at every frame.
# Increasing distance mid-orbit made the old threshold fitter jump visibly.
def calibrate_framing(index):
    a,b,lens = poses[index]
    pos = root.location.copy()
    target = pos+Vector((0,-0.1,0.70))
    factor = 1.0
    cam.data.lens = lens
    cam.data.sensor_fit = 'HORIZONTAL' if index == 9 else 'AUTO'
    for step in range(121):
        rel = Vector(a).lerp(Vector(b),step/120)
        for attempt in range(32):
            cam.location = target+(pos+rel-target)*factor
            cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
            bpy.context.view_layer.update()
            points = [world_to_camera_view(s,cam,pos+v) for v in static_bounds]
            if all(0.065 < v.x < 0.935 and 0.13 < v.y < 0.87 and v.z > 0 for v in points):
                break
            ratio = max(max(abs(v.x-0.5)/0.435,abs(v.y-0.5)/0.37) for v in points)
            factor *= max(ratio,1.005)*1.005
        else:
            raise RuntimeError('Unable to safely calibrate orbit '+str(index))
    print('FIXED_FRAMING',index,factor,flush=True)
    return factor*1.005
framing_factors = {i:calibrate_framing(i) for i in [8,9]}

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
    set_wheel_distance(wheel_specs, f/30*12.5)
    focus.location = pos+Vector((0,0,0.67))
    cam.location = pos+rel
    target = pos+Vector((0,-0.1,0.70))
    cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.lens = lens
    cam.data.sensor_fit = 'HORIZONTAL' if idx == 9 else 'AUTO'
    # Frame the complete approved silhouette in portrait, including the rear wing.
    bpy.context.view_layer.update()
    bounds = [pos+v for v in static_bounds]
    if idx in framing_factors:
        cam.location = target+(cam.location-target)*framing_factors[idx]
        bpy.context.view_layer.update()
    else:
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
    editing = f < 214
    update_weather(f, pos, editing)
    cam.data.dof.use_dof = not editing
    s.render.engine = 'BLENDER_WORKBENCH' if editing else 'CYCLES'
    s.display.shading.light = 'STUDIO'
    s.display.shading.studiolight_rotate_z = 0.5
    s.display.shading.color_type = 'SINGLE'
    s.display.shading.single_color = (0.48,0.49,0.5)
    s.display.shading.show_shadows = False
    s.display.shading.show_cavity = True
    s.display.shading.cavity_type = 'SCREEN'
    s.display.shading.show_specular_highlight = True
    s.display.shading.background_type = 'WORLD'
    s.display.shading.show_object_outline = False
    s.display.render_aa = 'FXAA'
    s.world.color = (0.065,0.065,0.065)
    s.view_settings.view_transform = 'Standard' if f < 214 else 'AgX'
    s.view_settings.look = 'None' if f < 214 else 'AgX - Medium High Contrast'
    s.view_settings.exposure = 0 if f < 214 else 0.6
    s.render.use_motion_blur = f >= 214 and not any(abs(f-c) <= 1 for c in cuts if c != 214)
    s.render.motion_blur_shutter = 0.5
    bpy.context.view_layer.update()

if ':' in opt.frames:
    a,b = map(int,opt.frames.split(':'))
    frames = range(a,b+1)
else:
    frames = list(map(int,opt.frames.split(',')))
# Bake the real camera/car/wheel motion before rendering so Cycles samples motion blur.
bake_frames = range(479) if opt.save else sorted({max(0,min(478,f+d)) for f in frames for d in [-1,0,1]})
for f in bake_frames:
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
