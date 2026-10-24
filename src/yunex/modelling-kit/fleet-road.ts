/** Source-owned V5 road families: connected body sections, wheel apertures and fitted crowned glazing. */
import * as T from 'three';
import type {VehicleOptions,VehicleSpec} from '../world-kit/catalog.ts';
import {box,mesh,surface} from '../world-kit/geometry.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {installRefinedFascia} from './fleet-fascia.ts';
import {fleetProfile} from './fleet-profiles.ts';
import {fleetCurve,fleetSkin,fleetPillar,fleetPatch,lerp} from './fleet-surfaces.ts';
import {bodySection,bodyDeck,bodyFlank,roundedBodyGeometry} from './fleet-body.ts';
export {fleetEndSurface,fleetEndFrame} from './fleet-body.ts';
export const fleetSection=bodySection;
export const fleetDeck=bodyDeck;
export const fleetFlank=bodyFlank;
function roadShell(s:VehicleSpec){
 const c=fleetProfile(s);let g=roundedBodyGeometry(s);
 const old=g;g=cutOpening(g,[c.rearBase+.045,c.sill+.08,-c.baseWidth*.94],[c.frontBase-.035,c.roof+.1,c.baseWidth*.94]);old.dispose();
 if(c.kind==='pickup'){const old=g;g=cutOpening(g,[-s.length/2+.11,c.belt-.18,-s.width*.40],[c.rearBase-.06,c.roof+.1,s.width*.40]);old.dispose();}
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
 const body=mesh(shell,roadShell(s),paint,[0,0,0],[0,0,0],'arched-body');body.userData.sourceSurface='continuous-section-v6';
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
 installRefinedFascia(shell,body,s,{paint,trim,metal,white,red});
 // Twin thin-wall outlets with usable canonical effect mounts; EVs have no fake exhaust.
 if(s.bodyStyle!=='ev')for(const side of c.rally?[-1]:[-1,1]){
  const mount=new T.Group();mount.name=`exhaust-outlet-${side>0?'left':'right'}`;mount.position.set(-half-.045,c.sill+.13,side*s.width*.30);mount.rotation.y=-Math.PI/2;mount.userData={role:'exhaust-outlet',outerDiameter:.09,localFlowAxis:[0,0,1]};shell.add(mount);
  mesh(mount,new T.CylinderGeometry(.045,.045,.16,40,1,true),metal,[0,0,-.08],[Math.PI/2,0,0],'exhaust-wall');mesh(mount,new T.RingGeometry(.041,.045,40),metal,[0,0,0],[0,0,0],'exhaust-lip');
 }
 if(s.bodyStyle==='track'){
  for(const side of [-1,1])box(shell,trim,[.08,.18,.06],[-half+.18,c.roof-.02,side*s.width*.30],.014,'spoiler-mount');
  box(shell,paint,[.22,.045,s.width*.83],[-half+.13,c.roof+.09,0],.018,'rear-spoiler');
 }
 shell.userData.bodyArchitecture='continuous-section-v6';
}
