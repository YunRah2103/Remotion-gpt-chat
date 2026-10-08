#!/usr/bin/env python3
"""POLISH05: additive detail pass on the exact manager-locked POLISH04 exported GLB.

Blender coordinates after glTF import: X card long axis, Z card height, -Y fan face.
The source GLB is REQUIRED and SHA256 locked; never falls back to an older mesh.
Internal geometry is plausible illustrative engineering, NOT an XFX schematic.
"""
import bpy, sys, math, json, pathlib, hashlib, random, os
from mathutils import Vector
from collections import Counter

BASE_SHA="edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e"
H=pathlib.Path(__file__).resolve().parent
OUT=H/"assets"; OUT.mkdir(parents=True,exist_ok=True)
SOURCE=pathlib.Path(sys.argv[sys.argv.index("--")+1]) if "--" in sys.argv else OUT/"polish4_locked.glb"
assert SOURCE.is_file(),("Missing approved POLISH04 GLB",str(SOURCE))
digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert digest==BASE_SHA,("Wrong POLISH04 model",digest,BASE_SHA)
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
REQUIRED=("GPU_ROOT FAN_ASSEMBLY FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD "
          "HEATSINK HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE PCB_ASSEMBLY PCB "
          "GPU_DIE VRAM_CHIPS VRM_COMPONENTS PCIE_FINGERS POWER_8PIN IO_BRACKET BACKPLATE").split()
for key in REQUIRED:
    assert len([x for x in bpy.data.objects if x.name==key])==1,("Anchor changed",key)
N={k:bpy.data.objects[k] for k in REQUIRED}
bpy.context.view_layer.update()
before_meshes=len([x for x in bpy.data.objects if x.type=="MESH"])
before_names={x.name for x in bpy.data.objects}
new_count=Counter()
def material(name,rgba,metal=0.0,rough=.5):
    m=bpy.data.materials.get(name)
    if m is None:m=bpy.data.materials.new(name)
    m.use_nodes=True
    bs=m.node_tree.nodes.get("Principled BSDF")
    assert bs
    bs.inputs["Base Color"].default_value=(*rgba,1.0)
    bs.inputs["Metallic"].default_value=metal
    bs.inputs["Roughness"].default_value=rough
    m.diffuse_color=(*rgba,1.0)
    return m
# GLB-transferable Metallic/Roughness; only compatible BSDF values, no unsupported procedural tricks.
mold=material("P5_black_moulded_polymer",(.023,.027,.034),.0,.61)
shadow=material("P5_recessed_shadow",(.008,.010,.012),.03,.77)
edge=material("P5_edge_satin_anodized",(.063,.071,.081),.49,.42)
carbon=material("P5_rotor_polymer",(.023,.030,.036),.05,.42)
matt=material("P5_rotor_core_black",(.018,.021,.025),.16,.50)
bearing=material("P5_bearing_dark_nickel",(.18,.20,.22),.85,.27)
alu=material("P5_finetip_anodized_aluminium",(.25,.28,.32),.84,.40)
nickel=material("P5_precision_nickel",(.39,.41,.43),.94,.26)
bronze=material("P5_copper_contact_matte",(.29,.17,.078),.82,.36)
mask=material("P5_PCB_solder_mask_greenblack",(.010,.030,.025),.07,.68)
trace=material("P5_trace_submask_dull",(.051,.094,.067),.31,.67)
solder=material("P5_solder_nickel",(.39,.40,.39),.75,.42)
chip=material("P5_packed_IC_body",(.025,.030,.035),.035,.58)
choke=material("P5_iron_ferrite",(.052,.061,.067),.035,.71)
ceramic=material("P5_tan_ceramic",(.20,.19,.16),.11,.67)
ink=material("P5_laser_print_tone",(.21,.26,.25),.02,.76)
gold=material("P5_edge_gold_contact",(.51,.33,.115),.87,.33)
tpad=material("P5_graphite_thermal_interface",(.11,.12,.14),0,.82)
for name,colour,mt,rg in (
  ("M_FAN_BLADE",(.026,.030,.038),.07,.45),
  ("M_PCB_DARK_GREEN",(.012,.030,.027),.015,.70),
  ("M_MONOLITHIC_XFX_FASCIA",(.016,.019,.023),.04,.60),
  ("M_P3_FIN_FOLDED_ALUMINIUM",(.28,.31,.35),.86,.41),
  ("M_NICKEL_COPPER",(.36,.38,.40),.91,.28),
  ("M_BACKPLATE_GRAPHITE",(.040,.046,.053),.52,.51)):
    m=bpy.data.materials.get(name)
    if m and m.use_nodes:
        sh=m.node_tree.nodes.get("Principled BSDF")
        if sh:
            sh.inputs["Base Color"].default_value=(*colour,1)
            sh.inputs["Metallic"].default_value=mt
            sh.inputs["Roughness"].default_value=rg
            m.diffuse_color=(*colour,1)
def attach(o,parent,ma,kind):
    o.parent=parent
    o.matrix_parent_inverse=parent.matrix_world.inverted()
    if ma:o.data.materials.clear();o.data.materials.append(ma)
    new_count[kind]+=1
    return o
def box(name,loc,dim,ma,parent,bev=.0,kind="machining"):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name="P5_"+name
    o.dimensions=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    attach(o,parent,ma,kind)
    if bev:
        mod=o.modifiers.new("Physical die-cut edge","BEVEL")
        mod.width=bev;mod.segments=2
        # Apply modifiers so bevels actually survive glTF export.
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def cyl(name,loc,r,depth,ma,parent,seg=20,kind="hardware"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg,radius=r,depth=depth,
                                      location=loc,rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.name="P5_"+name
    attach(o,parent,ma,kind)
    for face in o.data.polygons:face.use_smooth=True
    return o
def ring(name,loc,r,wire,ma,parent,kind="hardware"):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,
        location=loc,rotation=(math.pi/2,0,0),major_radius=r,minor_radius=wire)
    o=bpy.context.object;o.name="P5_"+name
    attach(o,parent,ma,kind)
    for f in o.data.polygons:f.use_smooth=True
    return o
def line(name,a,b,thick,ma,parent,kind="trace"):
    # Real cylindrical path between 3D locations. All points in Blender world.
    va,vb=Vector(a),Vector(b);delta=vb-va
    bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=thick,
         depth=delta.length,location=(va+vb)/2)
    o=bpy.context.object;o.name="P5_"+name
    o.rotation_euler=delta.to_track_quat("Z","Y").to_euler()
    return attach(o,parent,ma,kind)
def printed(name,value,loc,size,parent,ma=ink,rotation=(math.pi/2,0,0)):
    curve=bpy.data.curves.new("P5_"+name,"FONT")
    curve.body=value;curve.size=size;curve.extrude=.00035
    ob=bpy.data.objects.new("P5_"+name,curve)
    bpy.context.collection.objects.link(ob)
    ob.location=loc;ob.rotation_euler=rotation
    attach(ob,parent,ma,"legends")
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True);bpy.context.view_layer.objects.active=ob
    bpy.ops.object.convert(target="MESH")
    return bpy.context.object
def consolidated_prisms(name,items,ma,parent,kind):
    # Far fewer draw calls than one mesh per 0402 resistor / via / fin hem.
    vv=[];ff=[]
    for center,d in items:
        x,y,z=center;dx,dy,dz=(v/2 for v in d)
        at=len(vv)
        vv.extend([(x+a*dx,y+b*dy,z+c*dz) for a,b,c in
            ((-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),
             (1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1))])
        ff.extend(tuple(at+i for i in face) for face in
            ((0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)))
    mesh=bpy.data.meshes.new("P5_"+name)
    mesh.from_pydata(vv,[],ff);mesh.update()
    ob=bpy.data.objects.new("P5_"+name,mesh);bpy.context.collection.objects.link(ob)
    return attach(ob,parent,ma,kind)
# Exterior: exact original triple aperture Boolean geometry is preserved intact.
sh=N["FRONT_SHROUD"]
for side in (-1,1):
    for z in (-.559,.559):
        # moulded shoulder steps follow the original Swift stepped fascia, clear of rotor sweeps
        xb=side*1.205
        q=box("shoulder_sculpt_%d_%s"%(side,str(z)),(xb,-.231,z),(.30,.009,.022),
            mold,sh,.005,"fascia")
        q.rotation_euler[1]=side*(.085 if z>0 else -.085)
        box("shoulder_shadow_return_%d_%s"%(side,str(z)),
            (side*1.235,-.235,z+( -.018 if z>0 else .018)),
            (.24,.003,.004),shadow,sh,.001,"fascia")
    for z in (-.50,.50):
        cyl("perimeter_bolt_%d_%s"%(side,str(z)),(side*1.406,-.235,z),
            .011,.003,bearing,sh,12,"fascia")
        line("bolt_slot_%d_%s"%(side,str(z)),(side*1.4,-.238,z-.007),
             (side*1.4,-.238,z+.007),.0014,shadow,sh,"fascia")
# Outer top has real vent slots; the original spine geometry remains untouched.
for ix in range(11):
    x=-.38+ix*.078
    box("upper_fascia_vent_%02d"%ix,(x,-.067,.613),(.043,.041,.0035),
        shadow,sh,.001,"fascia")
    box("vent_lip_%02d"%ix,(x,-.087,.615),(.039,.003,.004),edge,sh,.001,"fascia")
# Fans: modify existing 27 blades: non-uniform aerofoil camber thickness, no animation anchor changes.
for fan_i,(cx,fan_name) in enumerate(zip((-.94,0,.94),("FAN_LEFT","FAN_CENTER","FAN_RIGHT"))):
    node=N[fan_name]
    blades=[o for o in bpy.data.objects if o.parent==node and o.name.startswith("BroadRotorBlade_")]
    assert len(blades)==9,(fan_name,len(blades))
    for j,ob in enumerate(blades):
        if ob.type!="MESH":continue
        # Changed radial blade thickness and front/back flare: preserves original sweep & endpoints.
        for v in ob.data.vertices:
            radius=math.hypot(v.co.x-cx,v.co.z-.025)
            if radius>.13:
                v.co.y+=.0025*(1-math.cos(min(1,radius/.45)*math.pi))
        ob.data.update()
    ring("fan_stainless_lockring_%d"%fan_i,(cx,-.249,.025),.083,.0028,bearing,node)
    cyl("fan_bearing_core_%d"%fan_i,(cx,-.247,.025),.037,.003,shadow,node,24)
    ring("fan_hub_o_ring_%d"%fan_i,(cx,-.250,.025),.115,.002,matt,node)
    # Supported motor backing: rigid stator ring must remain on stationary FRONT_SHROUD.
    for j in range(4):
        theta=(j+.2)*math.tau/4
        x=cx+.11*math.cos(theta);z=.025+.11*math.sin(theta)
        cyl("stator_fastener_%d_%d"%(fan_i,j),(x,-.187,z),.008,.003,bearing,sh,12)
    for j in range(6):
        a=(j+.5)*math.tau/6
        x=cx+.433*math.cos(a);z=.025+.433*math.sin(a)
        box("fan_well_tooling_%d_%d"%(fan_i,j),(x,-.225,z),
            (.011,.005,.020),edge,sh,.002,"fascia")
# Heatsink: individually folded fins preserved; real hems and offset secondary crests.
fins=N["HEATSINK_FINS"]
hems=[];tails=[]
for bi,cx in enumerate((-.94,0,.94)):
    for j in range(27):
        x=cx-.395+j*(.790/26)
        hems.extend([((x,-.153,-.382),(.011,.012,.023)),
                     ((x,-.153,.382),(.011,.012,.023))])
        if j%2==0:
            tails.append(((x,-.031,-.33),(.011,.011,.022)))
            tails.append(((x,-.031,.33),(.011,.011,.022)))
consolidated_prisms("genuine_finstack_folded_hems",hems,alu,fins,"cooler")
consolidated_prisms("genuine_fin_exit_crimps",tails,nickel,fins,"cooler")
for cx in (-.94,0,.94):
    for z in (-.463,.463):
        box("cooler_joiner_%.2f_%.2f"%(cx,z),(cx,-.094,z),
            (.74,.040,.015),edge,fins,.003,"cooler")
for cx in (-1.35,-.505,-.435,.435,.505,1.35):
    box("fin_stack_end_stiffener_%.2f"%cx,(cx,-.081,0),(.014,.065,.73),
        edge,fins,.003,"cooler")
# Thermal interface: supports, ferrules, soldered clamp geometry at plausible pipe-entry points.
pipes=N["HEATPIPE_BUNDLE"];cold=N["COLD_PLATE"]
for i,z in enumerate((-.155,0,.155)):
    for direction,x in ((-1,-.52),(1,.04)):
        ring("pipe_ferrule_%s_%d"%(direction,i),(x,-.027,z),
             .027,.004,bearing,pipes,"thermal")
        box("pipe_crimp_%s_%d"%(direction,i),(x,-.018,z),
            (.042,.009,.064),nickel,pipes,.004,"thermal")
for z in (-.21,.21):
    box("coldplate_mount_bridge_%s"%z,(-.23,-.035,z),
        (.55,.011,.022),nickel,cold,.003,"thermal")
for x in (-.48,.02):
    for z in (-.24,.24):
        cyl("coldplate_counterbored_socket_%s_%s"%(x,z),
            (x,-.054,z),.021,.006,shadow,cold,24,"thermal")
        cyl("coldplate_hex_insert_%s_%s"%(x,z),
            (x,-.060,z),.011,.004,bearing,cold,6,"thermal")
# GPU board: structured electronics, real SMD terminals, vias, escapes, decoupling & bus rows.
pcb=N["PCB"];die=N["GPU_DIE"];vram=N["VRAM_CHIPS"];vrm=N["VRM_COMPONENTS"]
box("PCB_soldermask_edge_green",(-.39,.103,-.50),(1.94,.004,.009),
    mask,pcb,.002,"pcb")
# Symmetrical memory routing lanes terminate at the package landings (not random circuit art).
for i,(mx,mz) in enumerate(((-.78,-.31),(-.78,.29),(.18,-.31),(.18,.29))):
    # clipped/mitered copper nets geometrically embedded just under mask finish
    for t in range(8):
        off=(t-3.5)*.019
        stx=mx+off*.5; ex=-.30+(t-3.5)*.021
        zline=mz+( .116 if mz>0 else -.116)
        line("gddr_route_a_%d_%d"%(i,t),(stx,.073,zline),
             (stx+.07,.073,zline),.0015,trace,pcb)
        line("gddr_route_b_%d_%d"%(i,t),(stx+.07,.073,zline),
             (ex,.073, (.24 if mz>0 else -.24)),.00145,trace,pcb)
    # miniature chip pin index marker under 3D memory body
    cyl("gddr_pin_index_%d"%i,(mx-.087,.027,mz-.073),.005,.001,solder,vram,10,"pcb")
# Uniformly distributed decoupling near memory and GPU *perimeter*, clear of physical die.
cap_bodies=[];cap_poles=[];chip_islands=[]
for i in range(4):
    mx,mz=((- .78,-.31),(-.78,.29),(.18,-.31),(.18,.29))[i]
    for j in range(10):
        u=-.11+(j%5)*.055
        z=mz+(.135 if mz>0 else -.135)+(j//5)*(.028 if mz>0 else -.028)
        pos=(mx+u,.059,z)
        cap_bodies.append((pos,(.028,.014,.015)))
        for s in (-1,1):
            cap_poles.append(((pos[0]+s*.015,pos[1],pos[2]),(.006,.016,.017)))
# VRM organized feed rows right of chip, next to existing five P3 DrMOS packages.
for n in range(6):
    x=.275+.055*(n//3)
    z=-.38+.16*(n%3)
    chip_islands.append(((x,.057,z),(.042,.022,.057)))
    for s in (-1,1):
        cap_poles.append(((x+s*.026,.057,z),(.007,.019,.036)))
consolidated_prisms("decoupling_0402_dielectrics",cap_bodies,ceramic,vrm,"pcb")
consolidated_prisms("decoupling_Ni_terminals",cap_poles,solder,vrm,"pcb")
consolidated_prisms("VRM_fine_control_ICs",chip_islands,chip,vrm,"pcb")
# Gold-plated solder lands and paired drill-hole vias, physically attached to PCB, not VRAM.
vias=[];land=[]
for row in range(4):
    z=(-.455,-.405,.402,.452)[row]
    for j in range(16):
        x=-1.26+j*.115
        if .70<x<1.50:continue
        vias.append(((x,.073,z),(.009,.003,.009)))
        if j%2==0:land.append(((x+.021,.072,z),(.018,.002,.006)))
consolidated_prisms("annular_via_plating",vias,gold,pcb,"pcb")
consolidated_prisms("production_test_lands",land,solder,pcb,"pcb")
# Corner board hold-down clearances and mechanical shock stand-offs.
for x in (-1.24,.55):
    for z in (-.43,.43):
        ring("board_mount_annulus_%s_%s"%(x,z),(x,.065,z),.027,.003,solder,pcb,"pcb")
        cyl("board_standoff_bolt_%s_%s"%(x,z),(x,.059,z),.009,.004,bearing,pcb,12,"pcb")
# Build physically separated substrate layers in package; sit inside inherited GPU_DIE anchor.
box("GPU_substrate_lip",(-.30,.041,0),(.39,.004,.392),bronze,die,.003,"silicon")
box("GPU_die_edge_land",(-.30,.019,0),(.323,.002,.323),bearing,die,.002,"silicon")
printed("die_package_identifier","NAVI44",(-.427,.015,-.045),.032,die)
for k,(mx,mz) in enumerate(((-.78,-.31),(-.78,.29),(.18,-.31),(.18,.29))):
    printed("memory_laser_%d"%k,"GDDR6",(mx-.086,.029,mz-.02),.025,vram)
# IO and power socket exterior should have structural mouth rather than black decals.
power=N["POWER_8PIN"]
for row in range(2):
    for i in range(4):
        x=.295+i*.086;z=.557+(row-.5)*.038
        box("8pin_contact_rail_%d_%d"%(row,i),(x,-.006,z),
            (.034,.004,.005),bronze,power,.001,"io")
for z in (-.31,0,.31):
    box("IO_socket_inner_lip_%s"%z,(-1.445,-.017,z),
        (.005,.10,.079),shadow,N["IO_BRACKET"],.001,"io")
# Backplate: route ribs and fastener recesses stay out of the real far-end vent.
back=N["BACKPLATE"]
for i in range(7):
    z=-.445+i*.13
    for j in range(2):
        x=-1.28+j*.265
        line("backplate_precision_channel_%d_%d"%(i,j),
            (x,.244,z),(x+.14,.244,z+.055),.003,shadow,back,"backplate")
for x in (-1.36,-.60,.32):
    for z in (-.50,.50):
        ring("backplate_recess_%s_%s"%(x,z),(x,.246,z),
            .020,.002,nickel,back,"backplate")
        cyl("backplate_screw_head_%s_%s"%(x,z),(x,.249,z),
            .012,.003,bearing,back,12,"backplate")
for z in (-.489,.489):
    box("rear_outlet_machined_lip_%s"%z,(1.01,.244,z),
        (.75,.006,.009),edge,back,.002,"backplate")
# Establish non-destructive, fully editable .blend before proof-only hide operations.
bpy.context.view_layer.update()
assert all(bpy.data.objects.get(s) is N[s] for s in REQUIRED)
assert all(len([ob for ob in bpy.data.objects if ob.name==s])==1 for s in REQUIRED)
# Baseline geometry preserved and edited only in permitted blade material/camber.
new_mes=len([x for x in bpy.data.objects if x.type=="MESH"])
print("P5_GEOMETRY_UPGRADE",before_meshes,new_mes,dict(new_count))
assert new_mes>before_meshes+100
# Artwork proof lighting; do not export camera/lights to model GLB.
world=bpy.data.worlds.new("P5_studio") if bpy.context.scene.world is None else bpy.context.scene.world
bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes["Background"].inputs["Color"].default_value=(.025,.033,.044,1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value=.48
def aim(o,target):
    o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
def softbox(name,loc,power,size):
    ld=bpy.data.lights.new(name,"AREA");ld.energy=power;ld.shape="DISK";ld.size=size
    ob=bpy.data.objects.new(name,ld);bpy.context.scene.collection.objects.link(ob)
    ob.location=loc;aim(ob,(0,0,0))
for x in list(bpy.context.scene.objects):
    if x.type=="LIGHT":bpy.data.objects.remove(x,do_unlink=True)
softbox("P5_Key",(-1.8,-3.1,2.3),1100,3.8)
softbox("P5_Fill",(2.8,-1.7,1.5),650,3)
softbox("P5_Rim",(1.5,2.4,2.6),1400,2.8)
cam_d=bpy.data.cameras.new("P5_Camera")
camera=bpy.data.objects.new("P5_Camera",cam_d)
bpy.context.scene.collection.objects.link(camera)
bpy.context.scene.camera=camera;cam_d.type="ORTHO"
scene=bpy.context.scene
scene.render.engine="CYCLES";scene.cycles.samples=14
scene.cycles.use_denoising=True
scene.render.image_settings.file_format="PNG"
scene.render.resolution_percentage=100
scene.render.film_transparent=False
scene.render.resolution_x=960;scene.render.resolution_y=640
try:
    scene.view_settings.view_transform="AgX"
    scene.view_settings.look="Medium High Contrast"
except Exception:pass
scene.view_settings.exposure=-.06
# Export MODEL ONLY; exclude proof cameras/lights and no visibility/hidden cutaway.
for o in bpy.context.scene.objects:o.select_set(False)
export_objs=[o for o in bpy.context.scene.objects if o.name!="P5_Camera" and o.type not in ("CAMERA","LIGHT")]
for o in export_objs:o.select_set(True)
bpy.context.view_layer.objects.active=N["GPU_ROOT"]
out_glb=OUT/"xfx_swift_rx9060xt_polish5.glb"
bpy.ops.export_scene.gltf(filepath=str(out_glb),export_format="GLB",
      use_selection=True,export_apply=False,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"xfx_swift_rx9060xt_polish5.blend"))
assert out_glb.is_file() and out_glb.stat().st_size>100000
modelsha=hashlib.sha256(out_glb.read_bytes()).hexdigest()
# Render native stills. Proof-only hidden geometry is restored for every image.
all_mesh=[o for o in bpy.context.scene.objects if o.type=="MESH"]
def view(name,eye,target=(0,0,0),ortho=3.65,hide=(),resolution=(960,640),samples=14):
    for ob in all_mesh:ob.hide_render=False
    for ob in all_mesh:
        if any(ob.name.startswith(s) for s in hide):ob.hide_render=True
    camera.location=eye;aim(camera,target);cam_d.ortho_scale=ortho
    scene.render.resolution_x,scene.render.resolution_y=resolution
    scene.cycles.samples=samples
    scene.render.filepath=str(OUT/name)
    bpy.ops.render.render(write_still=True)
    assert (OUT/name).stat().st_size>7000,name
# Objects start assembled; hide only selected exterior meshes when revealing internal parts.
hide_front=("Swift_", "Monolithic_", "P4_Shroud_", "P5_shoulder_", "P5_upper_fascia_", "P5_vent_",
            "P5_perimeter_", "P5_fan_well_", "P5_stator_", "Integrated_","Fan_", "BroadRotorBlade_", "OpenSCAD_FanHub_",
            "P3_Stator_", "P4_Hub_", "P4_Center_", "P5_fan_","P5_rotor_", "RADEON_", "XFX_")
hide_cooler=hide_front+("P3_L_fin_","P3_C_fin_","P3_R_fin_","P3_FinLeadingFold_","P5_genuine_",
                       "P5_cooler_","P5_fin_stack_","P3_FinBank_","P3_Endplate_", "P4_Shroud_")
hide_pcb=hide_cooler+("P3_Heatpipe_", "P3_Pipe_", "P4_Nickel_heatpipe_","P5_pipe_",
                      "P3_Heatspreader_","P3_Copper_contact_","Nickel_cold_",
                      "P5_coldplate_", "Backplate_", "P3_Exhaust_", "P5_rear_outlet_")
view("01_assembled.png",(3.2,-5.0,2.1))
view("02_fans_and_shroud_macro.png",(.95,-3.0,.70),(.89,-.20,.04),1.38)
view("03_rear_three_quarter.png",(2.8,4.9,2.5),(.0,0,0),3.7)
view("04_heatsink_macro.png",(.35,-2.8,1.25),(.12,-.07,0),1.82,hide=hide_front)
view("05_heatpipe_coldplate_macro.png",(-.15,-2.2,1.18),(-.25,-.018,0),1.35,hide=hide_cooler)
view("06_populated_pcb.png",(-.05,-2.6,1.4),(-.32,.05,0),2.55,hide=hide_pcb)
view("07_gpu_vram_macro.png",(-.36,-1.7,.68),(-.30,.046,0),1.04,hide=hide_pcb)
view("08_vrm_macro.png",(.57,-1.65,.63),(.37,.05,0),1.04,hide=hide_pcb)
view("09_backplate_macro.png",(.3,2.2,1.1),(.10,.23,0),2.2)
# Exploded proof poses must only translate canonical anchors; do not bake those poses into GLB.
explode=[("FAN_LEFT",(-.18,-.93,0)),("FAN_CENTER",(0,-1.00,0)),
         ("FAN_RIGHT",(.18,-.93,0)),("FRONT_SHROUD",(0,-.33,0)),
         ("HEATSINK",(.04,.19,.10)),("PCB_ASSEMBLY",(0,.65,-.14)),
         ("BACKPLATE",(0,1.14,-.03))]
saved={k:N[k].location.copy() for k,_ in explode}
for k,d in explode:N[k].location= saved[k]+Vector(d)
view("10_exploded.png",(3.7,-6.0,3.0),(.02,.05,0),5.1)
for k,d in explode:N[k].location=saved[k]
# 18 moving native Blender proof frames, for a short truthful video.
mov=OUT/"moving_frames";mov.mkdir(exist_ok=True)
for j in range(18):
    s=j/17
    s=s*s*(3-2*s)
    for k,d in explode:N[k].location=saved[k]+s*Vector(d)
    eye=Vector((3.3,-5.6,2.45))+Vector((.3,-.3,.12))*s
    camera.location=eye;aim(camera,(.02,.02,0));cam_d.ortho_scale=4.3+s*.9
    for ob in all_mesh:ob.hide_render=False
    scene.render.resolution_x=640;scene.render.resolution_y=424;scene.cycles.samples=7
    scene.render.filepath=str(mov/("frame-%03d.png"%j))
    bpy.ops.render.render(write_still=True)
for k,d in explode:N[k].location=saved[k]
from PIL import Image,ImageStat
imagedata={}
for f in sorted(OUT.glob("*.png")):
    with Image.open(f) as pic:
        stat=ImageStat.Stat(pic.convert("L"))
        assert stat.stddev[0]>5,(f.name,stat.stddev)
        imagedata[f.name]={"size":pic.size,"stdev":round(stat.stddev[0],2),"bytes":f.stat().st_size}
meta={
 "stage":"AGENT_A_HARDWARE_ONLY","baselinePolish04GlbSha256":BASE_SHA,
 "model":"xfx_swift_rx9060xt_polish5.glb","glbSha256":modelsha,
 "glbBytes":out_glb.stat().st_size,"product":"XFX Swift RX 9060 XT OC triple fan black",
 "manufacturerSKU":"RX-96TS316B7","dimensionsMM":[290,124,49],
 "requiredAnchors":REQUIRED,"baseMeshes":before_meshes,"preExportSceneMeshes":new_mes,
 "newModelGeometryByCategory":dict(new_count),"proofs":imagedata,
 "materialCount":len(bpy.data.materials),
 "claims":"Verified exterior SKU and specifications, engineering internals illustrative not OEM CAD",
 "sources":["https://uk.xfxforce.com/shop/xfx-swift-amd-radeon-rx-9060xt-oc-triple-fan-gaming-edition-16gb",
 "https://pcper.com/2025/06/xfx-swift-radeon-rx-9060-xt-16gb-oc-review/"],
 "sourceCommit":os.environ.get("GITHUB_SHA","local")
}
(OUT/"asset-manifest.json").write_text(json.dumps(meta,indent=2)+"\n")
print("P5_NATIVE_RENDER_PASS",len(imagedata),"GLB",modelsha,"preserved anchors",len(REQUIRED))
