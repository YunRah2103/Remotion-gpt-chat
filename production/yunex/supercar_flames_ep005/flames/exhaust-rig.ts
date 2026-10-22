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
export type PortRadii=Partial<Record<'exhaust-tip-left'|'exhaust-tip-right',number>>;
/** Pin explicitly to Agent 1's reviewed port contract when its JSON-created mounts lack radius metadata. */
export function readExhaustMounts(vehicle:T.Object3D,radii:PortRadii={}):ExhaustPort[]{
 vehicle.updateWorldMatrix(true,true);
 const ports=names.map(name=>{
  const node=vehicle.getObjectByName('mount:'+name);
  if(!node)throw Error('Agent 1 exhaust interface missing: mount:'+name);
  const radius=node.userData.nozzleInnerRadius??node.userData.radius??radii[name];
  if(!Array.isArray(node.userData.direction)||!Number.isFinite(radius))throw Error('Missing direction/radius on '+name+'; pass radius from the Agent 1 exhaust contract');
  const direction=new T.Vector3(...(node.userData.direction as Vec3)).transformDirection(node.matrixWorld);
  const relative=vehicle.getWorldQuaternion(new T.Quaternion()).invert();
  direction.applyQuaternion(relative).normalize();
  const position=vehicle.worldToLocal(node.getWorldPosition(new T.Vector3())).toArray() as Vec3;
  return {name,position,direction:direction.toArray() as Vec3,radius} as ExhaustPort;
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
/**
 * 3D procedural flame tongues: ZERO glowing spheres/discs. Multiple tapering,
 * animated non-axisymmetric turbulent envelopes share the REAL nozzle transform.
 * Vertex alpha feathers edges; deterministic absolute-frame deformation prevents
 * playback-order artefacts. Editorial illustration, not a combustion solver.
 */
type FlameObjects={socket:T.Object3D;root:T.Group;envelopes:T.Mesh[];cores:T.Mesh[];light:T.PointLight};
export type AfterfireRig={vehicle:T.Object3D;elements:FlameObjects[];provisional:boolean;radii:PortRadii};
const RINGS=25,SIDES=14;
const burnerColors={
 outer:[new T.Color('#b99cfa'),new T.Color('#ffc979'),new T.Color('#fa6e2a'),new T.Color('#5c201a')],
 core:[new T.Color('#c9d9ff'),new T.Color('#fff0b3'),new T.Color('#ffc163'),new T.Color('#f05b29')]
};
const layerMaterial=()=>new T.ShaderMaterial({
 uniforms:{opacity:{value:0}},
 vertexShader:`attribute float aAlpha;
 attribute vec3 color;
 varying vec3 vColor;varying float vAlpha;
 void main(){vColor=color;vAlpha=aAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform float opacity;
 varying vec3 vColor;varying float vAlpha;
 void main(){float a=clamp(vAlpha*opacity,0.0,0.75);if(a<0.008)discard;
 gl_FragColor=vec4(vColor,a);}`,
 transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,
 blending:T.NormalBlending
});
function newFlameLayer(kind:'outer'|'core',index:number):T.Mesh{
 const geo=new T.BufferGeometry(),verts=(RINGS+1)*(SIDES+1),positions=new Float32Array(verts*3),colors=new Float32Array(verts*3),alpha=new Float32Array(verts),indices:number[]=[];
 geo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));
 geo.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));
 geo.setAttribute('aAlpha',new T.BufferAttribute(alpha,1).setUsage(T.DynamicDrawUsage));
 for(let i=0;i<RINGS;i++)for(let j=0;j<SIDES;j++){const a=i*(SIDES+1)+j,b=a+SIDES+1;indices.push(a,b,a+1,b,b+1,a+1);}
 geo.setIndex(indices);
 const flame=new T.Mesh(geo,layerMaterial());flame.name=`ep005-${kind}-flame-tongue-${index}`;
 flame.frustumCulled=false;flame.renderOrder=kind==='core'?7:6;
 flame.userData.flameKind=kind;flame.userData.layerIndex=index;
 return flame;
}
function palette(u:number,kind:'outer'|'core'):T.Color{
 const stops=burnerColors[kind],v=Math.min(2.999,Math.max(0,u*3)),i=Math.floor(v);
 return stops[i].clone().lerp(stops[i+1],v-i);
}
function shapeLayer(mesh:T.Mesh,port:ExhaustPort,burst:AfterfireSample['ports'][number],frame:number,fps:number,side:number){
 const g=mesh.geometry,positions=g.getAttribute('position') as T.BufferAttribute,colors=g.getAttribute('color') as T.BufferAttribute,alphas=g.getAttribute('aAlpha') as T.BufferAttribute;
 const kind=mesh.userData.flameKind as 'outer'|'core',idx=mesh.userData.layerIndex as number,t=frame/fps;
 const core=kind==='core',seed=idx*2.27+side*.83;
 const len=burst.length*(core?.63+idx*.12:.74+idx*.15);
 const baseR=port.radius*(core?.27+idx*.12:.47+idx*.11);
 for(let i=0;i<=RINGS;i++){
  const u=i/RINGS,fade=Math.pow(1-u,core?1.3:.80);
  const tongueWave=Math.sin(u*12-t*27+seed)*.087+Math.sin(u*26+t*33+seed*1.9)*.057+Math.sin(u*41-t*21+seed)*.029;
  const x=.013+len*(u+u*u*tongueWave);
  // Each plume is a separate wandering ribbon with a shared metal nozzle base.
  const fan=seed+idx*1.618;
  const sideways=u*u*(core?.024:.104)*Math.sin(t*16+fan+u*9)+u*idx*.009*Math.cos(fan);
  const vertical=u*u*(core?.020:.091)*Math.cos(t*14+fan*1.8+u*8)+u*idx*.008*Math.sin(fan);
  const swell=(.80+.88*Math.sin(Math.PI*u))*fade;
  const taper=baseR*Math.max(.002,swell);
  const ink=palette(u,kind);
  for(let j=0;j<=SIDES;j++){
   const v=j/SIDES,theta=2*Math.PI*v+u*(1.15+idx*.20)+t*(core?8.1:11.6);
   const rough=1+.21*Math.sin(theta*3+u*17-t*24+seed)+.115*Math.sin(theta*7-u*38+t*31+seed*2)+.06*Math.cos(theta*11+u*55-t*41);
   const r=taper*Math.max(.50,rough);
   const k=i*(SIDES+1)+j;
   positions.setXYZ(k,x,sideways+Math.cos(theta)*r,vertical+Math.sin(theta)*r*(core?.9:1.2));
   const c=ink.clone().multiplyScalar(1-.10*u);
   colors.setXYZ(k,c.r,c.g,c.b);
   const entry=Math.min(1,u*18),falloff=Math.pow(1-u,core?1.7:1.25);
   const ragged=.48+.38*Math.cos(theta*3+u*9+t*12+seed)+.13*Math.sin(theta*9-u*28+t*19);
   const flicker=.82+.18*Math.sin(t*51-u*19+seed);
   alphas.setX(k,entry*falloff*Math.max(.06,ragged)*flicker*(core?.93:.72));
  }
 }
 positions.needsUpdate=true;colors.needsUpdate=true;alphas.needsUpdate=true;
 g.computeBoundingSphere();
 (mesh.material as T.ShaderMaterial).uniforms.opacity.value=burst.intensity;
}
export function createAfterfireRig(vehicle:T.Object3D,{requireAuthoritative=true,radii={}}:{requireAuthoritative?:boolean;radii?:PortRadii}={}):AfterfireRig{
 const ports=readExhaustMounts(vehicle,radii);
 const elements=ports.map(port=>{
  const socket=vehicle.getObjectByName('mount:'+port.name)!;
  if(requireAuthoritative&&(socket.userData.provisional||vehicle.userData.ep005ProvisionalPorts))throw Error('Production flame cannot attach to a provisional exhaust port');
  if(requireAuthoritative&&(!socket.parent||!socket.parent.name.includes('exhaust-tube')))throw Error('Flame requires real modelled exhaust-tube parent');
  const root=new T.Group();root.name='ep005-afterfire-'+port.name;
  root.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),new T.Vector3(...(socket.userData.direction as Vec3)).normalize());
  socket.add(root);
  const envelopes=Array.from({length:4},(_,i)=>{const m=newFlameLayer('outer',i);root.add(m);return m;});
  const cores=Array.from({length:2},(_,i)=>{const m=newFlameLayer('core',i);root.add(m);return m;});
  // Restrained warm bounce onto actual metal bodywork. Never a floating yellow disc.
  const light=new T.PointLight('#ff8e47',0,1.65,2);light.position.set(.08,.03,0);root.add(light);
  root.visible=false;
  return {socket,root,envelopes,cores,light};
 });
 return {vehicle,elements,provisional:!!vehicle.userData.ep005ProvisionalPorts,radii};
}
/** Stateless absolute-frame geometry update, attached to A1's physical moving nozzles. */
export function animateAfterfireRig(rig:AfterfireRig,sample:AfterfireSample):void{
 if(sample.ports.length!==rig.elements.length)throw Error('Port count mismatch');
 const ports=readExhaustMounts(rig.vehicle,rig.radii);
 for(let i=0;i<rig.elements.length;i++){
  const e=rig.elements[i],p=sample.ports.find(v=>v.name===names[i]);
  if(!p||p.name!==ports[i].name)throw Error('Mount identity mismatch');
  const a=p.intensity;e.root.visible=a>.012;
  e.light.intensity=a*2.1;e.light.distance=.7+a*.88;
  if(!e.root.visible)continue;
  for(const layer of [...e.envelopes,...e.cores])shapeLayer(layer,ports[i],p,sample.frame,sample.fps,i);
 }
}
function mount(root:T.Group,name:string,x:number,dir:Vec3){
 const m=new T.Object3D();m.name='mount:'+name;m.position.set(x,0,0);m.userData={mount:true,mountName:name,direction:dir};root.add(m);
}
/** Fresh built component with actual metal shell, inlet/outlet sockets and baffled internals. */
function segment(kind:'collector'|'catalyst'|'muffler'|'tailpipe'):T.Group{
 const root=new T.Group();root.name='ep005-'+kind;
 const length={collector:.60,catalyst:.66,muffler:.90,tailpipe:.44}[kind];
 const rad={collector:.13,catalyst:.23,muffler:.30,tailpipe:.095}[kind];
 const shell=new T.Mesh(new T.CylinderGeometry(rad,rad,length,28,1,true),new T.MeshPhysicalMaterial({color:kind==='muffler'?'#5a636e':'#a2aab1',metalness:.84,roughness:.3,transparent:kind==='catalyst'||kind==='muffler',opacity:kind==='catalyst'?.27:kind==='muffler'?.37:1,side:T.DoubleSide}));
 shell.rotation.z=Math.PI/2;shell.name=kind+'-steel-housing';root.add(shell);
 const rimA=new T.Mesh(new T.TorusGeometry(rad,.014,9,28),metal()),rimB=rimA.clone();rimA.rotation.y=rimB.rotation.y=Math.PI/2;rimA.position.x=-length/2;rimB.position.x=length/2;root.add(rimA,rimB);
 const flowTube=cylinderBetween(new T.Vector3(-length*.50,0,0),new T.Vector3(length*.50,0,0),Math.min(rad*.52,.074),'ep005-flow-core',new T.MeshStandardMaterial({color:'#bf6844',metalness:.70,roughness:.38}));
 root.add(flowTube);
 if(kind==='collector')for(let k=0;k<4;k++){
  const a=k/4*Math.PI*2,y=Math.sin(a)*.13,z=Math.cos(a)*.13;
  root.add(cylinderBetween(new T.Vector3(length*.28,y,z),new T.Vector3(-length*.36,0,0),.036,'ep005-header-'+k,metal()));
 }
 if(kind==='catalyst')for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if(y*y+z*z<=5){
  root.add(cylinderBetween(new T.Vector3(-length*.36,y*.034,z*.034),new T.Vector3(length*.36,y*.034,z*.034),.013,'ep005-substrate-channel-'+y+'-'+z,metal()));
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
