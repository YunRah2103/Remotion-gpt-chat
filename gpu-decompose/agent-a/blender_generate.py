#!/usr/bin/env python3
"""Procedural, native Blender 3D model of XFX Swift RX-96TS316B7 Triple Fan 16GB.
Caveat: reference-grounded 290x124x49 mm silhouette; internals illustrative, NOT OEM CAD.
BLENDER axes: X length, Z up, FRONT=-Y. GLB exports +Y up and +Z front automatically.
Scene units: 1 Blender unit = 100 physical mm. Required GLB node names are locked.
"""
import bpy, math, json, os, pathlib, struct, sys, hashlib
from mathutils import Vector
HERE=pathlib.Path(__file__).resolve().parent
ASSETS=HERE.parent/"assets"; ASSETS.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(HERE))
from generate_motion import PARTS,offset,FRAMES
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
 if c.name!="Collection" and c.users==0:bpy.data.collections.remove(c)
coll=bpy.data.collections.new("XFX_SWIFT_RX9060XT"); bpy.context.scene.collection.children.link(coll)
def relocate(obj):
 for c in list(obj.users_collection):c.objects.unlink(obj)
 coll.objects.link(obj);return obj
def empty(name,parent=None):
 ob=bpy.data.objects.new(name,None);coll.objects.link(ob)
 if parent:ob.parent=parent
 return ob
def mat(name,col,metal=0,rough=.45):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True
 bs=m.node_tree.nodes.get("Principled BSDF")
 bs.inputs["Base Color"].default_value=(*col,1)
 bs.inputs["Metallic"].default_value=metal
 bs.inputs["Roughness"].default_value=rough
 return m
plastic=mat("M_POLYMER_GRAPHITE",(.032,.037,.046),.10,.58)
frame_mat=mat("M_SHROUD_DARK",(.028,.032,.039),.18,.40)
rim=mat("M_FAN_RING",(.013,.016,.020),.25,.37)
blade=mat("M_FAN_BLADE",(.016,.019,.023),.08,.39)
hubmat=mat("M_FAN_HUB",(.037,.043,.052),.15,.42)
black_gloss=mat("M_GLOSS_ACCENT",(.012,.017,.02),.6,.20)
steel=mat("M_BRUSHED_ALUMINIUM",(.56,.60,.63),.82,.27)
finmat=mat("M_HEATSINK_ANODISED_SILVER",(.27,.30,.34),.72,.47)
copper=mat("M_NICKEL_COPPER",(.48,.36,.25),.81,.27)
coldmat=mat("M_COLDPLATE_NICKEL",(.53,.57,.60),.9,.20)
pcbmat=mat("M_PCB_DARK_GREEN",(.018,.053,.047),.1,.51)
chipmat=mat("M_CHIP_CERAMIC_DARK",(.021,.025,.032),.08,.42)
gold=mat("M_CONTACT_GOLD",(.73,.50,.16),.89,.22)
accent=mat("M_LOGO_PALE_SILVER",(.79,.85,.87),.25,.31)
ventmat=mat("M_BACKPLATE_GRAPHITE",(.032,.037,.044),.37,.57)
groovemat=mat("M_BACKPLATE_INSET",(.013,.017,.021),.11,.61)
root=empty("GPU_ROOT")
fans=empty("FAN_ASSEMBLY",root)
fan_nodes=[empty(n,fans) for n in ("FAN_LEFT","FAN_CENTER","FAN_RIGHT")]
shroud=empty("FRONT_SHROUD",root)
sink=empty("HEATSINK",root)
fins=empty("HEATSINK_FINS",sink)
pipes=empty("HEATPIPE_BUNDLE",sink)
cold=empty("COLD_PLATE",sink)
board=empty("PCB_ASSEMBLY",root)
pcb=empty("PCB",board)
die=empty("GPU_DIE",board)
vram=empty("VRAM_CHIPS",board)
vrm=empty("VRM_COMPONENTS",board)
fingers=empty("PCIE_FINGERS",board)
power=empty("POWER_8PIN",board)
bracket=empty("IO_BRACKET",board)
back=empty("BACKPLATE",root)
groups={k:v for k,v in [
 ("FAN_LEFT",fan_nodes[0]),("FAN_CENTER",fan_nodes[1]),("FAN_RIGHT",fan_nodes[2]),
 ("FRONT_SHROUD",shroud),("HEATSINK",sink),("GPU_DIE",die),
 ("VRAM_CHIPS",vram),("PCB_ASSEMBLY",board),("BACKPLATE",back)]}
def mesh_parent(obj,parent,m):
 relocate(obj);obj.parent=parent
 if m:obj.data.materials.append(m)
 return obj
def box(name,loc,dims,ma,parent,bev=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
 ob=bpy.context.object;ob.name=name
 ob.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mesh_parent(ob,parent,ma)
 if bev:
  mod=ob.modifiers.new("soft machined edges","BEVEL");mod.width=bev;mod.segments=2
  if hasattr(mod,"affect"):mod.affect="EDGES"
  # Explicit flat machined bevel; no Auto Smooth-dependent weighted-normal modifier.
 return ob
def cylinder(name,loc,r,dep,ma,parent,verts=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=dep,location=loc,rotation=(math.pi/2,0,0))
 ob=bpy.context.object;ob.name=name;mesh_parent(ob,parent,ma)
 for p in ob.data.polygons:p.use_smooth=True
 return ob
def torus(name,loc,r,thick,ma,parent):
 bpy.ops.mesh.primitive_torus_add(major_segments=72,minor_segments=10,
   location=loc,rotation=(math.pi/2,0,0),major_radius=r,minor_radius=thick)
 ob=bpy.context.object;ob.name=name;mesh_parent(ob,parent,ma)
 for p in ob.data.polygons:p.use_smooth=True
 return ob
def blade_mesh(parent,cx,cz,idx,material):
 # Nine true 3D, broad, swept axial rotor blades, double-sided with camber.
 # The source photograph shows large filled-in black aerofoils, not narrow spokes.
 nblades=9
 heading=idx*math.tau/nblades
 sections=[
  (.125,-.35,.57),
  (.172,-.28,.64),
  (.240,-.16,.61),
  (.308,-.01,.55),
  (.375,.10,.49),
  (.421,.20,.36),
  (.446,.27,.17)]
 face_count=len(sections)*2
 verts=[]
 for back in [False,True]:
  for radius,sweep,width in sections:
   for edge in [0,1]:
    angle=heading+sweep+(edge*width)+(radius-.125)*.08
    # Aerodynamic twist: shallow camber and cupped trailing edge.
    camber=math.sin(math.pi*edge)
    y=-.248+.033*(radius/.446)+.011*edge+.004*camber
    if back:y+=.016
    verts.append((cx+radius*math.cos(angle),y,cz+radius*math.sin(angle)))
 faces=[]
 for j in range(len(sections)-1):
  k=2*j;t=k+2
  faces.append((k,t,t+1,k+1))
  faces.append((face_count+k,face_count+k+1,face_count+t+1,face_count+t))
 # Close only the leading/trailing contours and both true blade ends.
 # All mesh indices in bounds, avoiding Blender's native crash on invalid polygons.
 for j in range(len(sections)-1):
  k=2*j;t=k+2
  faces.append((k,t,face_count+t,face_count+k))
  faces.append((k+1,face_count+k+1,face_count+t+1,t+1))
 faces.append((0,1,face_count+1,face_count))
 last=face_count-2
 faces.append((last,face_count+last,face_count+last+1,last+1))
 assert all(0<=idx<len(verts) for face in faces for idx in face), "Invalid rotor polygon index"
 me=bpy.data.meshes.new("MouldedSweptFanBlade")
 me.from_pydata(verts,[],faces);me.update()
 ob=bpy.data.objects.new("BroadRotorBlade_%02d"%idx,me)
 coll.objects.link(ob);ob.parent=parent
 me.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 mod=ob.modifiers.new("aerofoil edge bevel","BEVEL")
 mod.width=.002;mod.segments=2
 return ob
def stl_vertices(stl):
 data=pathlib.Path(stl).read_bytes()
 if len(data)>84:
  count=struct.unpack("<I",data[80:84])[0]
  if 84+50*count==len(data):
   out=[]
   for i in range(count):
    pos=84+i*50+12
    pts=[struct.unpack("<fff",data[pos+j*12:pos+(j+1)*12]) for j in range(3)]
    out.append(pts)
   return out
 out=[];tri=[]
 for l in data.decode("ascii",errors="ignore").splitlines():
  l=l.strip()
  if l.startswith("vertex"):
   tri.append(tuple(map(float,l.split()[1:4])))
   if len(tri)==3:out.append(tri);tri=[]
 if not out:raise RuntimeError("STL parse failed; OpenSCAD CAD geometry absent")
 return out
def import_cad_hub(name,stl,parent,x,z):
 tris=stl_vertices(stl)
 verts=[];polys=[]
 for tri in tris:
  idx=len(verts)
  # SCAD mm XYZ: convert XY=> XZ Blender fan plane; SCAD Z=> Blender -Y.
  for q in tri:verts.append((x+q[0]*.01,-.181-q[2]*.01,z+q[1]*.01))
  polys.append((idx,idx+1,idx+2))
 me=bpy.data.meshes.new("OpenSCAD_CAD_HUB_MESH");me.from_pydata(verts,[],polys);me.update()
 ob=bpy.data.objects.new(name,me);coll.objects.link(ob);ob.parent=parent
 me.materials.append(hubmat);return ob
cad=HERE/"fan_hub.stl"
if not cad.exists():raise RuntimeError("Real OpenSCAD STL required before modelling: "+str(cad))
# Accurate-looking solid black nine-blade fan rotors with dark recessed wells.
# The OpenSCAD hub remains truly embedded, mounted behind each visible cap.
well_mat=mat("M_DARK_RECESSED_FAN_WELL",(.008,.010,.014),.08,.82)
fan_tip_mat=mat("M_FAN_BLADE_WARM_BLACK",(.016,.019,.023),.07,.39)
fan_decal=mat("M_FAN_LOGOMARK_SILVER",(.47,.51,.55),.33,.38)
for i,(x,node) in enumerate(zip([-.94,0,.94],fan_nodes)):
 cylinder("Recessed_black_cooler_well_%d"%i,(x,-.185,.025),.445,.009,well_mat,node,72)
 torus("Fan_anti_vibration_gasket_%d"%i,(x,-.211,.025),.456,.011,rim,node)
 torus("Fan_precision_outer_bezel_%d"%i,(x,-.225,.025),.463,.007,frame_mat,node)
 for j in range(9):blade_mesh(node,x,.025,j,blade)
 import_cad_hub("OpenSCAD_FanHub_%d"%i,cad,node,x,.025)
 # Circular cap (OEM design has smooth caps carrying small X marks).
 cylinder("Fan_smooth_center_cap_%d"%i,(x,-.251,.025),.141,.026,hubmat,node)
 torus("Fan_hub_chamfer_%d"%i,(x,-.266,.025),.138,.006,black_gloss,node)
 for sign in [-1,1]:
  ob=box("Fan_X_silver_insignia_%d_%d"%(i,sign),
         (x,-.267,.025),(.076,.002,.012),fan_decal,node)
  ob.rotation_euler[1]=sign*.71

# Entire dark seamless sculpted fascia, constructed as three annular cut-out panels.
# Topology is real triangles with true open holes, not an image pasted on a box.
fascia=mat("M_MONOLITHIC_XFX_FASCIA",(.012,.014,.017),.12,.56)
fascia_highlight=mat("M_ANGULAR_FASCIA_HIGHLIGHT",(.034,.038,.044),.20,.46)
edgeblack=mat("M_TRIPLE_FAN_BEZEL_BLACK",(.016,.019,.024),.28,.43)
# One physically continuous polymer front fascia, three Boolean-drilled circular fan apertures.
# Removes the visible vertical panel seams of the first two prototypes.
frontpanel=box("Swift_unified_one_piece_fan_fascia",(0,-.215,0),
               (2.874,.022,1.176),fascia,shroud)
for idx,fan_x in enumerate([-.94,0,.94]):
 bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=.454,depth=.24,
   location=(fan_x,-.215,.025),rotation=(math.pi/2,0,0))
 cutter=bpy.context.object
 cutter.name="CUTTER_%d"%idx
 mod=frontpanel.modifiers.new("Real_fan_aperture_%d"%idx,"BOOLEAN")
 mod.operation="DIFFERENCE";mod.solver="EXACT";mod.object=cutter
 bpy.ops.object.select_all(action="DESELECT")
 frontpanel.select_set(True);bpy.context.view_layer.objects.active=frontpanel
 bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.data.objects.remove(cutter,do_unlink=True)
assert len(frontpanel.data.polygons)>100, "Boolean circular apertures failed"
bevel=frontpanel.modifiers.new("Continuous_moulded_face_edges","BEVEL")
bevel.width=.005;bevel.segments=2
# Seamless edge body: no raised square separators between individual fans.
box("Monolithic_shroud_top",(0,-.143,.593),(2.89,.147,.046),fascia,shroud,.015)
box("Monolithic_shroud_bottom",(0,-.143,-.596),(2.89,.146,.046),fascia,shroud,.015)
for x in [-1.420,1.420]:
 box("Rounded_chassis_endwall",(x,-.147,0),(.055,.150,1.16),fascia,shroud,.013)
for x in [-.94,0,.94]:
 torus("Integrated_matte_black_bezel",(x,-.220,.025),.460,.008,edgeblack,shroud)
# Actual Swift-style diagonal notches at both outside endcaps.
def accent_polygon(name,points,ma=fascia_highlight):
 mesh=bpy.data.meshes.new(name+"_Geo")
 mesh.from_pydata([(x,-.231,z) for x,z in points],[],[tuple(range(len(points)))])
 mesh.update();ob=bpy.data.objects.new(name,mesh)
 coll.objects.link(ob);ob.parent=shroud;mesh.materials.append(ma)
 return ob
for side in [-1,1]:
 def P(x,z):return (side*x,z)
 accent_polygon("Swift_upper_corner_sweep_%s"%side,[
  P(1.04,.570),P(1.40,.570),P(1.40,.505),P(1.27,.503),P(1.19,.532)])
 accent_polygon("Swift_lower_corner_cut_%s"%side,[
  P(1.03,-.566),P(1.40,-.566),P(1.40,-.505),P(1.29,-.490),P(1.16,-.533)])
# Tight full-length anti-scratch edge piping (black-on-black).
for z in [-.535,.542]:
 box("Shroud_fine_tapered_piping",(0,-.221,z),(2.74,.005,.008),black_gloss,shroud,.002)
for x in [-1.389,1.389]:
 for z in [-.50,.50]:
  cylinder("Hidden_fastener",(x,-.203,z),.011,.004,edgeblack,shroud,18)

# Outer top/body metal spine
box("RADEON_brand_spine",(-.86,-.085,.597),(.91,.195,.047),frame_mat,shroud,.007)
box("XFX_brand_spine",(1.08,-.089,.600),(.48,.195,.037),frame_mat,shroud,.008)
def text_mesh(text,name,loc,size,material,parent,rot=(math.pi/2,0,0)):
 cu=bpy.data.curves.new(name,"FONT");cu.body=text;cu.size=size;cu.extrude=.0009;cu.bevel_depth=.0003
 ob=bpy.data.objects.new(name,cu);coll.objects.link(ob);ob.parent=parent
 ob.location=loc;ob.rotation_euler=rot;cu.materials.append(material)
 bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
 bpy.ops.object.convert(target='MESH');return bpy.context.object
text_mesh("RADEON","RADEON_SIDE",(-1.30,-.19,.624),.080,accent,shroud,rot=(0,0,0))
text_mesh("XFX","XFX_SIDE",(.94,-.19,.623),.12,accent,shroud,rot=(0,0,0))
# Fins: actual separated machined layers across the heat exchanger.
for i in range(72):
 x=-1.347+i*(2.694/71)
 box("HeatsinkFin_%03d"%i,(x,-.081,.005),(.012,.158,1.030),finmat,fins)
for z in [-.470,.485]:
 box("HeatsinkFrame",(0,-.080,z),(2.73,.170,.015),steel,fins)
def bent_pipe(name,points,ma,parent,r=.019):
 cu=bpy.data.curves.new(name,"CURVE");cu.dimensions='3D';cu.resolution_u=12
 cu.bevel_depth=r;cu.bevel_resolution=3
 sp=cu.splines.new("BEZIER");sp.bezier_points.add(len(points)-1)
 for b,point in zip(sp.bezier_points,points):
  b.co=point;b.handle_left_type="AUTO";b.handle_right_type="AUTO"
 obj=bpy.data.objects.new(name,cu);coll.objects.link(obj);obj.parent=parent;cu.materials.append(ma)
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 bpy.ops.object.convert(target='MESH')
 return bpy.context.object
for i in range(5):
 z=-.20+i*.10
 bent_pipe("HeatPipe6mm_%d"%i,[(-1.12,-.015,z),(-.66,-.005,z*.5),(-.16,-.013,z),
  (.42,-.002,z*.6),(1.25,-.023,z)],copper,pipes,r=.028)
box("Nickel_cold_plate",(-.21,-.010,.010),(.56,.040,.55),coldmat,cold,.018)
# Dark green multilayer board, PCB model shorter than open-ended shroud.
box("PCB_Core",(-.20,.088,.012),(2.30,.023,1.060),pcbmat,pcb,.007)
for x in [-1.18,-.81,-.44,.0,.40,.78]:
 for z in [-.43,.43]:
  cylinder("Screw_post",(x,.069,z),.012,.025,steel,pcb,16)
# Processor silicon package and copper substrate
box("ASIC_substrate",(-.30,.045,.00),(.44,.031,.44),gold,die,.007)
box("AMD_Navi44_silicon",(-.30,.024,0),(.355,.013,.355),chipmat,die,.006)
for i,(x,z) in enumerate([(-.78,-.31),(-.78,.29),(.18,-.31),(.18,.29)]):
 box("GDDR6_memory_package_%d"%i,(x,.048,z),(.24,.030,.19),chipmat,vram,.007)
 # subtle package silk/mark
 box("Memory_stamp_%d"%i,(x,.029,z),(.145,.001,.016),groovemat,vram)
for x in [-1.13,-.99,-.85]:
 for z in [-.30,-.15,.0,.15,.30]:
  box("VRM_MOSFET",(x,.051,z),(.085,.030,.052),chipmat,vrm,.005)
# Real-looking, separately modelled regulator coils and ceramic SMDs.
# Generic illustrative electrical placement, not a manufacturer PCB tracing.
coilmat=mat("M_VRM_INDUCTOR_GRAPHITE",(.070,.077,.078),.25,.49)
for i,x in enumerate([-.99,-.83,-.67,-.51]):
 for z in [-.35,.34]:
  box("VRM_inductor_L%02d_%d"%(i,int(z>0)),(x,.047,z),
      (.113,.052,.098),coilmat,vrm,.012)
for i in range(28):
 x=-1.12+(i%7)*.10
 z=-.10+int(i/7)*.070
 if abs(x+.30)<.28:continue
 box("PCB_low_profile_SMD_%02d"%i,(x,.066,z),
     (.033,.014,.017),steel if i%5==0 else chipmat,vrm,.002)
# Low-relief traces on exposed board sections, tied to PCB anchor.
trace=mat("M_CIRCUIT_TRACE_DULL_COPPER",(.29,.23,.12),.67,.47)
for i in range(11):
 zz=-.40+i*.078
 box("PCB_trace_front_%02d"%i,(.57,.072,zz),(.35,.002,.004),trace,pcb)
for i in range(8):
 zz=-.40+i*.108
 box("PCB_trace_left_%02d"%i,(-1.06,.072,zz),(.10,.002,.003),trace,pcb)
# PCIe contact tongue at bottom and individual plated fingers
box("PCIE_edge_substrate",(-.24,.085,-.547),(.88,.017,.118),pcbmat,fingers,.002)
for i in range(32):
 x=-.65+i*.026
 box("PCIe_GoldFinger_%02d"%i,(x,.075,-.554),(.015,.004,.085),gold,fingers)
# 8-pin connector block on upper PCB edge
box("PCIe_8pin_socket",(.43,.078,.550),(.41,.16,.095),chipmat,power,.013)
for i in range(8):
 x=.285+(i%4)*.089;z=.559+((i//4)-.5)*.036
 box("Power_contact_hole", (x,-.005,z),(.044,.003,.028),groovemat,power,.002)
# Metal IO bracket & DP/HDMI receptacles (three outputs).
box("GPU_IO_bracket",(-1.416,.0,0),(.026,.405,1.17),steel,bracket,.008)
for i,z in enumerate([-.30,0,.30]):
 box("Display_socket_housing_%d"%i,(-1.432,-.015,z),(.014,.18,.128),chipmat,bracket,.005)
 box("Display_socket_trim_%d"%i,(-1.446,-.015,z),(.003,.144,.091),accent,bracket,.002)
# Reference-guided rear: one continuous backplate with an open rectangular fin outlet.
# Inspired by physical OC3D back photograph: cut-out reveals the REAL metal fins below.
# Unlike old v2.1, there are NO thick horizontal fake window bars.
backplate_shell=box("Backplate_machined_one_piece", (0,.231,0),
                    (2.882,.020,1.194),ventmat,back,.009)
def cut_metal_slot(target,name,center,dimensions):
 bpy.ops.mesh.primitive_cube_add(size=1,location=center)
 cutter=bpy.context.object;cutter.name=name+"_cutter"
 cutter.dimensions=dimensions
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 cut=target.modifiers.new(name,"BOOLEAN")
 cut.operation="DIFFERENCE";cut.solver="EXACT";cut.object=cutter
 bpy.ops.object.select_all(action="DESELECT")
 target.select_set(True);bpy.context.view_layer.objects.active=target
 bpy.ops.object.modifier_apply(modifier=cut.name)
 bpy.data.objects.remove(cutter,do_unlink=True)
cut_metal_slot(backplate_shell,"Full_depth_cooling_fin_window",
               (1.01,.232,0),(.750,.120,.954))
cut_metal_slot(backplate_shell,"Lower_standoff_relief_notch",
               (.05,.232,-.570),(.320,.120,.180))
assert len(backplate_shell.data.polygons)>20, "Machined rear-plate Boolean failed"
# Subtle dark anodized edge around the open exhaust window, no covering geometry.
for z in [-.483,.483]:
 box("Backplate_air_outlet_lip",(1.01,.239,z),(.756,.009,.012),groovemat,back,.004)
for x in [.617,1.398]:
 box("Backplate_outlet_endwall",(x,.239,0),(.010,.009,.966),groovemat,back,.003)
# Thermal pad patches on INNER face of the plate, visible only as layers part.
thermal=mat("M_BACKPLATE_THERMAL_PAD",(.117,.124,.129),.03,.80)
for x,z in [(-.95,-.29),(-.95,.29),(-.32,-.32),(-.32,.32),(.27,-.25)]:
 box("Backplate_silicone_thermal_pad",(x,.213,z),(.235,.011,.165),thermal,back,.010)
# Nested V/wave routing motif on solid section (inspired by official exterior).
def linebar(name,a,b,width,parent,ma):
 dx=b[0]-a[0]; dz=b[1]-a[1]
 mid=((a[0]+b[0])/2,.244,(a[1]+b[1])/2)
 ob=box(name,mid,(math.hypot(dx,dz),.003,width),ma,parent)
 ob.rotation_euler[1]=-math.atan2(dz,dx)
for i in range(9):
 x0=-1.29+i*.035;ztop=.47-i*.042;zend=-.42+i*.038
 xvee=-.22+i*.02
 linebar("V_wave_left_%02d"%i,(x0,ztop),(xvee,.03),.012,back,groovemat)
 linebar("V_wave_right_%02d"%i,(xvee,.03),(.45,zend),.012,back,groovemat)
for x in [-1.25,-.64,.48,1.30]:
 for z in [-.50,.50]:
  cylinder("Backplate_screw",(x,.245,z),.012,.007,steel,back,16)
# Studio preview only (excluded from GLB export).
def studio():
 world=bpy.context.scene.world;world.use_nodes=True
 world.node_tree.nodes["Background"].inputs["Color"].default_value=(.035,.043,.056,1)
 world.node_tree.nodes["Background"].inputs["Strength"].default_value=.6
 def light(loc,power,size):
  da=bpy.data.lights.new("Softbox","AREA");da.energy=power;da.shape='RECTANGLE';da.size=size;da.size_y=size/2
  ob=bpy.data.objects.new("Softbox",da);bpy.context.scene.collection.objects.link(ob);ob.location=loc
  dire=Vector((0,0,0))-ob.location;ob.rotation_euler=dire.to_track_quat("-Z","Y").to_euler()
 light((0,-4.1,4.5),780,4.0);light((-3,-2,1.6),520,3.5);light((3.5,1,3),1100,3.0)
 camdata=bpy.data.cameras.new("Preview_camera");cam=bpy.data.objects.new("Preview_camera",camdata)
 bpy.context.scene.collection.objects.link(cam);cam.location=(2.0,-7.2,2.05)
 dire=Vector((0,0,0))-cam.location;cam.rotation_euler=dire.to_track_quat("-Z","Y").to_euler()
 camdata.type="ORTHO";camdata.ortho_scale=3.65;bpy.context.scene.camera=cam
 scene=bpy.context.scene
 scene.render.engine='CYCLES';scene.cycles.samples=52
 for layer in scene.view_layers:
  if hasattr(layer,'cycles'):layer.cycles.use_denoising=False
 scene.render.resolution_x=960;scene.render.resolution_y=640
 scene.render.resolution_percentage=100
 scene.render.image_settings.file_format="PNG"
 scene.render.film_transparent=False
 scene.view_settings.view_transform='Standard'
 return cam
studio()
scene=bpy.context.scene
scene.render.fps=30;scene.frame_start=0;scene.frame_end=449
# Embed exactly contract-delta transforms in named root anchors.
for name,ob in groups.items():
 for frame in range(FRAMES):
  x,y,z=offset(name,frame) # JSON +Y-up +Z-front
  ob.location=(x,-z,y) # Blender internal => exported glTF [x,y,z]
  ob.keyframe_insert(data_path="location",frame=frame)
 for fc in ob.animation_data.action.fcurves:
  for kp in fc.keyframe_points:kp.interpolation="LINEAR"
# named group transform frames are authored at every frame; no cumulative state.
blend=str(ASSETS/"xfx_swift_rx9060xt_triple16.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend)
def export_glb(path):
 bpy.ops.object.select_all(action="DESELECT")
 for ob in coll.objects:ob.select_set(True)
 bpy.context.view_layer.objects.active=root
 bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",
  use_selection=True,export_yup=True,export_animations=False,
  export_apply=False,export_materials="EXPORT")
export_glb(ASSETS/"xfx_swift_rx9060xt_triple16.glb")
# Blender native QA previews
scene.frame_set(0);scene.render.filepath=str(ASSETS/"assembled.png");bpy.ops.render.render(write_still=True)
# Side-tilted final proof matches Agent B's director-only ~55-degree camera amendment.
camera=scene.camera
def aim_camera(position,ortho):
 camera.location=position
 camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat("-Z","Y").to_euler()
 camera.data.ortho_scale=ortho
scene.frame_set(449)
aim_camera((8.2,-5.55,2.8),5.1)
scene.render.filepath=str(ASSETS/"exploded.png")
bpy.ops.render.render(write_still=True)
# Distinct QA views. The actual canonical GLB and locked JSON remain unchanged.
aim_camera((9.2,-3.6,3.0),5.5)
scene.render.filepath=str(ASSETS/"exploded_side.png")
bpy.ops.render.render(write_still=True)
scene.frame_set(0)
aim_camera((2.6,7.2,2.1),4.15)
scene.render.filepath=str(ASSETS/"backplate_detail.png")
bpy.ops.render.render(write_still=True)
# Moving proof frames vary both the *real* part offsets and camera orbit,
# following Agent B v1.1 camera-only correction.
preview=ASSETS/"moving_frames";preview.mkdir(exist_ok=True)
scene.render.resolution_x=552;scene.render.resolution_y=368
scene.cycles.samples=10
for f in list(range(89,330,12))+[380,449]:
 scene.frame_set(f)
 t=min(1.,max(0.,(f-160.)/(332.-160.)))
 t=t*t*(3.-2.*t)
 origin=Vector((2.0,-7.2,2.05));end=Vector((8.2,-5.55,2.8))
 aim_camera(origin.lerp(end,t),3.65+(5.1-3.65)*t)
 scene.render.filepath=str(preview/("f_%03d.png"%f))
 bpy.ops.render.render(write_still=True)
# Persist camera documentation for the director, not a replacement animation contract.
(ASSETS/"camera-proof.json").write_text(json.dumps({
 "scope":"Blender native QA preview only",
 "heroBlenderPosition":[2.0,-7.2,2.05],
 "explodedBlenderPosition":[8.2,-5.55,2.8],
 "azimuthDegreesApprox":55.9,
 "orbitFrames":[160,332],
 "doesNotChange":"decomposition.json, exported GLB frame transforms or director-owned final timeline"},indent=2))
names=sorted([ob.name for ob in coll.objects])
(ASSETS/"model_nodes.json").write_text(json.dumps({"nodes":names,"required":list(groups),
 "part_groups":{k:len([o for o in coll.objects if o.parent==v]) for k,v in groups.items()}},indent=2))
print("BLENDER_MODEL_PASS",len(coll.objects),"objects",len(names),"nodes")
