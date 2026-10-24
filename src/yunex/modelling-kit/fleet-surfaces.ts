/** Shared indexed patches, closed glass, and crown-preserving section interpolation. */
import * as T from 'three';
import {mesh} from '../world-kit/geometry.ts';
export function fleetPatch(nu:number,nv:number,point:(u:number,v:number)=>T.Vector3,flip=false){
 const p:number[]=[],idx:number[]=[];
 for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)p.push(...point(i/nu,j/nv).toArray());
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(...(flip?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function fleetCurve(parent:T.Object3D,mat:T.Material,points:T.Vector3[],radius:number,name:string){
 return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(32,points.length*2),radius,8,false),mat,[0,0,0],[0,0,0],name);
}
export function fleetSkin(parent:T.Object3D,mat:T.Material,name:string,fn:(u:number,v:number)=>T.Vector3,flip=false,nu=48,nv=20){
 let geometry=fleetPatch(nu,nv,fn,flip);
 if(mat instanceof T.MeshPhysicalMaterial&&mat.transparent){
  const p=geometry.attributes.position,n=geometry.attributes.normal,count=p.count,vertices=Array.from(p.array),idx=Array.from(geometry.index!.array),edges=new Map<string,{a:number;b:number;count:number}>();
  for(let i=0;i<count;i++)vertices.push(p.getX(i)-n.getX(i)*.005,p.getY(i)-n.getY(i)*.005,p.getZ(i)-n.getZ(i)*.005);
  const faces=idx.length;
  for(let i=0;i<faces;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];idx.push(c+count,b+count,a+count);for(const [u,v] of [[a,b],[b,c],[c,a]]){const key=[Math.min(u,v),Math.max(u,v)].join(',');const e=edges.get(key);if(e)e.count++;else edges.set(key,{a:u,b:v,count:1});}}
  for(const e of edges.values())if(e.count===1)idx.push(e.a,e.a+count,e.b,e.b,e.a+count,e.b+count);
  geometry.dispose();geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(idx);geometry.computeVertexNormals();
 }
 const m=mesh(parent,geometry,mat,[0,0,0],[0,0,0],name);if(mat instanceof T.MeshPhysicalMaterial&&mat.transparent)m.userData.wallThickness=.005;m.userData.sourceSurface='fleet-v5';return m;
}
export const lerp=T.MathUtils.lerp;
/** Cosine interpolation keeps slope continuous at profile stations without overshoot. */
export function station(x:number,knots:readonly (readonly [number,number])[]){
 if(x<=knots[0][0])return knots[0][1];
 for(let i=1;i<knots.length;i++)if(x<=knots[i][0]){const [a,av]=knots[i-1],[b,bv]=knots[i];return lerp(av,bv,(1-Math.cos(Math.PI*(x-a)/(b-a)))/2);}
 return knots[knots.length-1][1];
}
/** Formed pillar with a broad painted face, rather than a decorative round tube. */
export function fleetPillar(parent:T.Object3D,mat:T.Material,points:T.Vector3[],width:number,depth:number,name:string){
 const w=width/2,d=depth/2,r=.005,shape=new T.Shape();shape.moveTo(-w+r,-d);shape.lineTo(w-r,-d);shape.quadraticCurveTo(w,-d,w,-d+r);shape.lineTo(w,d-r);shape.quadraticCurveTo(w,d,w-r,d);shape.lineTo(-w+r,d);shape.quadraticCurveTo(-w,d,-w,d-r);shape.lineTo(-w,-d+r);shape.quadraticCurveTo(-w,-d,-w+r,-d);
 return mesh(parent,new T.ExtrudeGeometry(shape,{steps:48,bevelEnabled:false,curveSegments:4,extrudePath:new T.CatmullRomCurve3(points)}),mat,[0,0,0],[0,0,0],name);
}
