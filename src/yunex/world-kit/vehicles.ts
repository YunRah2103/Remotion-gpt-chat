import * as T from 'three';
import {vehicleSpec} from './catalog.ts';
import type {VehicleSpec,VehicleOptions} from './catalog.ts';
import {box,mesh,panel,rod,paint,surface} from './geometry.ts';
import type {V3} from './geometry.ts';

type Mats={body:T.Material;trim:T.Material;glass:T.Material;metal:T.Material;rubber:T.Material;accent:T.Material;white:T.Material;red:T.Material};
function materials(o:VehicleOptions,s:VehicleSpec):Mats{return {
 body:paint(o.color??s.color),trim:surface('#18232a',.1,.55),glass:new T.MeshPhysicalMaterial({color:'#223e4b',metalness:.46,roughness:.16,clearcoat:1,side:T.DoubleSide}),metal:surface(o.wheelColor??'#abb9bf',.8,.28),rubber:surface('#15191c',.02,.91),accent:paint(o.accent??'#dfb45c'),white:new T.MeshStandardMaterial({color:'#e3f5ff',emissive:'#bfdfff',emissiveIntensity:o.lights?3:.15}),red:new T.MeshStandardMaterial({color:'#b42c36',emissive:'#ed2534',emissiveIntensity:o.lights?2:.15})};}
function wheel(parent:T.Group,m:Mats,x:number,z:number,r:number,w:number,steers:boolean,spokes=5){
 const pivot=new T.Group();pivot.name=`steer-${x}-${z}`;pivot.position.set(x,r,z);pivot.userData.steering=steers;parent.add(pivot);
 const roll=new T.Group();roll.name='wheel-roll';roll.userData={wheel:true,radius:r};pivot.add(roll);
 mesh(roll,new T.CylinderGeometry(r,r,w,32,1),m.rubber,[0,0,0],[Math.PI/2,0,0]);
 for(const side of [-1,1]){
  mesh(roll,new T.TorusGeometry(r*.76,r*.14,8,32),m.rubber,[0,0,side*w*.43]);
  mesh(roll,new T.TorusGeometry(r*.69,r*.035,6,32),m.metal,[0,0,side*(w*.5+.005)]);
  mesh(roll,new T.CylinderGeometry(r*.50,r*.50,.025,24),surface('#647079',.7,.45),[0,0,side*w*.40],[Math.PI/2,0,0]);
  for(let i=0;i<spokes;i++){
   const a=i*Math.PI*2/spokes;const b=box(roll,m.metal,[r*.59,r*.095,.035],[Math.cos(a)*r*.33,Math.sin(a)*r*.33,side*w*.51],.012);b.rotation.z=a;
  }
  mesh(roll,new T.CylinderGeometry(r*.15,r*.15,.04,16),m.metal,[0,0,side*w*.54],[Math.PI/2,0,0]);
 }
 // Caliper is attached to the axle, so it does not rotate with the wheel.
 box(pivot,m.accent,[r*.16,r*.47,w*.65],[r*.36,.03,0],.02,'brake-caliper');
 return pivot;
}
function archedBody(g:T.Group,m:Mats,s:VehicleSpec,top:number){
 const sh=new T.Shape(),half=s.length/2,bottom=s.radius*.70,ar=s.radius*1.10;
 sh.moveTo(-half+.10,bottom);
 for(const cx of [-s.wheelbase/2,s.wheelbase/2]){
  sh.lineTo(cx-ar,bottom);sh.lineTo(cx-ar,s.radius);
  for(let j=0;j<=24;j++){const a=Math.PI-j*Math.PI/24;sh.lineTo(cx+ar*Math.cos(a),s.radius+ar*Math.sin(a));}
  sh.lineTo(cx+ar,bottom);
 }
 sh.lineTo(half-.10,bottom);sh.quadraticCurveTo(half+.015,bottom,half,top-.16);sh.quadraticCurveTo(half-.04,top-.04,half-.23,top-.015);sh.lineTo(-half+.23,top+.035);sh.quadraticCurveTo(-half,top+.02,-half,top-.14);sh.lineTo(-half,bottom+.08);sh.closePath();
 const bevel=.045;const geo=new T.ExtrudeGeometry(sh,{depth:s.width-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:.025,bevelSegments:3,curveSegments:8,steps:1});geo.translate(0,0,-s.width/2+bevel);
 mesh(g,geo,m.body,[0,0,0],[0,0,0],'arched-body');
 box(g,m.trim,[s.wheelbase*.72,.095,s.width*.90],[0,bottom+.015,0],.025,'underbody');
}
function cabin(g:T.Group,m:Mats,s:VehicleSpec,belt:number){
 const sports=s.family==='sports',estate=s.roof==='estate',hatch=s.roof==='hatch',open=s.roof==='open';
 const frontBase=s.length*(s.id==='supercar'?.17:.22),frontRoof=s.length*(s.id==='supercar'?.03:.075);
 const rearRoof=-s.length*(s.id==='pickup'?.065:estate?.35:hatch?.29:s.id==='grand-tourer'?.21:.20),rearBase=-s.length*(s.id==='pickup'?.13:estate?.43:hatch?.42:.34);
 const roofY=s.height-.035,baseZ=s.width*.465,roofZ=s.width*(s.family==='suv'?.395:.375);
 const a:V3=[frontBase,belt,baseZ],b:V3=[frontRoof,roofY,roofZ],c:V3=[rearRoof,roofY,roofZ],d:V3=[rearBase,belt,baseZ];
 // Windshield and rear glass wrap onto the narrower roof, avoiding a box cabin.
 panel(g,m.glass,[a,[frontBase,belt,-baseZ],[frontRoof,roofY,-roofZ],b],'windshield');
 if(!open){
  panel(g,m.glass,[d,c,[rearRoof,roofY,-roofZ],[rearBase,belt,-baseZ]],'rear-glass');
  for(const sign of [-1,1]){
   const side=(v:V3):V3=>[v[0],v[1],v[2]*sign];panel(g,m.glass,[side(a),side(b),side(c),side(d)],'side-glass');
   rod(g,m.body,side(a),side(b),.035);rod(g,m.body,side(c),side(d),.045);
   if(!sports){const px=-s.length*.075;rod(g,m.trim,[px,belt,baseZ*sign],[px,roofY,roofZ*sign],.038);}
   rod(g,m.body,side(a),side(d),.025);
  }
  panel(g,m.body,[b,[frontRoof,roofY,-roofZ],[rearRoof,roofY,-roofZ],c],'roof');
  for(const sign of [-1,1])rod(g,m.body,[frontRoof,roofY,sign*roofZ],[rearRoof,roofY,sign*roofZ],.038);
 }else{
  for(const sign of [-1,1])rod(g,m.body,[frontBase,belt,sign*baseZ],[frontRoof,roofY,sign*roofZ],.035);
  rod(g,m.trim,[frontRoof,roofY,-roofZ],[frontRoof,roofY,roofZ],.035);
  box(g,m.trim,[1.32,.05,s.width*.72],[-.33,belt+.01,0],.04,'open-cockpit');
  for(const z of [-.39,.39]){box(g,m.trim,[.42,.13,.38],[-.25,belt+.09,z],.05,'seat');box(g,m.trim,[.13,.33,.36],[-.49,belt+.21,z],.05,'seat-back');mesh(g,new T.TorusGeometry(.17,.028,8,24),m.metal,[-.60,belt+.36,z]);}
 }
}
function roadCar(g:T.Group,m:Mats,s:VehicleSpec){
 const sports=s.family==='sports',suv=s.family==='suv',pickup=s.id==='pickup';
 const belt=suv?s.height*.59:pickup?1.08:sports?.79:.94;
 archedBody(g,m,s,belt);cabin(g,m,s,belt);
 const front=s.length/2,rear=-front;
 for(const sign of [-1,1]){
  const z=sign*s.width*.34;
  box(g,m.white,[.075,sports?.055:.10,s.width*.22],[front-.015,belt-.12,z],.02,'headlamp');
  box(g,m.red,[.065,.075,s.width*.22],[rear+.015,belt-.11,z],.02,'tail-lamp');
  box(g,m.trim,[s.length*.70,.07,.06],[-.06,.31,sign*(s.width*.5+.005)],.02,'sill');
  box(g,m.body,[.22,.105,.14],[s.length*.13,belt+.12,sign*s.width*.53],.035,'mirror');
  box(g,m.metal,[.14,.025,.023],[-.22,belt+.025,sign*(s.width*.5+.023)],.008,'handle');
  if(suv)rod(g,m.trim,[-s.length*.29,s.height+.035,sign*s.width*.30],[s.length*.04,s.height+.035,sign*s.width*.30],.024);
 }
 box(g,m.trim,[.065,.17,s.width*.52],[front+.012,belt-.34,0],.018,'grille');
 box(g,m.trim,[.09,.055,s.width*.85],[front-.01,.31,0],.018,'front-lip');
 box(g,m.trim,[.08,.11,s.width*.72],[rear-.015,.33,0],.018,'rear-diffuser');
 if(s.id==='supercar'){
  for(const sign of [-1,1])box(g,m.trim,[.44,.18,.045],[-.65,.71,sign*(s.width*.5+.012)],.03,'side-intake');
  box(g,m.body,[.20,.065,s.width*.82],[rear+.20,.99,0],.018,'rear-spoiler');
 }
 if(pickup){
  // Pickup has a visibly open bed instead of a continuous passenger cabin.
  box(g,m.trim,[1.75,.05,1.70],[-1.55,1.105,0],.02,'bed-floor');
  for(const z of [-.95,.95])box(g,m.body,[1.95,.27,.10],[-1.55,1.18,z],.02,'bed-wall');
 }
 const wheelZ=s.width/2-.09;
 for(const x of [-s.wheelbase/2,s.wheelbase/2])for(const sign of [-1,1])wheel(g,m,x,sign*wheelZ,s.radius,sports?.28:.235,x>0,sports?7:5);
}
function formula(g:T.Group,m:Mats,s:VehicleSpec){
 const modern=s.id==='formula-modern',front=s.wheelbase/2,rear=-front;
 box(g,m.trim,[s.length*.78,.09,.65],[0,.25,0],.03,'floor');
 const sh=new T.Shape();sh.moveTo(-s.length*.43,.34);sh.lineTo(s.length*.45,.34);sh.lineTo(s.length*.43,.48);sh.lineTo(.55,.63);sh.lineTo(.13,.72);sh.lineTo(-.22,.62);sh.lineTo(-.62,.90);sh.lineTo(-1.25,.90);sh.lineTo(-s.length*.43,.50);sh.closePath();
 const geo=new T.ExtrudeGeometry(sh,{depth:.52,bevelEnabled:true,bevelThickness:.10,bevelSize:.05,bevelSegments:3,steps:1});geo.translate(0,0,-.26);mesh(g,geo,m.body,[0,0,0],[0,0,0],'single-seater-body');
 box(g,m.trim,[.52,.05,.46],[-.36,.73,0],.07,'cockpit');
 for(const sign of [-1,1]){
  if(modern)box(g,m.body,[1.35,.32,.43],[-.65,.49,sign*.49],.10,'sidepod');
  for(const x of [front,rear]){
   wheel(g,m,x,sign*(s.width/2-.16),s.radius,.32,x>0,6);
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
 wheel(g,m,-f,0,s.radius,.17,false,6);wheel(g,m,f,0,s.radius,.14,true,6);
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
 box(g,m.white,[.08,.12,.23],[f+.025,.83,0],.035,'headlamp');
 box(g,m.red,[.05,.06,.22],[-.87,.86,0],.02,'tail-lamp');
 if(sport){for(const sign of [-1,1]){const points:V3[]=[[.58,.97,sign*.16],[.71,.65,sign*.20],[.20,.39,sign*.23],[-.12,.56,sign*.24],[.12,.86,sign*.21]];panel(g,m.body,sign>0?points.reverse():points,'fairing');}}
 if(sport||touring)panel(g,m.glass,[[f,.89,-.23],[f,.89,.23],[f-.20,touring?1.40:1.12,.18],[f-.20,touring?1.40:1.12,-.18]],'windshield');
 if(touring)for(const sign of [-1,1])box(g,m.body,[.58,.32,.25],[-.66,.64,sign*.31],.045,'pannier');
}
function heavyTruck(g:T.Group,m:Mats,s:VehicleSpec){
 const tractor=s.id==='tractor-truck',front=s.wheelbase/2,rear=-front;
 box(g,m.trim,[s.length-.30,.22,1.77],[0,.68,0],.04,'chassis');
 box(g,m.body,[1.80,1.70,s.width-.09],[front-.11,1.50,0],.09,'cab');
 if(tractor)box(g,m.body,[1.14,.78,s.width-.10],[front-.46,2.71,0],.10,'sleeper');
 const fx=front+.82;
 box(g,m.glass,[.035,.63,s.width*.83],[fx+.005,1.91,0],.01,'windscreen');
 for(const sign of [-1,1]){
  box(g,m.glass,[1.13,.59,.035],[front-.01,1.94,sign*(s.width/2-.035)],.02,'side-window');
  box(g,m.white,[.07,.12,.37],[fx+.025,1.10,sign*.72],.02,'headlamp');
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
 for(const x of axles)for(const sign of [-1,1])wheel(g,m,x,sign*(s.width/2-.13),s.radius,.28,x===front,8);
}
export function createVehicle(options:VehicleOptions):T.Group{
 const s=vehicleSpec(options.variant),g=new T.Group(),m=materials(options,s);g.name=`YUNEX-${s.id}`;g.userData={variant:s.id,family:s.family,units:'metres',forward:'+X'};
 if(s.family==='formula')formula(g,m,s);else if(s.family==='bike')bike(g,m,s);else if(s.id==='box-truck'||s.id==='tractor-truck')heavyTruck(g,m,s);else roadCar(g,m,s);
 return g;
}
