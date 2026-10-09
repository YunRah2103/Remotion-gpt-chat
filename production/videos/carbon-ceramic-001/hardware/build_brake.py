#!/usr/bin/env python3
"""Generate the original carbon-ceramic one-corner brake in real Blender.

Usage:
  blender --background --factory-startup --python build_brake.py -- /tmp/brake-proof

Outputs (once executed in Blender):
  carbon-ceramic-brake.blend, carbon-ceramic-brake.glb,
  rotor-front.png, exploded.png, pad-contact.png, ventilation.png,
  rig-manifest.json, build-report.json.

Units are metres. Blender is Z-up, rotor axle X. Standard glTF Y-up export:
  glTF(x,y,z) = Blender(x,z,-y). The X axle is invariant.
NO manufacturer/CAD accuracy is claimed.
"""
from __future__ import annotations
import bpy
import math
import json
import hashlib
import os
import sys
from pathlib import Path
from mathutils import Vector

ASSET_ID = "carbon-ceramic-brake"
D = {"outerDiameterM": .390, "outerRadiusM": .195,
     "innerFrictionRadiusM": .113, "faceThicknessM": .0048,
     "faceOuterX": .0107, "faceInnerX": -.0155,
     "totalRotorThicknessM": .031, "ventCount": 44,
     "boreCountPerFace": 64, "restPadGapM": .0025}
ROOT_NAMES = ("RotorAssembly","FrictionRing","RotorHat","Hub",
              "CaliperBody","PadInner","PadOuter","UprightSupport")
created = []

def material(name, color, metallic, roughness, texture=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color,1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if texture:
        # Original deterministic bitmap; unlike unbaked Blender noise it
        # survives glTF as a real packed texture.
        image = bpy.data.images.new("OriginalCarbonCeramicGrain",128,128,alpha=False)
        state=0x71c0FFAE
        rgba=[]
        for _ in range(128*128):
            state=(1664525*state+1013904223)&0xffffffff
            grey=(65+(state>>26)*.24)/255
            rgba.extend((grey,grey*1.016,grey*1.028,1))
        image.pixels[:]=rgba
        image.pack()
        tex=m.node_tree.nodes.new("ShaderNodeTexImage")
        tex.name="CarbonCompositeSurface";tex.image=image
        m.node_tree.links.new(tex.outputs["Color"],bsdf.inputs["Base Color"])
    m.diffuse_color=(*color,1)
    return m

CARBON=material("C_CERAMIC___woven_grain",(.23,.247,.26),.10,.82,True)
VENT=material("Carbon___vent_inner_surface",(.12,.135,.15),.10,.87)
HAT=material("AnodizedAluminium___machined",(.36,.42,.46),.73,.39)
STEEL=material("SatinSteel___bolts_and_carrier",(.34,.38,.41),.77,.40)
CALIPER=material("ForgedCaliper___blue_titanium",(.11,.18,.24),.55,.44)
ACCENT=material("Piston___nickel",(.53,.57,.58),.82,.34)
PAD=material("FrictionLining___graphite",(.095,.09,.087),.035,.93)
PADBACK=material("PadBacking___dark_steel",(.12,.15,.16),.68,.47)
RUBBER=material("Seal___rubber",(.027,.032,.038),.02,.89)

def parent(obj, target):
    if target:
        obj.parent=target
        # Keep physical offsets local for pivot-safe animation.
    if obj.type=="MESH":
        created.append(obj)
    return obj

def empty(name, parent_obj=None, loc=(0,0,0)):
    o=bpy.data.objects.new(name,None)
    bpy.context.scene.collection.objects.link(o)
    o.empty_display_type='PLAIN_AXES';o.empty_display_size=.018
    parent(o,parent_obj);o.location=loc
    return o

def activate(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True);bpy.context.view_layer.objects.active=o

def cylinder(name, radius, depth, center, mat, parent_obj=None, verts=64, bevel=.0005):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius,
        depth=depth, location=center, rotation=(0,math.pi/2,0))
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    parent(o,parent_obj)
    if bevel:
        m=o.modifiers.new("machined_edge_bevel","BEVEL")
        m.width=bevel;m.segments=2;m.limit_method='ANGLE'
        o.modifiers.new("corner_normals","WEIGHTED_NORMAL")
    return o

def cube(name, loc, dimensions, mat, parent_obj=None, bevel=.003):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name
    o.dimensions=dimensions;activate(o)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat);parent(o,parent_obj)
    if bevel:
        b=o.modifiers.new("CNC_edge_radii","BEVEL")
        b.width=bevel;b.segments=3;b.limit_method='ANGLE'
        o.modifiers.new("corner_normals","WEIGHTED_NORMAL")
    return o

def boolean_difference(target, cutter):
    activate(target)
    mod=target.modifiers.new("real_drilled_and_annular_cutouts","BOOLEAN")
    mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)

def sector_mesh(name, inner, outer, half_width, centre,
                x0, x1, mat, parent_obj, segments=24):
    # Curved annular pad/caliper section: true closed watertight manifold.
    rim=[]
    for i in range(segments+1):
        a=centre-half_width+2*half_width*i/segments
        rim.append((outer*math.sin(a),outer*math.cos(a)))
    for i in range(segments,-1,-1):
        a=centre-half_width+2*half_width*i/segments
        rim.append((inner*math.sin(a),inner*math.cos(a)))
    N=len(rim)
    verts=[(x,y,z) for x in (x0,x1) for (y,z) in rim]
    faces=[tuple(reversed(range(N))),tuple(range(N,N*2))]
    for i in range(N):
        j=(i+1)%N
        faces.append((i,j,j+N,i+N))
    mesh=bpy.data.meshes.new(name+"_mesh")
    mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat);parent(obj,parent_obj)
    bevel=obj.modifiers.new("micro_bevel","BEVEL")
    bevel.width=.00065;bevel.segments=2;bevel.limit_method='ANGLE'
    obj.modifiers.new("normals","WEIGHTED_NORMAL")
    return obj

def forged_shell(name, side, centre, holder):
    """One smoothly convex closed, machined fixed-caliper cheek.
    Curvature varies both around the disc and radially; unlike a flat box
    this casts genuine continuous 3D highlights in native Blender and GLB.
    The inner surface x=+/-0.0365 stays clear of both 31 mm rotor faces.
    """
    n_a = 26
    n_r = 8
    verts = []
    def point(t, u, layer):
        a = centre - .295 + .590*t
        scallop=math.sin(3*math.pi*t)**2
        r0=.142+.008*scallop
        r1=.217-.012*scallop
        r=r0+(r1-r0)*u
        lobes=.5+.5*math.cos(6*math.pi*t)
        envelope=(max(0,math.sin(math.pi*u))**.65)*(.5+.5*lobes)
        x=side*(.0365 if layer else (.055+.015*envelope))
        return (x,r*math.sin(a),r*math.cos(a))
    for layer in (0,1):
        for i in range(n_a+1):
            for j in range(n_r+1):
                verts.append(point(i/n_a,j/n_r,layer))
    n = (n_a+1)*(n_r+1)
    def cell(layer,i,j):
        return layer*n+i*(n_r+1)+j
    faces=[]
    for i in range(n_a):
        for j in range(n_r):
            p=(cell(0,i,j),cell(0,i+1,j),cell(0,i+1,j+1),
               cell(0,i,j+1))
            # Correct winding for +/- axial faces, and opposite for inside.
            faces.append(p if side>0 else tuple(reversed(p)))
            q=(cell(1,i,j),cell(1,i+1,j),cell(1,i+1,j+1),
               cell(1,i,j+1))
            faces.append(tuple(reversed(q)) if side>0 else q)
    loop=[]
    for i in range(n_a+1):loop.append((i,0))
    for j in range(1,n_r+1):loop.append((n_a,j))
    for i in range(n_a-1,-1,-1):loop.append((i,n_r))
    for j in range(n_r-1,0,-1):loop.append((0,j))
    for k,(i,j) in enumerate(loop):
        a=cell(0,i,j);b=cell(0,*loop[(k+1)%len(loop)])
        c=cell(1,*loop[(k+1)%len(loop)]);d=cell(1,i,j)
        f=(a,b,c,d)
        faces.append(tuple(reversed(f)) if side>0 else f)
    mesh=bpy.data.meshes.new(name+"_mesh")
    mesh.from_pydata(verts,[],faces);mesh.update()
    ob=bpy.data.objects.new(name,mesh)
    bpy.context.scene.collection.objects.link(ob);parent(ob,holder)
    ob.data.materials.append(CALIPER)
    for polygon in ob.data.polygons:polygon.use_smooth=True
    b=ob.modifiers.new("forging_transition_bevel","BEVEL")
    b.width=.0012;b.segments=3;b.limit_method='ANGLE'
    ob.modifiers.new("weighted_forging_normals","WEIGHTED_NORMAL")
    return ob

def vane_mesh(name, index, ring_parent):
    # Curved radial C-shaped pumping vane, NOT a solid spacer filling a vent.
    a0=2*math.pi*index/D["ventCount"]
    corners=[]
    for k in range(9):
        r=.117+(.191-.117)*k/8
        a=a0+.13*k/8
        corners.append((r*math.sin(a),r*math.cos(a)))
    for k in range(8,-1,-1):
        r=.117+(.191-.117)*k/8
        a=a0+.13*k/8+.056
        corners.append((r*math.sin(a),r*math.cos(a)))
    N=len(corners);verts=[]
    for x in (-.0105,.0105):
        verts.extend([(x,y,z) for y,z in corners])
    faces=[tuple(reversed(range(N))),tuple(range(N,2*N))]
    faces.extend((i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N))
    m=bpy.data.meshes.new(name+"_mesh");m.from_pydata(verts,[],faces);m.update()
    obj=bpy.data.objects.new(name,m)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(VENT);parent(obj,ring_parent)

def construct():
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene
    scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1.0
    rotor=empty("RotorAssembly")
    ring=empty("FrictionRing",rotor)
    # Two separate outer friction plates. True 64 drilled/perforated holes
    # per face and true central cavity cut with ONE multi-body boolean.
    face1=cylinder("CarbonCeramicFace_Inboard",.195,.0048,
                   (-.0131,0,0),CARBON,ring,verts=192,bevel=0)
    face2=cylinder("CarbonCeramicFace_Outboard",.195,.0048,
                   (.0131,0,0),CARBON,ring,verts=192,bevel=0)
    bores=[]
    bores.append(cylinder("RingCentralCut",.113,.12,(0,0,0),
                          VENT,None,verts=144,bevel=0))
    for bank in range(2):
        r=.147 if bank==0 else .175
        for i in range(32):
            a=(i+.47*bank)*2*math.pi/32
            bores.append(cylinder("Bore_%d_%02d"%(bank,i),
                .0027 if bank==0 else .0031,.12,
                (0,r*math.sin(a),r*math.cos(a)),VENT,None,verts=12,bevel=0))
    bpy.ops.object.select_all(action='DESELECT')
    for bore in bores:bore.select_set(True)
    bpy.context.view_layer.objects.active=bores[0]
    bpy.ops.object.join()
    cutter=bores[0];cutter.name="TEMP_BoreBooleanUnion"
    # After joining, the cutter consists of 65 disjoint positive solids.
    for face in (face1,face2):
        boolean_difference(face,cutter)
        edge=face.modifiers.new("DiscMicroEdge","BEVEL")
        edge.width=.00022;edge.segments=1;edge.limit_method='ANGLE'
        face.modifiers.new("FaceNormals","WEIGHTED_NORMAL")
    bpy.data.objects.remove(cutter,do_unlink=True)
    for i in range(D["ventCount"]):
        vane_mesh("CurvedCoolingVane_%02d"%(i+1),i,ring)
    # Hat and rotor spin together. Hat is a separate hierarchy branch.
    hat=empty("RotorHat",rotor)
    cylinder("AluminiumHatBell",.108,.010,(.011,0,0),HAT,hat,96)
    cylinder("HatCentreRegister",.067,.026,(.020,0,0),STEEL,hat,72)
    cylinder("HatLocatingFlange",.113,.004,(.005,0,0),HAT,hat,120)
    for i in range(12):
        a=i*math.tau/12
        y,z=.109*math.sin(a),.109*math.cos(a)
        cylinder("FloatingBobbin_%02d"%(i+1),.0053,.032,(0,y,z),
                 STEEL,hat,16,.0003)
        cylinder("BobbinHead_%02d"%(i+1),.0068,.0028,
                 (.018,y,z),ACCENT,hat,20,.00015)
    for i in range(6):
        a=i*math.tau/6
        y,z=.090*math.sin(a),.090*math.cos(a)
        cylinder("HatMountScrew_%02d"%(i+1),.0045,.004,
                 (.018,y,z),STEEL,hat,16,.00015)
    hub=empty("Hub",rotor)
    cylinder("FrontWheelHub",.049,.047,(.031,0,0),STEEL,hub,80)
    cylinder("HubCentrePilot",.036,.012,(.056,0,0),HAT,hub,60)
    for i in range(5):
        a=i*math.tau/5
        cylinder("WheelStud_%d"%(i+1),.0058,.027,
            (.060,.034*math.sin(a),.034*math.cos(a)),
            ACCENT,hub,16,.0003)

    # Caliper sector centre is -45 degrees in Blender YZ.
    # Blender -> glTF Y-up puts the caliper in positive Y and Z.
    sector=-math.pi/4
    body=empty("CaliperBody")
    for side in (-1,1):
        if side<0:
            x0,x1=-.064,-.037
        else:
            x0,x1=.037,.064
        cheek = forged_shell(
            "ForgedCaliperCheek_%s"%("Inboard" if side<0 else "Outboard"),
            side,sector,body)
        # Two purposeful cast ribs and a satin retaining bridge; they follow
        # the rotor circumference instead of making a rectangular silhouette.
        for rib, offset in enumerate((-.185,.185)):
            sector_mesh("CheekReinforcement_%s_%d"%("I" if side<0 else "O",rib),
                .143,.202,.045,sector+offset,
                (-.068 if side<0 else .060),
                (-.060 if side<0 else .068),CALIPER,body,12)
        sector_mesh("ForgingEdgeTrim_%s"%("Inboard" if side<0 else "Outboard"),
            .210,.215,.235,sector,
            (-.060 if side<0 else .056),
            (-.056 if side<0 else .060),HAT,body,24)
        for j,angleOffset in enumerate((-.17,0,.17)):
            angle=sector+angleOffset;r=.163
            cy,cz=r*math.sin(angle),r*math.cos(angle)
            cylinder("PistonBore_%s_%d"%(side,j+1),.015,.007,
                     (side*.033,cy,cz),STEEL,body,40,.0004)
            cylinder("StainlessPiston_%s_%d"%(side,j+1),.012,.004,
                     (side*.028,cy,cz),ACCENT,body,48,.0002)
            cylinder("DustSeal_%s_%d"%(side,j+1),.013,.001,
                     (side*.0295,cy,cz),RUBBER,body,48,0)
    # Three short structural bridges leave real open windows between
    # caliper cheeks. The earlier single continuous sector obscured the
    # piston bosses and pad backing in the hero view.
    for bridge_idx, offset in enumerate((-.220,0,.220)):
        sector_mesh(
            "OuterAxialCaliperBridge" if bridge_idx==1 else
            "CaliperEndBridge_%02d"%bridge_idx,
            .205,.231,.043,sector+offset,
            -.068,.068,CALIPER,body,14)
    sector_mesh("BridgeSatinCrown",.228,.232,.230,sector,
                -.042,.042,CALIPER,body,24)
    for a in (sector-.22,sector+.22):
        y=.205*math.sin(a);z=.205*math.cos(a)
        cylinder("BridgeRetainer_%.2f"%a,.005,.133,(0,y,z),ACCENT,body,16,.00025)
    cube("CaliperHydraulicInlet",(-.062,-.096,.120),
         (.018,.024,.022),ACCENT,body,.003)
    cylinder("BleedNipple",.0042,.020,(-.068,-.087,.148),ACCENT,body,12,.0001)
    cube("CaliperMountBracket",(-.073,-.100,.082),
         (.021,.062,.033),STEEL,body,.003)
    for i in range(2):
        cube("CaliperHousingRib_%d"%i,(-.054,-.115+i*.035,.146-i*.014),
             (.005,.025,.021),HAT,body,.002)

    # Pads remain separate root pivots. They translate ONLY along global X.
    # Outer friction face at +/-0.0155m; linings rest at +/-0.018m.
    padInner=empty("PadInner")
    padOuter=empty("PadOuter")
    sector_mesh("InnerPadFrictionLining",.126,.190,.245,sector,
                -.027,-.018,PAD,padInner)
    sector_mesh("InnerPadStainlessBacking",.124,.192,.254,sector,
                -.0305,-.027,PADBACK,padInner)
    sector_mesh("InnerAntiSquealShim",.125,.191,.248,sector,
                -.0312,-.0306,ACCENT,padInner)
    sector_mesh("OuterPadFrictionLining",.126,.190,.245,sector,
                .018,.027,PAD,padOuter)
    sector_mesh("OuterPadStainlessBacking",.124,.192,.254,sector,
                .027,.0305,PADBACK,padOuter)
    sector_mesh("OuterAntiSquealShim",.125,.191,.248,sector,
                .0306,.0312,ACCENT,padOuter)
    # Metallic retention ears are axially behind the friction compound,
    # not placed between pad and rotor; pad groups remain independently mobile.
    for root,side in ((padInner,-1),(padOuter,1)):
        for tag,a in enumerate((sector-.225,sector+.225)):
            r=.177
            y,z=r*math.sin(a),r*math.cos(a)
            cube("PadCarrierEar_%s_%d"%("inner" if side<0 else "outer",tag),
                (side*.033,y,z),(.006,.011,.012),PADBACK,root,.0017)
    for group,s in ((padInner,-1),(padOuter,1)):
        for i,a in enumerate((sector-.18,sector+.18)):
            y,z=.177*math.sin(a),.177*math.cos(a)
            cylinder("BackingLocator_%s_%d"%("I" if s<0 else "O",i),
                     .004,.002,(s*.031,y,z),STEEL,group,12,.0001)

    upright=empty("UprightSupport")
    cylinder("UprightBearingCarrier",.067,.022,(-.073,0,0),
             STEEL,upright,80,.002)
    cube("UprightForgedArm",(-.081,-.024,.085),(.027,.042,.128),
         HAT,upright,.008)
    cube("UprightAnchorEar",(-.078,-.094,.102),(.030,.044,.047),
         STEEL,upright,.004)

def setup_stage(out):
    scene=bpy.context.scene
    # A prior real GitHub Ubuntu run failed with "Build without
    # OpenImageDenoiser". Prefer headless Cycles CPU at modest samples,
    # deliberately WITHOUT denoising; Eevee needs a usable OpenGL context.
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 24
    if hasattr(scene.cycles, 'use_adaptive_sampling'):
        scene.cycles.use_adaptive_sampling = True
    if hasattr(scene.cycles, 'use_preview_denoising'):
        scene.cycles.use_preview_denoising = False
    if hasattr(scene, 'cycles') and hasattr(scene.cycles, 'use_denoising'):
        scene.cycles.use_denoising = False
    for layer in scene.view_layers:
        if hasattr(layer, 'cycles') and hasattr(layer.cycles, 'use_denoising'):
            layer.cycles.use_denoising = False
    scene.render.threads_mode='FIXED'
    scene.render.threads=2
    scene.render.resolution_x=900
    scene.render.resolution_y=900
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.film_transparent=False
    # Controlled studio view transform prevents highlight washout.
    view=scene.view_settings
    # Direct attempts matter: the Blender 4.0 distro exposes dynamic OCIO
    # transforms that are absent from static RNA enum_items.
    for transform in ('AgX','Filmic','Standard'):
        try:
            view.view_transform=transform
            break
        except (TypeError,ValueError):
            continue
    view.exposure=-0.85
    view.gamma=1.0
    for look in ('Medium High Contrast','AgX - Medium High Contrast',
                 'Medium Contrast','None'):
        try:
            view.look=look
            break
        except (TypeError,ValueError):
            continue
    print('POLISH03_COLOR_MANAGEMENT',view.view_transform,view.look,view.exposure)
    world=bpy.data.worlds.new("NightStudio")
    scene.world=world;world.use_nodes=True
    world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.012,.018,.025,1)
    world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.30
    def area(name,loc,power,colour,size):
        dat=bpy.data.lights.new(name,'AREA');dat.energy=power
        dat.color=colour;dat.shape='DISK';dat.size=size
        o=bpy.data.objects.new(name,dat);scene.collection.objects.link(o)
        o.location=loc;direction=Vector((0,0,0))-o.location
        o.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    area("Key softbox",(.49,-.35,.43),8,(.93,.97,1.0),.68)
    area("Shadow lift",(-.29,.33,.36),3,(1.0,.89,.81),.72)
    area("Vent rim",(-.18,-.18,.55),5,(.78,.88,1.0),.38)
    camera=bpy.data.cameras.new("Hero camera")
    cam=bpy.data.objects.new("Hero camera",camera)
    scene.collection.objects.link(cam);scene.camera=cam
    camera.type='ORTHO';camera.ortho_scale=.53
    def shot(name,position,target,scale):
        cam.location=position
        direction=Vector(target)-cam.location
        cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
        camera.ortho_scale=scale
        path = out/(name+".png")
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        if not path.is_file() or path.stat().st_size < 4000:
            raise RuntimeError("Native close-up proof missing/suspiciously small: "+str(path))
    shot("rotor-front",(.62,-.27,.34),(.008,-.04,.04),.50)
    shot("ventilation",(.38,-.59,.30),(.005,0,.0),.51)
    # Proof-only exploded assemblies, avoid changing canonical GLB rest.
    rotHat=bpy.data.objects["RotorHat"]
    hub=bpy.data.objects["Hub"]
    i=bpy.data.objects["PadInner"];o=bpy.data.objects["PadOuter"]
    rotHat.location.x+=.045;hub.location.x+=.10
    i.location.x-=.060;o.location.x+=.060
    shot("exploded",(.74,-.40,.35),(.015,-.015,.06),.65)
    rotHat.location.x-=.045;hub.location.x-=.10
    i.location.x+=.060;o.location.x-=.060
    shot("pad-contact",(.49,-.37,.28),(.0,-.112,.133),.28)

def main(output):
    out=Path(output).resolve();out.mkdir(parents=True,exist_ok=True)
    construct()
    # The real asset export contains ONLY hardware (no proof lights or camera).
    hardware=set()
    for root in ROOT_NAMES:
        p=bpy.data.objects[root]
        hardware.add(p.name)
        hardware.update(ch.name for ch in p.children_recursive)
    bpy.ops.object.select_all(action='DESELECT')
    for name in hardware:bpy.data.objects[name].select_set(True)
    bpy.context.view_layer.objects.active=bpy.data.objects["RotorAssembly"]
    glb=out/(ASSET_ID+".glb")
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',
       use_selection=True,export_extras=True,export_yup=True,
       export_animations=False,export_cameras=False,export_lights=False,
       export_normals=True,export_texcoords=True)
    if not glb.is_file() or glb.stat().st_size<10240:
        raise RuntimeError("GLB export too small or missing")
    manifest={
      "schemaVersion":1,"asset":ASSET_ID,"unit":"metres",
      "source":"Original procedural one-corner road-car demonstration; no manufacturer CAD",
      "axis":{"axle":[1,0,0],"up":[0,1,0],"discPlane":"YZ",
        "blenderToGlTF":"(x,y,z) -> (x,z,-y)"},
      "dimensions":D,
      "nodes":{name:{"animation":("rotation-X" if name=="RotorAssembly" else
          "translation+X" if name=="PadInner" else
          "translation-X" if name=="PadOuter" else "static-child" if name in
          ("FrictionRing","RotorHat","Hub") else "stationary"),
         "blenderRestLocation":list(bpy.data.objects[name].location)}
           for name in ROOT_NAMES},
      "children":{name:[o.name for o in bpy.data.objects[name].children]
                  for name in ROOT_NAMES},
      "hashes":{"glbSha256":hashlib.sha256(glb.read_bytes()).hexdigest()},
      "glbBytes":glb.stat().st_size,
      "caveats":["Geometry is illustrative, not certified CAD.",
                 "Heat is NOT simulated by this static material asset.",
                 "No direct claim of measured temperatures."],
    }
    (out/"rig-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    setup_stage(out)
    # Save the final real studio lights and proof camera in the .blend.
    bpy.ops.wm.save_as_mainfile(filepath=str(out/(ASSET_ID+".blend")))
    report={"status":"REAL_BLENDER_BUILD_PASS",
        "blenderVersion":bpy.app.version_string,
        "blenderFile":ASSET_ID+".blend","glb":glb.name,
        "glbSha256":manifest["hashes"]["glbSha256"],
        "objectCount":len(hardware),
        "proofImages":["rotor-front.png","exploded.png",
                       "pad-contact.png","ventilation.png"],
        "renderEngine":bpy.context.scene.render.engine,
        "renderDenoisingDisabled":True,
        "sourceSha":os.environ.get("GITHUB_SHA","local"),
        "colorManagement":{"transform":bpy.context.scene.view_settings.view_transform,
                           "look":bpy.context.scene.view_settings.look,
                           "exposure":bpy.context.scene.view_settings.exposure},
        "studioLightWatts":{"key":8,"fill":3,"rim":5}}
    (out/"build-report.json").write_text(json.dumps(report,indent=2)+"\n")
    print("BRAKE_HARDWARE_PROOF_PASS",json.dumps(report))

if __name__=="__main__":
    if "--" not in sys.argv or len(sys.argv[sys.argv.index("--")+1:])!=1:
        raise SystemExit("Usage: blender -b --python build_brake.py -- OUTPUT_DIR")
    main(sys.argv[sys.argv.index("--")+1])
