/** Closed formed surfaces: cambered wings and thin, compound-curved motorcycle panels. */
import * as T from 'three';
import {fleetPatch,lerp,station} from './fleet-surfaces.ts';
/** Sew a patch to an offset inner skin, including its complete perimeter. */
export function formedPanel(point:(u:number,v:number)=>T.Vector3,thickness=.016,flip=false,nu=48,nv=24){
 const outer=fleetPatch(nu,nv,point,flip),p=outer.attributes.position,n=outer.attributes.normal,count=p.count;
 const vertices=Array.from(p.array),indices=Array.from(outer.index!.array),edges=new Map<string,{a:number;b:number;count:number}>();
 for(let i=0;i<count;i++)vertices.push(p.getX(i)-n.getX(i)*thickness,p.getY(i)-n.getY(i)*thickness,p.getZ(i)-n.getZ(i)*thickness);
 const faces=indices.length;
 for(let i=0;i<faces;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];indices.push(c+count,b+count,a+count);for(const [a,b] of [[indices[i],indices[i+1]],[indices[i+1],indices[i+2]],[indices[i+2],indices[i]]]){const key=[Math.min(a,b),Math.max(a,b)].join(',');const e=edges.get(key);if(e)e.count++;else edges.set(key,{a,b,count:1});}}
 for(const {a,b,count:c} of edges.values())if(c===1)indices.push(a,a+count,b,b,a+count,b+count);
 outer.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();g.userData.wallThickness=thickness;return g;
}
/** A full elliptic airfoil section, cambered through its chord and closed at both tips. */
export function camberedWing(x:number,y:number,span:number,chord:number,camber:number,thickness:number){
 const p:number[]=[],idx:number[]=[],ns=64,nc=48;
 for(let i=0;i<=ns;i++){const z=lerp(-span,span,i/ns),q=z/span,sweep=.035*q*q;
  for(let j=0;j<nc;j++){const a=j/nc*Math.PI*2,t=(1-Math.cos(a))/2;p.push(x+sweep+chord*(t-.5),y+.025*q*q+camber*Math.sin(Math.PI*t)+thickness*.5*Math.sin(a),z);}
 }
 for(let i=0;i<ns;i++)for(let j=0;j<nc;j++){const a=i*nc+j,b=i*nc+(j+1)%nc;idx.push(a,a+nc,b,b,a+nc,b+nc);}
 // The fan centre lies on the half-chord camber line inside the section.
 // Using the baseline falls outside the concave lower skin and reverses cap faces.
 for(const i of [0,ns]){const c=p.length/3;p.push(x+.035,y+.025+camber, i===0?-span:span);for(let j=0;j<nc;j++){const a=i*nc+j,b=i*nc+(j+1)%nc;idx.push(...(i===0?[c,a,b]:[c,b,a]));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();g.userData.closedAirfoil=true;return g;
}
type FairingStation=readonly[number,number,number,number]; // x, width, lower edge, upper edge
export function motorcyclePanel(knots:readonly FairingStation[],side:number){
 const curves=[1,2,3].map(c=>knots.map(k=>[k[0],k[c]] as const));
 return formedPanel((u,v)=>{const x=lerp(knots[0][0],knots[knots.length-1][0],u),w=station(x,curves[0]),lo=station(x,curves[1]),hi=station(x,curves[2]);return new T.Vector3(x,lerp(lo,hi,v),side*(w*(.82+.18*Math.sin(Math.PI*v))+.012*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)));},.018,side<0);
}
