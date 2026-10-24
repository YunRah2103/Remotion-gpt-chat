/** Source-owned V5 road families: connected body sections, wheel apertures and fitted crowned glazing. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {box,mesh,surface} from '../world-kit/geometry.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {angleWeightedNormals} from './studio-normals.ts';
import {fleetProfile} from './fleet-profiles.ts';
import {fleetCurve,fleetSkin,fleetPillar,lerp,station} from './fleet-surfaces.ts';
export function fleetSection(s:VehicleSpec,x:number){
 const c=fleetProfile(s),u=x/(s.length/2),axle=Math.max(Math.exp(-(((x-s.wheelbase/2)/.45)**2)),Math.exp(-(((x+s.wheelbase/2)/.50)**2)));
 const rear=c.kind==='hatch'||c.kind==='rally'||c.kind==='estate'||c.van;
 const deck=c.belt+station(u,[[-1,-.13],[-.78,rear?-.01:.015],[-.35,.0],[.24,-.015],[.66,-.055],[1,-.19]]);
 const w=s.width*.5*station(u,[[-1,c.utility?.91:.84],[-.68,1],[0,1-c.waist],[.67,.99],[1,c.van?.93:.83]]);
 return {deck,width:w,axle};
}
export function fleetDeck(s:VehicleSpec,x:number,v:number){
 const c=fleetProfile(s),a=fleetSection(s,x),z=Math.abs(v);
 return new T.Vector3(x,a.deck+c.crown*(1-v*v)+c.shoulder*a.axle*Math.exp(-(((z-.83)/.23)**2)),a.width*v);
}
function flank(s:VehicleSpec,x:number,y:number,side:number){
 const c=fleetProfile(s),q=fleetDeck(s,x,side),t=T.MathUtils.clamp((q.y-y)/(q.y-c.sill),0,1);
 return new T.Vector3(x,y,q.z*(1-.070*Math.sin(Math.PI*t)) +side*.012*Math.exp(-(((t-.25)/.12)**2)));
}
function roadShell(s:VehicleSpec){
 const c=fleetProfile(s),half=s.length/2,xs:number[]=[];
 for(let i=0;i<=128;i++)xs.push(lerp(-half,half,i/128));
 for(const ax of [-s.wheelbase/2,s.wheelbase/2])for(let i=0;i<=48;i++)xs.push(ax+c.arch*Math.cos(i*Math.PI/48));
 xs.sort((a,b)=>a-b);const values=xs.filter((x,i)=>x>=-half&&x<=half&&(i===0||x-xs[i-1]>1e-5));
 const p:number[]=[],idx:number[]=[],rows:number[][]=[];
 for(const x of values){let low=c.sill;for(const ax of [-s.wheelbase/2,s.wheelbase/2])if(Math.abs(x-ax)<c.arch)low=Math.max(low,s.radius+Math.sqrt(c.arch**2-(x-ax)**2));
  const row:number[]=[],add=(q:T.Vector3)=>{row.push(p.length/3);p.push(...q.toArray());};
  for(let j=0;j<=32;j++)add(fleetDeck(s,x,-1+j/16));
  for(let j=1;j<=16;j++)add(flank(s,x,lerp(fleetDeck(s,x,1).y,low,j/16),1));
  for(let j=1;j<=8;j++)add(new T.Vector3(x,low,lerp(flank(s,x,low,1).z,flank(s,x,low,-1).z,j/8)));
  for(let j=15;j>0;j--)add(flank(s,x,lerp(fleetDeck(s,x,-1).y,low,j/16),-1));rows.push(row);
 }
 const n=rows[0].length;
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){const a=rows[i][j],b=rows[i][(j+1)%n],d=rows[i+1][j],e=rows[i+1][(j+1)%n];idx.push(a,b,d,b,e,d);}
 for(const end of [0,rows.length-1]){const row=rows[end],q=new T.Vector3();for(const i of row)q.add(new T.Vector3(p[i*3],p[i*3+1],p[i*3+2]));q.divideScalar(n);const centre=p.length/3;p.push(...q.toArray());for(let j=0;j<n;j++)idx.push(...(end===0?[centre,row[(j+1)%n],row[j]]:[centre,row[j],row[(j+1)%n]]));}
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);angleWeightedNormals(g);
 // Remove the actual cabin cavity instead of hiding a solid slab behind glass.
 const old=g;g=cutOpening(g,[c.rearBase+.045,c.sill+.08,-c.baseWidth*.94],[c.frontBase-.035,c.roof+.1,c.baseWidth*.94]);old.dispose();
 return g;
}
function canopy(shell:T.Group,s:VehicleSpec,paint:T.Material,glass:T.Material,trim:T.Material){
 const c=fleetProfile(s),roof=(x:number,z:number)=>new T.Vector3(x,c.roof-.048*z*z+.018*Math.sin(Math.PI*(x-c.rearRoof)/(c.frontRoof-c.rearRoof)),c.roofWidth*z);
 const screen=(rear:boolean,t:number,z:number)=>{const base=rear?c.rearBase:c.frontBase,top=rear?c.rearRoof:c.frontRoof,p=new T.Vector3(base,c.belt-.020*z*z,c.baseWidth*z).lerp(roof(top,z),t);p.x+=(rear?-.045:.065)*Math.sin(Math.PI*t)*(1-z*z);return p;};
 const rail=(name:string,fn:(t:number)=>T.Vector3,mat:T.Material,r:number)=>{const points=Array.from({length:33},(_,i)=>fn(i/32));return name==='a-pillar'||name==='c-pillar'||name==='roof-side-rail'?fleetPillar(shell,mat,points,r*2,.026,name):fleetCurve(shell,mat,points,r,name);};
 if(!c.open&&!c.targa)fleetSkin(shell,paint,'roof',(u,v)=>roof(lerp(c.rearRoof,c.frontRoof,u),-1+2*v),true);
 if(c.targa)fleetSkin(shell,paint,'targa-bar',(u,v)=>roof(lerp(c.rearRoof,c.rearRoof+.15,u),-1+2*v),true);
 for(const rear of [false,true]){
  if(rear&&c.open)continue;
  fleetSkin(shell,glass,rear?'rear-glass':'windshield',(u,v)=>screen(rear,u,-1+2*v),rear,28,32);
  for(const side of [-1,1])rail(rear?'c-pillar':'a-pillar',t=>screen(rear,t,side),paint,c.utility||c.van?.035:.027);
  for(const t of [0,1])rail(rear?'rear-window-seal':'windshield-seal',z=>screen(rear,t,-1+2*z),trim,.008);
 }
 const roofX=(t:number)=>t<.22?lerp(c.rearBase,c.rearRoof,t/.22):t>.78?lerp(c.frontRoof,c.frontBase,(t-.78)/.22):lerp(c.rearRoof,c.frontRoof,(t-.22)/.56);
 const roofY=(t:number)=>t<.22?lerp(c.belt,c.roof-.048,t/.22):t>.78?lerp(c.roof-.048,c.belt,(t-.78)/.22):c.roof-.048+.018*Math.sin(Math.PI*(t-.22)/.56);
 for(const side of [-1,1]){
  const edge=(t:number)=>new T.Vector3(roofX(t),roofY(t),side*lerp(c.baseWidth,c.roofWidth,(roofY(t)-c.belt)/(c.roof-c.belt)));
  if(!c.open){
   fleetSkin(shell,glass,'side-glass',(u,v)=>{const t=.025+u*.95,q=edge(t);return new T.Vector3(q.x,lerp(c.belt+.008,q.y,v),lerp(side*c.baseWidth,q.z,v)-side*.015*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));},side<0,64,20);
   rail('roof-side-rail',edge,paint,.020);
   if(!c.sports){const px=lerp(c.rearRoof,c.frontRoof,.56);rail('b-pillar',t=>new T.Vector3(px,lerp(c.belt,c.roof-.042,t),side*lerp(c.baseWidth,c.roofWidth,t)),trim,c.rally?.028:.032);}
  }
  rail('belt-window-seal',t=>new T.Vector3(lerp(c.rearBase,c.frontBase,t),c.belt,side*c.baseWidth),trim,.010);
 }
 const liner=shell.getObjectByName('roof-liner');if(liner)liner.visible=false;
 if(c.kind==='pickup'){
  const len=s.length/2+c.rearBase-.08,centre=(c.rearBase-s.length/2)/2;
  box(shell,trim,[len,.045,s.width*.80],[centre,c.belt-.20,0],.015,'bed-floor');
  for(const side of [-1,1])box(shell,paint,[len,.18,.07],[centre,c.belt-.06,side*s.width*.46],.028,'bed-rail');
 }
 // Cargo vans retain opaque cargo panels, keeping the cab glass distinct.
 if(c.van&&s.id!=='minivan')for(const side of [-1,1])fleetSkin(shell,paint,'cargo-side-panel',(u,v)=>new T.Vector3(lerp(c.rearBase+.07,-.5,u),lerp(c.belt+.02,c.roof-.06,v),side*lerp(c.baseWidth,c.roofWidth,v)),side<0);
}
export function installFleetRoad(shell:T.Group,s:VehicleSpec){
 const source=shell.getObjectByName('arched-body') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
 const paint=new T.MeshPhysicalMaterial({color:source.material.color,metalness:.58,roughness:.25,clearcoat:1,clearcoatRoughness:.09});
 const trim=surface('#13191d',.12,.55),rubber=surface('#111519',.01,.82),metal=surface('#a5afb4',.94,.22);
 const glass=new T.MeshPhysicalMaterial({color:'#617b86',metalness:.12,roughness:.065,clearcoat:1,transparent:true,opacity:.78,depthWrite:false,side:T.DoubleSide});
 for(const o of [...shell.children])if(!['interior','console-switch-bank'].includes(o.name)){shell.remove(o);o.traverse(n=>{if(n instanceof T.Mesh)n.geometry.dispose();});}
 const c=fleetProfile(s),half=s.length/2;
 const body=mesh(shell,roadShell(s),paint,[0,0,0],[0,0,0],'arched-body');body.userData.sourceSurface='fleet-v5';
 canopy(shell,s,paint,glass,trim);
 for(const side of [-1,1]){
  const x0=-s.wheelbase/2+c.arch+.03,x1=s.wheelbase/2-c.arch-.03;
  // Skin and seams follow the identical body evaluator. No hovering rectangular door slabs.
  const seam=(x:number)=>fleetCurve(shell,trim,Array.from({length:25},(_,j)=>flank(s,x,lerp(c.sill+.08,c.belt-.06,j/24),side).add(new T.Vector3(0,0,side*.002))),.003,'door-shut-line');
  seam(x0);seam(x1);if(!c.sports)seam(lerp(x0,x1,.43));
  for(const x of c.sports?[x0+.16]:[x0+.16,lerp(x0,x1,.43)+.13]){const p=flank(s,x,c.belt-.12,side);box(shell,metal,[.13,.018,.018],p.toArray(),.006,'door-handle');}
  fleetCurve(shell,paint,Array.from({length:49},(_,i)=>flank(s,lerp(x0,x1,i/48),c.sill+.07,side)),.026,'sculpted-rocker');
  for(const ax of [-s.wheelbase/2,s.wheelbase/2]){
   const point=(u:number,v:number)=>{const a=u*Math.PI,x=ax+Math.cos(a)*c.arch,y=s.radius+Math.sin(a)*c.arch;return new T.Vector3(x,y,flank(s,x,y,side).z-side*v*.15);};
   fleetSkin(shell,rubber,'wheel-well-return',point,side<0,64,5);
   fleetCurve(shell,c.rally||c.utility?trim:paint,Array.from({length:65},(_,i)=>point(i/64,0)),c.rally?.028:.014,'formed-wheel-arch');
  }
  const p=new T.Vector3(c.frontBase-.15,c.belt+.12,side*s.width*.515);
  fleetCurve(shell,trim,[new T.Vector3(p.x+.04,p.y-.10,side*c.baseWidth),p],.014,'mirror-stalk');
  mesh(shell,new T.SphereGeometry(1,28,16).scale(.135,.058,.080),paint,p.toArray(),[0,0,0],'mirror');
  mesh(shell,new T.SphereGeometry(1,24,12).scale(.008,.043,.063),metal,[p.x-.12,p.y,p.z],[0,0,0],'mirror-glass');
 }
 const white=new T.MeshStandardMaterial({color:'#dce9f0',emissive:'#c7e2ff',emissiveIntensity:.65}),red=new T.MeshStandardMaterial({color:'#90121e',emissive:'#f12432',emissiveIntensity:.45});
 for(const front of [true,false]){
  const sign=front?1:-1,x=sign*half,y=c.belt-(front?.24:.15),lampWidth=s.width*(c.kind==='classic'?.13:.20),lampH=c.kind==='classic'?.12:c.utility?.075:.045;
  for(const side of [-1,1]){
   const z=side*s.width*.29;
   const old=body.geometry;body.geometry=cutOpening(old,[x-.13,y-lampH,z-lampWidth*.55],[x+.13,y+lampH,z+lampWidth*.55]);old.dispose();
   box(shell,trim,[.11,lampH*1.8,lampWidth*1.08],[x-sign*.045,y,z],.018,front?'headlamp-housing':'tail-lamp-housing');
   fleetCurve(shell,front?white:red,[-.44,0,.44].map(t=>new T.Vector3(x+sign*.012,y+Math.abs(t)*.018,z+t*lampWidth)),front?.012:.009,front?'led-signature':'rear-light-guide');
   box(shell,glass,[.018,lampH*1.7,lampWidth],[x+sign*.019,y,z],.009,'lamp-cover');
  }
  const y0=c.sill+.12,w=s.width*(front?.33:.38),h=Math.min(.22,c.belt-c.sill-.23);
  const old=body.geometry;body.geometry=cutOpening(old,[x-.16,y0,-w],[x+.16,y0+h,w]);old.dispose();
  box(shell,trim,[.10,h,w*2],[x-sign*.09,y0+h/2,0],.025,front?'radiator-recess':'rear-valance');
  for(let i=-6;i<=6;i++)box(shell,trim,[.045,h*.85,.008],[x-sign*.025,y0+h/2,i*w/7],.002,'grille-fin');
  fleetCurve(shell,trim,Array.from({length:33},(_,i)=>new T.Vector3(x-sign*.025*(2*i/32-1)**2,c.sill+.04,lerp(-s.width*.43,s.width*.43,i/32))),.025,front?'front-lip':'rear-lip');
 }
 // Twin thin-wall outlets with usable canonical effect mounts; EVs have no fake exhaust.
 if(s.bodyStyle!=='ev')for(const side of c.rally?[-1]:[-1,1]){
  const mount=new T.Group();mount.name=`exhaust-outlet-${side>0?'left':'right'}`;mount.position.set(-half-.045,c.sill+.13,side*s.width*.30);mount.rotation.y=-Math.PI/2;mount.userData={role:'exhaust-outlet',outerDiameter:.09,localFlowAxis:[0,0,1]};shell.add(mount);
  mesh(mount,new T.CylinderGeometry(.045,.045,.16,40,1,true),metal,[0,0,-.08],[Math.PI/2,0,0],'exhaust-wall');mesh(mount,new T.RingGeometry(.041,.045,40),metal,[0,0,0],[0,0,0],'exhaust-lip');
 }
 if(s.bodyStyle==='track'){
  for(const side of [-1,1])box(shell,trim,[.08,.18,.06],[-half+.18,c.roof-.02,side*s.width*.30],.014,'spoiler-mount');
  box(shell,paint,[.22,.045,s.width*.83],[-half+.13,c.roof+.09,0],.018,'rear-spoiler');
 }
 // Round the front/rear plan-view corners together with lamps and trim. Preserve
 // interpolated normals through the field's inverse-transpose, including clipped faces.
 const h=s.length/2,amount=c.van?.075:c.utility?.10:.18;
 shell.updateMatrixWorld(true);
 for(const object of shell.children){
  if(object.name==='interior'||object.name==='console-switch-bank'||object.name.startsWith('exhaust-outlet'))continue;
  object.traverse(o=>{if(!(o instanceof T.Mesh))return;o.updateMatrix();const mat=o.matrix.clone(),inverse=mat.clone().invert(),old=o.geometry;o.geometry=old.clone();old.dispose();
   const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,nmat=new T.Matrix3().getNormalMatrix(mat),back=new T.Matrix3().getNormalMatrix(inverse);
   for(let i=0;i<p.count;i++){
    const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mat),sign=Math.sign(q.x),a=T.MathUtils.clamp((Math.abs(q.x)-h*.79)/(h*.21),0,1),blend=a*a*(3-2*a),z=q.z/(s.width/2),dx=1-amount*z*z*6*a*(1-a)/(h*.21),dz=-sign*amount*2*z/(s.width/2)*blend;
    q.x-=sign*amount*z*z*blend;q.applyMatrix4(inverse);p.setXYZ(i,q.x,q.y,q.z);
    if(n){const normal=new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(nmat).normalize();normal.set(normal.x/dx,normal.y,normal.z-dz*normal.x/dx).normalize().applyMatrix3(back).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);}
   }
   o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
  });
 }
 shell.userData.bodyArchitecture='fleet-v5';
}
