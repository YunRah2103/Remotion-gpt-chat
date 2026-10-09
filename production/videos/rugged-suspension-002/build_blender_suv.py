#!/usr/bin/env python3
"""Original rugged-suspension-002 modern SUV and underbody built in native Blender.
METRES: Three.js Y up, forward -Z. Blender conversion (x,-z,y). Deterministic and no external assets.
Run: blender -b -t 2 --python production/videos/rugged-suspension-002/build_blender_suv.py -- out/assets
"""
import bpy, math, json, hashlib, sys
from pathlib import Path
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in bpy.data.materials:bpy.data.materials.remove(m)
def P(p):x,y,z=p;return(x,-z,y)
def mat(name,color,metal=0,rough=.4,alpha=1,emit=None):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,alpha);m.use_nodes=True
 bs=m.node_tree.nodes.get("Principled BSDF");bs.inputs["Base Color"].default_value=(*color,1)
 bs.inputs["Metallic"].default_value=metal;bs.inputs["Roughness"].default_value=rough
 if alpha<1:
  bs.inputs["Alpha"].default_value=alpha;m.blend_method='BLEND'
 if emit:
  bs.inputs["Emission Color"].default_value=(*emit[:3],1);bs.inputs["Emission Strength"].default_value=emit[3]
 return m
graphite=mat("CERAMIC GRAPHITE | metallic multilayer paint",(.17,.205,.227),.55,.27)
graphite_light=mat("FENDER GRAPHITE | satin",(.255,.281,.285),.38,.35)
roofmat=mat("ROOF COMPOSITE | dark graphite",(.095,.115,.128),.34,.38)
black=mat("MOULDED RUBBER",(.025,.032,.036),.03,.89)
plastic=mat("SATIN ANTHRACITE POLYMER",(.064,.083,.094),.2,.66)
glass=mat("TINTED GLASS",(.052,.126,.165),.23,.20,.83)
chrome=mat("BRUSHED STAINLESS",(.55,.63,.66),.80,.31)
alu=mat("ANODIZED ALUMINUM",(.29,.36,.4),.79,.32)
orange=mat("SAFETY ORANGE ALUMINUM",(.89,.245,.044),.58,.29)
white=mat("DAYLIGHT LED",(.94,.96,.91),.0,.22,emit=(1,.92,.78,1.7))
red=mat("RED LAMP",(.65,.025,.02),.10,.24,emit=(.7,.015,.01,1.2))
def assign(o,m):
 o.data.materials.append(m);o["ae_origin"]="Original Blender procedural SUV | Polish02";return o
def bevel(o,width=.04,segments=3):
 if o.type!='MESH':return o
 b=o.modifiers.new("Precision bevel on manufactured edges","BEVEL");b.width=width;b.segments=segments
 n=o.modifiers.new("Weighted normals","WEIGHTED_NORMAL");n.keep_sharp=True
 return o
def cube(name,center,scale,m,bevelSize=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=P(center))
 o=bpy.context.object;o.name=name;o.dimensions=(scale[0],scale[2],scale[1])
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 assign(o,m)
 if bevelSize:bevel(o,bevelSize)
 return o
def mesh(name,vertices,faces,m,bev=0):
 data=bpy.data.meshes.new(name);data.from_pydata([P(p) for p in vertices],[],faces);data.update()
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);assign(obj,m)
 for f in obj.data.polygons:f.use_smooth=True
 if bev:bevel(obj,bev,2)
 return obj
def quads(name,sections,m,bev=0):
 # Each section is an 8-vertex cross sectional ring in true 3D coordinates
 verts=[v for section in sections for v in section];faces=[]
 for i in range(len(sections)-1):
  for j in range(8):
   k=(j+1)%8;faces.append((i*8+j,(i+1)*8+j,(i+1)*8+k,i*8+k))
 faces.append(tuple(reversed(range(8))));faces.append(tuple((len(sections)-1)*8+j for j in range(8)))
 return mesh(name,verts,faces,m,bev)
def beam(name,a,b,r,m,vertices=10):
 av=Vector(P(a));bv=Vector(P(b));d=bv-av
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(av+bv)/2)
 o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
 return assign(o,m)
def tube(name,points,r,m,res=6):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=14
 curve.bevel_depth=r;curve.bevel_resolution=res;spline=curve.splines.new('POLY')
 spline.points.add(len(points)-1)
 for p,v in zip(spline.points,points):
  xyz=P(v);p.co=(*xyz,1)
 obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj)
 assign(obj,m)
 return obj
def side_panel(side,name,z0,z1,ytop=.28):
 x=side*1.12
 verts=[(x-.008*side,ytop,z0),(x-.008*side,ytop,z1),
 (x,-.43,z1),(x,-.43,z0),
 (side*.91,ytop+.03,z0),(side*.91,ytop+.03,z1)]
 return mesh(name,verts,[(0,1,2,3),(4,5,1,0)],graphite,.015)
# Robust sculpted upper body: 3D cross-section changes along length, continuous around vehicle.
def ring(z,w,upper,lower):
 return [(-w*.79,lower,z),(w*.79,lower,z),(w,lower+.16,z),(w,upper-.10,z),
         (w-.22,upper,z),(-w+.22,upper,z),(-w,upper-.10,z),(-w,lower+.16,z)]
sections=[ring(-2.56,.88,.06,-.39),ring(-2.29,1.08,.25,-.43),
 ring(-1.37,1.11,.43,-.43),ring(-.87,1.12,.38,-.43),
 ring(.83,1.12,.36,-.43),ring(1.40,1.11,.37,-.43),
 ring(2.16,1.10,.20,-.43),ring(2.56,.92,.02,-.41)]
quads("BODY_MAIN | sculpted tapered shell",sections,graphite,.055)
# Hard-surface bonnet with its own shallow raised central surfacing and vents.
mesh("HOOD_SURFACE | six sided formed metal",
 [(-.85,.47,-2.33),(.85,.47,-2.33),(.98,.48,-1.36),(-.98,.48,-1.36),
 (-.67,.54,-2.12),(.67,.54,-2.12),(.79,.55,-1.44),(-.79,.55,-1.44)],
 [(0,1,5,4),(4,5,6,7),(7,6,2,3),(0,4,7,3),(1,2,6,5)],graphite,.027)
for s in [-1,1]:
 cube("BONNET_POWER_BULGE_"+str(s),(s*.59,.53,-1.89),(.18,.047,.69),graphite_light,.037)
 for k in range(5):
  cube("BONNET_HEAT_LOUVRE_"+str(s)+"_"+str(k),(s*.76,.56,-1.78+.095*k),(.075,.017,.035),plastic,.007)
# Angled side-glass cabin, tapered roof and broad front/rear pillars.
quads("GREENHOUSE_A_B_C_D_PILLARS",
 [ring(-1.32,.83,.75,.35),ring(-1.10,.80,1.32,.42),
  ring(-.87,.76,1.49,.43),ring(1.05,.76,1.48,.42),
  ring(1.34,.84,1.26,.37),ring(1.55,.87,.66,.33)],roofmat,.065)
# Wrapped glazing panels are offset from greenhouse in all three dimensions.
mesh("WINDSCREEN_DARK_BLUE_ANGLED",
 [(-.72,.62,-1.312),(.72,.62,-1.312),(.65,1.35,-.993),(-.65,1.35,-.993)],
 [(0,1,2,3)],glass,.009)
mesh("REAR_WINDOW_SMOKED",
 [(-.71,.62,1.562),(.71,.62,1.562),(.63,1.28,1.32),(-.63,1.28,1.32)],
 [(0,1,2,3)],glass,.008)
for s in [-1,1]:
 for a,b,name in [(-.95,-.07,"FRONT"),(.025,.92,"REAR")]:
  mesh("SIDE_WINDOW_"+name+("_L" if s<0 else "_R"),
  [(s*.844,.64,a),(s*.844,.64,b),(s*.76,1.34,b-.09),(s*.76,1.34,a+.085)],
  [(0,1,2,3)],glass,.004)
 tube("WINDOW_BELTLINE_"+name+str(s),[(s*.866,.59,a),(s*.866,.59,b)],.023,roofmat)
 for zz in [-.88,.04,1.01]:
  beam("STRUCTURAL_PILLAR_"+str(s)+"_"+str(zz),(s*.84,.64,zz),(s*.75,1.4,zz-.07),.053,roofmat)
 # Individual door metal skins and discrete jamb creases
 side_panel(s,"DOOR_FRONT_FORMED_"+str(s),-.96,-.07)
 side_panel(s,"DOOR_REAR_FORMED_"+str(s),.08,.93)
 for zz in [-1.05,.005,1.04]:
  tube("DOOR_SEAL_"+str(s)+"_"+str(zz),
       [(s*1.134,.38,zz),(s*1.146,-.40,zz)],.008,plastic,3)
 for zz in [-.32,.66]:
  cube("ALLOY_PULL_HANDLE_"+str(s)+"_"+str(zz),(s*1.18,.20,zz),(.074,.052,.205),chrome,.022)
 # Off-road side skirts, skid and lower sill detailing
 cube("ROCKER_GUARD_"+str(s),(s*1.09,-.45,0),(.22,.12,2.43),black,.055)
 tube("ROCKER_ORANGE_INLAY_"+str(s),[(s*1.226,-.38,-1.03),(s*1.226,-.38,1.05)],.017,orange)
 # Mirrors use separate cover+indicator+stalk, physically outboard
 beam("MIRROR_STALK_"+str(s),(s*.83,.76,-.90),(s*1.26,.77,-.89),.045,black)
 cube("FOLDING_SIDE_MIRROR_"+str(s),(s*1.32,.80,-.88),(.28,.18,.29),graphite_light,.065)
 cube("MIRROR_REPEATER_"+str(s),(s*1.32,.83,-1.038),(.20,.025,.014),white,.005)
 # formed arch flares: near-circle segmented semicircle with muscular radius
 for index,z in enumerate([-1.72,1.72]):
  points=[]
  for i in range(30):
   angle=math.pi*i/29
   points.append((s*1.174,-.67+.68*math.sin(angle),z+.70*math.cos(angle)))
  tube("INSET_WHEEL_ARCH_BROW_"+str(s)+"_"+str(index),points,.094,black,4)
  points2=[(s*1.204,y+.03,zz) for x,y,zz in points]
  tube("FENDER_RIVETED_LIP_"+str(s)+"_"+str(index),points2,.038,graphite_light,3)
  for j in [3,7,11,16,21,26]:
   x,y,zz=points[j]
   cube("ARCH_FASTENER_"+str(s)+"_"+str(index)+"_"+str(j),(s*1.268,y,zz),(.023,.02,.026),chrome,.006)
 # Roof-rack side rails with real stanchions.
 tube("ROOF_RACK_SIDE_"+str(s),[(s*.73,1.60,-1.00),(s*.77,1.60,1.18)],.044,black)
 for zz in [-.84,.19,1.04]:
  beam("ROOF_RACK_STANCHION_"+str(s)+"_"+str(zz),(s*.77,1.46,zz),(s*.76,1.59,zz),.036,chrome)
 for zz in [-.92,.21,1.08]:
  beam("ROOF_RACK_CROSSBAR_"+str(zz),(-.75,1.63,zz),(.75,1.63,zz),.029,alu)
# Forged grille: recessed trim, seven physical louvres, extended skid protection.
cube("FRONT_GRILLE_RECESS",(0,.024,-2.601),(1.37,.41,.09),black,.088)
for i in range(8):
 cube("FRONT_GRILLE_SLAT_"+str(i),(-.54+i*.154,.04,-2.67),(.055,.28,.055),chrome,.018)
tube("GRILLE_ORANGE_GRAPHIC",[(-.58,.22,-2.684),(.58,.22,-2.684)],.02,orange)
for s in [-1,1]:
 cube("LED_HEADLAMP_RECESS_"+str(s),(s*.812,.16,-2.562),(.395,.26,.065),black,.076)
 cube("DAYLIGHT_SIGNATURE_"+str(s),(s*.825,.24,-2.637),(.28,.052,.025),white,.024)
 cube("PROJECTOR_LENS_"+str(s),(s*.825,.114,-2.650),(.14,.12,.035),white,.048)
 cube("REAR_TAIL_LIGHT_"+str(s),(s*.88,.16,2.58),(.15,.36,.044),red,.035)
 cube("SIDE_FENDER_SIGNAL_"+str(s),(s*1.102,.36,-2.24),(.04,.05,.22),orange,.017)
for front in [-1,1]:
 z=-2.67 if front<0 else 2.66
 cube(("FRONT" if front<0 else "REAR")+"_BUMPER_TAPERED",(0,-.33,z),(2.18,.22,.27),plastic,.09)
 tube(("FRONT" if front<0 else "REAR")+"_BASH_BAR",
      [(-1.02,-.46,z-front*.035),(-.72,-.50,z-front*.13),(.72,-.50,z-front*.13),(1.02,-.46,z-front*.035)],.054,chrome)
 for s in [-1,1]:
  tube("RECOVERY_SHACKLE_"+str(front)+"_"+str(s),
      [(s*.60,-.42,z-front*.20),(s*.58,-.54,z-front*.23),(s*.72,-.55,z-front*.23)],.043,orange)
# Severe duty underbody rails and engine/transmission protection, visibly three-dimensional.
for s in [-1,1]:
 beam("BOXED_LADDER_CHASSIS_RAIL_"+str(s),(s*.64,-.49,-2.36),(s*.64,-.49,2.34),.111,alu)
 for zz in [-1.62,0,1.64]:
  cube("CHASSIS_HARDPOINT_"+str(s)+"_"+str(zz),(s*.61,-.52,zz),(.24,.21,.31),black,.027)
for z in [-1.85,-.94,.0,.95,1.85]:
 beam("FRAME_CROSS_MEMBER_"+str(z),(-.7,-.47,z),(.7,-.47,z),.081,alu)
cube("ENGINE_SUMP_SKID",(0,-.61,-1.56),(1.43,.07,1.0),chrome,.045)
cube("TRANSFER_CASE_HOUSING",(0,-.63,.05),(.77,.26,.68),plastic,.12)
for s in [-1,1]:
 beam("SIDE_UNDERBODY_PROTECTOR_"+str(s),(s*.86,-.57,-.95),(s*.86,-.57,1.1),.054,alu)
# Original source contract: static vehicle shell only. Suspension rig is live constrained Three.js geometry.
out=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path('out/assets')
out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str((out/'rugged-suv-body-002.blend').resolve()))
bpy.ops.export_scene.gltf(filepath=str((out/'rugged-suv-body-002.glb').resolve()),
 export_format='GLB',export_extras=True,export_yup=True,export_normals=True,
 export_texcoords=True,export_animations=False)
glb=out/'rugged-suv-body-002.glb'
objects=[x for x in bpy.context.scene.objects if x.type in ('MESH','CURVE')]
report={'asset':'rugged-suv-body-002','metres':True,'source':'Original native Blender authored procedural hard-surface body',
 'blenderVersion':bpy.app.version_string,'objectCount':len(objects),
 'objectNames':[o.name for o in objects], 'glbBytes':glb.stat().st_size,
 'sha256':hashlib.sha256(glb.read_bytes()).hexdigest(),
 'note':'GLB static shell, wheel and suspension motion provided by separately validated joint solver in Remotion.'}
(out/'blender-build-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('RUGGED02_NATIVE_BLENDER_BUILD_PASS',len(objects),'objects',glb.stat().st_size,'bytes')
