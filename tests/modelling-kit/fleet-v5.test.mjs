import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';

test('fleet coachwork covers every catalogue vehicle with finite geometry and canonical axles',()=>{
 for(const s of VEHICLES){
  const car=createCinematicVehicle({variant:s.id,bodyDetail:'fleet',quality:'hero',optimize:false});
  assert.equal(car.userData.bodyArchitecture,'fleet-v5',s.id);
  const mounts=car.children.filter(o=>o.name.startsWith('mount-'));
  assert.equal(mounts.length,s.family==='bike'?2:s.axles*2,s.id);
  for(const m of mounts) assert.equal(m.position.y,s.radius,s.id);
  let triangles=0;
  car.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(const a of [p,n])if(a)for(const v of a.array)assert.ok(Number.isFinite(v),s.id+' '+o.name);triangles+=(o.geometry.index?.count??p.count)/3;}});
  assert.ok(triangles>1000,s.id);
  animateCinematicVehicle(car,{frame:30,fps:30,distance:12,speed:12,steer:.12});
  const pose=mounts.map(m=>m.matrixWorld.toArray());
  animateCinematicVehicle(car,{frame:7,fps:30,distance:2,speed:12});
  animateCinematicVehicle(car,{frame:30,fps:30,distance:12,speed:12,steer:.12});
  assert.deepEqual(mounts.map(m=>m.matrixWorld.toArray()),pose,s.id);
  disposeObject(car);
 }
});
test('V4 approved reference and existing defaults retain their architectures',()=>{
 const v4=createCinematicVehicle({variant:'supercar',bodyDetail:'studio',optimize:false});
 assert.equal(v4.userData.bodyArchitecture,'section-loft-v4');
 assert.ok(v4.getObjectByName('exhaust-outlet-left'));
 const legacy=createCinematicVehicle({variant:'saloon'});
 assert.notEqual(legacy.userData.bodyArchitecture,'fleet-v5');
 disposeObject(v4);disposeObject(legacy);
});
test('fleet road shell normals remain smooth after clipping cabin and lamps',()=>{
 const car=createCinematicVehicle({variant:'grand-tourer',bodyDetail:'fleet',optimize:false});
 const body=car.getObjectByName('arched-body'),p=body.geometry.attributes.position,n=body.geometry.attributes.normal;
 const bins=new Map();let discontinuities=0;
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');const normal=new T.Vector3().fromBufferAttribute(n,i),prev=bins.get(key);if(prev&&prev.dot(normal)<.9)discontinuities++;else bins.set(key,normal);}
 assert.equal(discontinuities,0,'duplicated clipped vertices must retain interpolated shared normals');disposeObject(car);
});
test('fleet supports quality selection without reverting silhouette',()=>{
 for(const quality of ['lightweight','standard','hero']){
  const car=createCinematicVehicle({variant:'saloon',bodyDetail:'fleet',quality,optimize:false});
  assert.equal(car.userData.bodyArchitecture,'fleet-v5');assert.ok(car.getObjectByName('windshield'));
  assert.ok(car.getObjectByName('arched-body'));disposeObject(car);
 }
});
test('high-level fleet workflows compile valid recipes and reject conflicting selectors',async()=>{
 const {createFleetVehicle,createFleetRecipe,fleetCatalogue}=await import('../../src/yunex/modelling-kit/fleet.ts');
 const {compileRecipe}=await import('../../src/yunex/modelling-kit/recipe.ts');
 assert.equal(fleetCatalogue().length,VEHICLES.length);
 const car=createFleetVehicle({family:'sedan',quality:'standard'});assert.equal(car.userData.variant,'saloon');disposeObject(car);
 assert.equal(compileRecipe(createFleetRecipe({id:'fleet-test'})).durationInFrames,180);
 assert.throws(()=>createFleetVehicle({family:'rally',variant:'saloon'}),/does not belong/);
 assert.throws(()=>createFleetVehicle({family:'unknown'}),/Unknown fleet family/);
});
test('fleet road families pass structural audit and detect a displaced wheel anchor',async()=>{
 const {auditFleetVehicle}=await import('../../src/yunex/modelling-kit/fleet-quality.ts');
 for(const variant of ['saloon','grand-tourer','rally-hatch','long-suv','crew-pickup','panel-van','roadster','supercar']){
  const car=createCinematicVehicle({variant,bodyDetail:'fleet',optimize:false}),audit=auditFleetVehicle(car);
  assert.deepEqual(audit.issues,[],variant);assert.equal(audit.visualApproval,'pending');
  car.getObjectByName('mount-front-left').userData.restPosition[1]+=1;
  assert.equal(auditFleetVehicle(car).state,'fail');disposeObject(car);
 }
});
