/** Editable section-built specialty bodywork. Wheel rigs and cabin hardpoints stay canonical. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {mesh,surface} from '../world-kit/geometry.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {fleetSkin,station,lerp} from './fleet-surfaces.ts';
import {camberedWing,formedPanel,motorcyclePanel} from './smooth-specialty-surfaces.ts';
type Section=readonly [number,number,number,number]; // x, half-width, centre height, vertical radius
/** Closed, longitudinal superellipse loft. Positive end radii avoid singular pole normals. */
function volume(knots:readonly Section[],offset=0,round=.68){
 const n=64,nx=96,p:number[]=[],idx:number[]=[];
 const curves=[1,2,3].map(c=>knots.map(k=>[k[0],k[c]] as const));
 for(let i=0;i<=nx;i++){
  const x=lerp(knots[0][0],knots[knots.length-1][0],i/nx),w=station(x,curves[0]),y=station(x,curves[1]),h=station(x,curves[2]);
  for(let j=0;j<n;j++){const a=j/n*Math.PI*2,c=Math.cos(a),v=Math.sin(a);p.push(x,y+Math.sign(v)*Math.abs(v)**round*h,offset+Math.sign(c)*Math.abs(c)**round*w);}
 }
 for(let i=0;i<nx;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;idx.push(a,a+n,b,b,a+n,b+n);}
 for(const i of [0,nx]){const k=i===0?knots[0]:knots[knots.length-1],ci=p.length/3;p.push(k[0],k[2],offset);for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;idx.push(...(i===0?[ci,a,b]:[ci,b,a]));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function remove(shell:T.Group,names:string[]){shell.traverse(o=>{if(names.includes(o.name))o.visible=false;});}
function replace(shell:T.Group,name:string,geo:T.BufferGeometry){
 const old=shell.getObjectByName(name) as T.Mesh|undefined;
 if(!old){geo.dispose();return;}
 old.geometry.dispose();old.geometry=geo;old.position.set(0,0,0);old.rotation.set(0,0,0);old.scale.set(1,1,1);
}
export function installFleetSpecialty(shell:T.Group,s:VehicleSpec){
 let paint:T.Material|undefined;shell.traverse(o=>{if(!paint&&o instanceof T.Mesh&&o.material instanceof T.MeshPhysicalMaterial&&o.material.clearcoat>0)paint=o.material;});
 paint=paint??new T.MeshPhysicalMaterial({color:s.color,metalness:.52,roughness:.25,clearcoat:1});
 const carbon=surface('#182024',.2,.40);
 if(s.family==='formula'){
  remove(shell,['single-seater-body','sidepod','engine-cover','sidepod-inlet','cooling-louvre','airbox-inlet']);
  const modern=s.id==='formula-modern',h=s.length/2;
  const tub:Section[]=modern?
   [[-h*.86,.075,.40,.09],[-1.46,.18,.48,.18],[-.85,.32,.54,.24],[-.35,.335,.53,.25],[.22,.28,.50,.21],[.90,.14,.44,.115],[h*.89,.065,.31,.055]]:
   [[-h*.87,.06,.43,.08],[-1.15,.24,.50,.19],[-.75,.355,.53,.23],[-.28,.36,.52,.24],[.34,.28,.48,.20],[1.12,.19,.39,.145],[h*.91,.07,.31,.07]];
  const geo=cutOpening(volume(tub,0,modern?.88:1),[-.69,.55,-.235],[.18,1.4,.235]);
  mesh(shell,geo,paint,[0,0,0],[0,0,0],'fleet-monocoque');
  mesh(shell,volume(modern?
   [[-h*.87,.055,.43,.05],[-1.55,.13,.58,.16],[-1.02,.21,.73,.25],[-.75,.14,.79,.20]]:
   [[-h*.85,.045,.46,.045],[-1.38,.16,.61,.13],[-1.03,.22,.70,.19],[-.76,.18,.75,.17]],0,modern?.92:1),paint,[0,0,0],[0,0,0],'fleet-engine-cover');
  if(modern)for(const side of [-1,1]){
   // High inlet shoulder falls away to a narrow rear coke-bottle, leaving an undercut below.
   const pod=volume([[-1.52,.055,.39,.055],[-1.18,.14,.45,.09],[-.72,.235,.54,.13],[-.22,.30,.61,.165],[.12,.29,.61,.15],[.28,.22,.58,.12]],side*.55,.90);
   mesh(shell,cutOpening(pod,[.17,.545,side*.55-.15],[.36,.645,side*.55+.15]),paint,[0,0,0],[0,0,0],'fleet-undercut-sidepod');
   // Recessed duct has a curved throat; the opening is removed from the outer shoulder.
   mesh(shell,formedPanel((u,v)=>new T.Vector3(.175-.05*Math.sin(Math.PI*u)*Math.sin(Math.PI*v),.545+v*.10,side*.55+lerp(-.15,.15,u)),.012,true,24,12),carbon,[0,0,0],[0,0,0],'fleet-sidepod-inlet');
  }
  remove(shell,['front-wing','rear-wing','wing-flap','wing-endplate']);
  for(const rear of [false,true])for(let element=0;element<(modern?3:2);element++){
   const span=s.width*(rear?.39:.47),x=(rear?-1:1)*s.length*.42,y=rear?.86:.22;
   mesh(shell,camberedWing(x+element*.105,y+element*.046,span,element===0?.23:.16,.032,.025),paint,[0,0,0],[0,0,0],rear?'fleet-rear-airfoil':'fleet-front-airfoil');
   if(element===0)for(const side of [-1,1])mesh(shell,formedPanel((u,v)=>new T.Vector3(x+lerp(-.15,.35,u)+.025*Math.sin(Math.PI*v),y+lerp(-.045,rear?.23:.14,v),side*(span+.012+.012*Math.sin(Math.PI*u)*Math.sin(Math.PI*v))),.022,side<0,24,16),paint,[0,0,0],[0,0,0],'fleet-wing-endplate');
  }
 }else if(s.family==='bike'){
  const sport=s.id==='sport-bike',touring=s.id==='touring-bike',f=s.wheelbase/2;
  remove(shell,['fuel-tank','tail','saddle','fairing','fairing-inner','fairing-edge','mudguard','pannier']);
  const tank:Section[]=sport?
   [[-.28,.07,.86,.045],[-.12,.16,.90,.13],[.10,.195,.90,.16],[.28,.16,.91,.115],[.39,.055,.87,.045]]:
   touring?[[-.32,.11,.83,.07],[-.13,.225,.89,.15],[.13,.235,.91,.16],[.34,.15,.92,.10],[.43,.05,.89,.04]]:
   [[-.34,.075,.83,.06],[-.16,.21,.88,.15],[.06,.245,.90,.16],[.28,.20,.90,.14],[.40,.055,.85,.05]];
  mesh(shell,volume(tank,0,sport?.95:1),paint,[0,0,0],[0,0,0],'fleet-tank');
  mesh(shell,volume(sport?
   [[-.97,.035,.99,.025],[-.78,.105,.96,.065],[-.58,.15,.90,.06],[-.39,.115,.84,.03]]:
   touring?[[-1.02,.08,.90,.04],[-.86,.175,.91,.07],[-.62,.19,.86,.07],[-.40,.15,.81,.035]]:
   [[-.91,.045,.86,.025],[-.76,.11,.88,.035],[-.53,.14,.86,.045],[-.36,.10,.82,.025]],0,.90),paint,[0,0,0],[0,0,0],'fleet-tail-cowl');
  mesh(shell,volume([[-.77,.11,sport?.925:.91,.025],[-.57,touring?.19:.155,sport?.88:.87,.04],[-.32,.14,.825,.035],[-.17,.095,.815,.025]],0,.82),carbon,[0,0,0],[0,0,0],'fleet-saddle');
  if(sport){
   // Tailored side skins leave the engine, steering head and front wheel separate.
   for(const side of [-1,1])mesh(shell,motorcyclePanel([[-.24,.19,.43,.61],[-.03,.255,.36,.80],[.26,.28,.39,.90],[.48,.235,.57,.98],[.68,.17,.84,1.015],[.81,.065,.89,.96]],side),paint,[0,0,0],[0,0,0],'fleet-sculpted-fairing');
   mesh(shell,volume([[.43,.105,.94,.055],[.61,.19,.965,.075],[.77,.14,.94,.06],[.84,.035,.92,.025]],0,1),paint,[0,0,0],[0,0,0],'fleet-nose-cowl');
   mesh(shell,volume([[-.27,.09,.35,.035],[.05,.19,.37,.065],[.39,.15,.40,.07],[.51,.055,.46,.025]],0,.9),paint,[0,0,0],[0,0,0],'fleet-belly-pan');
  }else if(touring){
   for(const side of [-1,1]){
    mesh(shell,motorcyclePanel([[.01,.23,.63,.84],[.24,.34,.68,1.03],[.49,.35,.79,1.12],[.69,.27,.88,1.11],[.83,.09,.94,1.02]],side),paint,[0,0,0],[0,0,0],'fleet-touring-fairing');
    mesh(shell,volume([[-1.02,.075,.65,.13],[-.90,.13,.68,.19],[-.57,.14,.69,.19],[-.42,.08,.72,.13]],side*.30,.63),paint,[0,0,0],[0,0,0],'fleet-touring-case');
   }
  }
  if(touring)mesh(shell,volume([[.43,.16,1.02,.08],[.64,.27,1.035,.105],[.80,.17,1.00,.07],[.87,.045,.97,.035]],0,1),paint,[0,0,0],[0,0,0],'fleet-nose-cowl');
  if(sport||touring){
   const lampMaterial=surface('#c8e7ed',.25,.13);
   for(const side of [-1,1])mesh(shell,formedPanel((u,v)=>new T.Vector3((touring?.858:.827)-.05*(u-.5)**2-.025*(v-.5)**2,(touring?.98:.925)+v*.05,side*(.045+u*(touring?.12:.095))),.009,side>0,20,12),lampMaterial,[0,0,0],[0,0,0],'fleet-curved-headlamp-cover');
  }
  if(!sport&&!touring)for(const side of [-1,1])mesh(shell,volume([[-.02,.025,.72,.075],[.12,.065,.76,.15],[.29,.07,.80,.18],[.43,.035,.83,.105],[.48,.015,.85,.035]],side*.19,.94),paint,[0,0,0],[0,0,0],'fleet-radiator-shroud');
  if(sport||touring){
   const screen=shell.getObjectByName('windshield') as T.Mesh|undefined;
   if(screen){const mat=screen.material;screen.visible=false;screen.name='legacy-bike-windshield';fleetSkin(shell,mat as T.Material,'windshield',(u,v)=>{const z=lerp(-1,1,u)*(touring?.25:.18)*(1-.25*v);return new T.Vector3(lerp(touring?.76:.77,touring?.40:.48,v)-.025*(1-(z/.25)**2),lerp(touring?1.04:1.00,s.height,v),z);},true,32,24);}
  }
  const cap=shell.getObjectByName('fuel-cap');if(cap)cap.position.y=sport?1.065:1.08;
  const tailLamp=shell.getObjectByName('tail-lamp');if(tailLamp)tailLamp.position.y=sport?.99:.89;
  for(const axle of [-f,f])mesh(shell,formedPanel((u,v)=>{const a=lerp(.20,Math.PI-.20,u),z=lerp(-.09,.09,v),r=s.radius+.04+.012*(1-(z/.09)**2);return new T.Vector3(axle+Math.cos(a)*r,s.radius+Math.sin(a)*r,z);},.014,false,48,12),paint,[0,0,0],[0,0,0],'fleet-bike-fender');
 }else{
  const tractor=s.id==='tractor-truck',front=s.wheelbase/2,fx=front+.82,w=(s.width-.09)/2;
  // New section shell, with a broad flat face, rounded shoulders and a real hollow cab.
  let cab=volume([[-.90,w*.84,0,.73],[-.79,w*.96,0,.82],[-.61,w,0,.85],[.45,w,0,.85],[.70,w*.98,0,.83],[.84,w*.91,0,.78],[.90,w*.82,0,.71]],0,.27);
  cab=cutOpening(cab,[-.75,-.47,-s.width*.42],[.75,.77,s.width*.42]);
  cab=cutOpening(cab,[.73,.08,-s.width*.42],[1.05,.73,s.width*.42]);
  cab=cutOpening(cab,[-.55,.14,-s.width],[.65,.72,s.width]);
  for(const side of [-1,1])cab=cutOpening(cab,[.78,-.465,side*.72-.195],[1.10,-.335,side*.72+.195]);
  const original=shell.getObjectByName('cab') as T.Mesh;original.geometry.computeBoundingBox();
  if(original.geometry.boundingBox!.max.y<.72)cab=cutOpening(cab,[-1,.70,-s.width],[1,2,s.width]);
  original.geometry.dispose();original.geometry=cab;
  // One deformation fits cab structure, aperture edges, glass and all attached fittings.
  const warp=(p:T.Vector3)=>{
   const t=T.MathUtils.clamp((p.y-1.13)/1.22,0,1),nose=T.MathUtils.smoothstep(p.x,front-.15,fx+.12);
   p.x-=nose*((tractor?.36:.29)*t+.10*(Math.abs(p.z)/w)**4);
   p.z*=1-(tractor?.095:.075)*t*t;
   p.y+=(tractor?.12:.045)*T.MathUtils.smoothstep(p.y,2.16,2.36);
   return p;
  };
  const cabNames=new Set(['cab','windscreen','side-window','truck-window-seal','windscreen-mullion','windscreen-wiper','grille','grille-slat','truck-headlamp-housing','headlamp','headlamp-housing','lamp-bucket','lamp-reflector','lamp-lens','projector-light','daylight-strip','mirror','mirror-glass','mirror-arm','cab-handle','cab-door-seam','cab-marker','indicator']);
  shell.traverse(o=>{if(!(o instanceof T.Mesh)||!cabNames.has(o.name))return;
   o.updateMatrix();const mat=o.matrix.clone(),inverse=mat.clone().invert(),old=o.geometry;o.geometry=old.clone();old.dispose();const p=o.geometry.attributes.position;
   for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mat);warp(q).applyMatrix4(inverse);p.setXYZ(i,q.x,q.y,q.z);}o.geometry.computeVertexNormals();
  });
  if(tractor){
   remove(shell,['roof-deflector','sleeper-panel-gap']);
   replace(shell,'sleeper',volume([[front-1.06,w*.94,2.55,.45],[front-.91,w*.97,2.70,.60],[front-.47,w*.95,2.72,.66],[front-.05,w*.90,2.66,.59],[front+.11,w*.84,2.55,.46]],0,.42));
   // A hollow lower shoulder spans the sleeper/cab join without filling the cabin.
  }else{
   replace(shell,'cargo-box',volume([[-3.145,s.width/2,2.12,1.125],[-2.96,s.width/2,2.12,1.125],[.76,s.width/2,2.12,1.125],[1.02,s.width*.49,2.08,1.085],[1.105,s.width*.47,2.01,1.01]],0,.12));
  }
  for(const side of [-1,1])fleetSkin(shell,paint,'fleet-truck-arch',(u,v)=>{const a=u*Math.PI,r=s.radius+.09;return new T.Vector3(front+Math.cos(a)*r,s.radius+Math.sin(a)*r,side*(s.width*.49-v*.12));},side<0,64,8);
 }
 shell.userData.bodyArchitecture='fleet-v5';shell.userData.specialtyRebuild=2;shell.userData.smoothSpecialtyRevision=3;
}
