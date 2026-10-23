import * as T from 'three';
import {box,mesh,surface} from '../world-kit/geometry.ts';
/** Original corrugated rail, with longitudinal subdivision for prescribed bending. */
export function createImpactBarrier(){
 const g=new T.Group();g.name='impact-barrier';const mat=surface('#80939c',.8,.34),points:number[]=[],indices:number[]=[];
 for(let i=0;i<=100;i++)for(let j=0;j<=12;j++){const u=i/100,v=j/12;points.push((u-.5)*8,.55+(v-.5)*.36,Math.sin(v*Math.PI*4)*.035);}
 for(let i=0;i<100;i++)for(let j=0;j<12;j++){const a=i*13+j;indices.push(a,a+1,a+13,a+1,a+14,a+13);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();mat.side=T.DoubleSide;
 const rail=mesh(g,geo,mat,[0,0,0],[0,0,0],'impact-rail');rail.userData.restVertices=points;
 for(let i=-3;i<=3;i++){const post=box(g,mat,[.10,.72,.10],[i,.36,-.10],.005,'barrier-post');post.userData.restX=i;}
 return g;
}
export function animateImpactBarrier(g:T.Group,impact:number){
 if(!Number.isFinite(impact)||impact<0||impact>1)throw new Error('impact must be 0..1');
 const rail=g.getObjectByName('impact-rail') as T.Mesh,a=rail.geometry.attributes.position,rest=rail.userData.restVertices;
 for(let i=0;i<a.count;i++){const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],bend=Math.exp(-x*x/.85)*impact;a.setXYZ(i,x,y-bend*.06,z-bend*.50);}
 a.needsUpdate=true;rail.geometry.computeVertexNormals();rail.geometry.computeBoundingSphere();
 g.children.forEach(o=>{if(o.name==='barrier-post'){const d=Math.exp(-(o.userData.restX**2)/.85)*impact;o.rotation.x=-d*.35;o.position.z=-.10-d*.30;}});
}
