import {test} from 'node:test';import assert from 'node:assert/strict';
import {createStudioEnvironment,resolveConfig,PRESETS} from '../../src/yunex/studio-v5/environment.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
import {VEHICLES,ENVIRONMENTS} from '../../src/yunex/world-kit/catalog.ts';
test('four presets have road-led scenery and finite geometry',()=>{
 for(const preset of Object.keys(PRESETS)){
 const e=createStudioEnvironment({preset,quality:'preview'});assert.ok(e.group.getObjectByName('v5-road'));assert.ok(e.group.getObjectByName('v5-scenery'));
 e.group.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});disposeObject(e.group);
 }
 assert.equal(VEHICLES.length,36);assert.equal(ENVIRONMENTS.length,20);
});
test('structured configuration rejects typos and out of range settings',()=>{
 assert.throws(()=>resolveConfig({preset:'ocean'}),/preset/);assert.throws(()=>resolveConfig({preset:'city',vegetation:2}),/vegetation/);
 assert.throws(()=>resolveConfig({preset:'city',weather:'snow'}),/weather/);
 assert.throws(()=>resolveConfig({preset:'city',qualty:'hero'}),/Unknown/);
 assert.equal(resolveConfig({preset:'mountain',vegetation:0}).vegetation,0);
});
test('hero rally foliage uses a bounded instanced LOD budget',()=>{
 const e=createStudioEnvironment({preset:'rally',quality:'hero'}),foliage=e.group.getObjectByName('v5-instanced-foliage-branches');assert.ok(foliage.isInstancedMesh);assert.ok(foliage.count<50000,`Unbounded foliage: ${foliage.count}`);assert.equal(foliage.castShadow,false);disposeObject(e.group);
});
