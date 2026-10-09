"""Reusable Blender assemblies for Automotive Engineering 001 / ABS.
Run: blender -b --python automotive/abs001/blender_assets.py
Exports separate original GLB assets and two original studio previews.
This is a source asset generator, not a claim that this Blender output was used in
the chat-delivered VTK render or the independent Remotion procedural film.
"""
import bpy, math, os
from mathutils import Vector
from math import pi, cos, sin
ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(ROOT,"generated"); os.makedirs(OUT,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine="CYCLES";scene.cycles.samples=16
scene.render.resolution_x=720;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.world.color=(.035,.055,.08)
def material(name,col,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1)
 m.use_nodes=True;bs=m.node_tree.nodes.get("Principled BSDF")
 bs.inputs["Base Color"].default_value=(*col,1)
 bs.inputs["Metallic"].default_value=metal
 bs.inputs["Roughness"].default_value=rough
 return m
rub=material("Carbon-black radial tyre",(.027,.032,.039),0,.79)
tread=material("Raised tread ribs",(.055,.067,.075),0,.84)
alloy=material("Brushed forged aluminium",(.53,.60,.63),.72,.25)
rotor=material("Vented steel rotor",(.61,.67,.69),.75,.3)
cal=material("Red painted caliper",(.65,.15,.12),.48,.28)
pad=material("Graphite friction pads",(.11,.12,.13),.04,.81)
sensor=material("Wheel-speed sensor",(.19,.72,.80),.25,.32)
gold=material("Copper coil",(.82,.42,.16),.61,.3)
case=material("Manifold alloy",(.34,.44,.50),.64,.39)
fluid=material("Blue high pressure path",(.12,.55,.88),.3,.24)
return_mat=material("Orange return path",(.95,.49,.2),.3,.25)
def put(obj,name,mat,collection):
 obj.name=name;obj.data.materials.append(mat)
 for c in tuple(obj.users_collection):c.objects.unlink(obj)
 collection.objects.link(obj)
 return obj
def coll(name):
 c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
def bevel(obj,size=.014):
 b=obj.modifiers.new("Machined edge bevel","BEVEL");b.width=size;b.segments=2
 obj.modifiers.new("Weighted face normals","WEIGHTED_NORMAL");return obj
def cube(name,loc,scale,mat,collection,rot=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rot or (0,0,0))
 o=put(bpy.context.object,name,mat,collection);o.dimensions=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return bevel(o)
def cyl(name,loc,r,depth,mat,collection,axis="X",vertices=64):
 rot=(0,pi/2,0) if axis=="X" else ((pi/2,0,0) if axis=="Z" else (0,0,0))
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc,rotation=rot)
 o=put(bpy.context.object,name,mat,collection);return bevel(o,.009)
def tor(name,loc,r,t,mat,collection,axis="X"):
 rot=(0,pi/2,0) if axis=="X" else ((pi/2,0,0) if axis=="Y" else (0,0,0))
 bpy.ops.mesh.primitive_torus_add(major_segments=72,minor_segments=12,location=loc,rotation=rot,major_radius=r,minor_radius=t)
 return put(bpy.context.object,name,mat,collection)
def pipe(name,pts,rad,mat,collection):
 cu=bpy.data.curves.new(name,"CURVE");cu.dimensions="3D";cu.resolution_u=16;cu.bevel_depth=rad;cu.bevel_resolution=5
 sp=cu.splines.new("POLY");sp.points.add(len(pts)-1)
 for p,xyz in zip(sp.points,pts):p.co=(*xyz,1)
 ob=bpy.data.objects.new(name,cu);collection.objects.link(ob);ob.data.materials.append(mat);return ob
W=coll("01 WHEEL | BRAKE | SENSOR")
# Axle along X; tyre and rotor share the same rotational axis, caliper fixed in world.
for x in [-.17,-.06,.06,.17]:tor("Rubber toroid band", (x,0,0),.80,.13,rub,W)
for x in [-.24,.24]:tor("Sidewall bead", (x,0,0),.69,.06,rub,W)
for x in [-.32,.29]:tor("Alloy rim lip",(x,0,0),.54,.048,alloy,W)
cyl("Forged centre hub",(.31,0,0),.17,.12,alloy,W)
for i in range(10):
 a=i*2*pi/10
 o=cube("Radial spoke %02d"%i,(.30,.32*cos(a),.32*sin(a)),(.065,.42,.072),alloy,W)
 o.rotation_euler[0]=-a
 for r in [.17]:
  cyl("Wheel lug bolt",(.38,r*cos(a),r*sin(a)),.033,.025,pad,W)
for x in [-.20,-.15]:cyl("Vented rotor friction face",(x,0,0),.60,.026,rotor,W)
for i in range(24):
 a=i*pi/12
 for r in (.44,.52):
  cyl("Rotor drilled vent",(-.22,r*cos(a),r*sin(a)),.019,.008,pad,W,vertices=10)
for x in [-.32,.075]:
 cube("Two-piece fixed caliper half",(x,.35,-.35),(.15,.43,.36),cal,W)
 cube("Inner brake pad",(x+(.08 if x<0 else -.07),.35,-.35),(.045,.27,.27),pad,W)
cube("Caliper bridge",(-.115,.59,-.35),(.53,.12,.32),cal,W)
tor("Toothed encoder carrier",(-.3,0,0),.30,.024,gold,W)
for i in range(44):
 a=i*2*pi/44
 o=cube("Encoder tooth %02d"%i,(-.31,.313*cos(a),.313*sin(a)),(.022,.048,.027),gold,W)
 o.rotation_euler[0]=-a
cube("Fixed active speed sensor",(-.42,.30,.23),(.14,.12,.11),sensor,W)
pipe("Sensor signal cable",[(-.42,.30,.23),(-.6,.4,.27),(-.78,.54,.37)],.022,sensor,W)
H=coll("02 HYDRAULIC | VALVES | PUMP")
cube("Milled aluminium hydraulic body",(0,-.20,-.46),(4.75,2.42,.80),case,H)
for x in [-1.75,-.6,.6,1.75]:
 cyl("Brake line manifold port",(x,1.11,-.25),.11,.44,alloy,H,"Y")
for x,label,hilite in [(-.95,"Inlet valve",sensor),(.9,"Outlet valve",return_mat)]:
 cyl(label+" solenoid casing",(x,.33,.16),.30,.77,case,H,"Y")
 for k in range(7):tor(label+" copper winding",(x,-.02+k*.11,.18),.27,.024,gold,H,"Y")
 cyl(label+" steel armature",(x,-.30,.17),.08,1.03,alloy,H,"Y")
 tor(label+" annular valve seat",(x,-.79,.18),.17,.033,rotor,H,"Y")
 cyl(label+" valve poppet",(x,-.59 if x<0 else -.79,.18),.15,.15,hilite,H,"Y")
cyl("Brake master cylinder",(-3.4,.12,.08),.30,1.35,alloy,H)
cyl("Master piston",(-4.1,.12,.08),.24,.22,rotor,H)
pipe("Pressure feed master to inlet and caliper",
 [(-3.0,.12,.05),(-2.2,.12,.05),(-.95,.12,.05),(.05,.12,.05),(2.2,.12,.05),(3.4,.12,.05)],.093,fluid,H)
cyl("Caliper piston outlet",(3.5,.12,.05),.28,.2,alloy,H)
pipe("Return line via accumulator and pump",
 [(.9,-.8,.18),(1.5,-1.44,.18),(2.3,-1.44,.18),(.3,-1.8,.18),(-.95,-.79,.18)],.075,return_mat,H)
cyl("Low pressure accumulator",(2.25,-1.36,.17),.38,.75,alloy,H,"Y")
cyl("Return pump housing",(.65,-1.95,.26),.47,.35,alloy,H)
for i in range(6):
 a=i*pi/3
 o=cube("Pump radial impeller blade",(.91,-1.95+.2*cos(a),.26+.2*sin(a)),(.08,.30,.08),rotor,H)
 o.rotation_euler[0]=-a
cube("ABS electronic controller",(0,1.75,-.24),(1.4,.74,.60),case,H)
cube("Controller microprocessor",(0,1.79,.10),(.48,.31,.19),pad,H)
pipe("Controller input signal",[(-.43,.4,.22),(-.8,1.50,.2),(-.2,1.57,.2)],.025,sensor,H)
def camera_lights(target,position):
 for o in tuple(bpy.data.objects):
  if o.type in {"CAMERA","LIGHT"}:bpy.data.objects.remove(o,do_unlink=True)
 bpy.ops.object.camera_add(location=position)
 cam=bpy.context.object;direction=Vector(target)-cam.location;cam.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
 cam.data.type="ORTHO";cam.data.ortho_scale=5.2;scene.camera=cam
 for p,power,size in [((-4,6,6),1400,5),((5,3,5),1000,4),((1,6,-3),1500,5)]:
  bpy.ops.object.light_add(type="AREA",location=p);l=bpy.context.object;l.data.energy=power;l.data.shape="DISK";l.data.size=size
def reveal(c):
 for o in bpy.data.objects:
  if o.type=="MESH" or o.type=="CURVE":o.hide_render=(o.name not in {x.name for x in c.objects})
def export(c,path):
 bpy.ops.object.select_all(action="DESELECT")
 for ob in c.objects:ob.select_set(True)
 if c.objects:
  bpy.context.view_layer.objects.active=c.objects[0]
 bpy.ops.export_scene.gltf(filepath=path,export_format="GLB",use_selection=True)
for c,filename,position,target in [
 (W,"ABS001-Wheel-Brake-Sensor",(3.6,2.1,7.5),(0,0,0)),
 (H,"ABS001-Hydraulic-Modulator",(5,3.2,11),(0,-.2,0))]:
 export(c,os.path.join(OUT,filename+".glb"))
 reveal(c);camera_lights(target,position)
 scene.render.filepath=os.path.join(OUT,filename+".png")
 bpy.ops.render.render(write_still=True)
 print("BLENDER_ASSET_OK",filename)
