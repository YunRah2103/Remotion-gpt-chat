/** Original authored section lofts. Metres, +X forward. Shared surface equations keep adjoining panels fitted. */
import * as T from 'three';
import {mesh,box,rod,surface} from '../world-kit/geometry.ts';
import type {V3} from '../world-kit/geometry.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
export const STUDIO_BODY_IDS=['supercar','coupe','rally-hatch'] as const;
type Profile={roof:number;frontBase:number;frontRoof:number;rearRoof:number;rearBase:number;belt:number;baseWidth:number;roofWidth:number};
export function studioBodyProfile(s:VehicleSpec):Profile{
 const rally=s.id==='rally-hatch',coupe=s.id==='coupe',l=interiorLayout(s);
 return {roof:rally?1.54:coupe?1.37:1.39,frontBase:l.frontBase,frontRoof:rally?.37:coupe?.26:.20,rearRoof:rally?-1.46:coupe?-.79:-.74,rearBase:rally?-1.90:coupe?-1.49:-1.48,belt:rally?.98:.84,baseWidth:s.width*(rally?.445:.426),roofWidth:s.width*(rally?.365:.326)};
}
const smooth=T.MathUtils.smoothstep;
/** Shape-preserving cubic longitudinal interpolation, without uncontrolled spline overshoot. */
function profileAt(x:number,knots:readonly (readonly [number,number])[]){
 if(x<=knots[0][0])return knots[0][1];
 for(let i=1;i<knots.length;i++)if(x<=knots[i][0]){const [a,av]=knots[i-1],[b,bv]=knots[i],t=(x-a)/(b-a),delta=(bv-av)/(b-a);const tangent=(k:number)=>{if(k===0)return (knots[1][1]-knots[0][1])/(knots[1][0]-knots[0][0]);if(k===knots.length-1)return (knots[k][1]-knots[k-1][1])/(knots[k][0]-knots[k-1][0]);const left=(knots[k][1]-knots[k-1][1])/(knots[k][0]-knots[k-1][0]),right=(knots[k+1][1]-knots[k][1])/(knots[k+1][0]-knots[k][0]);return left*right<=0?0:2*left*right/(left+right);};const ma=delta===0?0:tangent(i-1),mb=delta===0?0:tangent(i);return (2*t**3-3*t*t+1)*av+(t**3-2*t*t+t)*(b-a)*ma+(-2*t**3+3*t*t)*bv+(t**3-t*t)*(b-a)*mb;}
 return knots[knots.length-1][1];
}
function section(s:VehicleSpec,x:number){
 const h=s.length/2,rally=s.id==='rally-hatch',coupe=s.id==='coupe',u=x/h;
 const deck=profileAt(u,rally?[[-1,.89],[-.78,1.00],[-.30,.99],[.35,.97],[.7,.92],[1,.73]]:coupe?[[-1,.79],[-.70,.88],[-.2,.84],[.25,.84],[.67,.81],[1,.70]]:[[-1,.80],[-.72,.90],[-.34,.86],[.32,.84],[.64,.82],[1,.70]]);
 const width=s.width*.5*profileAt(u,rally?[[-1,.91],[-.72,1.0],[0,.96],[.72,1],[1,.86]]:[[-1,.86],[-.66,1],[0,.92],[.63,.97],[1,.85]]);
 const axle=Math.max(Math.exp(-(((x-s.wheelbase/2)/.46)**2)),Math.exp(-(((x+s.wheelbase/2)/.53)**2)));
 return {deck,width,axle};
}
export function studioDeckPoint(s:VehicleSpec,x:number,v:number):T.Vector3{
 const {deck,width,axle}=section(s,x),side=Math.abs(v);
 const shoulder=(s.id==='rally-hatch'?.045:.065)*axle*Math.exp(-(((side-.83)/.26)**2));
 return new T.Vector3(x,deck+.035*(1-v*v)+shoulder,width*v);
}
function grid(nu:number,nv:number,point:(u:number,v:number)=>T.Vector3,flip=false){
 const p:number[]=[],idx:number[]=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)p.push(...point(i/nu,j/nv).toArray());
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(...(flip?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
/** Closed offset shell for this kit's smooth open patches; not a general CAD offset solver. */
function closePatch(input:T.BufferGeometry,thickness:number){
 const a=input.attributes.position,n=input.attributes.normal,source=input.index,p:number[]=[],normals:T.Vector3[]=[],ids:number[]=[],lookup=new Map<string,number>();
 for(let i=0;i<a.count;i++){const q=new T.Vector3().fromBufferAttribute(a,i),key=q.toArray().map(v=>Math.round(v*1e6)).join(',');let id=lookup.get(key);if(id===undefined){id=p.length/3;lookup.set(key,id);p.push(...q.toArray());normals.push(new T.Vector3());}normals[id].add(new T.Vector3().fromBufferAttribute(n,i));ids.push(id);}
 const count=p.length/3,idx:number[]=[],edges=new Map<string,{a:number;b:number;count:number}>();
 for(let i=0;i<(source?.count??a.count);i+=3){const face=[0,1,2].map(j=>ids[source?source.getX(i+j):i+j]);if(new Set(face).size<3)continue;idx.push(...face,face[2]+count,face[1]+count,face[0]+count);for(let j=0;j<3;j++){const a=face[j],b=face[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(',');const e=edges.get(key);if(e)e.count++;else edges.set(key,{a,b,count:1});}}
 for(let i=0;i<count;i++){const q=new T.Vector3(p[i*3],p[i*3+1],p[i*3+2]).addScaledVector(normals[i].normalize(),-thickness);p.push(...q.toArray());}
 for(const e of edges.values())if(e.count===1)idx.push(e.a,e.a+count,e.b,e.b,e.a+count,e.b+count);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function curve(parent:T.Object3D,mat:T.Material,points:V3[],radius:number,name:string){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(32,points.length*3),radius,8,false),mat,[0,0,0],[0,0,0],name);}
/** Formed painted pillar section, distinct from a round decorative pipe. */
function formedRail(parent:T.Object3D,mat:T.Material,points:V3[],width:number,depth:number,name:string){
 const w=width/2,d=depth/2,r=Math.min(width,depth)*.18,shape=new T.Shape();shape.moveTo(-w+r,-d);shape.lineTo(w-r,-d);shape.quadraticCurveTo(w,-d,w,-d+r);shape.lineTo(w,d-r);shape.quadraticCurveTo(w,d,w-r,d);shape.lineTo(-w+r,d);shape.quadraticCurveTo(-w,d,-w,d-r);shape.lineTo(-w,-d+r);shape.quadraticCurveTo(-w,-d,-w+r,-d);
 return mesh(parent,new T.ExtrudeGeometry(shape,{steps:48,bevelEnabled:false,curveSegments:3,extrudePath:new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)))}),mat,[0,0,0],[0,0,0],name);
}
function bodyGeometry(s:VehicleSpec){
 const half=s.length/2,nx=160,nz=32,ny=14,rows:number[][]=[],p:number[]=[],idx:number[]=[],arch=s.radius*1.12;
 const xs:number[]=[];for(let i=0;i<=nx;i++)xs.push(T.MathUtils.lerp(-half,half,i/nx));for(const axle of [-s.wheelbase/2,s.wheelbase/2])for(let i=0;i<=40;i++)xs.push(axle+arch*Math.cos(i/40*Math.PI));xs.sort((a,b)=>a-b);
 const samples=xs.filter((x,i)=>x>=-half&&x<=half&&(i===0||x-xs[i-1]>1e-5));
 for(const x of samples){
  let low=s.radius*.69;for(const axle of [-s.wheelbase/2,s.wheelbase/2])if(Math.abs(x-axle)<arch)low=Math.max(low,s.radius+Math.sqrt(arch*arch-(x-axle)**2));
  const row:number[]=[];const add=(q:T.Vector3)=>{row.push(p.length/3);p.push(...q.toArray());};
  for(let j=0;j<=nz;j++)add(studioDeckPoint(s,x,-1+2*j/nz));
  for(let j=1;j<=ny;j++){const t=j/ny,edge=studioDeckPoint(s,x,1);add(new T.Vector3(x,T.MathUtils.lerp(edge.y,low,t),edge.z*(1-.075*Math.sin(Math.PI*t*.8))));}
  for(let j=1;j<=8;j++)add(new T.Vector3(x,low,section(s,x).width*.956*T.MathUtils.lerp(1,-1,j/8)));
  for(let j=ny-1;j>0;j--){const t=j/ny,edge=studioDeckPoint(s,x,-1);add(new T.Vector3(x,T.MathUtils.lerp(edge.y,low,t),edge.z*(1-.075*Math.sin(Math.PI*t*.8))));}
  rows.push(row);
 }
 const n=rows[0].length;for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){const a=rows[i][j],b=rows[i][(j+1)%n],c=rows[i+1][j],d=rows[i+1][(j+1)%n];idx.push(a,b,c,b,d,c);}
 for(const end of [0,rows.length-1]){const row=rows[end],centre=new T.Vector3();for(const i of row)centre.add(new T.Vector3(p[i*3],p[i*3+1],p[i*3+2]));centre.multiplyScalar(1/n);const ci=p.length/3;p.push(...centre.toArray());for(let j=0;j<n;j++)idx.push(...(end===0?[ci,row[(j+1)%n],row[j]]:[ci,row[j],row[(j+1)%n]]));}
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);const position=g.attributes.position;for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i);position.setX(i,x-.13*(z/(s.width/2))**2*smooth(x,half-.50,half)+.07*(z/(s.width/2))**2*(1-smooth(x,-half,-half+.42)));}g.computeVertexNormals();
 const c=studioBodyProfile(s);g=cutOpening(g,[c.rearBase+.06,.49,-c.baseWidth*.91],[c.frontBase-.05,2,c.baseWidth*.91]);
 return g;
}
function doorPatch(s:VehicleSpec,side:number,hole?:{x0:number;x1:number;y0:number;y1:number}){
 const c=studioBodyProfile(s),x0=-s.wheelbase/2+s.radius*1.20+.004,x1=Math.min(s.wheelbase/2-s.radius*1.20,c.frontBase-.09)-.004,y0=.374,y1=c.belt-.049;
 const xs=Array.from({length:33},(_,i)=>T.MathUtils.lerp(x0,x1,i/32)),ys=Array.from({length:21},(_,i)=>T.MathUtils.lerp(y0,y1,i/20));
 if(hole){xs.push(hole.x0,hole.x1);ys.push(hole.y0,hole.y1);}xs.sort((a,b)=>a-b);ys.sort((a,b)=>a-b);const p:number[]=[],idx:number[]=[],ny=ys.length;
 for(const x of xs)for(const y of ys){const u=(x-x0)/(x1-x0),v=(y-y0)/(y1-y0),top=studioDeckPoint(s,x,side),t=T.MathUtils.clamp((top.y-y)/(top.y-s.radius*.69),0,1);p.push(x,y,top.z*(1-.075*Math.sin(Math.PI*t*.8))+side*.005*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));}
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){const x=(xs[i]+xs[i+1])/2,y=(ys[j]+ys[j+1])/2;if(hole&&x>hole.x0&&x<hole.x1&&y>hole.y0&&y<hole.y1)continue;const a=i*ny+j,b=a+ny;idx.push(...(side>0?[a,b,a+1,a+1,b,b+1]:[a,a+1,b,a+1,b+1,b]));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function canopy(shell:T.Group,s:VehicleSpec,paint:T.Material,trim:T.Material,glass:T.Material){
 const c=studioBodyProfile(s),roofAt=(x:number,v:number)=>new T.Vector3(x,c.roof-.055*v*v+.012*Math.sin(Math.PI*(x-c.rearRoof)/(c.frontRoof-c.rearRoof)),c.roofWidth*v);
 const pane=(name:string,fn:(u:number,v:number)=>T.Vector3,mat:T.Material,flip=false)=>{const patch=grid(26,32,fn,flip),g=mat===glass?closePatch(patch,.006):patch;if(g!==patch)patch.dispose();const m=mesh(shell,g,mat,[0,0,0],[0,0,0],name);m.userData.sourceSurface='section-loft-v4';if(mat===glass)m.userData.wallThickness=.006;return m;};
 pane('roof',(u,v)=>roofAt(T.MathUtils.lerp(c.rearRoof,c.frontRoof,u),-1+2*v),paint,true);
 // One parameterization per windscreen: transverse crown vanishes at fitted A-pillars.
 const screen=(rear:boolean,u:number,v:number)=>{const base=rear?c.rearBase:c.frontBase,top=rear?c.rearRoof:c.frontRoof,z=-1+2*v;const q=roofAt(top,z),p=new T.Vector3(base,c.belt-.025*z*z,c.baseWidth*z);p.lerp(q,u);p.x+=(rear?-.045:.055)*Math.sin(Math.PI*u)*(1-z*z);return p;};
 for(const rear of [false,true]){
  pane(rear?'rear-glass':'windshield',(u,v)=>screen(rear,u,v),glass,rear);
  for(const side of [0,1]){const pts:V3[]=[];for(let i=0;i<=24;i++)pts.push(screen(rear,i/24,side).toArray() as V3);formedRail(shell,paint,pts,.065,.028,rear?'c-pillar':'a-pillar');}
  for(const edge of [0,1]){const pts:V3[]=[];for(let i=0;i<=32;i++)pts.push(screen(rear,edge,i/32).toArray() as V3);curve(shell,trim,pts,.009,rear?'rear-window-frame':'windshield-seal');}
 }
 const roofX=(t:number)=>t<.24?T.MathUtils.lerp(c.rearBase,c.rearRoof,t/.24):t>.77?T.MathUtils.lerp(c.frontRoof,c.frontBase,(t-.77)/.23):T.MathUtils.lerp(c.rearRoof,c.frontRoof,(t-.24)/.53);
 const topY=(t:number)=>t<.24?T.MathUtils.lerp(c.belt,c.roof-.055,t/.24):t>.77?T.MathUtils.lerp(c.roof-.055,c.belt,(t-.77)/.23):c.roof-.055+.012*Math.sin(Math.PI*(t-.24)/.53);
 for(const side of [-1,1]){
  pane('side-glass',(u,v)=>{const t=.04+u*.92,x=roofX(t),y=topY(t),edge=1-v;return new T.Vector3(x,T.MathUtils.lerp(c.belt+.009,y-.005,v),side*T.MathUtils.lerp(c.baseWidth,c.roofWidth,(y-c.belt)/(c.roof-c.belt)*v)-side*.009*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));},glass,side<0);
  const upper:V3[]=[],lower:V3[]=[];for(let i=0;i<=64;i++){const t=i/64,y=topY(t);upper.push([roofX(t),y,side*T.MathUtils.lerp(c.baseWidth,c.roofWidth,(y-c.belt)/(c.roof-c.belt))]);lower.push([T.MathUtils.lerp(c.rearBase,c.frontBase,t),c.belt,side*c.baseWidth]);}
  formedRail(shell,paint,upper,.040,.020,'window-frame');curve(shell,trim,lower,.012,'window-seal');
  if(s.id==='rally-hatch'){const t=.48,x=roofX(t);rod(shell,trim,[x,c.belt,side*c.baseWidth],[x,c.roof-.055,side*c.roofWidth],.026).name='b-pillar';}
 }
 const cabin=shell.getObjectByName('interior'),liner=cabin?.getObjectByName('roof-liner') as T.Mesh|undefined;
 if(liner){liner.geometry.dispose();liner.geometry=grid(20,24,(u,v)=>roofAt(T.MathUtils.lerp(c.rearRoof,c.frontRoof,u),-1+2*v).add(new T.Vector3(0,-.028,0)));liner.position.set(0,0,0);liner.rotation.set(0,0,0);}
}
function intake(shell:T.Group,mat:T.Material,x:number,y:number,z:number,w:number,h:number,name:string){
 const outer=new T.Shape();outer.moveTo(-w/2,-h/2);outer.lineTo(w/2,-h/2);outer.lineTo(w*.40,h/2);outer.lineTo(-w*.40,h/2);outer.closePath();
 const hole=new T.Path();hole.moveTo(-w*.42,-h*.32);hole.lineTo(-w*.34,h*.32);hole.lineTo(w*.34,h*.32);hole.lineTo(w*.42,-h*.32);hole.closePath();outer.holes.push(hole);
 const g=new T.ExtrudeGeometry(outer,{depth:.075,bevelEnabled:true,bevelSegments:3,bevelSize:.009,bevelThickness:.009,steps:1});g.rotateY(Math.PI/2);mesh(shell,g,mat,[x,y,z],[0,0,0],name);
 box(shell,mat,[.020,h*1.07,w*1.07],[x-.080,y,z],.009,name+'-backing');
}
/** Replace, not overlay, the old exterior; canonical interior and wheel/driver hardpoints remain. */
export function installStudioCoachwork(shell:T.Group,s:VehicleSpec){
 if(!STUDIO_BODY_IDS.includes(s.id as typeof STUDIO_BODY_IDS[number]))throw Error('Studio body supported for supercar, coupe and rally-hatch; use coachbuilt for other catalogue vehicles');
 const source=shell.getObjectByName('arched-body') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
 const paint=new T.MeshPhysicalMaterial({color:source.material.color,metalness:.36,roughness:.28,clearcoat:1,clearcoatRoughness:.10,envMapIntensity:1.2});
 const carbon=surface('#11171b',.25,.32),rubber=surface('#11181b',.02,.76),chrome=surface('#a4adb0',.93,.18),glass=new T.MeshPhysicalMaterial({color:'#849fa4',metalness:.05,roughness:.055,clearcoat:1,transparent:true,opacity:.52,depthWrite:false,side:T.DoubleSide});
 const retained=shell.children.filter(o=>['interior','console-switch-bank'].includes(o.name));
 for(const o of [...shell.children])if(!retained.includes(o)){shell.remove(o);o.traverse(n=>{if(n instanceof T.Mesh)n.geometry.dispose();});}
 const body=mesh(shell,bodyGeometry(s),paint,[0,0,0],[0,0,0],'arched-body');body.userData.sourceSurface='section-loft-v4';
 canopy(shell,s,paint,rubber,glass);
 const rally=s.id==='rally-hatch',c=studioBodyProfile(s),half=s.length/2;
 // Closed, individually replaceable door skins occupying genuine openings.
 for(const side of [-1,1]){
  const x0=-s.wheelbase/2+s.radius*1.20,x1=Math.min(s.wheelbase/2-s.radius*1.20,c.frontBase-.09),y0=.37,y1=c.belt-.045;
  const old=body.geometry;body.geometry=cutOpening(old,[x0,y0,side>0?s.width*.34:-s.width],[x1,y1,side>0?s.width:-s.width*.34]);old.dispose();
  const door=grid(32,20,(u,v)=>{const x=T.MathUtils.lerp(x0+.004,x1-.004,u),y=T.MathUtils.lerp(y0+.004,y1-.004,v),top=studioDeckPoint(s,x,side),t=T.MathUtils.clamp((top.y-y)/(top.y-s.radius*.69),0,1);return new T.Vector3(x,y,top.z*(1-.075*Math.sin(Math.PI*t*.8))+side*.005*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));},side<0);
  const d=mesh(shell,door,paint,[0,0,0],[0,0,0],`studio-door-${side>0?'left':'right'}`);d.userData.editablePanel=true;d.userData.sourceSurface='section-loft-v4';d.userData.panelGap=.004;
  box(shell,carbon,[.15,.018,.017],[x0+.14,y1-.065,side*section(s,x0+.14).width*.98],.007,'flush-door-handle');
  box(shell,carbon,[s.wheelbase*.75,.07,.10],[0,.255,side*s.width*.455],.022,'sill');
  for(const axle of [-s.wheelbase/2,s.wheelbase/2]){
   const points:V3[]=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI,x=axle+Math.cos(a)*s.radius*1.12,y=s.radius+Math.sin(a)*s.radius*1.12;points.push([x,y,side*section(s,x).width*.978]);}
   curve(shell,rally?carbon:paint,points,rally?.024:.013,'studio-fender-lip');
   const inner=grid(48,5,(u,v)=>{const a=u*Math.PI,x=axle+Math.cos(a)*s.radius*1.12,y=s.radius+Math.sin(a)*s.radius*1.12;return new T.Vector3(x,y,side*(section(s,x).width*.978-v*.12));},side<0);mesh(shell,inner,rubber,[0,0,0],[0,0,0],'wheel-well-return');
  }
  // Curved mirror housing and fitted reflective insert.
  const mirror=mesh(shell,new T.SphereGeometry(1,24,14).scale(.125,.052,.086),paint,[c.frontBase-.13,c.belt+.13,side*s.width*.51],[0,0,0],'mirror');
  rod(shell,carbon,[c.frontBase-.08,c.belt+.035,side*c.baseWidth],[mirror.position.x,mirror.position.y,mirror.position.z],.015).name='mirror-stalk';
  mesh(shell,new T.SphereGeometry(1,24,12).scale(.010,.039,.065),chrome,[mirror.position.x-.113,mirror.position.y,mirror.position.z],[0,0,0],'mirror-glass');
 }
 // Designed front/rear masks are cut into the real shell, never pasted across paint.
 const lampY=rally?.77:.65;
 const white=new T.MeshStandardMaterial({color:'#e8f6ff',emissive:'#d6edff',emissiveIntensity:1.2});const red=new T.MeshStandardMaterial({color:'#b51b28',emissive:'#ef2433',emissiveIntensity:.7});
 for(const front of [true,false])for(const side of [-1,1]){
  const z=side*s.width*.30,x=front?half-.13*(z/(s.width/2))**2:-half+.07*(z/(s.width/2))**2,y=front?lampY:rally?.88:.70,w=s.width*(front?.18:.24),h=front?.045:.028;
  const old=body.geometry;body.geometry=cutOpening(old,[x-.15,y-.038,z-w*.52],[x+.15,y+.038,z+w*.52]);old.dispose();
  box(shell,carbon,[.07,.074,w+.045],[x+(front?-.055:.055),y,z],.015,front?'headlamp-housing':'tail-lamp-housing');
  const points:V3[]=[[x+(front?-.012:.012),y-.006,z-side*w*.46],[x+(front?-.027:.027),y,z],[x+(front?-.035:.035),y+.018,z+side*w*.44]];curve(shell,front?white:red,points,front?.009:.007,front?'led-signature':'rear-light-guide');
 }
 const frontIntakeY=rally?.50:.39;
 for(const side of [-1,1]){const z=side*s.width*.30,w=s.width*.22,h=rally?.22:.18;const old=body.geometry;body.geometry=cutOpening(old,[half-.22,frontIntakeY-h/2,z-w*.5],[half+.1,frontIntakeY+h/2,z+w*.5]);old.dispose();intake(shell,carbon,half-.045-.13*(z/(s.width/2))**2,frontIntakeY,z,w,h,'front-corner-intake');for(let j=0;j<3;j++)box(shell,carbon,[.12,.008,w*.73],[half-.065-.13*(z/(s.width/2))**2,frontIntakeY-.05+j*.045,z],.003,'intake-vane');}
 {const old=body.geometry;body.geometry=cutOpening(old,[half-.22,.36,-s.width*.125],[half+.1,.50,s.width*.125]);old.dispose();intake(shell,carbon,half-.035,.43,0,s.width*.25,.14,'central-radiator-inlet');for(let i=-5;i<=5;i++)box(shell,chrome,[.012,.09,.004],[half-.055,.43,i*.036],.001,'radiator-fin');}
 box(shell,carbon,[.22,.035,s.width*.82],[half-.08,.265,0],.014,'front-splitter');
 const rearOpeningY=.48;{const old=body.geometry;body.geometry=cutOpening(old,[-half-.1,.29,-s.width*.40],[-half+.18,.64,s.width*.40]);old.dispose();}
 box(shell,carbon,[.16,.32,s.width*.83],[-half+.10,rearOpeningY,0],.025,'rear-diffuser');
 for(let i=-3;i<=3;i++)box(shell,carbon,[.40,.13,.014],[-half+.15,.29,i*s.width*.105],.004,'rear-diffuser-channel');
 if(s.id==='supercar'){for(const side of [-1,1]){const door=shell.getObjectByName(`studio-door-${side>0?'left':'right'}`) as T.Mesh;const x0=-.87,x1=-.36,y0=.53,y1=.78;const old=door.geometry;door.geometry=doorPatch(s,side,{x0,x1,y0,y1});old.dispose();const z=side*.907;const points:V3[]=[[x0,y0,z],[x1,y0+.055,z],[x1+.035,y1,z],[x0,y1,z],[x0,y0,z]];curve(shell,carbon,points,.012,'side-intake-surround');const duct=grid(12,12,(u,v)=>new T.Vector3(T.MathUtils.lerp(x0,x1,u),T.MathUtils.lerp(y0,y1,v),side*(.855+.045*Math.sin(Math.PI*u))),side<0);mesh(shell,duct,carbon,[0,0,0],[0,0,0],'side-intake-recess');}}
 if(!rally){
  // Fitted engine-deck blades and raised haunch buttresses distinguish mid-engine architecture.
  const deckX=s.id==='supercar'?-1.70:-1.80;
  for(const side of [-1,1])for(let i=0;i<6;i++){const x=deckX+i*.075,q=studioDeckPoint(s,x,side*.45);box(shell,carbon,[.028,.012,.29],[x,q.y+.012,side*.36],.004,'engine-deck-louvre');}
  for(const side of [-1,1]){
   const endX=-s.length*.409,deck=studioDeckPoint(s,endX,side*.85),start=new T.Vector3(c.rearRoof,c.roof-.055,side*c.roofWidth);
   const shape=grid(40,8,(u,v)=>{const blend=u*u*(3-2*u),p=start.clone().lerp(deck,blend),width=.035+.065*Math.sin(Math.PI*u)+.045*u;p.z+=side*(v-.5)*width;p.y-=.025*(v-.5)*Math.sin(Math.PI*u);return p;},side<0),skin=closePatch(shape,.018);shape.dispose();const panel=mesh(shell,skin,paint,[0,0,0],[0,0,0],'rear-haunch-buttress-panel');panel.userData.sourceSurface='section-loft-v4';panel.userData.editablePanel=true;
  }
  const lip=grid(32,6,(u,v)=>{const z=T.MathUtils.lerp(-s.width*.39,s.width*.39,u),x=-half+.11+v*.15;return new T.Vector3(x,.84+.035*Math.sin(Math.PI*u)+.035*v,z);},true);mesh(shell,lip,paint,[0,0,0],[0,0,0],'integrated-rear-spoiler');
 }
 for(const side of ['left','right']){const door=shell.getObjectByName(`studio-door-${side}`) as T.Mesh;const old=door.geometry;door.geometry=closePatch(old,.016);old.dispose();door.userData.wallThickness=.016;}
 shell.userData.bodyArchitecture='section-loft-v4';
}
