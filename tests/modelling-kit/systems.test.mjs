import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('fitted internals cover all four-wheel catalogue variants and remain inside wheel envelope',()=>{
 for(const spec of VEHICLES.filter(s=>s.family!=='bike')){const g=createCinematicVehicle({variant:spec.id,quality:'standard'}),sys=g.getObjectByName('mechanical-systems');assert.ok(sys,spec.id);
 for(const name of ['chassis-rail','cooling-radiator','transmission','steering-rack','drive-shaft'])assert.ok(sys.getObjectByName(name),`${spec.id}: ${name}`);
 const bounds=new T.Box3().setFromObject(sys);assert.ok(bounds.min.y>.08,spec.id);assert.ok(bounds.min.x>=-spec.length/2&&bounds.max.x<=spec.length/2,spec.id);assert.ok(bounds.max.z<spec.width/2&&bounds.min.z>-spec.width/2,spec.id);
 assert.equal(!!g.getObjectByName('traction-battery'),spec.bodyStyle==='ev');assert.equal(!!g.getObjectByName('engine'),spec.bodyStyle!=='ev');disposeObject(g);}
});
test('half shafts keep connected wheel endpoints under suspension and exploded view',()=>{
 const g=createCinematicVehicle({variant:'supercar'});animateCinematicVehicle(g,{frame:30,fps:30,compression:.08,exploded:.7});g.updateMatrixWorld(true);
 g.getObjectByName('mechanical-systems').traverse(o=>{if(!o.userData.wheelEndpoint)return;const mount=g.getObjectByName(o.userData.wheelEndpoint),end=new T.Vector3(0,.5,0).applyMatrix4(o.matrixWorld);assert.ok(end.distanceTo(mount.getWorldPosition(new T.Vector3()))<1e-5);});disposeObject(g);
});
