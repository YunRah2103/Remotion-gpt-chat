import * as T from 'three';
import {box,mesh,rod,surface} from './geometry.ts';
import {cutOpening} from './cavity.ts';
import type {VehicleSpec} from './catalog.ts';
import type {VehicleMaterials} from './vehicle-wheels.ts';
import type {V3} from './geometry.ts';

type Section={x:number;width:number;low:number;high:number;offset?:number};
/** A smooth, closed rounded rectangular volume along the longitudinal axis. */
function volume(sections:Section[],round=.6){
 const p:number[]=[],idx:number[]=[],n=32;
 for(const s of sections)for(let j=0;j<n;j++){
  const a=j*Math.PI*2/n,c=Math.cos(a),v=Math.sin(a);
  p.push(s.x,(s.low+s.high)/2+(s.high-s.low)/2*Math.sign(v)*Math.abs(v)**round,(s.offset??0)+s.width/2*Math.sign(c)*Math.abs(c)**round);
 }
 for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;idx.push(a,a+n,b,b,a+n,b+n);}
 for(const i of [0,sections.length-1]){const s=sections[i],ci=p.length/3;p.push(s.x,(s.low+s.high)/2,s.offset??0);for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;idx.push(ci,...(i===0?[a,b]:[b,a]));}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
function replace(g:T.Group,name:string,geo:T.BufferGeometry){const old=g.getObjectByName(name) as T.Mesh;old.geometry.dispose();old.geometry=geo;old.position.set(0,0,0);old.rotation.set(0,0,0);}
export function sculptFormula(g:T.Group,m:VehicleMaterials,s:VehicleSpec){
 const fuselage=g.getObjectByName('single-seater-body') as T.Mesh;
 fuselage.geometry=cutOpening(fuselage.geometry,[-.68,.55,-.235],[.17,1.3,.235]);
 const cockpit=g.getObjectByName('cockpit') as T.Mesh;cockpit.position.y=.565;cockpit.scale.y=.5;
 if(s.id==='formula-modern'){
  const pods:T.Mesh[]=[];g.traverse(o=>{if(o.name==='sidepod')pods.push(o as T.Mesh);});
  for(const pod of pods){const sign=Math.sign(pod.position.z);pod.geometry.dispose();pod.position.set(0,0,0);pod.geometry=volume([
   {x:-1.43,width:.18,low:.34,high:.49,offset:sign*.42},
   {x:-1.28,width:.30,low:.32,high:.56,offset:sign*.46},
   {x:-.82,width:.43,low:.30,high:.64,offset:sign*.49},
   {x:-.22,width:.44,low:.32,high:.65,offset:sign*.49},
   {x:.025,width:.40,low:.36,high:.62,offset:sign*.49},
  ],.65);}
 }
 for(const sign of [-1,1]){
  for(let i=0;i<5;i++)box(g,m.trim,[.37,.09,.018],[-s.length*.40,.32,sign*(.12+i*.075)],.003,'floor-diffuser');
  rod(g,m.trim,[-.68,.79,sign*.25],[-.68,.98,sign*.20],.02).name='roll-hoop';
 }
 // Raised engine cover tapers smoothly into the rear bodywork.
 mesh(g,volume([{x:-s.length*.42,width:.15,low:.46,high:.60},{x:-1.45,width:.29,low:.49,high:.76},{x:-1.05,width:.36,low:.53,high:.96},{x:-.76,width:.24,low:.59,high:.91}],.75),m.body,[0,0,0],[0,0,0],'engine-cover');
}
export function sculptBike(g:T.Group,m:VehicleMaterials,s:VehicleSpec){
 replace(g,'fuel-tank',volume([{x:-.19,width:.21,low:.73,high:.87},{x:-.12,width:.37,low:.72,high:.96},{x:.10,width:.41,low:.72,high:1.00},{x:.29,width:.30,low:.75,high:.95},{x:.37,width:.12,low:.81,high:.88}],.7));
 replace(g,'saddle',volume([{x:-.68,width:.22,low:.81,high:.88},{x:-.55,width:.35,low:.80,high:.89},{x:-.30,width:.34,low:.78,high:.86},{x:-.14,width:.22,low:.78,high:.84}],.55));
 const metal=surface('#9a9b91',.85,.33),dark=surface('#343c42',.72,.42);
 for(const z of [-.105,0,.105]){
  const curve=new T.CatmullRomCurve3([new T.Vector3(.15,.61,z),new T.Vector3(.30,.48,z),new T.Vector3(.27,.32,z),new T.Vector3(-.18,.31,z),new T.Vector3(-.45,.37,z)]);
  mesh(g,new T.TubeGeometry(curve,24,.018,8,false),metal,[0,0,0],[0,0,0],'exhaust-header');
 }
 // The spring sits between the chassis and swingarm rather than floating by a wheel.
 const a=new T.Vector3(-.49,.52,0),b=new T.Vector3(-.19,.76,0),axis=b.clone().sub(a),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis.clone().normalize()),points=[];
 for(let i=0;i<=100;i++){const t=i/100;points.push(new T.Vector3(Math.cos(t*Math.PI*12)*.040,t*axis.length(),Math.sin(t*Math.PI*12)*.040).applyQuaternion(q).add(a));}
 mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points),100,.008,6,false),m.accent,[0,0,0],[0,0,0],'rear-shock-spring');rod(g,dark,a.toArray() as V3,b.toArray() as V3,.017).name='rear-damper';
 for(const sign of [-1,1]){
  rod(g,m.trim,[s.wheelbase/2-.22,.99,sign*.23],[s.wheelbase/2-.29,1.10,sign*.29],.009).name='control-cable';
  mesh(g,new T.CylinderGeometry(.035,.035,.012,16),dark,[-.03,.48,sign*.19],[Math.PI/2,0,0],'engine-cover-bolt');
 }
}
export function sculptTruck(g:T.Group,m:VehicleMaterials,s:VehicleSpec){
 const front=s.wheelbase/2,fx=front+.82,rear=-s.length/2+.15;
 // Recessed window gaskets read as glazing seated in the cab, rather than pasted panels.
 for(const sign of [-1,1]){
  for(const y of [1.635,2.245])box(g,m.trim,[1.16,.035,.046],[front-.01,y,sign*(s.width/2-.034)],.009,'truck-window-seal');
  for(const x of [front-.58,front+.56])box(g,m.trim,[.035,.62,.046],[x,1.94,sign*(s.width/2-.034)],.009,'truck-window-seal');
  box(g,m.trim,[.16,.12,.36],[rear,.68,sign*s.width*.36],.018,'rear-lamp-housing');
  box(g,m.red,[.020,.075,.17],[rear-.087,.69,sign*s.width*.36],.008,'truck-tail-light');
  box(g,m.accent,[.020,.075,.08],[rear-.087,.69,sign*s.width*.36+sign*.13],.008,'rear-indicator');
 }
 box(g,m.metal,[.10,.16,s.width*.86],[rear,.49,0],.015,'rear-underrun-bar');
 box(g,m.trim,[.025,.11,.40],[rear-.06,.60,0],.006,'rear-plate');
 if(s.id==='box-truck'){
  box(g,m.metal,[.86,.34,.37],[.45,.70,-s.width*.40],.055,'truck-fuel-tank');
  const x=-3.202;
  for(const z of [-s.width*.43,s.width*.43])for(const y of [1.40,2.00,2.65])box(g,m.metal,[.034,.09,.12],[x,y,z],.006,'cargo-hinge');
  for(const z of [-.04,.04])box(g,m.trim,[.06,.11,.14],[x-.015,1.58,z],.01,'cargo-lock-handle');
 }else{
  const sleeper=g.getObjectByName('sleeper') as T.Mesh;
  // Add a shallow roof deflector with a clear visual connection to the sleeper.
  mesh(g,volume([{x:front-.99,width:s.width*.90,low:2.99,high:3.04},{x:front-.80,width:s.width*.90,low:3.00,high:3.19},{x:front-.05,width:s.width*.88,low:3.00,high:3.10}],.45),m.body,[0,0,0],[0,0,0],'roof-deflector');
  if(sleeper)for(const sign of [-1,1])box(g,m.trim,[.68,.035,.012],[front-.46,2.59,sign*(s.width/2-.044)],.006,'sleeper-panel-gap');
 }
 for(const z of [-.50,.50])box(g,m.trim,[.025,.60,.016],[fx+.030,1.91,z],.004,'windscreen-mullion');
}
