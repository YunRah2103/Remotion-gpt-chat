import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('family hero bodies expose separately editable curved door skins with real thickness',()=>{
 for(const variant of ['supercar','coupe','hot-hatch','crossover','city-ev','pickup','panel-van','box-truck']){
  const car=createCinematicVehicle({variant,optimize:false}),panel=car.getObjectByName('coachbuilt-door-front-left');
  assert.ok(panel,variant);assert.equal(panel.userData.editablePanel,true);assert.ok(panel.userData.thickness>=.015);
  assert.ok(panel.geometry.attributes.position.count>500);const box=new T.Box3().setFromObject(panel);assert.ok(box.max.z-box.min.z>.017);
  const normal=panel.geometry.attributes.normal;for(let i=0;i<normal.count;i++)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(normal,i).length()-1)<.002);
  const baseline=Array.from(panel.geometry.attributes.position.array);animateCinematicVehicle(car,{frame:30,fps:30,bodyDamage:.8,cutaway:.8});animateCinematicVehicle(car,{frame:0,fps:30});assert.deepEqual(Array.from(panel.geometry.attributes.position.array),baseline);disposeObject(car);
 }
});
test('legacy bodies stay available for matched moving panel comparisons',()=>{
 const car=createCinematicVehicle({variant:'supercar',bodyDetail:'legacy',optimize:false});assert.equal(car.getObjectByName('coachbuilt-door-front-left'),undefined);disposeObject(car);
});
test('replacement skin occupies an actual opening rather than overlapping an intact side panel',()=>{
 for(const variant of ['supercar','crossover','box-truck']){
  const car=createCinematicVehicle({variant,optimize:false}),panel=car.getObjectByName('coachbuilt-door-front-left'),body=car.getObjectByName(panel.userData.sourceSurface);car.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(panel),p=box.getCenter(new T.Vector3());p.z=box.max.z+.025;
  const hits=new T.Raycaster(p,new T.Vector3(0,0,-1),0,.065).intersectObject(body,false);assert.equal(hits.length,0,variant+' hidden duplicate body skin');disposeObject(car);
 }
});
