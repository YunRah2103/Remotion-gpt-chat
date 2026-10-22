import * as T from "three";
import {createCinematicEnvironment} from "../../../../src/yunex/modelling-kit/environments.ts";
import {EP005_ROUTE,EP005_CAMERA_CLEARANCE,trackPoint} from "./route.ts";
type Item={p:[number,number,number];s:[number,number,number];yaw?:number;color?:string};
const surface=(color:string,roughness=.7,metalness=.1,emissive="#000000",emissiveIntensity=0)=>
 new T.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity});
function batch(g:T.Group,name:string,geo:T.BufferGeometry,mat:T.MeshStandardMaterial,items:Item[]){
 const mesh=new T.InstancedMesh(geo,mat,items.length),dummy=new T.Object3D();
 mesh.name="ep005-"+name;mesh.frustumCulled=false;mesh.receiveShadow=true;
 items.forEach((a,i)=>{dummy.position.set(...a.p);dummy.rotation.set(0,a.yaw??0,0);
  dummy.scale.set(...a.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  if(a.color)mesh.setColorAt(i,new T.Color(a.color));});
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 g.add(mesh);return mesh;
}
function item(distance:number,sideOffset:number,y:number,s:Item["s"],color?:string):Item{
 const p=trackPoint(distance,sideOffset,y);return {p:p.position,yaw:p.yaw,s,color};
}
const hash=(x:number,y:number)=>(((x*374761393)^(y*668265263)^(x*y*1274126177))>>>0);
function makeTexture(n:number,bytes:Uint8Array,srgb:boolean){
 const tex=new T.DataTexture(bytes,n,n,T.RGBAFormat);
 tex.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;
 tex.wrapS=tex.wrapT=T.RepeatWrapping;
 tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
 tex.generateMipmaps=true;tex.anisotropy=4;tex.needsUpdate=true;
 return tex;
}
/** Procedural physically-rough asphalt: baked procedural maps, no screen-space mirror. */
function upgradeRoad(world:T.Group){
 const road=world.getObjectByName("circuit-asphalt");
 if(!(road instanceof T.Mesh))throw Error("EP005 needs the original V3 circuit-asphalt");
 const attr=road.geometry.getAttribute("position");
 if(!attr)throw Error("V3 circuit-asphalt lacks positions");
 // The original ribbon was generated in world X/Z. Add UVs only; never change its vertices.
 const uv=new Float32Array(attr.count*2);
 for(let i=0;i<attr.count;i++){uv[2*i]=attr.getX(i)/7;uv[2*i+1]=attr.getZ(i)/7;}
 road.geometry.setAttribute("uv",new T.BufferAttribute(uv,2));
 const n=256,colour=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const k=4*(y*n+x),grain=hash(x,y)%32-16;
  const veins=Math.sin((x+y)*.13)*Math.cos((x-y)*.07)*8;
  const irregular=Math.sin(x*.041+2*Math.cos(y*.065))*Math.cos(y*.057)*13;
  const r=Math.max(49,Math.min(119,Math.round(87+grain*.72+veins+irregular)));
  colour[k]=r-5;colour[k+1]=r;colour[k+2]=r+5;colour[k+3]=255;
  const v=Math.max(151,Math.min(232,Math.round(197-grain*.65+irregular*.58)));
  rough[k]=rough[k+1]=rough[k+2]=v;rough[k+3]=255;
 }
 const mat=road.material as T.MeshStandardMaterial;
 mat.color.set("#c2ccd4");mat.map=makeTexture(n,colour,true);
 mat.roughnessMap=makeTexture(n,rough,false);
 mat.bumpMap=mat.roughnessMap;mat.bumpScale=.013;
 mat.roughness=.89;mat.metalness=.055;mat.envMapIntensity=.85;
 mat.needsUpdate=true;road.receiveShadow=true;
 road.userData.ep005Asphalt={uvProjectedFrom:"unchanged source V3 vertex positions",
  physical:"deterministic grit + mottled aggregate",roughness:.89,wetness:EP005_ROUTE.wetness,
  preservesRoute:true};
}
/** Additive route-tangent circuit with richer PBR road and subtle practical scenery. */
export function createEP005NightCircuit({premium=true}:{premium?:boolean}={}):T.Group{
 const world=createCinematicEnvironment({kind:EP005_ROUTE.kind,seed:EP005_ROUTE.seed,
  timeOfDay:premium?"night":EP005_ROUTE.timeOfDay,wetness:EP005_ROUTE.wetness,quality:"hero"});
 world.name="EP005-premium-after-dark-circuit";
 world.userData.ep005={route:EP005_ROUTE,clearance:EP005_CAMERA_CLEARANCE,premium};
 if(!premium)return world;
 upgradeRoad(world);
 const g=new T.Group();g.name="ep005-premium-environment";world.add(g);
 const steel=surface("#445761",.43,.52),warm=surface("#e5caa8",.36,.13,"#f5ba6b",2.05);
 const cyan=surface("#70a9b8",.4,.33,"#397a9b",.67);
 const trim=surface("#85969a",.59,.2),stone=surface("#323e45",.98,.015);
 const lap=EP005_ROUTE.lapMetres,segments=96,lampCount=12;
 const studs:Item[]=[],barrierEdge:Item[]=[],mast:Item[]=[],lamp:Item[]=[],arms:Item[]=[],foot:Item[]=[];
 const seams:Item[]=[],shoulderSheen:Item[]=[];
 for(let i=0;i<segments;i++){
  const d=lap*(i+.25)/segments;
  for(const side of [-1,1]){
   studs.push(item(d,side*11.97,.50,[.23,.10,.07],side<0?"#efd4a5":"#a5bfcb"));
   if(i%3===0)barrierEdge.push(item(d,side*12.10,.96,[1.34,.055,.045]));
   // Very thin edge surface details. Car stays within +/-6m road; no road height changed.
   if(i%2===0)seams.push(item(d,side*5.78,.009,[1.45,.009,.038]));
   if(i%4===0)shoulderSheen.push(item(d,side*5.43,.008,[2.15,.006,.33]));
  }
 }
 batch(g,"barrier-retroreflectors",new T.BoxGeometry(),surface("#e8ded0",.37,.09),studs);
 batch(g,"barrier-cap-accents",new T.BoxGeometry(),trim,barrierEdge);
 batch(g,"shoulder-tar-seams",new T.BoxGeometry(),surface("#232f35",.95,.01),seams);
 batch(g,"damp-shoulder-patches",new T.BoxGeometry(),surface("#303e4b",.54,.035),shoulderSheen);
 for(let i=0;i<lampCount;i++){
  const d=lap*(i+.07)/lampCount;
  for(const side of [-1,1]){
   mast.push(item(d,side*20.8,3.55,[1,1,1]));
   arms.push(item(d,side*20.0,7.02,[.12,.12,1.8]));
   lamp.push(item(d,side*19.30,6.96,[.68,.10,.36]));
   foot.push(item(d,side*20.8,.09,[.8,.18,.8]));
  }
 }
 batch(g,"track-lamp-masts",new T.CylinderGeometry(.095,.13,7.1,12),steel,mast);
 batch(g,"track-lamp-arms",new T.BoxGeometry(),steel,arms);
 batch(g,"track-warm-luminaires",new T.BoxGeometry(),warm,lamp);
 batch(g,"track-light-footings",new T.BoxGeometry(),trim,foot);
 const pylons:Item[]=[],roofs:Item[]=[],indirect:Item[]=[],bases:Item[]=[];
 for(const f of [.11,.24,.37,.58,.73,.89]){
  const d=lap*f,side=f<.5?1:-1;
  for(const shift of [-4,4]){
   pylons.push(item(d+shift,side*23.5,3.3,[.48,6.6,.46]));
   bases.push(item(d+shift,side*23.5,.14,[.94,.28,.92]));
  }
  roofs.push(item(d,side*23.6,6.75,[9,.36,5.8]));
  indirect.push(item(d,side*20.8,6.48,[8.7,.055,.14]));
 }
 batch(g,"paddock-canopy-pillars",new T.BoxGeometry(),steel,pylons);
 batch(g,"paddock-canopy-roofs",new T.BoxGeometry(),surface("#243442",.56,.23),roofs);
 batch(g,"paddock-wash-leds",new T.BoxGeometry(),cyan,indirect);
 batch(g,"paddock-plinths",new T.BoxGeometry(),stone,bases);
 const slopes:Item[]=[],rocks:Item[]=[],windowBands:Item[]=[];
 for(let i=0;i<24;i++){
  const d=lap*(i+.5)/24,side=i%2?-1:1;
  slopes.push(item(d,side*(29+(i%4)*2),1.3,[5+(i%3)*1.5,2.2+(i%3)*.3,5]));
  if(i%2===0)rocks.push(item(d+2,side*35,1.6,[1.4+(i%4),1.6,1.5]));
  if(i%3===0)windowBands.push(item(d+5,side*22.2,3.9,[6.5,1.7,.12],i%2?"#8ab0b7":"#d6aa79"));
 }
 // Subdivided, soft-shaded geometry replaces visibly faceted low-poly boulders.
 batch(g,"landscape-low-berms",new T.IcosahedronGeometry(1,2),stone,slopes);
 batch(g,"cut-rock-breaks",new T.IcosahedronGeometry(1,1),surface("#43535d",.97),rocks);
 batch(g,"paddock-glazing",new T.BoxGeometry(),surface("#b1c4cd",.2,.26,"#294d62",.25),windowBands);
 g.userData={routeMeshUnchanged:true,canonicalSampler:EP005_ROUTE.canonicalSampler,roadY:0,
  barrierOffset:11.7,tallFixturesMinOffset:19.3,closedLoop:true,
  surface:"PBR grit UV/roughness/bump, no planar reflections",noFakeFlames:true,
  artDirection:"dark navy night with warm practicals, cool rim, graduated falloff",
  staticInstancedBatches:14};
 return world;
}
