import {sculptFormula,sculptBike,sculptTruck} from './family-shapes.ts';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as T from 'three';
import {cutOpening} from './cavity.ts';
import {createInterior,interiorLayout} from './interiors.ts';
import {vehicleSpec} from './catalog.ts';
import type {VehicleSpec,VehicleOptions} from './catalog.ts';
import {box,mesh,panel,rod,paint,surface} from './geometry.ts';
import type {V3} from './geometry.ts';

import {archedBody,cabin,bodyHalfWidth} from './vehicle-body.ts';
import {wheel} from './vehicle-wheels.ts';
import type {VehicleMaterials as Mats} from './vehicle-wheels.ts';
import {roadDetails,formulaDetails,bikeDetails,truckDetails,lamp} from './vehicle-details.ts';
function materials(o:VehicleOptions,s:VehicleSpec):Mats{return {
 body:paint(o.color??s.color),trim:surface('#18232a',.1,.55),glass:new T.MeshPhysicalMaterial({color:'#6e8795',metalness:.18,roughness:.09,clearcoat:1,envMapIntensity:1.4,side:T.DoubleSide,transparent:true,opacity:o.glassOpacity??(o.interior===false?1:.55),depthWrite:false}),metal:surface(o.wheelColor??'#abb9bf',.8,.28),rubber:surface('#15191c',.02,.91),accent:paint(o.accent??(s.family==='sports'?'#c53f38':'#dfb45c')),white:new T.MeshStandardMaterial({color:'#e3f5ff',emissive:'#bfdfff',emissiveIntensity:o.lights?3:.15}),red:new T.MeshStandardMaterial({color:'#b42c36',emissive:'#ed2534',emissiveIntensity:o.lights?2:.15})};}
function roadCar(g:T.Group,m:Mats,s:VehicleSpec){
 const sports=s.family==='sports',suv=s.family==='suv',pickup=s.id.includes('pickup');
 const belt=interiorLayout(s).belt;
 archedBody(g,m,s,belt);cabin(g,m,s,belt);
 const front=s.length/2,rear=-front;
 for(const sign of [-1,1]){

  box(g,m.trim,[s.wheelbase-s.radius*1.96,.065,.07],[0,s.radius*.70+.085,sign*(bodyHalfWidth(s,0,s.radius*.70+.085)+.020)],.018,'sill');

  if(suv)rod(g,m.trim,[-s.length*.29,s.height+.035,sign*s.width*.30],[s.length*.04,s.height+.035,sign*s.width*.30],.024);
 }
 box(g,m.trim,[.065,.17,s.width*.52],[front-.023,belt-.34,0],.018,'grille');
 box(g,m.trim,[.09,.055,s.width*.85],[front-.01,.31,0],.018,'front-lip');
 box(g,m.trim,[.08,.11,s.width*.72],[rear-.015,.33,0],.018,'rear-diffuser');
 if(s.id==='supercar'||s.bodyStyle==='track'){
  for(const sign of [-1,1])box(g,m.trim,[.44,.18,.045],[-.65,.71,sign*(bodyHalfWidth(s,-.65,.71)+.010)],.03,'side-intake');
  box(g,m.body,[.20,.065,s.width*.82],[rear+.20,.99,0],.018,'rear-spoiler');
 }
 if(pickup){
  // Pickup has a visibly open bed instead of a continuous passenger cabin.
  box(g,m.trim,[s.length/2+interiorLayout(s).rearBase-.12,.05,s.width*.82],[(interiorLayout(s).rearBase-s.length/2)/2,1.105,0],.02,'bed-floor');
  for(const z of [-s.width*.46,s.width*.46])box(g,m.body,[s.length/2+interiorLayout(s).rearBase-.10,.27,.10],[(interiorLayout(s).rearBase-s.length/2)/2,1.18,z],.02,'bed-wall');
 }


 if(s.bodyStyle==='muscle')box(g,m.body,[.90,.09,.48],[front-.8,belt+.06,0],.035,'hood-scoop');
 if(s.bodyStyle==='ev')box(g,m.body,[.075,.19,s.width*.55],[front+.03,belt-.33,0],.025,'closed-front-panel');
 if(s.family==='van'){
  for(const sign of [-1,1]){rod(g,m.trim,[-s.length*.38,belt+.08,sign*s.width*.47],[s.length*.06,belt+.08,sign*s.width*.47],.018);if(s.id!=='minivan')box(g,m.body,[s.length*.46,s.height-belt-.22,.06],[-s.length*.17,(s.height+belt)/2-.08,sign*s.width*.43],.025,'cargo-side-panel');}
 }
 const wheelZ=s.width/2-.09;
 for(const x of [-s.wheelbase/2,s.wheelbase/2])for(const sign of [-1,1])wheel(g,m,x,sign*wheelZ,s.radius,sports?.28:.235,x>0,sports?5:suv?6:5,s.bodyStyle==='retro'?'steel':s.bodyStyle==='ev'?'turbine':sports?'sport':suv||pickup?'suv':'road');
}
function formula(g:T.Group,m:Mats,s:VehicleSpec){
 const modern=s.id==='formula-modern',front=s.wheelbase/2,rear=-front;
 box(g,m.trim,[s.length*.78,.09,.65],[0,.25,0],.03,'floor');
 const sh=new T.Shape();sh.moveTo(-s.length*.43,.34);sh.lineTo(s.length*.45,.34);sh.lineTo(s.length*.43,.48);sh.lineTo(.55,.63);sh.lineTo(.13,.72);sh.lineTo(-.22,.62);sh.lineTo(-.62,.90);sh.lineTo(-1.25,.90);sh.lineTo(-s.length*.43,.50);sh.closePath();
 const geo=new T.ExtrudeGeometry(sh,{depth:.52,bevelEnabled:true,bevelThickness:.10,bevelSize:.05,bevelSegments:3,steps:1});geo.translate(0,0,-.26);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),t=T.MathUtils.smoothstep(x,.40,s.length*.43);p.setZ(i,p.getZ(i)*T.MathUtils.lerp(1,.31,t));}geo.computeVertexNormals();mesh(g,geo,m.body,[0,0,0],[0,0,0],'single-seater-body');
 box(g,m.trim,[.52,.05,.46],[-.36,.73,0],.07,'cockpit');
 for(const sign of [-1,1]){
  if(modern)box(g,m.body,[1.35,.32,.43],[-.65,.49,sign*.49],.10,'sidepod');
  for(const x of [front,rear]){
   wheel(g,m,x,sign*(s.width/2-.16),s.radius,.32,x>0,6,'formula');
   rod(g,m.trim,[x*.65,.38,sign*.23],[x,.34,sign*(s.width/2-.26)],.025);
   rod(g,m.trim,[x*.55,.60,sign*.22],[x,.42,sign*(s.width/2-.26)],.025);
  }
 }
 for(const x of [s.length*.43,-s.length*.41]){
  const rearWing=x<0,y=rearWing?.85:.24,w=rearWing?s.width*.80:s.width*.96;
  box(g,m.body,[rearWing?.28:.39,.06,w],[x,y,0],.015,rearWing?'rear-wing':'front-wing');
  for(const sign of [-1,1])box(g,m.accent,[.30,.18,.035],[x,y+.07,sign*w/2],.01,'wing-endplate');
  if(rearWing)for(const z of [-.22,.22])rod(g,m.trim,[x,.34,z],[x,y,z],.027);
 }
 if(modern){rod(g,m.trim,[-.62,.76,-.27],[.10,.94,0],.028);rod(g,m.trim,[-.62,.76,.27],[.10,.94,0],.028);rod(g,m.trim,[.10,.94,0],[.30,.66,0],.028);}
}
function bike(g:T.Group,m:Mats,s:VehicleSpec){
 const touring=s.id==='touring-bike',sport=s.id==='sport-bike',f=s.wheelbase/2;
 wheel(g,m,-f,0,s.radius,.17,false,3,'bike');wheel(g,m,f,0,s.radius,.14,true,3,'bike');
 for(const sign of [-1,1]){
  rod(g,m.metal,[f,s.radius,sign*.085],[f-.20,.94,sign*.085],.032);
  rod(g,m.trim,[-f,s.radius,sign*.10],[.15,.66,sign*.10],.034);
  rod(g,m.trim,[-.40,.76,sign*.17],[.15,.42,sign*.17],.035);
  rod(g,m.trim,[.15,.42,sign*.17],[.43,.88,sign*.14],.035);
  box(g,m.metal,[.24,.23,.10],[-.03,.48,sign*.13],.03,'engine-casing');
  rod(g,m.metal,[-.35,.40,sign*.22],[-.80,.50,sign*.22],.055);
 }
 box(g,m.body,[.54,.28,.39],[.10,.83,0],.11,'fuel-tank');
 box(g,m.trim,[.58,.09,.35],[-.38,.84,0],.045,'saddle');
 box(g,m.body,[.31,.13,.32],[-.73,.88,0],.04,'tail');
 rod(g,m.metal,[f-.20,.96,-s.width*.46],[f-.20,.96,s.width*.46],.025);
 lamp(g,m,f+.025,.83,0,.23,.12,true);
 box(g,m.red,[.05,.06,.22],[-.87,.86,0],.02,'tail-lamp');
 if(sport){for(const sign of [-1,1]){
  const points:V3[]=[[.58,.97,sign*.16],[.71,.65,sign*.20],[.20,.39,sign*.23],[-.12,.56,sign*.24],[.12,.86,sign*.21]];if(sign>0)points.reverse();
  const centre:V3=[.30,.69,sign*.29],vertices=[...centre,...points.flat()],indices:number[]=[];
  for(let i=0;i<points.length;i++)indices.push(0,i+1,(i+1)%points.length+1);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(g,geo,m.body,[0,0,0],[0,0,0],'fairing');
  const inner=points.map(p=>[p[0],p[1],p[2]-sign*.035] as V3);panel(g,m.trim,[...inner].reverse(),'fairing-inner');
  for(let i=0;i<points.length;i++)panel(g,m.body,[points[i],inner[i],inner[(i+1)%points.length],points[(i+1)%points.length]],'fairing-edge');
 }}
 if(sport||touring)panel(g,m.glass,[[f,.89,-.23],[f,.89,.23],[f-.20,touring?1.40:1.12,.18],[f-.20,touring?1.40:1.12,-.18]],'windshield');
 if(touring)for(const sign of [-1,1])box(g,m.body,[.58,.32,.25],[-.66,.64,sign*.31],.045,'pannier');
}
function heavyTruck(g:T.Group,m:Mats,s:VehicleSpec){
 const tractor=s.id==='tractor-truck',front=s.wheelbase/2,rear=-front;
 box(g,m.trim,[s.length-.30,.22,1.77],[0,.68,0],.04,'chassis');
 const cab=box(g,m.body,[1.80,1.70,s.width-.09],[front-.11,1.50,0],.09,'cab');
 const hollow=(min:V3,max:V3)=>{cab.geometry=cutOpening(cab.geometry,min,max);};
 hollow([-.75,-.47,-s.width*.42],[.75,.77,s.width*.42]);
 hollow([.73,.08,-s.width*.42],[1.05,.73,s.width*.42]);
 hollow([-.55,.14,-s.width],[.65,.72,s.width]);
 for(const sign of [-1,1])hollow([.78,-.465,sign*.72-.195],[1.10,-.335,sign*.72+.195]);
 if(tractor)box(g,m.body,[1.14,.78,s.width-.10],[front-.46,2.71,0],.10,'sleeper');
 const fx=front+.82;
 box(g,m.glass,[.035,.63,s.width*.83],[fx+.005,1.91,0],.01,'windscreen');
 for(const sign of [-1,1]){
  box(g,m.glass,[1.13,.59,.035],[front-.01,1.94,sign*(s.width/2-.035)],.02,'side-window');
  lamp(g,m,fx-.065,1.10,sign*.72,.37,.12,true);
  box(g,m.trim,[.27,.24,.13],[fx,1.83,sign*(s.width/2+.10)],.025,'mirror');
  box(g,m.metal,[.64,.10,.21],[front,.71,sign*s.width*.49],.02,'step');
 }
 box(g,m.trim,[.055,.35,1.26],[fx+.02,1.36,0],.02,'grille');
 if(!tractor){
  box(g,m.body,[4.25,2.25,s.width],[-1.02,2.12,0],.045,'cargo-box');
  box(g,m.metal,[.035,2.08,s.width*.92],[-3.17,2.12,0],.01,'cargo-door');
  for(const z of [-.04,.04])rod(g,m.metal,[-3.20,1.15,z],[-3.20,3.05,z],.014);
  for(const sign of [-1,1])box(g,m.accent,[4.05,.08,.02],[-1.02,1.30,sign*(s.width/2+.012)],.005,'cargo-stripe');
 }else{
  box(g,m.trim,[1.1,.12,1.18],[-1.45,1.11,0],.12,'fifth-wheel');
  box(g,m.metal,[1.14,.44,.64],[.15,.74,-.76],.06,'fuel-tank');
 }
 const axles=tractor?[front,rear,rear+.98]:[front,rear];
 for(const x of axles)for(const sign of [-1,1])wheel(g,m,x,sign*(s.width/2-.13),s.radius,.28,x===front,8,'steel');
}
export function createVehicle(options:VehicleOptions):T.Group{
 const s=vehicleSpec(options.variant),g=new T.Group(),m=materials(options,s);g.name=`YUNEX-${s.id}`;g.userData={variant:s.id,family:s.family,units:'metres',forward:'+X'};
 if(s.family==='formula')formula(g,m,s);else if(s.family==='bike')bike(g,m,s);else if(s.id==='box-truck'||s.id==='tractor-truck')heavyTruck(g,m,s);else roadCar(g,m,s);
 if(s.family==='formula'){formulaDetails(g,m,s);sculptFormula(g,m,s);}else if(s.family==='bike'){bikeDetails(g,m,s);sculptBike(g,m,s);}else if(s.id==='box-truck'||s.id==='tractor-truck'){truckDetails(g,m,s);sculptTruck(g,m,s);}else roadDetails(g,m,s);
 if(options.interior!==false&&s.family!=='bike'&&s.family!=='formula')g.add(createInterior(s,options));
 if(s.family==='formula'){
  box(g,m.trim,[.38,.08,.39],[-.36,.76,0],.03,'racing-seat');box(g,m.trim,[.10,.24,.32],[-.60,.85,0],.03,'racing-seat-back');
  mesh(g,new T.TorusGeometry(.11,.018,8,24),m.trim,[.03,.78,0],[0,Math.PI/2,0],'racing-steering-wheel');
 }
 // Smooth bevel joins while retaining deliberate hard creases; shared factory geometry is untouched.
 const smooth=new Map<T.BufferGeometry,T.BufferGeometry>();
 g.traverse(o=>{if(o instanceof T.Mesh&&o.material===m.body&&o.geometry.type==='ExtrudeGeometry'){
  const old=o.geometry;let next=smooth.get(old);if(!next){next=toCreasedNormals(old,Math.PI/3);smooth.set(old,next);}o.geometry=next;
 }});smooth.forEach((_,old)=>old.dispose());
 if(options.cutaway&&(s.id==='box-truck'||s.id==='tractor-truck')){const cab=g.getObjectByName('cab') as T.Mesh;cab.geometry=cutOpening(cab.geometry,[-1,.70,-s.width],[1,2,s.width]);const sleeper=g.getObjectByName('sleeper');if(sleeper)sleeper.visible=false;}
 if(options.cutaway)g.traverse(o=>{if(['roof','side-glass','windshield','rear-glass','roof-liner','cargo-side-panel','windscreen','side-window','roof-deflector'].includes(o.name))o.visible=false;});
 return g;
}
