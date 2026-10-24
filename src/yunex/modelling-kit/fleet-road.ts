/** Source-owned V5 road families: connected body sections, wheel apertures and fitted crowned glazing. */
import * as T from 'three';
import type {VehicleOptions,VehicleSpec} from '../world-kit/catalog.ts';
import {box,mesh,surface} from '../world-kit/geometry.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {angleWeightedNormals} from './studio-normals.ts';
import {installRefinedFascia} from './fleet-fascia.ts';
import {fleetProfile} from './fleet-profiles.ts';
import {fleetCurve,fleetSkin,fleetPillar,fleetPatch,lerp,station} from './fleet-surfaces.ts';
/** Longitudinal section: one monotonic bonnet and one boot volume with broad fender lobes. */
export function fleetSection(s:VehicleSpec,x:number){
 const c=fleetProfile(s),u=x/(s.length/2),f=c.form;
 const front=T.MathUtils.smoothstep(x,c.frontBase,s.length/2),rear=1-T.MathUtils.smoothstep(x,-s.length/2,c.rearBase);
 const frontAxle=Math.exp(-(((x-s.wheelbase/2)/(.24*s.length))**4));
 const rearAxle=Math.exp(-(((x+s.wheelbase/2)/(.22*s.length))**4));
 const axle=Math.max(frontAxle,rearAxle);
 const deck=c.belt-f.nose*front-f.tail*rear-f.hood*front*(1-front);
 const width=s.width*.5*station(u,[[-1,f.endWidth],[-.77,.985],[-s.wheelbase/s.length,1],[0,1-c.waist],[s.wheelbase/s.length,.998],[.82,.97],[1,f.endWidth]]);
 return {deck,width,axle,frontAxle,rearAxle};
}
export function fleetDeck(s:VehicleSpec,x:number,v:number){
 const c=fleetProfile(s),a=fleetSection(s,x),z=Math.abs(v);
 // The centre bonnet stays low. Full shoulders rise continuously into the fender peaks,
 // then roll back down at the edge, producing a round section rather than a flat slab.
 const shoulder=station(z,[[0,0],[.42,.04],[.68,.72],[.80,1],[.94,.57],[1,.22]]);
 const rise=c.form.shoulder*a.frontAxle+c.form.haunch*a.rearAxle*(1-a.frontAxle*.35);
 return new T.Vector3(x,a.deck+c.crown*(1-v*v)+rise*shoulder,a.width*v);
}
export function fleetFlank(s:VehicleSpec,x:number,y:number,side:number){
 const c=fleetProfile(s),q=fleetDeck(s,x,side),t=T.MathUtils.clamp((q.y-y)/(q.y-c.sill),0,1),a=fleetSection(s,x);
 // Rolled upper shoulder / concave door / returned rocker, all in the continuous shell.
 // At the wheel housings the fuller section wraps around the actual aperture.
 const inset=c.form.inset*(1-.44*a.axle);
 const section=station(t,[[0,1],[.16,1.018],[.36,1-inset*.40],[.58,1-inset],[.79,1-inset*.74],[1,1-c.form.rocker]]);
 return new T.Vector3(x,y,side*a.width*section);
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
  for(let j=1;j<=16;j++)add(fleetFlank(s,x,lerp(fleetDeck(s,x,1).y,low,j/16),1));
  for(let j=1;j<=8;j++)add(new T.Vector3(x,low,lerp(fleetFlank(s,x,low,1).z,fleetFlank(s,x,low,-1).z,j/8)));
  for(let j=15;j>0;j--)add(fleetFlank(s,x,lerp(fleetDeck(s,x,-1).y,low,j/16),-1));rows.push(row);
 }
 const n=rows[0].length;
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){const a=rows[i][j],b=rows[i][(j+1)%n],d=rows[i+1][j],e=rows[i+1][(j+1)%n];idx.push(a,b,d,b,e,d);}
 for(const end of [0,rows.length-1]){const row=rows[end],q=new T.Vector3();for(const i of row)q.add(new T.Vector3(p[i*3],p[i*3+1],p[i*3+2]));q.divideScalar(n);const centre=p.length/3;p.push(...q.toArray());for(let j=0;j<n;j++)idx.push(...(end===0?[centre,row[(j+1)%n],row[j]]:[centre,row[j],row[(j+1)%n]]));}
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);angleWeightedNormals(g);
 // Remove the actual cabin cavity instead of hiding a solid slab behind glass.
 const old=g;g=cutOpening(g,[c.rearBase+.045,c.sill+.08,-c.baseWidth*.94],[c.frontBase-.035,c.roof+.1,c.baseWidth*.94]);old.dispose();
 if(c.kind==='pickup')g=cutOpening(g,[-half+.11,c.belt-.18,-s.width*.40],[c.rearBase-.06,c.roof+.1,s.width*.40]);
 return g;
}
export function fleetRoof(s:VehicleSpec,x:number,z:number){
 const c=fleetProfile(s),t=T.MathUtils.clamp((x-c.rearRoof)/(c.frontRoof-c.rearRoof),0,1),arch=4*t*(1-t),roll=z*z;
 return new T.Vector3(x+(1-2*t)*(c.van?.035:.10)*roll,
  c.roof-c.form.roofArc*(1-arch)-c.form.roofRoll*roll,
  c.roofWidth*z*(1-c.form.roofTaper*(1-arch)));
}
/** Aperture boundary lies on the authored deck, including its raised shoulder. */
export function fleetBelt(s:VehicleSpec,x:number,z:number){
 const c=fleetProfile(s),width=fleetSection(s,x).width;
 return fleetDeck(s,x,c.baseWidth*z/width);
}
function canopy(shell:T.Group,s:VehicleSpec,paint:T.Material,glass:T.Material,trim:T.Material){
 const c=fleetProfile(s),roof=(x:number,z:number)=>fleetRoof(s,x,z);
 const screen=(rear:boolean,t:number,z:number)=>{const base=rear?c.rearBase:c.frontBase,top=rear?c.rearRoof:c.frontRoof,p=fleetBelt(s,base,z).lerp(roof(top,z),t);p.x+=(rear?-.045:.065)*Math.sin(Math.PI*t)*(1-z*z);return p;};
 const rail=(name:string,fn:(t:number)=>T.Vector3,mat:T.Material,r:number)=>{const points=Array.from({length:33},(_,i)=>fn(i/32));return name==='a-pillar'||name==='c-pillar'||name==='roof-side-rail'?fleetPillar(shell,mat,points,r*2,.026,name):fleetCurve(shell,mat,points,r,name);};
 if(!c.open&&!c.targa)fleetSkin(shell,paint,'roof',(u,v)=>roof(lerp(c.rearRoof,c.frontRoof,u),-1+2*v),true);
 if(c.targa)fleetSkin(shell,paint,'targa-bar',(u,v)=>roof(lerp(c.rearRoof,c.rearRoof+.15,u),-1+2*v),true);
 for(const rear of [false,true]){
  if(rear&&c.open)continue;
  fleetSkin(shell,glass,rear?'rear-glass':'windshield',(u,v)=>screen(rear,u,-1+2*v),rear,28,32);
  for(const side of [-1,1])rail(rear?'c-pillar':'a-pillar',t=>screen(rear,t,side),paint,c.utility||c.van?.035:.027);
  for(const t of [0,1])rail(rear?'rear-window-seal':'windshield-seal',z=>screen(rear,t,-1+2*z),trim,.008);
 }
 for(const side of [-1,1]){
  const edge=(t:number)=>t<.22?screen(true,t/.22,side):t>.78?screen(false,1-(t-.78)/.22,side):roof(lerp(c.rearRoof,c.frontRoof,(t-.22)/.56),side);
  if(!c.open){
   fleetSkin(shell,glass,'side-glass',(u,v)=>{const t=.025+u*.95,q=edge(t);return new T.Vector3(q.x,lerp(fleetBelt(s,q.x,side).y+.008,q.y,v),lerp(side*c.baseWidth,q.z,v)-side*.015*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));},side<0,64,20);
   rail('roof-side-rail',edge,paint,.020);
   {const px=lerp(c.rearRoof,c.frontRoof,.56);rail('b-pillar',t=>fleetBelt(s,px,side).lerp(roof(px,side),t),trim,c.sports?.018:c.rally?.028:.032);}
   // Painted rear sail follows the same curved greenhouse evaluator.
   fleetSkin(shell,paint,'quarter-sail',(u,v)=>{const t=u*(c.sports?.18:.12),q=edge(t);return new T.Vector3(q.x,lerp(fleetBelt(s,q.x,side).y+.002,q.y,v),lerp(side*c.baseWidth,q.z,v)+side*.004);},side<0,16,12);
  }
  rail('belt-window-seal',t=>{const x=lerp(c.rearBase,c.frontBase,t);return fleetBelt(s,x,side);},trim,.010);
 }
 const liner=shell.getObjectByName('roof-liner') as T.Mesh|undefined;
 if(liner){
  if(c.open||c.targa){liner.visible=false;liner.userData.fleetHidden=true;}
  else{liner.geometry.dispose();liner.geometry=fleetPatch(32,24,(u,v)=>roof(lerp(c.rearRoof,c.frontRoof,u),-1+2*v).add(new T.Vector3(0,-.035,0)));liner.position.set(0,0,0);liner.rotation.set(0,0,0);}
 }
 if(c.kind==='pickup'){
  const len=s.length/2+c.rearBase-.08,centre=(c.rearBase-s.length/2)/2;
  box(shell,trim,[len,.045,s.width*.80],[centre,c.belt-.20,0],.015,'bed-floor');
  for(const side of [-1,1])box(shell,paint,[len,.18,.07],[centre,c.belt-.06,side*s.width*.46],.028,'bed-rail');
  for(const side of [-1,1]){
   box(shell,trim,[len,.18,.025],[centre,c.belt-.09,side*s.width*.40],.008,'bed-inner-wall');
   fleetSkin(shell,trim,'bed-wheel-tub',(u,v)=>{const a=u*Math.PI,x=-s.wheelbase/2+Math.cos(a)*(c.arch+.025);return new T.Vector3(x,Math.max(c.belt-.18,s.radius+Math.sin(a)*(c.arch+.025)),side*lerp(s.width*.30,s.width*.40,v));},side<0,48,8);
  }
  for(const x of [-s.length/2+.12,c.rearBase-.075])box(shell,trim,[.025,.18,s.width*.80],[x,c.belt-.09,0],.008,'bed-end-liner');
 }
 // Cargo vans retain opaque cargo panels, keeping the cab glass distinct.
 if(c.van&&s.id!=='minivan')for(const side of [-1,1])fleetSkin(shell,paint,'cargo-side-panel',(u,v)=>new T.Vector3(lerp(c.rearBase+.07,-.5,u),lerp(c.belt+.02,c.roof-.06,v),side*lerp(c.baseWidth,c.roofWidth,v)),side<0);
}
export function installFleetRoad(shell:T.Group,s:VehicleSpec,options:Partial<VehicleOptions>={}){
 const source=shell.getObjectByName('arched-body') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
 const paint=new T.MeshPhysicalMaterial({color:source.material.color,metalness:.58,roughness:.25,clearcoat:1,clearcoatRoughness:.09});
 const trim=surface('#13191d',.12,.55),rubber=surface('#111519',.01,.82),metal=surface('#a5afb4',.94,.22);
 const glass=new T.MeshPhysicalMaterial({color:'#617b86',metalness:.12,roughness:.065,clearcoat:1,transparent:true,opacity:options.glassOpacity??.78,depthWrite:false,side:T.FrontSide});
 for(const o of [...shell.children])if(!['interior','console-switch-bank'].includes(o.name)){shell.remove(o);o.traverse(n=>{if(n instanceof T.Mesh)n.geometry.dispose();});}
 const c=fleetProfile(s),half=s.length/2;
 const body=mesh(shell,roadShell(s),paint,[0,0,0],[0,0,0],'arched-body');body.userData.sourceSurface='fleet-v5';
 canopy(shell,s,paint,glass,trim);
 if(!c.van){
  const start=Math.max(c.frontBase+.08,-half+.2),end=half-.24;
  for(const side of [-1,1])fleetCurve(shell,trim,Array.from({length:49},(_,i)=>{const t=i/48;return fleetDeck(s,start+(end-start)*t,side*(.52-.12*t)).add(new T.Vector3(0,.003,0));}),.0025,'bonnet-shut-line');
  fleetCurve(shell,trim,Array.from({length:33},(_,i)=>fleetDeck(s,end,(-.40+.8*i/32)).add(new T.Vector3(0,.003,0))),.0025,'bonnet-leading-seam');
 }
 for(const side of [-1,1]){
  const x0=-s.wheelbase/2+c.arch+.03,x1=s.wheelbase/2-c.arch-.03;
  // Skin and seams follow the identical body evaluator. No hovering rectangular door slabs.
  const seam=(x:number)=>fleetCurve(shell,trim,Array.from({length:25},(_,j)=>fleetFlank(s,x,lerp(c.sill+.08,c.belt-.06,j/24),side).add(new T.Vector3(0,0,side*.002))),.003,'door-shut-line');
  seam(x0);seam(x1);if(!c.sports)seam(lerp(x0,x1,.43));
  for(const x of c.sports?[x0+.16]:[x0+.16,lerp(x0,x1,.43)+.13]){const p=fleetFlank(s,x,c.belt-.12,side);box(shell,metal,[.13,.018,.018],p.toArray(),.006,'door-handle');}
  fleetCurve(shell,paint,Array.from({length:49},(_,i)=>fleetFlank(s,lerp(x0,x1,i/48),c.sill+.07,side)),.026,'sculpted-rocker');
  for(const ax of [-s.wheelbase/2,s.wheelbase/2]){
   const point=(u:number,v:number)=>{const a=u*Math.PI,x=ax+Math.cos(a)*c.arch,y=s.radius+Math.sin(a)*c.arch;return new T.Vector3(x,y,fleetFlank(s,x,y,side).z-side*v*.15);};
   fleetSkin(shell,rubber,'wheel-well-return',point,side<0,64,5);
   fleetCurve(shell,c.rally||c.utility?trim:paint,Array.from({length:65},(_,i)=>point(i/64,0)),c.rally?.028:.014,'formed-wheel-arch');
  }
  const p=new T.Vector3(c.frontBase-.15,c.belt+.12,side*s.width*.515);
  fleetCurve(shell,trim,[new T.Vector3(p.x+.04,p.y-.10,side*c.baseWidth),p],.014,'mirror-stalk');
  mesh(shell,new T.SphereGeometry(1,28,16).scale(.135,.058,.080),paint,p.toArray(),[0,0,0],'mirror');
  mesh(shell,new T.SphereGeometry(1,24,12).scale(.008,.043,.063),metal,[p.x-.12,p.y,p.z],[0,0,0],'mirror-glass');
 }
 const white=new T.MeshStandardMaterial({color:'#dce9f0',emissive:'#c7e2ff',emissiveIntensity:options.lights===false?0:.65}),red=new T.MeshStandardMaterial({color:'#90121e',emissive:'#f12432',emissiveIntensity:options.lights===false?0:.45});
 if(c.kind!=='classic')installRefinedFascia(shell,body,s,{paint,trim,metal,white,red});
 else for(const front of [true,false]){
  const sign=front?1:-1,x=sign*half,y=c.belt-(front?.24:.15),lampWidth=s.width*(c.kind==='classic'?.13:.20),lampH=c.kind==='classic'?.12:c.utility?.075:.045;
  for(const side of [-1,1]){
   const z=side*s.width*.29;
   const old=body.geometry;body.geometry=cutOpening(old,[x-.13,y-lampH,z-lampWidth*.55],[x+.13,y+lampH,z+lampWidth*.55]);old.dispose();
   box(shell,trim,[.11,lampH*1.8,lampWidth*1.08],[x-sign*.045,y,z],.018,front?'headlamp-housing':'tail-lamp-housing');
   if(c.kind==='classic'&&front){
    fleetSkin(shell,metal,'classic-headlamp-reflector',(u,v)=>{const a=u*Math.PI*2,r=v*.102;return new T.Vector3(x+sign*(.006-.035*(1-v*v)),y+Math.cos(a)*r,z+Math.sin(a)*r);},true,48,16);
    mesh(shell,new T.TorusGeometry(.108,.009,10,48),metal,[x+.018,y,z],[0,Math.PI/2,0],'classic-headlamp-bezel');
    mesh(shell,new T.SphereGeometry(1,32,20).scale(.018,.103,.103),glass,[x+.024,y,z],[0,0,0],'classic-headlamp-lens');
    mesh(shell,new T.SphereGeometry(.022,16,12),white,[x-.017,y,z],[0,0,0],'classic-headlamp-bulb');
   }else{
    fleetCurve(shell,front?white:red,[-.44,0,.44].map(t=>new T.Vector3(x+sign*.012,y+Math.abs(t)*.018,z+t*lampWidth)),front?.012:.009,front?'led-signature':'rear-light-guide');
    box(shell,glass,[.018,lampH*1.7,lampWidth],[x+sign*.019,y,z],.009,'lamp-cover');
   }
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
