import * as T from 'three';import {surface} from './geometry.ts';import type {V3} from './geometry.ts';
export function random(seed:number){let a=seed>>>0;return ()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
export type Instance={p:V3;s:V3;ry?:number;color?:string};
export function instances(g:T.Group,name:string,geo:T.BufferGeometry,material:T.Material,items:Instance[]){
 const m=new T.InstancedMesh(geo,material,items.length),dummy=new T.Object3D();m.name=name;m.castShadow=true;m.receiveShadow=true;
 items.forEach((v,i)=>{dummy.position.set(...v.p);dummy.scale.set(...v.s);dummy.rotation.set(0,v.ry??0,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);if(v.color)m.setColorAt(i,new T.Color(v.color));});m.instanceMatrix.needsUpdate=true;g.add(m);return m;
}
export function trees(g:T.Group,items:V3[],snow=false){
 const trunks:Instance[]=[],leaves:Instance[]=[],pines:Instance[]=[],snowLayers:Instance[]=[];
 items.forEach((p,i)=>{
  const h=5.6+(Math.sin(p[0]*2.1+p[2]*.7)+1)*1.4,pine=snow||i%4===0;trunks.push({p:[p[0],p[1]+h*.32,p[2]],s:[.85,h*.64,.85]});
  if(pine){for(let k=0;k<4;k++){const r=2.2-k*.38,cy=p[1]+h*.45+k*h*.12;pines.push({p:[p[0],cy,p[2]],s:[r,h*.43,r],ry:i*.7,color:['#3e6254','#4e735b','#567b60'][i%3]});if(snow)snowLayers.push({p:[p[0],cy+h*.07,p[2]],s:[r*.79,h*.30,r*.79],ry:i*.7});}}
  else for(let k=0;k<6;k++){const a=k*Math.PI*.77,spread=k===0?0:1.35;leaves.push({p:[p[0]+Math.cos(a)*spread,p[1]+h*.63+(k%3)*.65,p[2]+Math.sin(a)*spread],s:[1.65+(i%3)*.12,1.8+(k%2)*.3,1.6],ry:a,color:['#4f7358','#638361','#75906b','#456951'][(i+k)%4]});}
 });
 instances(g,'tree-trunks',new T.CylinderGeometry(.22,.34,1,9),surface('#70604e'),trunks);
 if(leaves.length)instances(g,'tree-crowns',new T.IcosahedronGeometry(1,1),surface('#ffffff',0,.96),leaves);
 if(pines.length)instances(g,'conifer-tiers',new T.ConeGeometry(1,1,12),surface('#ffffff',0,.94),pines);
 if(snowLayers.length)instances(g,'conifer-snow',new T.ConeGeometry(1,1,12),surface('#e4e9e4'),snowLayers);
}
