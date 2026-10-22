import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {coachbuiltField} from '../../src/yunex/modelling-kit/coachbuilt.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';

test('sports body retains bonnet volume, raised fenders and a swept nose',()=>{
 const s=vehicleSpec('supercar'),map=(x,y,z)=>coachbuiltField(new T.Vector3(x,y,z),s);
 const centre=map(1.5,.81,0),shoulder=map(1.5,.81,.78);
 assert.ok(centre.y>.80,'bonnet must not collapse into a thin flat slab');
 assert.ok(shoulder.y>centre.y+.015,'curved fender shoulder stands above bonnet');
 assert.ok(map(s.length/2,.81,0).x-map(s.length/2,.81,.88).x>.16,'nose corners must sweep behind central prow');
});

test('supercar canopy has useful height and a narrower curved roof',()=>{
 const s=vehicleSpec('supercar'),map=(x,y,z)=>coachbuiltField(new T.Vector3(x,y,z),s);
 const roof=map(-.35,1.1,0),edge=map(-.35,1.1,.75),belt=map(-.35,.79,.93);
 assert.ok(roof.y>1.27,'recognisable cabin above the belt');
 assert.ok(roof.y-belt.y>.47,'usable windscreen and cabin height');
 assert.ok(Math.abs(edge.z)<.70,'roof tapers in from full-width shoulder');
 assert.ok(roof.y-edge.y>.045,'roof has transverse crown');
});

test('raised exterior canopy carries its liner while controls stay on original targets',()=>{
 const before=createCinematicVehicle({variant:'supercar',bodyDetail:'legacy',optimize:false}),after=createCinematicVehicle({variant:'supercar',optimize:false});
 try{
  const roof=new T.Box3().setFromObject(after.getObjectByName('roof')),liner=new T.Box3().setFromObject(after.getObjectByName('roof-liner'));
  assert.ok(Math.abs(roof.max.y-liner.max.y-.028)<.003,'liner follows actual curved roof at 28mm inset');
  assert.ok(Math.abs(roof.min.y-liner.min.y-.028)<.003,'liner edge follows pillars');
  for(const name of ['steering-wheel','pedals','front-seat-left'])assert.deepEqual(after.getObjectByName(name).position.toArray(),before.getObjectByName(name).position.toArray());
 }finally{disposeObject(before);disposeObject(after);}
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
