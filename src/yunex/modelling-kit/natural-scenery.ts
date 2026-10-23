/** Continuous shoulders and irregular natural geometry; no external textures/assets. */
import * as T from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {random,instances} from '../world-kit/scenery.ts';
import type {Instance} from '../world-kit/scenery.ts';
import {scenicOffset} from '../world-kit/world-catalog.ts';
import {mesh,surface} from '../world-kit/geometry.ts';
import type {EnvironmentOptions} from '../world-kit/environments.ts';
function roughRock(seed:number){const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.14*Math.sin(x*9+seed)*Math.sin(y*8-z*5)+.065*Math.sin(z*17+seed*.73);p.setXYZ(i,x*r,y*r,z*r);}g.deleteAttribute('normal');g.deleteAttribute('uv');const smooth=mergeVertices(g,.00001);g.dispose();smooth.computeVertexNormals();return smooth;}
export function naturalScenery(root:T.Group,o:EnvironmentOptions){
 if(!['mountain','rally','forest','coast'].includes(o.kind))return;
 const g=new T.Group();g.name='natural-scenery-v4';root.add(g);const rng=random((o.seed??12)+4913),rally=o.kind==='rally';
 if(rally)for(const name of ['retaining-wall','retaining-buttresses','wall-coping']){const old=root.getObjectByName(name);if(old)old.visible=false;}
 if(o.kind==='mountain')for(const name of ['rock-peaks','snow-caps']){const old=root.getObjectByName(name);if(old)old.visible=false;}
 const positions:number[]=[],colors:number[]=[],index:number[]=[];
 // The ragged verge is one continuous mesh on each side, not repeated stamped tiles.
 for(const side of [-1,1]){
  const base=positions.length/3,nx=320,nz=12;
  for(let i=0;i<=nx;i++){const x=-120+i*.75,centre=scenicOffset(x,o.kind);for(let j=0;j<=nz;j++){const u=j/nz,width=5.06+u*(2.0+.6*Math.sin(x*.09+side)),z=centre+side*width,y=-.025-.08*u+.023*Math.sin(x*2.3+z*4)*u;positions.push(x,y,z);const c=new T.Color(rally?'#91846b':'#777b65').multiplyScalar(.78+.17*Math.sin(x*.18+u*7)+rng()*.16);colors.push(c.r,c.g,c.b);}}
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=base+i*(nz+1)+j,b=a+nz+1;index.push(...(side>0?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
 }
 const shoulder=new T.BufferGeometry();shoulder.setAttribute('position',new T.Float32BufferAttribute(positions,3));shoulder.setAttribute('color',new T.Float32BufferAttribute(colors,3));shoulder.setIndex(index);shoulder.computeVertexNormals();mesh(g,shoulder,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),[0,0,0],[0,0,0],'natural-road-shoulder');
 const grass:Instance[]=[],stones:Instance[][]=[[],[],[]],shrubs:Instance[]=[];
 for(let i=0;i<1800;i++){const x=(rng()-.5)*240,side=i%2?1:-1,z=scenicOffset(x,o.kind)+side*(6.4+rng()*7),h=.12+rng()*.42;grass.push({p:[x,h*.5-.03,z],s:[.10+rng()*.16,h,.10+rng()*.13],ry:rng()*Math.PI*2,color:['#60694b','#767b52','#8a8760','#525e43'][i%4]});}
 for(let i=0;i<90;i++){const x=(rng()-.5)*240,side=i%2?1:-1,z=scenicOffset(x,o.kind)+side*(11+rng()*24),h=.18+rng()**2*(o.kind==='mountain'?2.0:1.3);stones[i%3].push({p:[x,h*.32-.08,z],s:[h*(.8+rng()),h,h*(.7+rng())],ry:rng()*6.28,color:['#7c8178','#8c8b7c','#99998b'][i%3]});}
 for(let i=0;i<210;i++){const x=(rng()-.5)*240,side=i%2?1:-1,z=scenicOffset(x,o.kind)+side*(10.5+rng()*22),h=.22+rng()*.7;shrubs.push({p:[x,h*.5-.03,z],s:[h*1.6,h,h*1.4],ry:rng()*6.28,color:['#4e6047','#657257','#7c815d'][i%3]});}
 const blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,.5,0,0,.12,1,0,0,0,-.5,0,0,.5,-.09,.88,0],3));blade.computeVertexNormals();const foliage=surface('#ffffff',0,.98);foliage.side=T.DoubleSide;const tufts=instances(g,'irregular-verge-grass',blade,foliage,grass);tufts.castShadow=false;
 stones.forEach((items,i)=>instances(g,`eroded-rock-group-${i}`,roughRock(i+7),surface('#ffffff',.02,.95),items));instances(g,'irregular-roadside-shrubs',roughRock(23),surface('#ffffff',0,.97),shrubs);
 // Preserve authored tree placement, replace the regular low-poly crown silhouettes.
 const oldRocks=root.getObjectByName('roadside-boulder-clusters') as T.InstancedMesh|undefined;if(oldRocks){const old=oldRocks.geometry;oldRocks.geometry=roughRock(53);old.dispose();const material=oldRocks.material as T.MeshStandardMaterial;material.flatShading=false;material.needsUpdate=true;}
 const crowns=root.getObjectByName('tree-crowns') as T.InstancedMesh|undefined;
 if(crowns){const old=crowns.geometry;crowns.geometry=roughRock(39);old.dispose();const leaflets:Instance[]=[],matrix=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3();for(let i=0;i<crowns.count;i++){crowns.getMatrixAt(i,matrix);matrix.decompose(p,q,scale);for(let j=0;j<5;j++){const a=j*2.399+i*.6;leaflets.push({p:[p.x+Math.cos(a)*scale.x*.65,p.y+Math.sin(j*1.3)*scale.y*.6,p.z+Math.sin(a)*scale.z*.65],s:[scale.x*.55,scale.y*.45,scale.z*.50],ry:a,color:['#516a4d','#69825b','#7b8d68'][j%3]});}}instances(g,'leafy-crown-breakup',roughRock(19),surface('#ffffff',0,.96),leaflets);}
 root.userData.naturalScenery='v4 continuous shoulders, eroded rocks and irregular instanced foliage';
}
