import * as T from 'three';import type {V3} from './geometry.ts';
/** Subtract an axis-aligned opening from a mesh surface. Cabin trim closes its edges. */
export function cutOpening(source:T.BufferGeometry,min:V3,max:V3):T.BufferGeometry{
 const g=source.index?source.toNonIndexed():source;const pos=g.attributes.position,norm=g.attributes.normal,out:number[]=[],normals:number[]=[];
 type Vertex={p:T.Vector3;n:T.Vector3};
 const planes=[new T.Plane(new T.Vector3(1,0,0),-min[0]),new T.Plane(new T.Vector3(-1,0,0),max[0]),new T.Plane(new T.Vector3(0,1,0),-min[1]),new T.Plane(new T.Vector3(0,-1,0),max[1]),new T.Plane(new T.Vector3(0,0,1),-min[2]),new T.Plane(new T.Vector3(0,0,-1),max[2])];
 const clip=(poly:Vertex[],plane:T.Plane,inside:boolean)=>{const result:Vertex[]=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=plane.distanceToPoint(a.p),db=plane.distanceToPoint(b.p),ain=inside?da>=-1e-7:da<=1e-7,bin=inside?db>=-1e-7:db<=1e-7;if(ain)result.push(a);if(ain!==bin){const t=da/(da-db);result.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize()});}}return result;};
 const emit=(poly:Vertex[])=>{for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]]){out.push(...v.p.toArray());normals.push(...v.n.toArray());}};
 for(let i=0;i<pos.count;i+=3){let remaining:Vertex[]=Array.from({length:3},(_,j)=>({p:new T.Vector3().fromBufferAttribute(pos,i+j),n:norm?new T.Vector3().fromBufferAttribute(norm,i+j):new T.Vector3(0,1,0)}));for(const plane of planes){emit(clip(remaining,plane,false));remaining=clip(remaining,plane,true);if(remaining.length<3)break;}}
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(out,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));if(g!==source)g.dispose();source.dispose();return result;
}
