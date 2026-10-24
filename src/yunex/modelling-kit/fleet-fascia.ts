/** Formed end modules. Every visible face is evaluated on the coachwork's rounded cap. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {mesh} from '../world-kit/geometry.ts';
import {fleetProfile} from './fleet-profiles.ts';
import {fleetCurve,fleetPatch} from './fleet-surfaces.ts';
import {fleetEndFrame,fleetEndSurface} from './fleet-body.ts';
type Materials={paint:T.Material;trim:T.Material;metal:T.Material;white:T.Material;red:T.Material};
type Aperture={y:number;z:number;w:number;h:number;sweep:number;taper:number;round?:boolean};
/** Rounded, swept lens/intake perimeter in the physical YZ mounting plane. */
function contour(a:Aperture,t:number,scale=1){
 const angle=t*Math.PI*2,co=Math.cos(angle),si=Math.sin(angle),z=Math.sign(co)*Math.abs(co)**(a.round?1:.52)*a.w*.5*scale;
 const y=Math.sign(si)*Math.abs(si)**(a.round?1:.68)*a.h*.5*scale+a.sweep*(z/(a.w*.5))**2;
 return new T.Vector2(a.y+y,a.z+z*(1+a.taper*y/Math.max(a.h,.001)));
}
function cut(body:T.Mesh,s:VehicleSpec,front:boolean,a:Aperture){
 // Subtract the actual convex swept aperture, not its rectangular bounding box.
 const x=(front?1:-1)*s.length/2,n=32,boundary=Array.from({length:n},(_,i)=>contour(a,i/n,1.002));
 const minY=Math.min(...boundary.map(p=>p.x)),maxY=Math.max(...boundary.map(p=>p.x)),minZ=Math.min(...boundary.map(p=>p.y)),maxZ=Math.max(...boundary.map(p=>p.y));
 const source=body.geometry,g=source.index?source.toNonIndexed():source,p=g.attributes.position,normal=g.attributes.normal,out:number[]=[],normals:number[]=[];
 type Vertex={p:T.Vector3;n:T.Vector3};
 const planes=[new T.Plane(new T.Vector3(1,0,0),-x+.55),new T.Plane(new T.Vector3(-1,0,0),x+.55)];
 for(let i=0;i<n;i++){
  const u=boundary[i],v=boundary[(i+1)%n],dy=v.x-u.x,dz=v.y-u.y;
  // contour runs counterclockwise in ZY: its inside lies to the left.
  const norm=new T.Vector3(0,dz,-dy).normalize();planes.push(new T.Plane(norm,-norm.y*u.x-norm.z*u.y));
 }
 const emit=(poly:Vertex[])=>{for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]]){out.push(...v.p.toArray());normals.push(...v.n.toArray());}};
 const clip=(poly:Vertex[],plane:T.Plane,inside:boolean)=>{const result:Vertex[]=[];for(let i=0;i<poly.length;i++){
  const u=poly[i],v=poly[(i+1)%poly.length],du=plane.distanceToPoint(u.p),dv=plane.distanceToPoint(v.p),ui=inside?du>=-1e-8:du<=1e-8,vi=inside?dv>=-1e-8:dv<=1e-8;
  if(ui)result.push(u);if(ui!==vi){const t=du/(du-dv);result.push({p:u.p.clone().lerp(v.p,t),n:u.n.clone().lerp(v.n,t).normalize()});}
 }return result;};
 for(let i=0;i<p.count;i+=3){
  let poly:Vertex[]=Array.from({length:3},(_,j)=>({p:new T.Vector3().fromBufferAttribute(p,i+j),n:new T.Vector3().fromBufferAttribute(normal,i+j)}));
  if(poly.every(v=>v.p.y<minY)||poly.every(v=>v.p.y>maxY)||poly.every(v=>v.p.z<minZ)||poly.every(v=>v.p.z>maxZ)||poly.every(v=>v.p.x<x-.55)||poly.every(v=>v.p.x>x+.55)){emit(poly);continue;}
  for(const plane of planes){emit(clip(poly,plane,false));poly=clip(poly,plane,true);if(poly.length<3)break;}
 }
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(out,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));body.geometry=result;if(g!==source)g.dispose();source.dispose();
}
/** Closed radial patch; its front is curved in X and its back provides real volume. */
function disc(parent:T.Group,material:T.Material,s:VehicleSpec,front:boolean,a:Aperture,offset:number,depth:number,name:string){
 const sign=front?1:-1,n=64,rings=8,p:number[]=[],idx:number[]=[],count=1+rings*n;
 const vertex=(y:number,z:number,v:number,layer:number)=>{const q=fleetEndSurface(s,front,y,z);q.x+=sign*(offset+(layer===0?.004*(1-v*v):-depth));p.push(...q.toArray());};
 for(let layer=0;layer<2;layer++){
  vertex(a.y,a.z,0,layer);
  for(let r=1;r<=rings;r++)for(let j=0;j<n;j++){
   const v=r/rings,b=contour(a,j/n);vertex(T.MathUtils.lerp(a.y,b.x,v),T.MathUtils.lerp(a.z,b.y,v),v,layer);
  }
  const base=layer*count,outward=front!==(layer===1),face=(u:number,v:number,w:number)=>idx.push(...(outward?[u,w,v]:[u,v,w]));
  for(let j=0;j<n;j++)face(base,base+1+j,base+1+(j+1)%n);
  for(let r=0;r<rings-1;r++)for(let j=0;j<n;j++){
   const u=base+1+r*n+j,v=base+1+r*n+(j+1)%n,w=u+n,k=v+n;face(u,w,v);face(v,w,k);
  }
 }
 for(let j=0;j<n;j++){
  const u=1+(rings-1)*n+j,v=1+(rings-1)*n+(j+1)%n;
  idx.push(...(front?[u,v,u+count,v,v+count,u+count]:[u,u+count,v,v,u+count,v+count]));
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
 const out=mesh(parent,g,material,[0,0,0],[0,0,0],name);out.userData={surface:'rounded-end-cap',front,capOffset:offset};return out;
}
/** Outer seam, rolled painted lip and deep inner return share one curved annular mesh. */
function surround(parent:T.Group,material:T.Material,s:VehicleSpec,front:boolean,a:Aperture,name:string){
 const sign=front?1:-1,loops=[[1.18,.002],[1.10,.018],[1.00,.006],[.98,-.072]],n=80,p:number[]=[],idx:number[]=[];
 for(const [scale,offset] of loops)for(let j=0;j<=n;j++){
  const b=contour(a,j/n,scale),q=fleetEndSurface(s,front,b.x,b.y);q.x+=sign*offset;p.push(...q.toArray());
 }
 for(let i=0;i<loops.length-1;i++)for(let j=0;j<n;j++){const a0=i*(n+1)+j,b=a0+n+1;idx.push(...(front?[a0,b,a0+1,a0+1,b,b+1]:[a0,a0+1,b,a0+1,b+1,b]));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
 const out=mesh(parent,g,material,[0,0,0],[0,0,0],name);out.userData={surface:'rounded-end-cap',front,aperture:{...a},outerCapOffset:.002};return out;
}
function curve(parent:T.Group,mat:T.Material,s:VehicleSpec,front:boolean,points:T.Vector2[],offset:number,r:number,name:string){
 const sign=front?1:-1;return fleetCurve(parent,mat,points.map(p=>{const q=fleetEndSurface(s,front,p.x,p.y);q.x+=sign*offset;return q;}),r,name);
}
/** Duplicate a formed skin inward and close its perimeter before aperture subtraction. */
function thicken(g:T.BufferGeometry,front:boolean){
 const position=g.attributes.position,count=position.count,p=Array.from(position.array),idx=Array.from(g.index!.array),edges=new Map<string,{a:number;b:number;count:number}>();
 for(let i=0;i<count;i++)p.push(position.getX(i)-(front?1:-1)*.016,position.getY(i),position.getZ(i));
 const faces=idx.length;
 for(let i=0;i<faces;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];idx.push(c+count,b+count,a+count);for(const [u,v] of [[a,b],[b,c],[c,a]]){const key=[Math.min(u,v),Math.max(u,v)].join(',');const edge=edges.get(key);if(edge)edge.count++;else edges.set(key,{a:u,b:v,count:1});}}
 for(const e of edges.values())if(e.count===1)idx.push(e.a,e.a+count,e.b,e.b,e.a+count,e.b+count);
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(p,3));out.setIndex(idx);out.computeVertexNormals();g.dispose();return out;
}
export function installRefinedFascia(parent:T.Group,body:T.Mesh,s:VehicleSpec,m:Materials){
 const c=fleetProfile(s),sport=c.sports,muscle=c.kind==='muscle',classic=c.kind==='classic';
 const lens=new T.MeshPhysicalMaterial({color:'#b2c8d1',roughness:.08,metalness:.05,transparent:true,opacity:.18,depthWrite:false,side:T.FrontSide});
 const projectorGlass=new T.MeshPhysicalMaterial({color:'#8daabe',roughness:.08,metalness:.5,clearcoat:1});
 for(const front of [true,false]){
  const sign=front?1:-1,f=fleetEndFrame(s,front),height=f.deck-f.sill,width=f.width;
  // The formed bumper rolls back into the cap at every edge; no rectangular fascia plate.
  const bumperGeometry=fleetPatch(64,20,(u,v)=>{
   const y=f.sill+height*(.10+v*.50),vertical=(y-f.centreY)/(height*.5),edge=width*Math.max(0,1-Math.abs(vertical)**(2/.79))**(.79/2),z=(u*2-1)*edge*.965;
   const q=fleetEndSurface(s,front,y,z);q.x+=sign*(.002+.032*Math.sin(Math.PI*u)**2*Math.sin(Math.PI*v));return q;
  },front);
  const bumper=mesh(parent,thicken(bumperGeometry,front),m.paint,[0,0,0],[0,0,0],front?'formed-front-bumper':'formed-rear-bumper');
  bumper.userData.surface='rounded-end-cap';
  const apertures:Aperture[]=[];
  const punch=(a:Aperture)=>{cut(body,s,front,a);cut(bumper,s,front,a);apertures.push(a);};
  const lampW=width*(c.utility?.40:c.van?.36:.43),lampH=Math.min(front?(c.utility?.14:.105):.08,height*(front?.20:.16));
  for(const side of [-1,1]){
   const a:Aperture={y:f.sill+height*(front?.74:.73),z:side*width*.57,w:lampW,h:lampH,sweep:front?(sport?.016:.009):.006,taper:front?(sport?-.32:-.12):.08};
   if(classic&&front){a.round=true;a.w=a.h=Math.min(.20,height*.30);a.sweep=0;a.taper=0;}
   punch(a);surround(parent,m.paint,s,front,a,front?'shaped-headlamp-surround':'shaped-tail-surround');
   disc(parent,m.trim,s,front,{...a,w:a.w*.98,h:a.h*.98},-.075,.015,front?'headlamp-housing':'tail-lamp-housing');
   if(front&&classic){
    disc(parent,m.metal,s,front,{...a,w:a.w*.92,h:a.h*.92},-.041,.012,'classic-headlamp-reflector');
    curve(parent,m.metal,s,front,Array.from({length:65},(_,i)=>contour(a,i/64,.98)),.002,.008,'classic-headlamp-bezel');
    const q=fleetEndSurface(s,front,a.y,a.z);
    mesh(parent,new T.SphereGeometry(.022,16,12),m.white,[q.x-.023,a.y,a.z],[0,0,0],'classic-headlamp-bulb');
   }else if(front){
    for(const offset of [-.22,.22]){
     const zz=a.z+offset*a.w,yy=a.y+a.sweep*(offset*2)**2,r=Math.min(lampH*.34,muscle?.039:c.utility?.036:.028),q=fleetEndSurface(s,front,yy,zz);
     const dx=(fleetEndSurface(s,front,yy,zz+.001).x-fleetEndSurface(s,front,yy,zz-.001).x)/.002,rotation:[number,number,number]=[0,-Math.atan(dx),0];
     mesh(parent,new T.SphereGeometry(1,24,16).scale(.025,r,r),m.metal,[q.x-sign*.042,yy,zz],rotation,'headlamp-reflector');
     mesh(parent,new T.TorusGeometry(r,.003,8,32),m.metal,[q.x-sign*.019,yy,zz],[0,Math.PI/2-Math.atan(dx),0],'headlamp-bezel');
     mesh(parent,new T.SphereGeometry(1,24,16).scale(.018,r*.76,r*.76),projectorGlass,[q.x-sign*.014,yy,zz],rotation,'headlamp-projector');
    }
    curve(parent,m.white,s,front,Array.from({length:25},(_,i)=>{const t=-.41+.82*i/24;return new T.Vector2(a.y+a.h*.24+a.sweep*(t*2)**2,a.z+t*a.w);}),-.007,.0045,'led-signature');
   }else{
    for(const level of [-1,1])curve(parent,m.red,s,front,Array.from({length:25},(_,i)=>{const t=-.42+.84*i/24;return new T.Vector2(a.y+level*a.h*.19+a.sweep*(t*2)**2,a.z+t*a.w);}),-.008,.005,'rear-light-guide');
   }
   disc(parent,lens,s,front,{...a,w:a.w*.97,h:a.h*.96},.007,.006,classic&&front?'classic-headlamp-lens':'lamp-cover');
  }
  const intake:Aperture={y:f.sill+height*.35,z:0,w:width*(front?(c.utility?.90:c.rally?.92:muscle?.92:.90):1.30),h:Math.min(front?(c.utility?.25:c.rally?.20:.15):.13,height*.30),sweep:front?(sport?.012:.005):-.006,taper:c.rally?.10:sport?-.24:-.08};
  punch(intake);surround(parent,m.paint,s,front,intake,front?'sculpted-intake-surround':'sculpted-rear-valance');
  const recess=disc(parent,m.trim,s,front,{...intake,w:intake.w*.98,h:intake.h*.98},-.105,.018,front?'radiator-recess':'rear-valance');recess.userData.fasciaFamily=c.kind;
  if(front){
   // Individually swept open cells stand ahead of a genuinely recessed radiator.
   const r=.024,spacing=r*1.85,cols=Math.floor(intake.w*.82/spacing),rows=Math.max(1,Math.floor(intake.h*.60/(r*1.5)));
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const z=(col-(cols-1)/2)*spacing+(row%2?r*.44:0),y=intake.y+(row-(rows-1)/2)*r*1.5;
    curve(parent,m.trim,s,front,Array.from({length:7},(_,i)=>new T.Vector2(y+Math.cos(i*Math.PI/3)*r,z+Math.sin(i*Math.PI/3)*r)),-.052,.0023,'grille-open-cell');
   }
   if(!c.van)for(const side of [-1,1]){
    const a:Aperture={y:intake.y+.012,z:side*width*.71,w:width*.18,h:intake.h*.76,sweep:.008,taper:-.20};
    punch(a);surround(parent,m.paint,s,front,a,'side-intake-surround');
    disc(parent,m.trim,s,front,{...a,w:a.w*.98,h:a.h*.98},-.102,.012,'side-intake-recess');
    for(const level of [-1,0,1])curve(parent,m.trim,s,front,Array.from({length:15},(_,i)=>new T.Vector2(a.y+level*a.h*.20,a.z+(-.36+.72*i/14)*a.w)),-.044,.0045,'intake-louvre');
   }
  }else if(sport||c.rally){
   for(let i=-3;i<=3;i++){
    const z=i*width*.19,q=fleetEndSurface(s,front,f.sill+height*.08,z);
    const fin=new T.Shape();fin.moveTo(-.18,0);fin.quadraticCurveTo(-.12,.055,0,.075);fin.lineTo(.035,.055);fin.lineTo(.035,0);fin.closePath();
    mesh(parent,new T.ExtrudeGeometry(fin,{depth:.012,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2}),m.trim,[q.x+.06,f.sill+.015,z-.006],[0,0,0],'rear-diffuser-fin');
   }
  }
  curve(parent,m.trim,s,front,Array.from({length:49},(_,i)=>{const t=-1+2*i/48;return new T.Vector2(f.sill+height*(.12+.06*t*t),t*width*.76);}),.008,sport?.018:.024,front?'front-lip':'rear-lip');
  bumper.userData.apertures=apertures;
 }
}
