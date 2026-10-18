import * as T from 'three';
import {box,mesh,rod,surface} from './geometry.ts';
import type {V3} from './geometry.ts';
import type {VehicleMaterials} from './vehicle-wheels.ts';
import type {VehicleSpec} from './catalog.ts';
import {interiorLayout} from './interiors.ts';

function line(g:T.Object3D,m:T.Material,points:V3[],radius=.003,name='panel-gap'){
 // Straight segments keep creases crisp and avoid Catmull-Rom overshoot into panels.
 for(let i=1;i<points.length;i++){const r=rod(g,m,points[i-1],points[i],radius);r.name=name;}
}
function ring(g:T.Object3D,m:T.Material,r:number,t:number,p:V3,rotation:V3=[0,0,0],name='trim-ring'){return mesh(g,new T.TorusGeometry(r,t,8,32),m,p,rotation,name);}
function slats(g:T.Object3D,m:T.Material,x:number,y:number,width:number,height:number,count:number){
 for(let i=0;i<count;i++)box(g,m,[.012,.009,width],[x,y-height/2+height*(i+.5)/count,0],.002,'grille-slat');
}
export function lamp(g:T.Group,m:VehicleMaterials,x:number,y:number,z:number,width:number,height:number,front:boolean,retro=false){
 const sign=front?1:-1;
 if(retro&&front){
  mesh(g,new T.CylinderGeometry(.105,.105,.036,32),m.trim,[x,y,z],[0,0,Math.PI/2],'headlamp-housing');
  ring(g,m.metal,.095,.008,[x+.024,y,z],[0,Math.PI/2,0],'headlamp-bezel');
  mesh(g,new T.SphereGeometry(.09,24,12),m.white,[x+.028,y,z],[0,0,0],'headlamp-lens').scale.set(.22,1,1);
  return;
 }
 box(g,m.trim,[.050,height+.035,width+.035],[x,y,z],.014,front?'headlamp-housing':'tail-lamp-housing');
 box(g,front?m.metal:m.red,[.014,height*.68,width*.90],[x+sign*.029,y,z],.009,'lamp-reflector');
 const lensMat=new T.MeshPhysicalMaterial({color:front?'#c6e6ed':'#b32132',metalness:.12,roughness:.15,clearcoat:1,transparent:true,opacity:.62,depthWrite:false});
 box(g,lensMat,[.012,height*.84,width*.96],[x+sign*.040,y,z],.008,'lamp-lens');
 if(front){
  for(const dz of [-width*.24,width*.24])mesh(g,new T.CylinderGeometry(height*.26,height*.26,.012,20),m.white,[x+.043,y,z+dz],[0,0,Math.PI/2],'projector-light');
  box(g,m.white,[.012,.012,width*.92],[x+.05,y-height*.34,z],.004,'daylight-strip');
 }else{
  for(const dy of [-height*.23,height*.23])box(g,m.red,[.012,.012,width*.92],[x-.049,y+dy,z],.003,'tail-light-strip');
 }
}
/** Shallow curved skins share their boundaries with the original cabin/body. */
export function crownedPanel(g:T.Group,m:T.Material,x0:number,x1:number,z:number,y:(x:number)=>number,crown:number,name:string){
 const p:number[]=[],idx:number[]=[],nx=8,nz=12;
 for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const t=i/nx,u=j/nz,x=T.MathUtils.lerp(x0,x1,t);p.push(x,y(x)+crown*Math.sin(Math.PI*u)*Math.sin(Math.PI*t),T.MathUtils.lerp(-z,z,u));}
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j;idx.push(a,a+1,a+nz+1,a+1,a+nz+2,a+nz+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,m,[0,0,0],[0,0,0],name);
}
export function roadDetails(g:T.Group,m:VehicleMaterials,s:VehicleSpec){
 const l=interiorLayout(s),front=s.length/2,rear=-front,sports=s.family==='sports',pickup=s.id.includes('pickup'),seam=surface('#243038',.15,.64),black=surface('#0c171d',.15,.5);
 for(const sign of [-1,1]){
  lamp(g,m,front-.015,l.belt-.12,sign*s.width*.34,s.width*.22,sports?.065:.10,true,s.bodyStyle==='retro');
  lamp(g,m,rear+.015,l.belt-.11,sign*s.width*.34,s.width*.22,.085,false);
  const z=sign*(s.width/2+.003),doorRear=Math.max(-s.wheelbase/2+s.radius*1.16,-s.length*.09),doorFront=Math.min(s.wheelbase/2-s.radius*1.16,l.frontBase-.10),bottom=s.radius*.70+.15;
  line(g,seam,[[doorRear,l.belt-.014,z],[doorRear,bottom+.08,z],[doorRear+.09,bottom,z],[doorFront-.06,bottom,z],[doorFront,bottom+.07,z],[doorFront,l.belt-.014,z]],.0035,'door-seam');
  // A second door only fits passenger cabins with enough distance behind the B pillar.
  const rearDoors=!sports&&s.id!=='compact'&&!pickup&&l.rearBase<doorRear-.35;
  if(rearDoors)line(g,seam,[[l.rearBase+.11,l.belt-.015,z],[l.rearBase+.16,Math.max(bottom+.05,s.radius*2.13),z],[doorRear,Math.max(bottom+.05,s.radius*2.13),z]],.003,'rear-door-seam');
  const handleX=doorRear+.13;
  box(g,black,[.18,.042,.008],[handleX,l.belt-.07,z],.01,'handle-recess');
  box(g,m.metal,[.13,.018,.025],[handleX+.005,l.belt-.066,z+sign*.012],.006,'door-handle');
  if(rearDoors)box(g,m.metal,[.13,.018,.025],[l.rearBase+.25,l.belt-.066,z+sign*.012],.006,'rear-door-handle');
  const mx=l.frontBase-.14,mz=sign*s.width*.53;
  rod(g,m.trim,[mx,l.belt+.035,sign*s.width*.455],[mx-.035,l.belt+.10,mz],.018).name='mirror-stalk';
  box(g,m.body,[.22,.105,.14],[mx-.02,l.belt+.12,mz],.035,'mirror');
  box(g,surface('#b1c6ce',.96,.08),[.012,.075,.105],[mx-.136,l.belt+.122,mz],.013,'mirror-glass');
  // Wheel-arch beads follow the opening, with no tyre intersection.
  for(const x of [-s.wheelbase/2,s.wheelbase/2]){
   const pts:V3[]=[];for(let i=0;i<=24;i++){const a=i*Math.PI/24;pts.push([x+Math.cos(a)*s.radius*1.10,s.radius+Math.sin(a)*s.radius*1.10,z]);}
   line(g,s.family==='suv'||pickup?m.trim:m.body,pts,s.family==='suv'||pickup?.012:.007,'arch-trim');
  }
  const hoodStart=Math.max(l.frontBase+.06,front-.95),hoodEnd=front-.25;
  if(hoodEnd>hoodStart+.1){const y=(x:number)=>l.belt+.036-(x+front-.23)/(s.length-.46)*.05+.028*Math.sin(Math.PI*.81)+.004;line(g,seam,[[hoodStart,y(hoodStart),sign*s.width*.31],[hoodEnd,y(hoodEnd),sign*s.width*.30]],.003,'bonnet-seam');}
  if(s.bodyStyle!=='ev'){
   // Rear-facing exhaust outlets use a dark bore, avoiding a solid chrome plug.
   const exhaust=mesh(g,new T.CylinderGeometry(.041,.041,.12,20,1,true),m.metal,[rear-.035,.365,sign*s.width*.31],[0,0,Math.PI/2],'exhaust-tip');
   mesh(g,new T.CircleGeometry(.035,20),black,[rear-.097,.365,sign*s.width*.31],[0,-Math.PI/2,0],'exhaust-bore');exhaust.castShadow=false;
  }
  box(g,m.red,[.012,.03,.10],[rear-.055,.46,sign*s.width*.38],.005,'rear-reflector');
 }
 if(s.bodyStyle!=='ev')slats(g,m.metal,front+.047,l.belt-.34,s.width*.48,.12,sports?3:5);
 for(const x of [front+.052,rear-.052])box(g,black,[.014,.095,.38],[x,.47,0],.007,'plate-mount');
 // Wipers lie on the sloped windscreen, below the driver's sightline.
 for(const z of [-s.width*.23,s.width*.18]){
  const t=.085,x=T.MathUtils.lerp(l.frontBase,l.frontRoof,t),y=T.MathUtils.lerp(l.belt,l.roof,t)+.008;
  line(g,m.trim,[[x,y,z],[x-.035,y+.025,z+.15],[x-.06,y+.045,z+.33]],.007,'windscreen-wiper');
 }
 if(sports||s.bodyStyle==='track'){
  for(const z of [-.45,-.15,.15,.45])box(g,m.trim,[.30,.08,.018],[rear+.08,.32,z*s.width*.65],.004,'diffuser-fin');
  if(s.id==='supercar'||s.bodyStyle==='track')for(const sign of [-1,1])rod(g,m.trim,[rear+.25,l.belt+.015,sign*s.width*.27],[rear+.2,.965,sign*s.width*.27],.018).name='spoiler-support';
 }
 if(pickup){
  const length=s.length/2+l.rearBase-.16,cx=(l.rearBase-s.length/2)/2;
  for(let i=-4;i<=4;i++)box(g,m.trim,[length,.014,.025],[cx,1.137,i*s.width*.075],.003,'bed-rib');
  line(g,seam,[[rear-.003,1.06,-s.width*.42],[rear-.003,.91,-s.width*.42],[rear-.003,.91,s.width*.42],[rear-.003,1.06,s.width*.42]],.004,'tailgate-seam');
 }
 if(s.family==='van'&&s.id!=='minivan')for(const sign of [-1,1])box(g,m.trim,[s.length*.40,.07,.035],[-s.length*.18,.69,sign*(s.width/2+.018)],.01,'cargo-rub-strip');
}
export function formulaDetails(g:T.Group,m:VehicleMaterials,s:VehicleSpec){
 const modern=s.id==='formula-modern';
 for(const sign of [-1,1]){
  box(g,m.trim,[modern?.24:.18,.17,.20],[-.03,.73,sign*.23],.025,'cockpit-padding');
  box(g,m.trim,[.12,.10,.22],[.25,.78,sign*.45],.02,'racing-mirror');
  rod(g,m.trim,[.18,.66,sign*.23],[.25,.76,sign*.45],.012).name='mirror-stalk';
  for(const x of [-s.wheelbase/2,s.wheelbase/2]){
   rod(g,m.metal,[x*.55,.48,sign*.23],[x,.36,sign*(s.width/2-.26)],.012).name='pushrod';
   rod(g,m.trim,[x*.85,.3,sign*.24],[x,.37,sign*(s.width/2-.26)],.022).name='lower-wishbone';
  }
  if(modern){box(g,m.trim,[.055,.15,.32],[.036,.50,sign*.49],.018,'sidepod-inlet');for(let i=0;i<5;i++)box(g,m.trim,[.11,.008,.24],[-.45-i*.13,.662,sign*.50],.002,'cooling-louvre');}
 }
 for(const rear of [false,true]){
  const x=s.length*(rear?-.41:.43),y=rear?.85:.24,w=s.width*(rear?.80:.96);
  for(let i=1;i<=2;i++)box(g,m.body,[rear?.19:.22,.025,w*.96],[x-(rear?-.07:.08)*i,y+.045*i,0],.009,'wing-flap');
 }
 mesh(g,new T.CylinderGeometry(.085,.11,.24,24),m.trim,[-.9,.95,0],[0,0,Math.PI/2],'airbox-inlet');
 box(g,m.red,[.025,.065,.07],[-s.length*.44,.43,0],.006,'rain-light');
 for(const z of [-.10,.10])box(g,m.accent,[.022,.22,.035],[-.535,.86,z],.004,'harness');
}
export function bikeDetails(g:T.Group,m:VehicleMaterials,s:VehicleSpec){
 const f=s.wheelbase/2;
 for(const sign of [-1,1]){
  rod(g,m.accent,[f-.11,.65,sign*.085],[f-.2,.94,sign*.085],.025).name='fork-stanchion';
  box(g,m.trim,[.12,.06,.045],[f-.20,.96,sign*(s.width*.46-.055)],.012,'handlebar-grip');
  rod(g,m.metal,[f-.24,.99,sign*.20],[f-.18,.99,sign*.31],.008).name='brake-lever';
  rod(g,m.trim,[-.13,.38,sign*.16],[-.22,.38,sign*.29],.018).name='foot-peg';
  for(let i=0;i<5;i++)box(g,m.metal,[.25,.012,.03],[-.03,.42+i*.033,sign*.19],.002,'engine-cooling-fin');
  rod(g,m.trim,[f-.2,.96,sign*.22],[f-.27,1.10,sign*.28],.01).name='mirror-stalk';
  box(g,m.trim,[.09,.07,.13],[f-.27,1.12,sign*.28],.02,'bike-mirror');
 }
 mesh(g,new T.CylinderGeometry(.041,.041,.012,24),m.metal,[.11,.978,0],[0,0,0],'fuel-cap');
 // Narrow curved fenders follow each tyre and leave clearance through the entire arc.
 for(const x of [-f,f]){
  const curve=new T.EllipseCurve(0,0,s.radius*1.07,s.radius*1.07,.22,Math.PI-.22,false,0),pts=curve.getPoints(24),vertices:number[]=[],indices:number[]=[];
  for(const p of pts)for(const z of [-.07,.07])vertices.push(x+p.x,s.radius+p.y,z);
  for(let i=0;i<pts.length-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mat=m.body.clone();mat.side=T.DoubleSide;mesh(g,geo,mat,[0,0,0],[0,0,0],'mudguard');
 }
 line(g,m.trim,[[-f,s.radius,-.105],[-.12,.39,-.105],[.16,.44,-.105]],.014,'chain-drive');
 const screen=surface('#508a9a',.2,.24);box(g,screen,[.11,.025,.14],[f-.23,1.015,0],.008,'bike-instruments');
 box(g,m.trim,[.10,.18,.12],[-s.length*.43,.61,0],.008,'rear-plate');
}
export function truckDetails(g:T.Group,m:VehicleMaterials,s:VehicleSpec){
 const front=s.wheelbase/2,fx=front+.82,cabHalf=(s.width-.09)/2;
 slats(g,m.metal,fx+.055,1.36,1.20,.28,7);
 box(g,m.metal,[.065,.14,s.width*.87],[fx+.04,.86,0],.025,'truck-bumper');
 for(const sign of [-1,1]){
  box(g,surface('#b5cbd0',.95,.09),[.025,.185,.095],[fx-.15,1.83,sign*(s.width/2+.10)],.012,'mirror-glass');
  rod(g,m.trim,[front+.25,1.96,sign*s.width*.48],[fx,1.96,sign*(s.width/2+.1)],.018).name='mirror-arm';
  box(g,m.metal,[.23,.025,.028],[front-.40,1.52,sign*(cabHalf+.006)],.006,'cab-handle');
  line(g,m.trim,[[front+.57,1.57,sign*(cabHalf+.001)],[front+.57,1.03,sign*(cabHalf+.001)],[front-.65,1.03,sign*(cabHalf+.001)],[front-.65,2.17,sign*(cabHalf+.001)]],.004,'cab-door-seam');
  for(let i=0;i<4;i++)box(g,m.trim,[.50,.008,.012],[front,.767,sign*s.width*.49+(i-1.5)*.035],.002,'step-tread');
  box(g,m.accent,[.06,.035,.09],[fx+.06,1.22,sign*.78],.006,'indicator');
  box(g,m.trim,[.08,.28,.32],[-s.wheelbase/2-.40,.55,sign*(s.width/2-.12)],.008,'mudflap');
  if(s.id==='box-truck'){
   for(let i=0;i<8;i++)box(g,m.metal,[.025,2.14,.015],[-2.90+i*.52,2.12,sign*(s.width/2+.004)],.002,'cargo-upright');
   for(let i=0;i<5;i++)box(g,m.accent,[.12,.035,.018],[-2.9+i*.9,1.05,sign*(s.width/2+.012)],.003,'side-marker');
  }
 }
 for(const z of [-.65,0,.65])box(g,m.accent,[.05,.04,.09],[fx,2.37,z],.005,'cab-marker');
 for(const z of [-.57,.36])line(g,m.trim,[[fx+.028,1.64,z],[fx+.033,1.76,z+.15],[fx+.033,1.79,z+.40]],.008,'windscreen-wiper');
 if(s.id==='tractor-truck'){
  for(const sign of [-1,1])box(g,m.trim,[1.65,.07,.40],[-s.wheelbase/2+.49,1.09,sign*(s.width/2-.12)],.025,'rear-fender');
  for(const z of [-.14,.14])mesh(g,new T.TorusGeometry(.10,.018,8,24),m.accent,[.42,1.40,z],[0,Math.PI/2,0],'service-hose');
 }
}
