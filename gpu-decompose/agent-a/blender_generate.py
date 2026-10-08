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
frame_mat=mat("M_SHROUD_DARK",(.055,.063,.076),.2,.36)
rim=mat("M_FAN_RING",(.018,.022,.027),.32,.3)
blade=mat("M_FAN_BLADE",(.025,.031,.039),.16,.46)
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
ventmat=mat("M_BACKPLATE_GRAPHITE",(.066,.073,.083),.64,.44)
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
 # Curved swept 3D aerofoils, angled/cambered leading/trailing edges in XZ.
 N=10;ang=idx*math.tau/N
 vals=[(.135,-.32),(.22,-.23),(.34,-.08),(.43,.19)]
 verts=[]
 for yy in [0,.012]:
  for r,sweep in vals:
   for edge in [0,.14]:
    a=ang+sweep+edge+(r-.13)*.32
    verts.append((cx+r*math.cos(a),-.213+yy+.009*(r/.43),cz+r*math.sin(a)))
 polys=[]
 for j in range(len(vals)-1):
  k=j*2; t=(j+1)*2
  polys.append((k,t,t+1,k+1))
  polys.append((8+k+1,8+t+1,8+t,8+k))
 for i in range(7):
  j=(i+1)%8
  if i<7:polys.append((i,j,8+j,8+i))
 polys.append((0,8,9,1));polys.append((6,7,15,14))
 mesh=bpy.data.meshes.new("SweptBladeGeometry");mesh.from_pydata(verts,[],polys);mesh.update()
 ob=bpy.data.objects.new("RotorBlade_%02d"%idx,mesh);coll.objects.link(ob);ob.parent=parent
 mesh.materials.append(material)
 for f in mesh.polygons:f.use_smooth=True
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
  for q in tri:verts.append((x+q[0]*.01,-.219-q[2]*.01,z+q[1]*.01))
  polys.append((idx,idx+1,idx+2))
 me=bpy.data.meshes.new("OpenSCAD_CAD_HUB_MESH");me.from_pydata(verts,[],polys);me.update()
 ob=bpy.data.objects.new(name,me);coll.objects.link(ob);ob.parent=parent
 me.materials.append(hubmat);return ob
cad=HERE/"fan_hub.stl"
if not cad.exists():raise RuntimeError("Real OpenSCAD STL required before modelling: "+str(cad))
# Fans: positions verified from three-up marketing photography, approximate 90mm rotors.
for i,(x,node) in enumerate(zip([-.94,0,.94],fan_nodes)):
 torus("FAN_%d_Spinner_Rim"%i,(x,-.203,.025),.452,.012,rim,node)
 torus("FAN_%d_OuterRing"%i,(x,-.199,.025),.468,.008,frame_mat,node)
 for j in range(10):blade_mesh(node,x,.025,j,blade)
 cylinder("FAN_HUB_CORE_%d"%i,(x,-.220,.025),.144,.024,hubmat,node)
 import_cad_hub("OpenSCAD_FanHub_%d"%i,cad,node,x,.025)
 # Minimal engraved X mark on each dark hub face:
 for sign in [-1,1]:
  ob=box("FAN_X_badge_%d_%d"%(i,sign),(x+sign*.017,-.235,.025),(.042,.003,.006),accent,node)
  ob.rotation_euler[1]=sign*.61
# Shroud has open fan holes. No front-covering opaque solid panel.
# Real dark polygon fascia surrounding circular fan cut-outs, rather than exposed silver cooling fins.
def aperture_fascia(parent,cx):
 verts=[];faces=[]
 segments=96;inner=.454
 for i in range(segments):
  a0=i*math.tau/segments;a1=(i+1)*math.tau/segments
  def point(a,r):
   return (cx+r*math.cos(a),-.223,.025+r*math.sin(a))
  def outer(a):
   ca=math.cos(a);sa=math.sin(a)
   edge_z=.525 if sa>=0 else .570
   return min(.474/max(1e-6,abs(ca)),edge_z/max(1e-6,abs(sa)))
  start=len(verts)
  verts.extend([point(a0,inner),point(a0,outer(a0)),point(a1,outer(a1)),point(a1,inner)])
  faces.extend([(start,start+1,start+2),(start,start+2,start+3)])
 me=bpy.data.meshes.new("ApertureFascia");me.from_pydata(verts,[],faces);me.update()
 ob=bpy.data.objects.new("Solid_Fan_Aperture_Fascia",me);coll.objects.link(ob)
 ob.parent=parent;me.materials.append(plastic)
for fan_x in [-.94,0,.94]:aperture_fascia(shroud,fan_x)
box("Shroud_top_rail",(0,-.177,.584),(2.90,.108,.072),plastic,shroud,.010)
box("Shroud_bottom_rail",(0,-.177,-.583),(2.90,.106,.074),plastic,shroud,.009)
for x in [-1.419,1.419]:
 box("Shroud_end_cap",(x,-.178,0),(.062,.12,1.16),plastic,shroud,.012)
for x in [-.468,.468]:
 box("Shroud_center_bridge",(x,-.184,0),(.018,.07,1.12),frame_mat,shroud,.006)
for x in [-.94,0,.94]:
 torus("ShroudFanBezel",(x,-.210,.025),.47,.019,frame_mat,shroud)
# bevelled side bands/ridges
for z in [-.519,.519]:
 box("Shroud_side_creaseline",(0,-.217,z),(2.81,.021,.015),black_gloss,shroud,.004)
for x in [-1.33,1.33]:
 for z in [-.52,.52]:
  box("MountBoss",(x,-.16,z),(.076,.065,.076),plastic,shroud,.008)
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
# Backplate, distinctive left labyrinth and large right vent cutout visible.
box("Backplate_left_solid",(-.49,.231,.0),(1.90,.022,1.206),ventmat,back,.016)
box("Backplate_top_beam",(1.02,.231,.554),(.90,.024,.098),ventmat,back,.010)
box("Backplate_bottom_beam",(1.02,.231,-.554),(.90,.024,.100),ventmat,back,.010)
box("Backplate_end_beam",(1.407,.231,0),(.074,.024,1.12),ventmat,back,.008)
box("Backplate_vent_border",(.578,.231,0),(.065,.024,1.12),ventmat,back,.007)
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
 bpy.context.scene.collection.objects.link(cam);cam.location=(3.4,-7.2,2.3)
 dire=Vector((0,0,0))-cam.location;cam.rotation_euler=dire.to_track_quat("-Z","Y").to_euler()
 camdata.type="ORTHO";camdata.ortho_scale=4.25;bpy.context.scene.camera=cam
 scene=bpy.context.scene
 scene.render.engine='CYCLES';scene.cycles.samples=124
 for layer in scene.view_layers:
  if hasattr(layer,'cycles'):layer.cycles.use_denoising=False
 scene.render.resolution_x=680;scene.render.resolution_y=480
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
scene.frame_set(449)
# Stronger three-quarter viewing angle makes front-to-back exploded offsets readable.
camera=scene.camera
camera.location=(6.2,-5.6,2.65)
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.ortho_scale=5.1
scene.render.filepath=str(ASSETS/"exploded.png");bpy.ops.render.render(write_still=True)
# Render REAL sampled moving frames for short evidence video, no screenshot animation fakes.
preview=ASSETS/"moving_frames";preview.mkdir(exist_ok=True)
scene.render.resolution_x=448;scene.render.resolution_y=316
scene.cycles.samples=6
for f in list(range(89,330,12))+[380,449]:
 scene.frame_set(f)
 scene.render.filepath=str(preview/("f_%03d.png"%f))
 bpy.ops.render.render(write_still=True)
names=sorted([ob.name for ob in coll.objects])
(ASSETS/"model_nodes.json").write_text(json.dumps({"nodes":names,"required":list(groups),
 "part_groups":{k:len([o for o in coll.objects if o.parent==v]) for k,v in groups.items()}},indent=2))
print("BLENDER_MODEL_PASS",len(coll.objects),"objects",len(names),"nodes")
