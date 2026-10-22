import * as T from 'three';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {createAssembly} from '../../../../src/yunex/modelling-kit/authoring.ts';
import {ComponentRegistry} from '../../../../src/yunex/modelling-kit/registry.ts';
import type {ExhaustPort,Vec3,AfterfireSample} from './afterfire.ts';
import {validateExhaustMounts} from './afterfire.ts';
/**
 * Production path FAILS CLOSED without Agent 1 authored mount:<name> on the car.
 * Preview-only sockets are visibly fabricated exhaust tubes, NEVER production ports.
 * Orientation is mount-local userData.direction and radius is metres.
 */
const names=['exhaust-tip-left','exhaust-tip-right'] as const;
export function readExhaustMounts(vehicle:T.Object3D):ExhaustPort[]{
 vehicle.updateWorldMatrix(true,true);
 const ports=names.map(name=>{
  const node=vehicle.getObjectByName('mount:'+name);
  if(!node)throw Error('Agent 1 exhaust interface missing: mount:'+name);
  if(!Array.isArray(node.userData.direction)||!Number.isFinite(node.userData.radius))throw Error('Missing direction/radius on '+name);
  const direction=new T.Vector3(...(node.userData.direction as Vec3)).transformDirection(node.matrixWorld);
  const relative=vehicle.getWorldQuaternion(new T.Quaternion()).invert();
  direction.applyQuaternion(relative).normalize();
  const position=vehicle.worldToLocal(node.getWorldPosition(new T.Vector3())).toArray() as Vec3;
  return {name,position,direction:direction.toArray() as Vec3,radius:node.userData.radius} as ExhaustPort;
 });
 validateExhaustMounts(ports);return ports;
}
const metal=()=>new T.MeshStandardMaterial({color:'#8c939e',metalness:.87,roughness:.24});
function cylinderBetween(a:T.Vector3,b:T.Vector3,r:number,name:string,material:T.Material){
 const axis=b.clone().sub(a);const mesh=new T.Mesh(new T.CylinderGeometry(r,r,axis.length(),24,1,true),material);
 mesh.name=name;mesh.position.copy(a).add(b).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());return mesh;
}
/** Isolated preview adapter. Remove when Agent 1 ports exist. */
export function addProvisionalPreviewExhaust(vehicle:T.Object3D):void{
 if(names.some(name=>vehicle.getObjectByName('mount:'+name)))throw Error('Never overwrite authored Agent 1 mounts');
 const root=vehicle.getObjectByName('body-shell');
 if(!root)throw Error('Preview requires a V3 body-shell');
 const s=vehicleSpec(vehicle.userData.variant);
 for(const [i,name] of names.entries()){
  const z=(i===0?1:-1)*s.width*.27,y=Math.max(.32,s.radius*.80),x=-s.length*.48;
  const tube=cylinderBetween(new T.Vector3(x+.33,y,z),new T.Vector3(x,y,z),.078,'ep005-preview-pipe-'+name,metal());
  root.add(tube);
  const ring=new T.Mesh(new T.TorusGeometry(.078,.014,9,32),metal());ring.name='preview-tip-rim-'+name;ring.position.set(x,y,z);ring.rotation.y=Math.PI/2;root.add(ring);
  const socket=new T.Object3D();socket.name='mount:'+name;socket.position.set(x,y,z);
  socket.userData={mount:true,mountName:name,direction:[-1,0,0],radius:.078,provisional:true};
  root.add(socket);
 }
 vehicle.userData.ep005ProvisionalPorts=true;
}
type FlameObjects={socket:T.Object3D;root:T.Group;lobes:T.Mesh[];cores:T.Mesh[];light:T.PointLight;rim:T.Mesh};
export type AfterfireRig={vehicle:T.Object3D;elements:FlameObjects[];provisional:boolean};
const cloud=(color:string,opacity:number)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});
/** Geometry extends along local +X after orienting to actual mount direction. */
export function createAfterfireRig(vehicle:T.Object3D,{requireAuthoritative=true}:{requireAuthoritative?:boolean}={}):AfterfireRig{
 const ports=readExhaustMounts(vehicle);
 const elements=ports.map(port=>{
  const socket=vehicle.getObjectByName('mount:'+port.name)!;
  if(requireAuthoritative&&socket.userData.provisional)throw Error('Production flame cannot attach to a provisional exhaust port');
  const root=new T.Group();root.name='ep005-afterfire-'+port.name;
  root.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),new T.Vector3(...(socket.userData.direction as Vec3)).normalize());
  socket.add(root);
  const lobes:T.Mesh[]=[],cores:T.Mesh[]=[];
  for(let i=0;i<8;i++){
   const envelope=new T.Mesh(new T.SphereGeometry(1,12,9),cloud(i%2?'#fa540c':'#ff8d16',.18));
   envelope.name='ep005-turbulent-envelope-'+i;envelope.renderOrder=7;root.add(envelope);lobes.push(envelope);
   const core=new T.Mesh(new T.SphereGeometry(1,12,9),cloud(i%2?'#ffe8ac':'#fff7db',.35));
   core.name='ep005-hot-core-'+i;core.renderOrder=8;root.add(core);cores.push(core);
  }
  const rim=new T.Mesh(new T.SphereGeometry(1,14,10),cloud('#ffc35b',.55));rim.name='ep005-exhaust-glow';rim.renderOrder=9;root.add(rim);
  const light=new T.PointLight('#ff8129',0,2.7,2);light.position.set(.14,0,0);root.add(light);
  root.visible=false;
  return {socket,root,lobes,cores,light,rim};
 });
 return {vehicle,elements,provisional:!!vehicle.userData.ep005ProvisionalPorts};
}
/** Stateless frame update. Port nodes move with suspension/body/route transform. */
export function animateAfterfireRig(rig:AfterfireRig,sample:AfterfireSample):void{
 if(sample.ports.length!==rig.elements.length)throw Error('Port count mismatch');
 const ports=readExhaustMounts(rig.vehicle);
 for(let i=0;i<rig.elements.length;i++){
  const e=rig.elements[i],p=sample.ports.find(v=>v.name===names[i])!;
  if(!p||p.name!==ports[i].name)throw Error('Mount identity mismatch');
  const a=p.intensity;e.root.visible=a>.012;e.light.intensity=a*1.9;
  e.light.distance=1.2+a*1.2;
  const radius=ports[i].radius,time=sample.frame/sample.fps;
  e.rim.visible=a>.03;e.rim.position.set(.018,0,0);e.rim.scale.set(.025,2*radius,2*radius);
  for(let j=0;j<e.lobes.length;j++){
   const u=(j+.5)/e.lobes.length,shear=Math.sin(j*2.9+time*33+i*7),flicker=.86+.13*Math.sin(j*6.7+time*45);
   const x=.025+(u*.9)*p.length;
   const r=(.38+.62*Math.sin(Math.PI*u))*radius*(1+.24*u)*(1+.35*a);
   const mesh=e.lobes[j];mesh.position.set(x,shear*r*.3,Math.cos(j*5.5+time*28)*r*.36);
   mesh.scale.set(Math.max(.02,p.length*.12*flicker),r,r*.9);
   (mesh.material as T.MeshBasicMaterial).opacity=a*(.12+(1-u)*.14);
   const core=e.cores[j];core.position.set(x*.76,shear*r*.18,0);
   core.scale.set(Math.max(.01,p.length*.095*flicker),r*.41,r*.43);
   (core.material as T.MeshBasicMaterial).opacity=a*(.45-u*.27);
  }
 }
}
function mount(root:T.Group,name:string,x:number,dir:Vec3){
 const m=new T.Object3D();m.name='mount:'+name;m.position.set(x,0,0);m.userData={mount:true,mountName:name,direction:dir};root.add(m);
}
const muted=metal();
/** Fresh built component with actual metal shell, inlet/outlet sockets and baffled internals. */
function segment(kind:'collector'|'catalyst'|'muffler'|'tailpipe'):T.Group{
 const root=new T.Group();root.name='ep005-'+kind;
 const length={collector:.60,catalyst:.66,muffler:.90,tailpipe:.44}[kind];
 const rad={collector:.13,catalyst:.23,muffler:.30,tailpipe:.095}[kind];
 const shell=new T.Mesh(new T.CylinderGeometry(rad,rad,length,28,1,true),new T.MeshPhysicalMaterial({color:kind==='muffler'?'#5a636e':'#a2aab1',metalness:.84,roughness:.3,transparent:kind==='catalyst',opacity:kind==='catalyst'?.48:1,side:T.DoubleSide}));
 shell.rotation.z=Math.PI/2;shell.name=kind+'-steel-housing';root.add(shell);
 const rimA=new T.Mesh(new T.TorusGeometry(rad,.014,9,28),metal()),rimB=rimA.clone();rimA.rotation.y=rimB.rotation.y=Math.PI/2;rimA.position.x=-length/2;rimB.position.x=length/2;root.add(rimA,rimB);
 const flowTube=cylinderBetween(new T.Vector3(-length*.50,0,0),new T.Vector3(length*.50,0,0),Math.min(rad*.52,.074),'ep005-flow-core',new T.MeshStandardMaterial({color:'#bf6844',metalness:.70,roughness:.38}));
 root.add(flowTube);
 if(kind==='collector')for(let k=0;k<4;k++){
  const a=k/4*Math.PI*2,y=Math.sin(a)*.13,z=Math.cos(a)*.13;
  root.add(cylinderBetween(new T.Vector3(length*.28,y,z),new T.Vector3(-length*.36,0,0),.036,'ep005-header-'+k,metal()));
 }
 if(kind==='catalyst')for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if(y*y+z*z<=5){
  root.add(cylinderBetween(new T.Vector3(-length*.36,y*.034,z*.034),new T.Vector3(length*.36,y*.034,z*.034),.013,'ep005-substrate-channel-'+y+'-'+z,muted));
 }
 if(kind==='muffler')for(let k=0;k<3;k++){
  const plate=new T.Mesh(new T.CylinderGeometry(rad*.94,rad*.94,.025,24),new T.MeshStandardMaterial({color:'#758390',metalness:.76,roughness:.39}));
  plate.rotation.z=Math.PI/2;plate.position.x=-.23+k*.23;plate.name='ep005-muffler-baffle-'+k;root.add(plate);
 }
 mount(root,'inlet',length/2,[1,0,0]);mount(root,'outlet',-length/2,[-1,0,0]);return root;
}
/** Reusable V3 ComponentRegistry + assembly port-plumbed explanatory cutaway. */
export function createAfterfireCutaway():T.Group{
 const registry=new ComponentRegistry();
 for(const kind of ['collector','catalyst','muffler','tailpipe'] as const)registry.register({
  id:'ep005-'+kind,version:'1.0.0',families:['sports'],source:'production/yunex/supercar_flames_ep005/flames/exhaust-rig.ts',factory:()=>segment(kind)
 });
 const assembly=createAssembly({id:'ep005-afterfire-exhaust-assembly',version:1,nodes:[
  {id:'engine',part:'v8',position:[2.1,.15,0],scale:[.9,.9,.9]},
  {id:'collector',part:'ep005-collector',position:[.80,0,0]},
  {id:'catalyst',part:'ep005-catalyst',position:[-.1,0,0]},
  {id:'muffler',part:'ep005-muffler',position:[-1.1,0,0]},
  {id:'tailpipe',part:'ep005-tailpipe',position:[-2.0,0,0]}
 ],connections:[
  {from:'engine:exhaust',to:'collector:inlet',radius:.045,flow:{speed:.20,count:7}},
  {from:'collector:outlet',to:'catalyst:inlet',radius:.052,flow:{speed:.20,count:6}},
  {from:'catalyst:outlet',to:'muffler:inlet',radius:.052,flow:{speed:.20,count:6}},
  {from:'muffler:outlet',to:'tailpipe:inlet',radius:.052,flow:{speed:.20,count:6}}
 ]},id=>registry.create(id,'sports'));
 assembly.userData.accuracy='Cutaway illustrative gas path; no CFD, calibrated catalyst model or OEM fit';
 return assembly;
}
