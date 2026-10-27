import bpy, bmesh, math, sys, os, random
from mathutils import Vector, Matrix, Euler
from math import sin, cos, pi, exp

GLB = '/home/user/Remotion-gpt-chat/public/yunex/imported-cars/ferrari-f40.glb'
FPS = 30
V = 134.112  # 300 mph in m/s
random.seed(7)

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def sstep(a, b, x):
    t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def vlerp(a, b, t): return Vector([lerp(a[i], b[i], t) for i in range(3)])

def speed(t): return V * (0.80 + 0.20 * sstep(0.4, 3.6, t))
_CACHE = {}
def travelled(t):
    k = round(t * 600)
    if k not in _CACHE:
        n = 300; s = 0.0; dt = (k / 600) / n
        for i in range(n): s += speed((i + .5) * dt) * dt
        _CACHE[k] = s
    return _CACHE[k]
def car_y(t): return -(travelled(t) - travelled(0.8))   # car drives toward -Y, passes y=0 at t=0.8

def mat_emit(name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*color, 1); e.inputs[1].default_value = strength
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], o.inputs[0]); return m

def mathn(nt, op, a=None, b=None):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: nt.links.new(v, n.inputs[i])
    return n.outputs[0]

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    ev = sc.eevee
    for k, v in dict(taa_render_samples=6, use_raytracing=True, use_shadows=False).items():
        if hasattr(ev, k): setattr(ev, k, v)
    try: ev.ray_tracing_options.resolution_scale = '2'
    except Exception as e: print('rt opts', e)
    if hasattr(sc.render, 'use_motion_blur'):
        sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.6
    elif hasattr(ev, 'use_motion_blur'):
        ev.use_motion_blur = True; ev.motion_blur_shutter = 0.6
    sc.view_settings.view_transform = 'AgX'
    try: sc.view_settings.look = 'AgX - High Contrast'
    except Exception: pass
    sc.render.resolution_x = 1080; sc.render.resolution_y = 1920
    sc.render.fps = FPS
    sc.render.image_settings.file_format = 'PNG'

    # world gradient: dark sky, warm horizon glow
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    tc = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    cr = nt.nodes.new('ShaderNodeValToRGB')
    el = cr.color_ramp.elements
    el[0].position = 0.40; el[0].color = (0.004, 0.012, 0.03, 1)
    el[1].position = 0.60; el[1].color = (0.002, 0.003, 0.008, 1)
    e2 = el.new(0.5); e2.color = (0.35, 0.12, 0.03, 1)
    el.new(0.45).color = (0.003, 0.008, 0.02, 1); el.new(0.56).color = (0.004, 0.008, 0.018, 1)
    bg = nt.nodes.new('ShaderNodeBackground'); bg.inputs[1].default_value = 1.0
    wo = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(tc.outputs['Incoming'], sep.inputs[0])
    hz = mathn(nt, 'MULTIPLY', sep.outputs['Z'], -0.5); nt.links.new(mathn(nt, 'ADD', hz, 0.5), cr.inputs[0])
    st = nt.nodes.new('ShaderNodeTexNoise'); st.inputs['Scale'].default_value = 900; st.inputs['Detail'].default_value = 0
    nt.links.new(tc.outputs['Incoming'], st.inputs[0])
    sm = nt.nodes.new('ShaderNodeMapRange'); sm.inputs[1].default_value = 0.93; sm.inputs[2].default_value = 0.95; nt.links.new(st.outputs['Fac'], sm.inputs[0])
    up = nt.nodes.new('ShaderNodeMapRange'); up.inputs[1].default_value = 0.52; up.inputs[2].default_value = 0.65; nt.links.new(mathn(nt, 'ADD', hz, 0.5), up.inputs[0])
    sstar = mathn(nt, 'MULTIPLY', sm.outputs[0], up.outputs[0]); sstar = mathn(nt, 'MULTIPLY', sstar, 5.0)
    ad = nt.nodes.new('ShaderNodeMix'); ad.data_type = 'RGBA'; ad.blend_type = 'ADD'; ad.inputs[0].default_value = 1.0
    nt.links.new(cr.outputs[0], ad.inputs[6])
    sc_ = nt.nodes.new('ShaderNodeCombineColor'); [nt.links.new(sstar, sc_.inputs[i]) for i in range(3)]
    nt.links.new(sc_.outputs[0], ad.inputs[7])
    nt.links.new(ad.outputs[2], bg.inputs[0]); nt.links.new(bg.outputs[0], wo.inputs[0])

    # ground
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -1200, 0))
    g = bpy.context.object; g.scale = (60, 4000, 1); g.name = 'ground'
    bpy.ops.object.transform_apply(scale=True)
    gm = bpy.data.materials.new('asphalt'); gm.use_nodes = True; nt = gm.node_tree
    pb = nt.nodes['Principled BSDF']
    tcx = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tcx.outputs['Object'], sp.inputs[0])
    X, Y = sp.outputs['X'], sp.outputs['Y']
    def band(c, wd): return mathn(nt, 'LESS_THAN', mathn(nt, 'ABSOLUTE', mathn(nt, 'SUBTRACT', X, c)), wd)
    dash = mathn(nt, 'LESS_THAN', mathn(nt, 'PINGPONG', Y, 6.0), 3.0)
    lines = mathn(nt, 'ADD', mathn(nt, 'ADD', band(6.2, 0.10), band(-6.2, 0.10)), mathn(nt, 'MULTIPLY', band(0.0, 0.08), dash))
    mixc = nt.nodes.new('ShaderNodeMix'); mixc.data_type = 'RGBA'
    mixc.inputs[6].default_value = (0.012, 0.012, 0.014, 1); mixc.inputs[7].default_value = (0.5, 0.5, 0.5, 1)
    nt.links.new(lines, mixc.inputs[0]); nt.links.new(mixc.outputs[2], pb.inputs['Base Color'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs[3].default_value = 0.14; mr.inputs[4].default_value = 0.4
    nt.links.new(tcx.outputs['Object'], nz.inputs[0]); nt.links.new(nz.outputs['Fac'], mr.inputs[0]); nt.links.new(mr.outputs[0], pb.inputs['Roughness'])
    g.data.materials.append(gm)

    # walls + LED strips
    wallm = bpy.data.materials.new('wall'); wallm.use_nodes = True
    wb = wallm.node_tree.nodes['Principled BSDF']; wb.inputs['Base Color'].default_value = (0.05, 0.05, 0.055, 1); wb.inputs['Roughness'].default_value = 0.6
    led_c = mat_emit('led_cyan', (0.1, 0.7, 1.0), 14.0); led_o = mat_emit('led_orange', (1.0, 0.35, 0.04), 12.0)
    def box(loc, sc_, m):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.scale = sc_; o.data.materials.append(m); return o
    for sx in (-1, 1):
        box((sx * 11, -1200, 0.6), (0.6, 4000, 1.2), wallm)
        box((sx * 10.65, -1200, 0.9), (0.05, 4000, 0.08), led_c if sx < 0 else led_o)
        box((sx * 6.9, -1200, 0.015), (0.05, 4000, 0.03), led_c if sx > 0 else led_o)
    global POLES, POSTS, GANTS
    pole_m = bpy.data.materials.new('pole'); pole_m.use_nodes = True
    pole_m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.03, 0.03, 0.035, 1)
    lamp_m = mat_emit('lamp', (1.0, 0.82, 0.55), 12.0)
    POLES = []
    for sx in (-1, 1):
        for i in range(40):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=11, location=(0, 0, 5.5), vertices=8)
            p = bpy.context.object; p.data.materials.append(pole_m)
            h = box((0, 0, 11), (2.6, 0.35, 0.12), lamp_m); h.parent = p; h.location = (-sx * 1.2, 0, 5.5)
            POLES.append((p, sx, i))
    POSTS = []
    post_m = mat_emit('post', (1.0, 1.0, 1.0), 6.0)
    for sx in (-1, 1):
        for i in range(120):
            POSTS.append((box((0, 0, 0.5), (0.08, 0.08, 1.0), post_m if sx > 0 else led_o), sx, i))
    GANTS = []
    for i in range(10):
        a = box((0, 0, 7.5), (22, 0.5, 0.6), pole_m)
        b = box((0, 0, 7.0), (20, 0.06, 0.05), led_c)
        GANTS.append((a, b))


    global CITY, PARTS, MOON
    bm = bpy.data.materials.new('bld'); bm.use_nodes = True; nt = bm.node_tree; nt.nodes.clear()
    oi = nt.nodes.new('ShaderNodeObjectInfo'); tcx = nt.nodes.new('ShaderNodeTexCoord')
    ck = nt.nodes.new('ShaderNodeTexChecker'); ck.inputs['Scale'].default_value = 1.0
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.22, 0.22, 0.2)
    nt.links.new(tcx.outputs['Object'], mp.inputs[0]); nt.links.new(mp.outputs[0], ck.inputs[0])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.45; nt.links.new(tcx.outputs['Object'], nz.inputs[0])
    on = nt.nodes.new('ShaderNodeMapRange'); on.inputs[1].default_value = 0.56; on.inputs[2].default_value = 0.6; nt.links.new(nz.outputs['Fac'], on.inputs[0])
    msk = mathn(nt, 'MULTIPLY', ck.outputs['Fac'], on.outputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); nt.links.new(oi.outputs['Random'], ramp.inputs[0])
    ramp.color_ramp.elements[0].color = (1.0, 0.62, 0.25, 1); ramp.color_ramp.elements[1].color = (0.3, 0.7, 1.0, 1)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.4; nt.links.new(ramp.outputs[0], em.inputs[0])
    dk = nt.nodes.new('ShaderNodeBsdfDiffuse'); dk.inputs[0].default_value = (0.01, 0.012, 0.02, 1)
    mx = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(msk, mx.inputs[0]); nt.links.new(dk.outputs[0], mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2])
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(mx.outputs[0], out.inputs[0])
    # wide matte ground so the skyline stands on land instead of floating over the void
    gm2 = bpy.data.materials.new('land'); gm2.use_nodes = True
    p2 = gm2.node_tree.nodes['Principled BSDF']; p2.inputs['Base Color'].default_value = (0.006, 0.007, 0.009, 1); p2.inputs['Roughness'].default_value = 0.55
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -1200, -0.03)); lg = bpy.context.object; lg.scale = (2400, 6000, 1); lg.data.materials.append(gm2)
    CITY = []
    for sx in (-1, 1):
        for i in range(36):
            hgt = random.uniform(18, 140); wd = random.uniform(14, 40)
            o = box((0, 0, hgt / 2), (wd, random.uniform(14, 40), hgt), bm); bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.transform_apply(scale=True); o.select_set(False)
            CITY.append((o, sx, i, random.uniform(55, 260), random.uniform(-40, 40)))
    ptm = mat_emit('ptc', (0.6, 0.85, 1.0), 6.0)
    PARTS = []
    for i in range(70):
        o = box((0, 0, 0), (0.012, 1.2, 0.012), ptm)
        PARTS.append((o, random.choice((-1, 1)) * random.uniform(3, 9), random.uniform(0.2, 5.0), random.uniform(0, 1)))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=30, location=(-260, -900, 190))
    MOON = bpy.context.object; MOON.data.materials.append(mat_emit('moon', (0.75, 0.85, 1.0), 4.0))

    # car
    bpy.ops.import_scene.gltf(filepath=GLB)
    root = bpy.data.objects.new('CarRoot', None); sc.collection.objects.link(root)
    bpy.data.objects['Sketchfab_model'].parent = root
    bpy.context.view_layer.update()
    def bbox(o):
        b = [o.matrix_world @ Vector(c) for c in o.bound_box]
        return Vector([min(v[i] for v in b) for i in range(3)]), Vector([max(v[i] for v in b) for i in range(3)])
    wheels = []
    for n in ('Object_37', 'Object_38', 'Object_39', 'Object_40'):
        o = bpy.data.objects[n]; lo, hi = bbox(o); wheels.append((o, (lo + hi) / 2))
    rim_parts = []
    for rn in ('Object_30', 'Object_31'):
        ro = bpy.data.objects[rn]
        for wi, (to, c) in enumerate(wheels):
            d = ro.copy(); d.data = ro.data.copy(); ro.users_collection[0].objects.link(d)
            bm = bmesh.new(); bm.from_mesh(d.data); mw = d.matrix_world
            kill = [v for v in bm.verts if not (abs((mw @ v.co).y - c.y) < 0.42 and abs((mw @ v.co).x - c.x) < 0.3)]
            bmesh.ops.delete(bm, geom=kill, context='VERTS'); bm.to_mesh(d.data); bm.free()
            if len(d.data.vertices) > 0: rim_parts.append((d, wi))
            else: bpy.data.objects.remove(d)
        bpy.data.objects.remove(ro)
    global WHEELS
    WHEELS = []
    for wi, (to, c) in enumerate(wheels):
        em = bpy.data.objects.new(f'wheel{wi}', None); sc.collection.objects.link(em)
        em.parent = root; em.location = c
        bpy.context.view_layer.update()
        for ob in [to] + [d for d, k in rim_parts if k == wi]:
            mw = ob.matrix_world.copy(); ob.parent = em; ob.matrix_parent_inverse = Matrix.Identity(4); ob.matrix_world = mw
        WHEELS.append(em)
    for m in bpy.data.materials:
        if m.use_nodes:
            print('MAT', m.name, [tuple(round(x, 2) for x in n.inputs['Base Color'].default_value[:3]) for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'][:1])

    # xray cutaway sweep on shell materials
    global CUTV, BRAKE_EM
    SHELL = ['material', 'F40_Skin', 'F40_Glass', 'F40_Glass.001', 'F40_Window', 'F40_Window.001', 'F40_Chrome', 'F40_Chrome.001',
             'F40_Cockpit', 'F40_Cockpit_HR', 'F40_Display', 'F40_Logos', 'F40_Grid', 'F40_GridD', 'F40_Carbon', 'F40_Estra', 'F40_Vehiclelight']
    CUTV = []
    for mn in SHELL:
        m = bpy.data.materials.get(mn)
        if not m or not m.use_nodes: continue
        nt = m.node_tree
        for n in nt.nodes:
            if n.type == 'BSDF_PRINCIPLED' and mn == 'material':
                n.inputs['Metallic'].default_value = 0.4; n.inputs['Roughness'].default_value = 0.14
                for k, v in (('Coat Weight', 1.0), ('Coat Roughness', 0.03)):
                    if k in n.inputs: n.inputs[k].default_value = v
        out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
        src = out.inputs['Surface'].links[0].from_socket if out.inputs['Surface'].links else None
        pos = nt.nodes.new('ShaderNodeNewGeometry'); sepz = nt.nodes.new('ShaderNodeSeparateXYZ')
        nt.links.new(pos.outputs['Position'], sepz.inputs[0])
        sw = nt.nodes.new('ShaderNodeValue'); CUTV.append(sw)
        d = mathn(nt, 'SUBTRACT', sepz.outputs['Y'], sw.outputs[0])
        cutm = nt.nodes.new('ShaderNodeMapRange'); cutm.inputs[1].default_value = 0.0; cutm.inputs[2].default_value = 0.03
        nt.links.new(mathn(nt, 'MULTIPLY', d, -1.0), cutm.inputs[0])
        edge = nt.nodes.new('ShaderNodeMapRange'); edge.inputs[1].default_value = 0.0; edge.inputs[2].default_value = 0.09
        edge.inputs[3].default_value = 1.0; edge.inputs[4].default_value = 0.0
        nt.links.new(mathn(nt, 'ABSOLUTE', d), edge.inputs[0])
        wf = nt.nodes.new('ShaderNodeWireframe'); wf.inputs[0].default_value = 1.0; wf.use_pixel_size = False
        wf.inputs[0].default_value = 0.003
        xr = nt.nodes.new('ShaderNodeEmission'); xr.inputs[0].default_value = (0.1, 0.75, 1.0, 1); xr.inputs[1].default_value = 5.0
        tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        xmix = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(wf.outputs[0], xmix.inputs[0]); nt.links.new(tr.outputs[0], xmix.inputs[1]); nt.links.new(xr.outputs[0], xmix.inputs[2])
        ed = nt.nodes.new('ShaderNodeEmission'); ed.inputs[0].default_value = (1.0, 0.85, 0.5, 1); ed.inputs[1].default_value = 25.0
        emix = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(edge.outputs[0], emix.inputs[0]); nt.links.new(xmix.outputs[0], emix.inputs[1]); nt.links.new(ed.outputs[0], emix.inputs[2])
        fin = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(cutm.outputs[0], fin.inputs[0])
        if src: nt.links.new(src, fin.inputs[1])
        nt.links.new(emix.outputs[0], fin.inputs[2]); nt.links.new(fin.outputs[0], out.inputs['Surface'])
    BRAKE_EM = None
    bm_ = bpy.data.materials.get('F40_Brake')
    if bm_ and bm_.use_nodes:
        for n in bm_.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                BRAKE_EM = n
                if 'Emission Color' in n.inputs: n.inputs['Emission Color'].default_value = (1.0, 0.25, 0.03, 1); n.inputs['Emission Strength'].default_value = 0.6

    # lights parented to car
    def area(name, loc, size, sy, power, color, rot):
        l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.color = color; l.shape = 'RECTANGLE'; l.size = size; l.size_y = sy
        o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.parent = root; o.location = loc; o.rotation_euler = rot; return o
    area('top', (0, 0, 5.5), 2.0, 7, 2500, (1.0, 0.95, 0.85), (0, 0, 0))
    area('cy', (-5, 4, 1.4), 5, 1.5, 6000, (0.2, 0.6, 1.0), (0, -pi / 2 * 0.8, pi / 2))
    area('or', (5, -3.5, 1.4), 5, 1.5, 7000, (1.0, 0.45, 0.12), (0, pi / 2 * 0.8, pi / 2))
    area('fill', (0, 6, 1.5), 3, 3, 2000, (0.4, 0.55, 1.0), (-pi / 2, 0, 0))

    cam = bpy.data.cameras.new('cam'); cam.lens = 35; cam.sensor_width = 36; cam.sensor_fit = 'HORIZONTAL'; cam.clip_end = 3000
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    global CAM, ROOT, STREAMS
    CAM = co; ROOT = root

    # streamlines (car-local, air flows front(-Y) -> rear(+Y))
    def H(y):
        pts = [(-2.4, 0.38), (-1.9, 0.52), (-1.3, 0.72), (-0.8, 0.92), (-0.3, 1.16), (0.4, 1.17), (0.9, 1.0), (1.5, 0.92), (2.15, 0.78), (2.3, 0.6)]
        if y <= pts[0][0]: return pts[0][1]
        for a, b in zip(pts, pts[1:]):
            if y <= b[0]:
                t = (y - a[0]) / (b[0] - a[0]); t = t * t * (3 - 2 * t); return lerp(a[1], b[1], t)
        return pts[-1][1]
    STREAMS = []
    N = 90
    for k in range(44):
        side = random.choice((-1, 1)); roof = k % 2 == 0
        xo = random.uniform(-0.55, 0.55) if roof else side * random.uniform(1.2, 2.0)
        off = random.uniform(0.04, 0.5); z0 = random.uniform(0.2, 1.5); ph = random.uniform(0, 6.28); rr = random.uniform(0.6, 1.4)
        cv = bpy.data.curves.new(f'sl{k}', 'CURVE'); cv.dimensions = '3D'
        spl = cv.splines.new('POLY'); spl.points.add(N - 1)
        for i in range(N):
            y = lerp(-8.0, 11.0, i / (N - 1))
            if roof:
                zz = H(y) + off * (0.25 + 0.75 * sstep(-2.4, 1.5, y)) if y > -2.4 else lerp(0.9 + off, 0.4 + off, sstep(-8, -2.4, y))
            else:
                zz = z0 + 0.06 * sin(y * 0.8 + ph)
            wake = max(0.0, y - 2.2); amp = 0.012 * wake ** 1.35 * rr
            xx = xo + amp * sin(wake * 2.2 + ph) * 0.6; zz += amp * cos(wake * 1.7 + ph * 1.3) * 0.8 + 0.02 * wake
            spl.points[i].co = (xx, y, zz, 1)
        cv.bevel_depth = 0.014 if roof else 0.011; cv.bevel_resolution = 1
        cv.bevel_factor_mapping_start = 'SPLINE'; cv.bevel_factor_mapping_end = 'SPLINE'
        ob = bpy.data.objects.new(f'sl{k}', cv); sc.collection.objects.link(ob); ob.parent = root
        col = (0.15, 0.75, 1.0) if k % 3 else (0.9, 0.95, 1.0)
        ob.data.materials.append(mat_emit(f'sl{k}', col, 9.0)); ob.hide_render = True
        STREAMS.append((cv, ob, random.uniform(0.7, 1.3), random.uniform(0, 1)))
    return sc

def shake(t, a, f=1.0):
    return Vector((sin(t * 37 * f) + .6 * sin(t * 91 * f + 1), sin(t * 41 * f + 2) + .6 * sin(t * 83 * f), sin(t * 29 * f + 4) + .5 * sin(t * 71 * f))) * a

T_FLY_END, T_TYRE, T_AIR, T_MIST, T_HERO, T_FINAL = 1.15, 5.6, 8.75, 11.55, 15.7, 17.9
FINAL_REF = None
_SW = 0.0
def shot(t, cy):
    car = Vector((0, cy, 0))
    if t < T_FLY_END:  # roadside low flyby; camera pans with the car
        return Vector((2.6, 0, 0.3)), Vector((0, cy, 0.5)), lerp(28, 20, t / T_FLY_END), 0.0
    if t < T_TYRE:
        u = (t - T_FLY_END) / (T_TYRE - T_FLY_END); e = sstep(0, 1, u)
        loc = car + Vector((lerp(-3.4, -2.2, e), lerp(-6.2, -5.4, e), lerp(0.4, 0.62, e))) + shake(t, 0.012)
        return loc, car + Vector((0, -0.6, 0.45)), lerp(32, 38, u), lerp(-3, 2, u)
    if t < T_AIR:  # front wheel approach (car's right side is -X)
        u = (t - T_TYRE) / (T_AIR - T_TYRE); e = sstep(0, 1, u)
        loc = car + vlerp((-4.6, -4.2, 0.9), (-1.8, -1.5, 0.5), e) + shake(t, 0.008)
        return loc, car + vlerp((-0.5, -1.5, 0.45), (-0.8, -1.28, 0.34), e), lerp(35, 70, e), lerp(5, -1, e)
    if t < T_MIST:  # side profile
        u = (t - T_AIR) / (T_MIST - T_AIR); e = sstep(0, 1, u)
        return car + Vector((lerp(-8.4, -6.8, e), lerp(-2.2, 0.8, u), lerp(0.85, 1.0, u))) + shake(t, 0.008), car + Vector((0, 0.1 * u, 0.6)), 32, 0.0
    if t < T_HERO:  # shaky chase behind
        u = (t - T_MIST) / (T_HERO - T_MIST); e = sstep(0, 1, u)
        sh = shake(t, 0.03 + 0.05 * sstep(0.2, 1, u), 1.3)
        return car + Vector((lerp(0.9, -0.5, e), lerp(7.2, 5.2, u), lerp(0.55, 0.85, e))) + sh, car + Vector((0, -2.0, 0.55)) + sh * 0.5, lerp(34, 28, u), 3 * sin(t * 2.1) * (0.3 + u)
    if t < T_FINAL:  # hero crane
        u = (t - T_HERO) / (T_FINAL - T_HERO); e = sstep(0, 1, u)
        ang = lerp(0.12, -0.78, e) * pi; r = lerp(5.5, 6.4, e)
        return car + Vector((sin(ang) * r, cos(ang) * r, lerp(0.7, 1.7, e))), car + Vector((0, -0.6, 0.5)), lerp(34, 30, e), 0.0
    # final flyby: fixed roadside camera ahead; car blasts past at t~19.35 then recedes
    loc = Vector((3.6, -(travelled(19.35) - travelled(0.8)), 0.42))
    return loc, Vector((0, cy, 0.5)), lerp(55, 26, sstep(0, 1, (t - T_FINAL) / 1.6)), 0.0

def set_frame(t):
    cy = car_y(t)
    ROOT.location = (0, cy, 0.004 * sin(t * 61))
    wob = 0.5 * sin((t - 12.2) * 9) * exp(-((t - 13.6) ** 2) / 1.6) if 12.2 < t < 15.5 else 0.0
    ROOT.rotation_euler = (0.0035 * sin(t * 53), 0.004 * sin(t * 47 + 1), wob * 0.035)
    for w in WHEELS: w.rotation_euler = (2 * pi * 1.8 * t, 0, 0)   # 1.8 rev/s displayed (legible)
    loc, tgt, lens, roll = shot(t, cy)
    CAM.location = loc; CAM.data.lens = lens
    CAM.rotation_euler = (tgt - loc).to_track_quat('-Z', 'Y').to_euler()
    CAM.rotation_euler.rotate_axis('Z', math.radians(roll))
    P = 45.0; base = round(loc.y / P) * P
    for p, sx, i in POLES: p.location = (sx * 9.2, base + (i - 20) * P + (P / 2 if sx < 0 else 0), 5.5)
    PP = 12.0; pb = round(loc.y / PP) * PP
    for p, sx, i in POSTS: p.location = (sx * 7.5, pb + (i - 60) * PP, 0.5)
    G = 120.0; gb = round(loc.y / G) * G
    for i, (a, b) in enumerate(GANTS):
        a.location = (0, gb + (i - 5) * G, 7.5); b.location = (0, gb + (i - 5) * G, 7.0)
    CP = 400.0; cb = round(loc.y / CP) * CP
    for o, sx, i, dx, jy in CITY: o.location = (sx * (dx + 14), cb + (i - 18) * (CP / 9) + jy, 0.0)  # mesh spans 0..h after transform_apply
    PL = 20.0
    for o, x, z, ph in PARTS:
        o.location = (x, round(loc.y / 90) * 90 + (ph - 0.5) * 90, z)
    MOON.location = (-260 * 1.0, loc.y - 900, 190)
    on = T_AIR <= t < 11.8
    for cv, ob, spd, ph in STREAMS:
        ob.hide_render = not on
        if on:
            head = ((t - T_AIR) * 0.75 * spd + ph) % 1.35
            st = max(0.0, head - 0.30); cv.bevel_factor_start = st; cv.bevel_factor_end = max(min(1.0, head), st + 1e-4)
    sw = cy + lerp(-2.7, 2.7, sstep(10.0, 11.6, t)) if 10.0 < t < 12.0 else -1e6
    global _SW
    if sw != _SW:
        _SW = sw
        for n in CUTV: n.outputs[0].default_value = sw

def render(t, path, scale=1.0, samples=None):
    sc = bpy.context.scene
    sc.render.resolution_percentage = int(scale * 100)
    if samples: sc.eevee.taa_render_samples = samples
    set_frame(t)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
