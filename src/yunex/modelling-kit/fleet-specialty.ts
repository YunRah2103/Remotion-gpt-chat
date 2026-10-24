/** V5 open-wheel, motorcycle and commercial surfaces keep their canonical wheel rigs. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {mesh,surface} from '../world-kit/geometry.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {fleetSkin,fleetCurve,station,lerp} from './fleet-surfaces.ts';
type Section=readonly [number,number,number,number]; // x, half-width, centre height, vertical radius
function volume(knots:readonly Section[],offset=0){
 const n=64,nx=96,p:number[]=[],idx:number[]=[];
 for(let i=0;i<=nx;i++){const x=lerp(knots[0][0],knots[knots.length-1][0],i/nx),w=station(x,knots.map(k=>[k[0],k[1]])),y=station(x,knots.map(k=>[k[0],k[2]])),h=station(x,knots.map(k=>[k[0],k[3]]));
  for(let j=0;j<n;j++){const a=j/n*Math.PI*2;p.push(x,y+Math.sin(a)*h,offset+Math.cos(a)*w);}
 }
 for(let i=0;i<nx;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;idx.push(a,a+n,b,b,a+n,b+n);}
 for(const i of [0,nx]){const k=i===0?knots[0]:knots[knots.length-1],ci=p.length/3;p.push(k[0],k[2],offset);for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;idx.push(...(i===0?[ci,a,b]:[ci,b,a]));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function remove(shell:T.Group,names:string[]){shell.traverse(o=>{if(names.includes(o.name))o.visible=false;});}
export function installFleetSpecialty(shell:T.Group,s:VehicleSpec){
 let paint:T.Material|undefined;shell.traverse(o=>{if(!paint&&o instanceof T.Mesh&&o.material instanceof T.MeshPhysicalMaterial&&o.material.clearcoat>0)paint=o.material;});
 paint=paint??new T.MeshPhysicalMaterial({color:s.color,metalness:.52,roughness:.25,clearcoat:1});
 const carbon=surface('#182024',.2,.40),metal=surface('#aab3b9',.92,.23);
 if(s.family==='formula'){
  remove(shell,['single-seater-body','sidepod','engine-cover']);const modern=s.id==='formula-modern',h=s.length/2;
  let geo=volume([[-h*.87,.10,.43,.10],[-1.40,.20,.56,.19],[-.78,.28,.63,.22],[.05,.26,.57,.20],[.70,.15,.46,.10],[h*.89,.055,.36,.045]]);
  const old=geo;geo=cutOpening(geo,[-.69,.55,-.235],[.18,1.4,.235]);old.dispose();mesh(shell,geo,paint,[0,0,0],[0,0,0],'fleet-monocoque');
  mesh(shell,volume([[-h*.88,.07,.50,.05],[-1.34,.16,.65,.13],[-1.02,.19,.79,.21],[-.76,.13,.84,.18]]),paint,[0,0,0],[0,0,0],'fleet-engine-cover');
  if(modern)for(const side of [-1,1]){
   mesh(shell,volume([[-1.52,.045,.39,.07],[-1.10,.17,.43,.105],[-.53,.24,.48,.15],[.04,.22,.53,.14],[.16,.14,.55,.10]],side*.48),paint,[0,0,0],[0,0,0],'fleet-undercut-sidepod');
   fleetSkin(shell,carbon,'sidepod-inlet',(u,v)=>new T.Vector3(.168,.49+v*.12,side*(.39+u*.22)),side<0,8,8);
  }
  // Cambered multi-element wings replace the old flat plates.
  remove(shell,['front-wing','rear-wing']);
  for(const rear of [false,true])for(let element=0;element<(modern?3:2);element++){
   const span=s.width*(rear?.39:.47),x=(rear?-1:1)*s.length*.42,y=rear?.86:.22;
   fleetSkin(shell,paint,rear?'fleet-rear-airfoil':'fleet-front-airfoil',(u,v)=>{const z=lerp(-span,span,u),t=v;return new T.Vector3(x+element*.105+t*.18,y+.045*Math.sin(Math.PI*t)+element*.035+.018*(z/span)**2,z);},true,64,16);
  }
 }else if(s.family==='bike'){
  remove(shell,['fuel-tank','tail','fairing','fairing-inner','fairing-edge']);
  mesh(shell,volume([[-.26,.065,.84,.05],[-.12,.175,.85,.13],[.10,.205,.86,.15],[.31,.125,.87,.09],[.39,.035,.86,.035]]),paint,[0,0,0],[0,0,0],'fleet-tank');
  mesh(shell,volume([[-.93,.045,.88,.025],[-.77,.135,.90,.055],[-.54,.16,.86,.05],[-.39,.13,.83,.035]]),paint,[0,0,0],[0,0,0],'fleet-tail-cowl');
  if(s.id==='sport-bike')for(const side of [-1,1])fleetSkin(shell,paint,'fleet-sculpted-fairing',(u,v)=>{const x=lerp(-.12,.72,u),y=lerp(.38,.98,v),w=.10+.14*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+.035*v;return new T.Vector3(x,y,side*w);},side<0,48,32);
  for(const axle of [-s.wheelbase/2,s.wheelbase/2])fleetSkin(shell,paint,'fleet-bike-fender',(u,v)=>{const a=lerp(.20,Math.PI-.20,u),z=lerp(-.09,.09,v),r=s.radius+.035;return new T.Vector3(axle+Math.cos(a)*r,s.radius+Math.sin(a)*r,z);},false,48,12);
 }else{
  // Commercial cab: sculpt the existing perforated cab coherently, including its glazing.
  const front=s.wheelbase/2,fx=front+.82;
  const warp=(p:T.Vector3)=>{const nose=T.MathUtils.smoothstep(p.x,front+.52,fx+.16),t=T.MathUtils.clamp((p.y-1.12)/1.25,0,1);p.x-=nose*(.02+.15*t*t);p.z*=1-.065*t*t;return p;};
  const cabNames=['cab','windscreen','side-window','truck-window-seal','windscreen-mullion','grille','truck-headlamp-housing','headlamp'];
  shell.updateMatrixWorld(true);shell.traverse(o=>{if(!(o instanceof T.Mesh)||!cabNames.includes(o.name))return;
   o.updateMatrix();const mat=o.matrix.clone(),inverse=mat.clone().invert(),old=o.geometry;o.geometry=old.clone();old.dispose();const p=o.geometry.attributes.position;
   for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mat);warp(q).applyMatrix4(inverse);p.setXYZ(i,q.x,q.y,q.z);}o.geometry.computeVertexNormals();
  });
  for(const side of [-1,1])fleetCurve(shell,metal,[new T.Vector3(front-.68,1.13,side*s.width*.48),new T.Vector3(front+.12,1.13,side*s.width*.48),new T.Vector3(front+.60,1.18,side*s.width*.47)],.012,'fleet-cab-swage');
  // Curved wheel eyebrows visually join the cab to the wheel enclosure.
  for(const side of [-1,1])fleetSkin(shell,paint,'fleet-truck-arch',(u,v)=>{const a=u*Math.PI,r=s.radius+.09;return new T.Vector3(front+Math.cos(a)*r,s.radius+Math.sin(a)*r,side*(s.width*.49-v*.12));},side<0,64,8);
 }
 shell.userData.bodyArchitecture='fleet-v5';
}
