import * as T from 'three';import {surface} from './geometry.ts';import type {V3} from './geometry.ts';
export function random(seed:number){let a=seed>>>0;return ()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
export type Instance={p:V3;s:V3;ry?:number;color?:string};
export function instances(g:T.Group,name:string,geo:T.BufferGeometry,material:T.Material,items:Instance[]){
 const m=new T.InstancedMesh(geo,material,items.length),dummy=new T.Object3D();m.name=name;m.castShadow=true;m.receiveShadow=true;
 items.forEach((v,i)=>{dummy.position.set(...v.p);dummy.scale.set(...v.s);dummy.rotation.set(0,v.ry??0,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);if(v.color)m.setColorAt(i,new T.Color(v.color));});m.instanceMatrix.needsUpdate=true;g.add(m);return m;
}
export function trees(g:T.Group,items:V3[],snow=false){
 instances(g,'tree-trunks',new T.CylinderGeometry(.23,.31,1,7),surface('#655446'),items.map(p=>({p:[p[0],1.1,p[2]],s:[1,2.2,1]})));
 instances(g,'tree-crowns',new T.ConeGeometry(1,1,8),surface(snow?'#b3c7bc':'#526c52'),items.map((p,i)=>({p:[p[0],3.35,p[2]],s:[1.4+(i%3)*.25,4,1.4+(i%3)*.25]})));
}
