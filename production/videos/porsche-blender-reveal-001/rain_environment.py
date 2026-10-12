"""Wet forest highway: physical reflected light, terrain, vegetation and rainfall."""
import math
import random
import bpy
import numpy as np
from mathutils import Vector

def build_environment(scene, material, box, cylinder):
    rng = random.Random(731032)
    world = scene.world.node_tree
    world.nodes.clear()
    bg = world.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.07,0.13,0.24,1)
    bg.inputs['Strength'].default_value = 0.65
    output = world.nodes.new('ShaderNodeOutputWorld')
    world.links.new(bg.outputs[0],output.inputs['Surface'])

    road = material('rain saturated asphalt', (0.025,0.032,0.043),0.16,True,130,0.16)
    nt = road.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['IOR'].default_value=1.33
    p.inputs['Coat Weight'].default_value=1
    p.inputs['Coat Roughness'].default_value=0.035
    geo=nt.nodes.new('ShaderNodeNewGeometry')
    mapping=nt.nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY'
    mapping.inputs[1].default_value=(0.65,0.24,1)
    noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=1.0
    noise.inputs['Detail'].default_value=4
    nt.links.new(geo.outputs['Position'],mapping.inputs[0]);nt.links.new(mapping.outputs[0],noise.inputs[0])
    rough=nt.nodes.new('ShaderNodeMapRange')
    rough.inputs['From Min'].default_value=0.28;rough.inputs['From Max'].default_value=0.70
    rough.inputs['To Min'].default_value=0.04;rough.inputs['To Max'].default_value=0.24
    nt.links.new(noise.outputs['Fac'],rough.inputs[0]);nt.links.new(rough.outputs[0],p.inputs['Roughness'])
    nt.links.new(rough.outputs[0],p.inputs['Coat Roughness'])
    road_object=box('WET ROAD / reflected forest and lamps',(0,-160,-0.085),(8,720,0.15),road)
    paint=material('wet reflective road markings',(0.64,0.68,0.64),0.17,True,80,0.06)
    paint.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=0.6
    for x in [-3.65,3.65]:box('wet road edge',(x,-160,-0.006),(0.085,720,0.002),paint)
    for y in range(-500,201,8):box('centre dash',(0,y,-0.006),(0.095,3.1,0.002),paint)

    soil=material('wet moss earth',(0.025,0.044,0.026),0.76,True,3.4,0.34)
    rock=material('rain darkened granite',(0.05,0.065,0.076),0.25,True,9,0.5)
    bark=material('rain dark bark',(0.035,0.022,0.015),0.63,True,14,0.4)
    foliage=[material('wet forest leaf '+str(i),c,0.32) for i,c in enumerate([
        (0.021,0.069,0.027),(0.043,0.105,0.034),(0.075,0.13,0.047)])]
    for m in foliage:
        bs=m.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Coat Weight'].default_value=0.35;bs.inputs['Coat Roughness'].default_value=0.12

    # Raised irregular forest floor replaces the flat grass plane.
    verts=[];faces=[]
    nx,ny=61,241
    for j in range(ny):
        y=-510+j*3
        for i in range(nx):
            x=-90+i*3
            edge=max(0,abs(x)-4)
            z=-0.04 + min(edge/8,1)*(0.5+0.32*math.sin(y*.085+x*.4))
            z += max(0,edge-8)*(.10+.03*math.sin(y*.017))+min(edge/4,1)*rng.uniform(-.12,.12)
            verts.append((x,y,z))
    for j in range(ny-1):
        for i in range(nx-1):
            a=j*nx+i;faces.append((a,a+1,a+nx+1,a+nx))
    mesh=bpy.data.meshes.new('sloping irregular moss bank');mesh.from_pydata(verts,[],faces);mesh.materials.append(soil)
    o=bpy.data.objects.new('layered forest terrain',mesh);scene.collection.objects.link(o)
    for poly in mesh.polygons:poly.use_smooth=True

    # Leaves form rounded crowns with individually bent blades, using linked geometry.
    clusters=[]
    for k in range(3):
        vs=[];fs=[]
        for i in range(180):
            v=Vector((rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-.8,.8)))
            if v.length>1:v.normalize();v*=rng.uniform(.25,1)
            n=Vector((rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-1,1))).normalized()
            a=n.cross(Vector((0,0,1)))
            if a.length<.01:a=Vector((1,0,0))
            a.normalize();b=n.cross(a).normalized()
            length=rng.uniform(.08,.18);width=length*.45;base=len(vs)
            vs.extend([tuple(v-a*length),tuple(v+b*width),tuple(v+a*length),tuple(v-b*width),tuple(v+n*length*.15)])
            fs.extend([(base,base+1,base+4),(base+1,base+2,base+4),(base+2,base+3,base+4),(base+3,base,base+4)])
        mesh=bpy.data.meshes.new('real leafy crown '+str(k));mesh.from_pydata(vs,[],fs);mesh.materials.append(foliage[k]);clusters.append(mesh)
    def crown(name,loc,size,index):
        o=bpy.data.objects.new(name,clusters[index]);scene.collection.objects.link(o);o.location=loc
        o.scale=size;o.rotation_euler=(rng.uniform(-.3,.3),rng.uniform(-.3,.3),rng.uniform(0,6.28));return o
    for side in [-1,1]:
        for i in range(118):
            y=-350+i*5.3+rng.uniform(-1.5,1.5)
            x=side*rng.uniform(7.3,18);h=rng.uniform(9,17);r=rng.uniform(.16,.36)
            cylinder('rain forest trunk',(x,y,.1),(x+.25,y,h*.8),r,bark,10)
            for j in range(5):
                a=j*math.tau/5+rng.uniform(-.4,.4)
                bx,by=x+math.cos(a)*2.3,y+math.sin(a)*2.3;z=h*rng.uniform(.56,.82)
                cylinder('branch',(x,y,z-1.7),(bx,by,z),r*.29,bark,6)
                crown('dense foliage canopy',(bx,by,z),(2.3,2.3,2.0),i%3)
                crown('overlapping foliage',(bx+.7,by-.4,z+1.3),(2.0,2.0,1.6),(i+1)%3)
            # Deep vegetation and small verge plants give parallax without covering the Porsche.
            for layer in range(3):
                xx=side*(19+layer*7+rng.uniform(-2,2))
                crown('deep forest layers',(xx,y,3+layer*.7),(3.4,3.8,3.0),layer%3)
            for j in range(3):
                xx=side*rng.uniform(4.3,6.8)
                crown('wet verge fern',(xx,y+j*1.5,.4),(.5,.65,.55),j%3)
            if i%3==0:
                bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(side*rng.uniform(4.3,6.5),y,.25))
                stone=bpy.context.object;stone.name='mossy wet verge stone';stone.scale=(rng.uniform(.2,.5),rng.uniform(.25,.65),rng.uniform(.15,.4));stone.data.materials.append(rock)
    steel=material('wet dark roadside metal',(0.05,.07,.09),.19)
    steel.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.75
    luminous=material('warm lamp diffuser',(0.8,.65,.38),.25)
    bs=luminous.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.56,.23,1);bs.inputs['Emission Strength'].default_value=12
    for i,y in enumerate(range(-320,221,24)):
        side=-1 if i%2 else 1;x=side*5.7
        cylinder('road lamp pole',(x,y,0),(x,y,6),.075,steel,10)
        cylinder('road lamp arm',(x,y,5.9),(side*4.2,y,5.9),.055,steel,8)
        box('warm luminous lamp',(side*4.2,y,5.85),(.45,.65,.05),luminous)
        data=bpy.data.lights.new('warm rain lamp','AREA');data.energy=1800;data.color=(1,.63,.34);data.shape='RECTANGLE';data.size=.5;data.size_y=.65
        lamp=bpy.data.objects.new('roadside reflected warm light',data);scene.collection.objects.link(lamp);lamp.location=(side*4.2,y,5.8)

    # Finite haze volume keeps distant layers soft while the hero remains crisp.
    mist=bpy.data.materials.new('rain air / finite atmosphere');mist.use_nodes=True
    nt=mist.node_tree;nt.nodes.clear();v=nt.nodes.new('ShaderNodeVolumePrincipled');v.inputs['Density'].default_value=.006
    v.inputs['Color'].default_value=(.62,.73,.87,1);v.inputs['Anisotropy'].default_value=.35
    o=nt.nodes.new('ShaderNodeOutputMaterial');nt.links.new(v.outputs[0],o.inputs['Volume'])
    haze=box('rain atmosphere',(0,-140,12),(110,680,26),mist)

    rainmat=material('illuminated raindrops',(.44,.58,.73),.15)
    nt=rainmat.node_tree;bs=nt.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(.21,.3,.43,1);bs.inputs['Emission Strength'].default_value=.22
    transparent=nt.nodes.new('ShaderNodeBsdfTransparent');mix=nt.nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=.42
    nt.links.new(transparent.outputs[0],mix.inputs[1]);nt.links.new(bs.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],nt.nodes.get('Material Output').inputs['Surface'])
    seeds=np.array([[rng.uniform(-18,18),rng.uniform(-26,26),rng.uniform(0,15),rng.uniform(.09,.24),rng.uniform(.0025,.006)] for _ in range(1600)])
    rainmesh=bpy.data.meshes.new('moving rain streaks')
    rainmesh.from_pydata([(0,0,0)]*len(seeds)*4,[],[(i*4,i*4+1,i*4+2,i*4+3) for i in range(len(seeds))]);rainmesh.materials.append(rainmat)
    rain=bpy.data.objects.new('falling rain',rainmesh);scene.collection.objects.link(rain)
    # Spray is made of fine droplets, keeping the tyre contact patches visible.
    drops=np.array([[side,rng.random(),rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(.003,.012)] for side in [-1,1] for _ in range(320)])
    spraymesh=bpy.data.meshes.new('tyre spray droplets');spraymesh.from_pydata([(0,0,0)]*len(drops)*4,[],[(i*4,i*4+1,i*4+2,i*4+3) for i in range(len(drops))]);spraymesh.materials.append(rainmat)
    spray=bpy.data.objects.new('rear tyre rain spray',spraymesh);scene.collection.objects.link(spray)
    weather_objects=[haze,rain,spray]
    def weather(frame,pos,editing):
        for obj in weather_objects:obj.hide_render=editing
        if editing:return
        t=frame/30
        x=seeds[:,0];y=(seeds[:,1]+t*12.5+26)%52-26;z=(seeds[:,2]-t*18)%15-.2
        p=np.stack([x,y,z],axis=1)
        vs=np.repeat(p[:,None,:],4,axis=1)
        vs[:,0,0]-=seeds[:,4];vs[:,1,0]+=seeds[:,4]
        vs[:,2,0]+=seeds[:,4]+seeds[:,3]*.1;vs[:,3,0]+=-seeds[:,4]+seeds[:,3]*.1
        vs[:,2:,2]+=seeds[:,3,None]
        rainmesh.vertices.foreach_set('co',vs.ravel());rainmesh.update();rain.location=pos
        age=(drops[:,1]+t*2.1)%1
        p=np.stack([drops[:,0]*(.80+age*.42)+drops[:,2]*age*.3,1.2+age*3.5,.10+np.sin(age*math.pi)*.50+drops[:,3]*age*.08],axis=1)
        vs=np.repeat(p[:,None,:],4,axis=1);size=drops[:,4]*(.3+age)
        vs[:,0,0]-=size;vs[:,1,0]+=size;vs[:,2,0]+=size;vs[:,3,0]-=size
        vs[:,2:,2]+=size[:,None]*2
        spraymesh.vertices.foreach_set('co',vs.ravel());spraymesh.update();spray.location=pos
    return weather
