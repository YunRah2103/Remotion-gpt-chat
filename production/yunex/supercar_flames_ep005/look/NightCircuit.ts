import * as T from "three";
import {createCinematicEnvironment} from "../../../../src/yunex/modelling-kit/environments.ts";
import {EP005_ROUTE,EP005_CAMERA_CLEARANCE,trackPoint} from "./route.ts";
type Item={p:[number,number,number];s:[number,number,number];yaw?:number;color?:string};
const surface=(color:string,roughness=.7,metalness=.1,emissive="#000000",emissiveIntensity=0)=>
 new T.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity});
function batch(g:T.Group,name:string,geo:T.BufferGeometry,mat:T.MeshStandardMaterial,items:Item[]){
 const mesh=new T.InstancedMesh(geo,mat,items.length),dummy=new T.Object3D();
 mesh.name="ep005-"+name;mesh.frustumCulled=false;
 items.forEach((a,i)=>{dummy.position.set(...a.p);dummy.rotation.set(0,a.yaw??0,0);
  dummy.scale.set(...a.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  if(a.color)mesh.setColorAt(i,new T.Color(a.color));});
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 g.add(mesh);return mesh;
}
function item(distance:number,sideOffset:number,y:number,s:Item["s"],color?:string):Item {
 const p=trackPoint(distance,sideOffset,y);return {p:p.position,yaw:p.yaw,s,color};
}
/** Additive route-tangent circuit. It never replaces or offsets the existing road. */
export function createEP005NightCircuit({premium=true}:{premium?:boolean}={}):T.Group{
 const world=createCinematicEnvironment({kind:EP005_ROUTE.kind,seed:EP005_ROUTE.seed,
  timeOfDay:EP005_ROUTE.timeOfDay,wetness:EP005_ROUTE.wetness,quality:"hero"});
 world.name="EP005-dusk-night-circuit";
 world.userData.ep005={route:EP005_ROUTE,clearance:EP005_CAMERA_CLEARANCE,premium};
 if(!premium)return world;
 const g=new T.Group();g.name="ep005-premium-environment";world.add(g);
 const steel=surface("#50636b",.48,.48),warm=surface("#f5e1ba",.3,.02,"#f9c990",2.8);
 const cyan=surface("#94dbe4",.28,.24,"#579fc1",1.0);
 const trim=surface("#9ba9aa",.62,.25),stone=surface("#444c52",.99,.02);
 const lap=EP005_ROUTE.lapMetres,trackIntervals=96,lampCount=12;
 const studs:Item[]=[],barrierEdge:Item[]=[],mast:Item[]=[],lamp:Item[]=[],arms:Item[]=[],foot:Item[]=[];
 for(let i=0;i<trackIntervals;i++){
  const d=lap*(i+.25)/trackIntervals;
  for(const side of [-1,1]){
   studs.push(item(d,side*11.96,.48,[.22,.13,.10],side<0?"#f9dbad":"#c8e1e6"));
   if(i%3===0)barrierEdge.push(item(d,side*12.12,.95,[1.65,.07,.045]));
  }
 }
 batch(g,"barrier-retroreflectors",new T.BoxGeometry(),surface("#ffffff",.25,.1),studs);
 batch(g,"barrier-cap-accents",new T.BoxGeometry(),trim,barrierEdge);
 for(let i=0;i<lampCount;i++){
  const d=lap*(i+.07)/lampCount;
  for(const side of [-1,1]){
   mast.push(item(d,side*20.8,3.55,[1,1,1]));
   arms.push(item(d,side*20.0,7.02,[.12,.12,1.8]));
   lamp.push(item(d,side*19.30,6.96,[.68,.10,.36]));
   foot.push(item(d,side*20.8,.09,[.8,.18,.8]));
  }
 }
 batch(g,"track-lamp-masts",new T.CylinderGeometry(.10,.13,7.1,10),steel,mast);
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
 batch(g,"paddock-canopy-roofs",new T.BoxGeometry(),surface("#273e4c",.58,.27),roofs);
 batch(g,"paddock-wash-leds",new T.BoxGeometry(),cyan,indirect);
 batch(g,"paddock-plinths",new T.BoxGeometry(),stone,bases);
 const slopes:Item[]=[],rocks:Item[]=[],windowBands:Item[]=[];
 for(let i=0;i<24;i++){
  const d=lap*(i+.5)/24,side=i%2?-1:1;
  slopes.push(item(d,side*(29+(i%4)*2),1.35,[5+(i%3)*1.5,2.5+(i%3)*.4,5]));
  if(i%2===0)rocks.push(item(d+2,side*35,2,[1.4+(i%4),1.8,1.5]));
  if(i%3===0)windowBands.push(item(d+5,side*22.2,3.9,[6.5,1.7,.12],i%2?"#c8d7d3":"#dfbc91"));
 }
 batch(g,"landscape-low-berms",new T.DodecahedronGeometry(1,1),stone,slopes);
 batch(g,"cut-rock-breaks",new T.DodecahedronGeometry(1,0),surface("#52616a",.98),rocks);
 batch(g,"paddock-glazing",new T.BoxGeometry(),surface("#ffffff",.18,.3,"#6b8899",.45),windowBands);
 g.userData={routeMeshUnchanged:true,canonicalSampler:EP005_ROUTE.canonicalSampler,
  roadY:0,barrierOffset:11.7,tallFixturesMinOffset:19.3,
  closedLoop:true,weather:"restrained .10 wetness",noFakeFlames:true,staticInstancedBatches:12};
 return world;
}
