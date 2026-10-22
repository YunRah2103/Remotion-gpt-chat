import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {coachbuiltField} from '../../src/yunex/modelling-kit/coachbuilt.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';

test('sports body has raised fender shoulders and a swept rather than slab nose',()=>{
 const s=vehicleSpec('supercar'),map=(x,y,z)=>coachbuiltField(new T.Vector3(x,y,z),s);
 const centre=map(1.5,.81,0),shoulder=map(1.5,.81,.78);
 assert.ok(shoulder.y-centre.y>.075,'bonnet must sit below curved fender shoulders');
 assert.ok(map(s.length/2,.81,0).x-map(s.length/2,.81,.88).x>.16,'nose corners must sweep behind central prow');
});

test('sports styling preserves orientation, symmetry and tyre envelope',()=>{
 const s=vehicleSpec('supercar'),map=p=>coachbuiltField(p,s),e=1e-4;
 for(let x=-2.35;x<=2.35;x+=.13)for(let y=.25;y<1.2;y+=.08)for(let z=0;z<=1;z+=.13){
  const p=new T.Vector3(x,y,z),q=map(p.clone());
  const columns=[new T.Vector3(e,0,0),new T.Vector3(0,e,0),new T.Vector3(0,0,e)].map(d=>map(p.clone().add(d)).sub(q).divideScalar(e));
  const [a,b,c]=columns,det=new T.Matrix3().set(a.x,b.x,c.x,a.y,b.y,c.y,a.z,b.z,c.z).determinant();
  assert.ok(det>.12,`fold at ${p.toArray()}: ${det}`);
  const mirror=map(new T.Vector3(x,y,-z));assert.ok(Math.abs(q.x-mirror.x)<1e-8&&Math.abs(q.y-mirror.y)<1e-8&&Math.abs(q.z+mirror.z)<1e-8);
 }
 for(const x of [-s.wheelbase/2,s.wheelbase/2]){const p=new T.Vector3(x,s.radius,s.width/2);assert.ok(map(p.clone()).distanceTo(p)<1e-8);}
});
