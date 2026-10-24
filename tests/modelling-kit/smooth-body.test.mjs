import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {VEHICLES,vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {bodyRing,bodySection,bodyDeck,bodyFlank,bodyCapDepth,fleetEndSurface,roundedBodyGeometry} from '../../src/yunex/modelling-kit/fleet-body.ts';
import {fleetArchitecture,fleetProfile} from '../../src/yunex/modelling-kit/fleet-profiles.ts';
const road=VEHICLES.filter(s=>!['formula','motorcycle','commercial'].includes(fleetArchitecture(s)));
const normal=(s,x,t)=>{const h=1e-5,a=bodyRing(s,x+h,t).sub(bodyRing(s,x-h,t)),b=bodyRing(s,x,t+h).sub(bodyRing(s,x,t-h));return b.cross(a).normalize();};
test('every road family has one smooth rounded crown, shoulder and full door section',()=>{
 for(const s of road){const c=fleetProfile(s),a=bodySection(s,0);assert.ok(a.deck-c.sill>.66,`${s.id} usable body depth`);
  for(const t of [.12,.5,.9,1.2,Math.PI/2,2,2.7,Math.PI,3.8,4.7,5.6,Math.PI*2]){const left=normal(s,0,t-1e-4),right=normal(s,0,t+1e-4);assert.ok(left.dot(right)>.995,`${s.id} normal continuity ${t}`);}
  const shoulder=bodyDeck(s,0,.9),top=bodyDeck(s,0,0);assert.ok(top.y-shoulder.y>.12,`${s.id} shoulder turns down into side`);
  const match=bodyFlank(s,0,shoulder.y,1);assert.ok(match.distanceTo(shoulder)<1e-9,'deck/flank are inversions of same surface');
 }
});
test('front and rear use substantial curved domes, with matching longitudinal tangent',()=>{
 for(const s of road)for(const front of [true,false]){const sign=front?1:-1,d=bodyCapDepth(s),x=sign*(s.length/2-d),a=bodySection(s,x),tip=fleetEndSurface(s,front,a.centre,0),corner=fleetEndSurface(s,front,a.centre,a.width*.85);
  assert.ok(Math.abs(tip.x)-Math.abs(corner.x)>.06,`${s.id} rounded end depth`);
  assert.ok(a.deck-fleetProfile(s).sill>.65,`${s.id} nose retains vertical volume`);
  assert.equal(tip.x,sign*s.length/2);assert.ok(Math.abs(corner.x)>s.length/2-d);
 }
});
test('all road loft meshes have finite positions, unit normals and canonical body dimensions',()=>{
 for(const s of road){const g=roundedBodyGeometry(s);try{const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)),s.id);const len=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));assert.ok(Number.isFinite(len)&&len>.98&&len<1.02,`${s.id} normal ${i}: ${len}`);}g.computeBoundingBox();assert.ok(Math.abs(g.boundingBox.max.x-g.boundingBox.min.x-s.length)<1e-5);assert.ok(g.boundingBox.max.z<=s.width/2+1e-6);}finally{g.dispose();}}
});

test('both rounded end poles have outward triangles and meet the exact end evaluator',()=>{
 for(const s of road){const g=roundedBodyGeometry(s);try{const p=g.attributes.position,index=g.index;
  for(const sign of [-1,1]){let poleFaces=0;for(let k=0;k<index.count;k+=3){const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,index.getX(k+j)));
   if(points.every(q=>sign*q.x>s.length/2-.001)){const n=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));assert.ok(sign*n.x>0,`${s.id} ${sign} pole triangle faces outward`);poleFaces++;}}
   assert.equal(poleFaces,96,`${s.id} complete pole fan`);
   const x=sign*(s.length/2-bodyCapDepth(s));for(let j=0;j<96;j++){const q=bodyRing(s,x,j/96*Math.PI*2),end=fleetEndSurface(s,sign>0,q.y,q.z);assert.ok(end.distanceTo(q)<1e-7,`${s.id} cap rim uses same section`);
    const a=bodySection(s,x);for(const phi of [.2,.6,1,1.4]){const point=new T.Vector3(sign*(s.length/2-bodyCapDepth(s)+bodyCapDepth(s)*Math.sin(phi)),a.centre+(q.y-a.centre)*Math.cos(phi),q.z*Math.cos(phi));assert.ok(fleetEndSurface(s,sign>0,point.y,point.z).distanceTo(point)<1e-7,`${s.id} dome agrees with attachment evaluator`);}}
  }
 }finally{g.dispose();}}
});
