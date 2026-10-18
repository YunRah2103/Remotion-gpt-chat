import * as T from 'three';
import {cutOpening} from './cavity.ts';
import {interiorLayout} from './interiors.ts';
import {box,mesh,panel,rod} from './geometry.ts';
import type {V3} from './geometry.ts';
import type {VehicleSpec} from './catalog.ts';
import type {VehicleMaterials} from './vehicle-wheels.ts';

export function bodyTop(s:VehicleSpec,x:number){
 const belt=interiorLayout(s).belt,u=(x+s.length/2)/s.length;
 return belt+.030-.040*u-(s.bodyStyle==='retro'?.015:.075)*T.MathUtils.smoothstep(u,.88,1)-.015*(1-T.MathUtils.smoothstep(u,0,.045));
}
/** Shared surface evaluator keeps seams and trim attached to the sculpted body. */
export function bodyHalfWidth(s:VehicleSpec,x:number,y:number){
 const u=(x+s.length/2)/s.length,t=T.MathUtils.clamp((y-s.radius*.70)/(bodyTop(s,x)-s.radius*.70),0,1);
 const fender=Math.max(Math.exp(-Math.pow((x-s.wheelbase/2)/.38,2)),Math.exp(-Math.pow((x+s.wheelbase/2)/.38,2)));
 const end=.055*(1-T.MathUtils.smoothstep(u,0,.09))+.055*T.MathUtils.smoothstep(u,.91,1);
 return s.width/2*(.98+.020*fender-end)*(.89+.115*Math.sin(t*Math.PI*.79));
}
export function archedBody(g:T.Group,m:VehicleMaterials,s:VehicleSpec,_top:number){
 const half=s.length/2,arch=s.radius*1.10,xs:number[]=[];
 for(let i=0;i<=70;i++)xs.push(T.MathUtils.lerp(-half,half,i/70));
 for(const cx of [-s.wheelbase/2,s.wheelbase/2])for(let i=0;i<=28;i++)xs.push(cx+arch*Math.cos(i*Math.PI/28));
 xs.sort((a,b)=>a-b);const xValues=xs.filter((x,i)=>x>=-half&&x<=half&&(i===0||x-xs[i-1]>.0001));
 const positions:number[]=[],indices:number[]=[],rings:V3[][]=[];
 for(const x of xValues){
  const top=bodyTop(s,x);let low=s.radius*.70;
  for(const cx of [-s.wheelbase/2,s.wheelbase/2])if(Math.abs(x-cx)<=arch)low=Math.max(low,s.radius+Math.sqrt(Math.max(0,arch*arch-(x-cx)**2)));
  const ring:V3[]=[],width=bodyHalfWidth(s,x,top);
  for(let j=0;j<=20;j++){const u=j/20;ring.push([x,top+.040*Math.sin(Math.PI*u),T.MathUtils.lerp(-width,width,u)]);}
  for(let j=1;j<=10;j++){const y=T.MathUtils.lerp(top,low,j/10);ring.push([x,y,bodyHalfWidth(s,x,y)]);}
  const bottomWidth=bodyHalfWidth(s,x,low);
  for(let j=1;j<=4;j++)ring.push([x,low,T.MathUtils.lerp(bottomWidth,-bottomWidth,j/4)]);
  for(let j=1;j<10;j++){const y=T.MathUtils.lerp(low,top,j/10);ring.push([x,y,-bodyHalfWidth(s,x,y)]);}
  rings.push(ring);positions.push(...ring.flat());
 }
 const n=rings[0].length;
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;indices.push(a,b,a+n,b,b+n,a+n);}
 for(const end of [0,rings.length-1]){
  const ring=rings[end],centre=ring.reduce((v,p)=>v.add(new T.Vector3(...p)),new T.Vector3()).multiplyScalar(1/n),ci=positions.length/3;positions.push(...centre.toArray());
  for(let j=0;j<n;j++){const a=end*n+j,b=end*n+(j+1)%n;indices.push(ci,...(end===0?[b,a]:[a,b]));}
 }
 let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
 const l=interiorLayout(s);geo=cutOpening(geo,[l.rearBase+.03,l.floor+.02,-l.innerWidth/2],[l.frontBase-.03,l.roof+.1,l.innerWidth/2]);
 if(l.pickup)geo=cutOpening(geo,[-half+.12,1.08,-s.width*.40],[l.rearBase-.06,1.5,s.width*.40]);
 // Real apertures place the light assemblies inside the end panels.
 for(const sign of [-1,1]){
  const z=sign*s.width*.31;
  const lampY=l.belt-(s.family==='sports'?.135:.15);
  if(s.bodyStyle!=='retro')geo=cutOpening(geo,[half-.15,lampY-(s.family==='sports'?.0425:.055),z-s.width*.10-.009],[half+.10,lampY+(s.family==='sports'?.0425:.055),z+s.width*.10+.009]);
  geo=cutOpening(geo,[-half-.10,l.belt-.1625,z-s.width*.10-.009],[-half+.15,l.belt-.0575,z+s.width*.10+.009]);
 }
 geo=cutOpening(geo,[half-.13,l.belt-.42,-s.width*.255],[half+.10,l.belt-.26,s.width*.255]);
 mesh(g,geo,m.body,[0,0,0],[0,0,0],'arched-body');
 box(g,m.trim,[s.wheelbase*.72,.095,s.width*.82],[0,s.radius*.7+.015,0],.025,'underbody');
}

function roundedLoop(points:V3[],radius=.08,steps=4,round=true):V3[]{
 const out:V3[]=[];
 for(let i=0;i<points.length;i++){
  const p=new T.Vector3(...points[i]),before=new T.Vector3(...points[(i+points.length-1)%points.length]),after=new T.Vector3(...points[(i+1)%points.length]);
  const a=p.clone().lerp(before,Math.min(.22,radius/p.distanceTo(before))),b=p.clone().lerp(after,Math.min(.22,radius/p.distanceTo(after)));
  for(let j=0;j<=steps;j++){const t=j/steps;const v=round?a.clone().multiplyScalar((1-t)**2).add(p.clone().multiplyScalar(2*t*(1-t))).add(b.clone().multiplyScalar(t*t)):t<=.5?a.clone().lerp(p,t*2):p.clone().lerp(b,(t-.5)*2);out.push(v.toArray() as V3);}
 }
 return out;
}
function aperture(g:T.Group,m:T.Material,outer:V3[],inner:V3[],name:string){
 const o=roundedLoop(outer,.08,4,false),inside=roundedLoop(inner),p=[...o.flat(),...inside.flat()],idx:number[]=[],n=o.length;
 for(let j=0;j<n;j++){const k=(j+1)%n;idx.push(j,k,j+n,k,k+n,j+n);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();const mat=m.clone();mat.side=T.DoubleSide;return mesh(g,geo,mat,[0,0,0],[0,0,0],name);
}
function outwardSide(points:V3[]):V3[]{
 const a=new T.Vector3(...points[0]),b=new T.Vector3(...points[1]),c=new T.Vector3(...points[2]),nz=b.sub(a).cross(c.sub(a)).z,z=points.reduce((n,p)=>n+p[2],0);
 return z*nz<0?[...points].reverse():points;
}
export function cabin(g:T.Group,m:VehicleMaterials,s:VehicleSpec,belt:number){
 const l=interiorLayout(s),{frontBase:fb,frontRoof:fr,rearBase:rb,rearRoof:rr}=l,roof=s.height-.035,baseZ=s.width*.465,roofZ=s.width*(s.family==='suv'?.395:.375),open=s.roof==='open';
 const sidePoint=(x:number,y:number,sign:number):V3=>[x,y,sign*T.MathUtils.lerp(baseZ,roofZ,(y-belt)/(roof-belt))];
 for(const sign of [-1,1]){
  const outer=[sidePoint(fb,belt,sign),sidePoint(fr,roof,sign),sidePoint(rr,roof,sign),sidePoint(rb,belt,sign)];
  const inner=[sidePoint(fb-.085,belt+.045,sign),sidePoint(fr-.055,roof-.060,sign),sidePoint(rr+(l.sports?.11:.17),roof-.060,sign),sidePoint(rb+.13,belt+.045,sign)];
  if(!open){
   aperture(g,m.body,outer,inner,'window-frame');
   const inset=inner.map(p=>[p[0],p[1],p[2]-sign*.004] as V3);panel(g,m.glass,roundedLoop(inset),'side-glass');
   const sealOuter=inner.map(p=>[p[0],p[1],p[2]+sign*.001] as V3),cx=(fb+rb)/2,cy=(belt+roof)/2;
   aperture(g,m.trim,sealOuter,inner.map(p=>[T.MathUtils.lerp(p[0],cx,.012),T.MathUtils.lerp(p[1],cy,.022),p[2]] as V3),'window-seal');
   if(!l.sports){const px=-s.length*.075;if(px>rr+.15&&px<fr-.1){const a=sidePoint(px-.036,belt+.035,sign),b=sidePoint(px-.036,roof-.025,sign),c=sidePoint(px+.036,roof-.025,sign),d=sidePoint(px+.036,belt+.035,sign);panel(g,m.trim,outwardSide([a,b,c,d]),'b-pillar');}}
  }else{
   const p=[outer[0],outer[1],inner[1],inner[0]];panel(g,m.body,outwardSide(p),'cabin-pillar');
  }
 }
 const windshieldOuter:V3[]=[[fb,belt,-baseZ],[fb,belt,baseZ],[fr,roof,roofZ],[fr,roof,-roofZ]];
 const interp=(t:number,z:number):V3=>[T.MathUtils.lerp(fb,fr,t),T.MathUtils.lerp(belt,roof,t),T.MathUtils.lerp(baseZ,roofZ,t)*z];
 const windshieldInner=[interp(.055,-.94),interp(.055,.94),interp(.91,.94),interp(.91,-.94)];
 aperture(g,m.trim,windshieldOuter,windshieldInner,'windshield-seal');panel(g,m.glass,roundedLoop(windshieldInner),'windshield');
 if(!open){
  const outer:V3[]=[[rb,belt,baseZ],[rb,belt,-baseZ],[rr,roof,-roofZ],[rr,roof,roofZ]],rear=(t:number,z:number):V3=>[T.MathUtils.lerp(rb,rr,t),T.MathUtils.lerp(belt,roof,t),T.MathUtils.lerp(baseZ,roofZ,t)*z];
  const inner=[rear(.07,.91),rear(.07,-.91),rear(.90,-.91),rear(.90,.91)];aperture(g,m.body,outer,inner,'rear-window-frame');panel(g,m.glass,roundedLoop(inner),'rear-glass');
  if(s.bodyStyle!=='targa'){
   const pos:number[]=[],idx:number[]=[],nx=12,nz=20;
   for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const t=i/nx,u=j/nz;pos.push(T.MathUtils.lerp(rr,fr,t),roof+.055*Math.sin(Math.PI*u)*Math.sin(Math.PI*t),T.MathUtils.lerp(-roofZ,roofZ,u));}
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j;idx.push(a,a+1,a+nz+1,a+1,a+nz+2,a+nz+1);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,m.body,[0,0,0],[0,0,0],'roof');
  }else box(g,m.body,[.15,.055,roofZ*2],[rr+.12,roof,0],.015,'targa-bar');
 }
}
