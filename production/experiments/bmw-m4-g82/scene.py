"""Procedural G82 M4 coupe turntable in native Blender. Inspired model, not BMW CAD."""
import bpy, os, math
from mathutils import Vector
O=os.environ.get("M4_OUTPUT",os.path.abspath("out/m4-g82"))
os.makedirs(O,exist_ok=True)
bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
def material(name,c,m=0,r=.36,emit=0):
    a=bpy.data.materials.new(name);a.diffuse_color=(*c,1);a.use_nodes=True
    bs=a.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*c,1)
    bs.inputs["Metallic"].default_value=m;bs.inputs["Roughness"].default_value=r
    if emit:
        bs.inputs["Emission Color"].default_value=(*c,1)
        bs.inputs["Emission Strength"].default_value=emit
    return a
P=dict(paint=material("Emerald metallic",(.018,.29,.17),.55,.24),
 highlight=material("Bright green reflections",(.018,.47,.27),.55,.22),
 black=material("Carbon gloss",(.013,.017,.02),.24,.27),
 trim=material("Intake black",(.033,.037,.04),.15,.40),
 glass=material("Blue tint",(.03,.072,.087),.16,.16),
 tire=material("Rubber",(.018,.019,.022),0,.75),
 silver=material("Silver forged aluminium",(.53,.62,.68),.8,.23),
 chrome=material("Chromed trim",(.73,.79,.83),.84,.19),
 white=material("Cool LED",(.85,.96,1),.14,.2,2),
 red=material("Rear LED",(.87,.016,.026),.17,.23,1.3),
 blue=material("Blue brakes",(.012,.12,.72),.38,.30))
def mesh(name,points,faces,ma,smooth=True):
    me=bpy.data.meshes.new(name);me.from_pydata(points,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    ob.data.materials.append(P[ma])
    if smooth:
        for p in me.polygons:p.use_smooth=True
    return ob
def panel(name,points,ma):return mesh(name,points,[tuple(range(len(points)))],ma,False)
def line(name,points,ma,t=.012):
    cu=bpy.data.curves.new(name,"CURVE");cu.dimensions="3D";cu.bevel_depth=t;cu.bevel_resolution=3
    sp=cu.splines.new("POLY");sp.points.add(len(points)-1)
    for p,v in zip(sp.points,points):p.co=(*v,1)
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);cu.materials.append(P[ma])
def box(name,loc,dim,ma,bevel=.0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    ob=bpy.context.object;ob.name=name;ob.dimensions=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(P[ma])
    if bevel:
        b=ob.modifiers.new("Bevel","BEVEL");b.width=bevel;b.segments=3
        ob.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
def cyl(name,loc,rad,depth,ma,axis="Y"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=rad,depth=depth,location=loc)
    ob=bpy.context.object;ob.name=name;ob.data.materials.append(P[ma])
    if axis=="Y":ob.rotation_euler=(math.pi/2,0,0)
    if axis=="X":ob.rotation_euler=(0,math.pi/2,0)
    for p in ob.data.polygons:p.use_smooth=True
def ring(name,loc,rad,minor,ma):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,location=loc,
        major_radius=rad,minor_radius=minor,rotation=(math.pi/2,0,0))
    ob=bpy.context.object;ob.name=name;ob.data.materials.append(P[ma])
    for p in ob.data.polygons:p.use_smooth=True
def wid(x):return .865-.11*(abs(x)/2.36)**2+.04*math.exp(-((abs(x)-1.35)/.58)**2)
def deck(x):
    if x>1.55:return 1.035-.13*(x-1.55)/.81
    if x>.53:return 1.035+.035*math.sin((x-.53)/1.02*math.pi)
    if x>-.92:return 1.005+.016*x
    return 1.02-.12*min(1,(-x-.92)/1.44)
def arch(x):
    z=.33
    for a in (-1.43,1.43):
        d=abs(x-a)
        if d<.487:z=max(z,.406+math.sqrt(max(0,.487**2-d*d)))
    return z
xs=[-2.36+4.72*i/100 for i in range(101)]
v=[];f=[];N=11
for x in xs:
    for j in range(N):
        y=wid(x)*(-1+2*j/(N-1))
        v.append((x,y,deck(x)-.093*(abs(y)/wid(x))**2))
for i in range(100):
    for j in range(N-1):
        a=i*N+j;f.append((a,a+1,a+N+1,a+N))
mesh("One sculpted hood and trunk",v,f,"paint")
for s in (-1,1):
    v=[];f=[];N=7
    for x in xs:
        for j in range(N):
            t=j/(N-1);z=arch(x)*(1-t)+(deck(x)-.093)*t
            v.append((x,s*(wid(x)+.026*math.sin(math.pi*t)-.025*(1-t)),z))
    for i in range(100):
        for j in range(N-1):
            a=i*N+j;f.append((a,a+1,a+N+1,a+N))
    mesh("True curved wheel arches on side",v,f,"paint")
    line("Bright shoulder crease",[(x,s*(wid(x)+.012),.845+.023*math.cos(x)) for x in xs[3:-3]],"highlight",.007)
    line("Carbon sill",[(x,s*(wid(x)+.016),arch(x)+.018) for x in xs if -1<x<1],"black",.018)
    line("Two door cut line front",[(.52,s*.9,1.0),(.46,s*.9,.84),(.35,s*.9,.48)],"black",.008)
    line("Two door cut line rear",[(-.82,s*.9,.98),(-.77,s*.9,.74),(-.70,s*.9,.48)],"black",.008)
    box("Door handle",(-.14,s*.91,.96),(.16,.025,.025),"black",.008)
    panel("Front quarter aero vent",[(1.01,s*.914,.88),(1.22,s*.914,.88),
          (1.18,s*.914,.69),(.96,s*.914,.76)],"black")
    for ax in (-1.43,1.43):
        line("Flared wheel opening",[(ax+.47*math.cos(t),s*(wid(ax)+.029),.415+.47*math.sin(t))
          for t in [math.pi*k/32 for k in range(1,32)]],"highlight",.018)
    # Non-rotating mirrors fixed to doors
    box("Carbon wing mirror",(.47,s*.99,1.08),(.30,.21,.12),"black",.048)
box("Underfloor",(0,0,.38),(4.40,1.36,.11),"black",.03)
# Correct two-door sloped glasshouse (G82 rather than four-door G80).
roof=[(.84,.72,1.045),(.23,.602,1.54),(-.72,.611,1.58),(-1.45,.783,1.012)]
for s in (-1,1):
    panel("Green roof side pillar",[(x,s*y,z) for x,y,z in roof],"paint")
    panel("Front side glass",[(.67,s*.712,1.092),(.198,s*.61,1.475),
          (-.40,s*.619,1.49),(-.47,s*.795,1.105)],"glass")
    panel("Rear quarter glass",[(-.46,s*.613,1.491),(-.71,s*.616,1.50),
          (-1.31,s*.781,1.085),(-.515,s*.788,1.11)],"glass")
    line("Roof outline",[(x,s*y,z) for x,y,z in roof],"black",.023)
    line("Chrome window edge",[(.69,s*.72,1.098),(-.45,s*.796,1.104),
          (-1.30,s*.782,1.101)],"chrome",.011)
    line("B-pillar",[(-.45,s*.613,1.50),(-.49,s*.792,1.103)],"black",.025)
panel("Front windshield",[(.82,-.706,1.063),(.82,.706,1.063),
      (.226,.578,1.505),(.226,-.578,1.505)],"glass")
panel("Rear windshield",[(-.73,-.59,1.53),(-.73,.59,1.53),
      (-1.43,.75,1.034),(-1.43,-.75,1.034)],"glass")
panel("Dark roof",[(.23,-.60,1.546),(.23,.60,1.546),
      (-.72,.61,1.585),(-.72,-.61,1.585)],"black")
# Signature G82 tall vertical kidney grille, LED headlights and intakes.
for s in (-1,1):
    y=s*.176
    grille=[(2.385,y-.147,1.057),(2.386,y+.147,1.057),
      (2.395,y+.153,.925),(2.401,y+.142,.47),(2.403,y+.09,.398),
      (2.403,y-.09,.398),(2.401,y-.142,.47),(2.393,y-.154,.925)]
    panel("Tall BMW kidney grille",grille,"black")
    line("Thin chrome outline",grille+[grille[0]],"chrome",.012)
    for k in range(7):
        z=.49+.065*k
        line("Grille slat",[(2.414,y-.114,z),(2.414,y+.114,z)],"trim",.009)
    panel("Slim headlamp",[(2.374,s*.405,1.055),(2.36,s*.82,1.079),
      (2.36,s*.82,.941),(2.373,s*.416,.955)],"black")
    line("White daytime running LED",[(2.385,s*.43,1.027),
      (2.385,s*.76,1.045),(2.386,s*.731,1.006)],"white",.018)
    panel("Lower outer intake",[(2.405,s*.49,.62),(2.407,s*.829,.607),
      (2.406,s*.831,.4),(2.407,s*.475,.4)],"black")
    panel("Rear light",[(-2.381,s*.27,.947),(-2.387,s*.83,.951),
      (-2.40,s*.83,.839),(-2.396,s*.31,.846)],"red")
    line("Rear LED line",[(-2.414,s*.28,.919),(-2.414,s*.76,.915),
      (-2.414,s*.81,.856)],"red",.015)
    for exhaust in (.42,.64):
        cyl("Quad exhaust dark interior",(-2.52,s*exhaust,.38),.09,.11,"black","X")
        cyl("Chrome quad pipe",(-2.575,s*exhaust,.38),.067,.014,"chrome","X")
box("Carbon front lip",(2.38,0,.327),(.25,1.70,.045),"black",.018)
box("Rear carbon diffuser",(-2.39,0,.437),(.13,1.62,.16),"black",.017)
box("Small rear lip",(-2.28,0,1.007),(.18,1.28,.038),"black",.012)
for ax in (-1.43,1.43):
    for s in (-1,1):
        cyl("Performance tyre",(ax,s*.88,.415),.406,.29,"tire")
        ring("Tyre shoulder",(ax,s*1.03,.415),.342,.057,"tire")
        cyl("Machined alloy rim",(ax,s*1.047,.415),.312,.027,"silver")
        cyl("Dark hub recess",(ax,s*1.061,.415),.277,.028,"black")
        cyl("Brake rotor",(ax,s*1.073,.415),.234,.026,"trim")
        ring("Silver wheel lip",(ax,s*1.085,.415),.295,.011,"chrome")
        for i in range(10):
            a=math.tau*i/10
            for d in (-.06,.06):
                line("Double alloy spoke",[(ax+.08*math.cos(a),s*1.098,.415+.08*math.sin(a)),
                   (ax+.273*math.cos(a+d),s*1.103,.415+.273*math.sin(a+d))],"silver",.015)
        cyl("Center cap",(ax,s*1.117,.415),.064,.026,"black")
        box("Blue sport caliper",(ax-.20,s*1.074,.435),(.13,.045,.18),"blue",.013)
cyl("Bonnet roundel",(2.1,0,1.024),.061,.014,"black","Z")
cyl("Roundel face",(2.1,0,1.034),.043,.014,"white","Z")
floor=material("Dark infinite studio",(.038,.047,.055),.11,.47)
bpy.ops.mesh.primitive_plane_add(size=200)
bpy.context.object.name="Studio floor";bpy.context.object.data.materials.append(floor)
def light(name,pos,watts,col,size):
    l=bpy.data.lights.new(name,"AREA");l.energy=watts;l.shape="DISK";l.size=size;l.color=col
    ob=bpy.data.objects.new(name,l);bpy.context.collection.objects.link(ob);ob.location=pos
    ob.rotation_euler=(Vector((0,0,.6))-ob.location).to_track_quat("-Z","Y").to_euler()
light("Large high softbox",(-3,-4,7),1250,(.8,.93,1),6)
light("Green rim softbox",(2.2,4,6),1500,(.66,1,.85),5)
light("Rear white fill",(-4,3,4.5),800,(.87,.94,1),4)
world=bpy.data.worlds.new("Dark studio gradient");world.use_nodes=True
world.node_tree.nodes["Background"].inputs["Color"].default_value=(.03,.042,.05,1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value=.48
sc=bpy.context.scene;sc.world=world
bpy.ops.object.camera_add();camera=bpy.context.object;camera.name="360 DEGREE ANIMATED CAMERA"
sc.camera=camera;camera.data.type="ORTHO";camera.data.ortho_scale=6
sc.frame_start=1;sc.frame_end=144;sc.render.fps=24
sc.render.resolution_x=540;sc.render.resolution_y=960;sc.render.resolution_percentage=100
for frame in range(1,145):
    a=math.radians(42)+math.tau*(frame-1)/144
    camera.location=(7.9*math.cos(a),7.9*math.sin(a),3.45)
    camera.rotation_euler=(Vector((0,0,.84))-camera.location).to_track_quat("-Z","Y").to_euler()
    camera.keyframe_insert(data_path="location",frame=frame)
    camera.keyframe_insert(data_path="rotation_euler",frame=frame)
if camera.animation_data and camera.animation_data.action:
    for fc in camera.animation_data.action.fcurves:
        for point in fc.keyframe_points:point.interpolation="LINEAR"
sc.render.engine="CYCLES";sc.cycles.samples=12;sc.cycles.use_denoising=True
sc.render.image_settings.file_format="PNG"
sc.render.filepath=os.path.join(O,"frames","frame_")
os.makedirs(os.path.join(O,"frames"),exist_ok=True)
sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(O,"BMW_M4_G82.blend"))
print("BLENDER_MODEL_SAVED objects=",len(bpy.data.objects))
if os.environ.get("M4_RENDER","1")=="1":
    bpy.ops.render.render(animation=True)
    print("BLENDER_RENDER_COMPLETE")
