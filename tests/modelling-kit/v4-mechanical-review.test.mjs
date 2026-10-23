import test from 'node:test';import assert from 'node:assert/strict';
import {createAssembly,animateAssembly,validateModel} from '../../src/yunex/modelling-kit/authoring.ts';
import {createV4Production} from '../../src/yunex/modelling-kit/v4-production.ts';
import {TWIN_TURBO_V8} from '../../src/yunex/modelling-kit/v3-proofs.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('V4 inspection retains hot turbo housings at active pipe junctions while legacy cutaway stays unchanged',()=>{
 const before=structuredClone(TWIN_TURBO_V8),recipe=createV4Production({kind:'film'}).recipe,assembly=recipe.shots.find(s=>s.assembly).assembly,model=createAssembly(assembly);try{for(const name of ['turbo-left','turbo-right'])assert.equal(model.getObjectByName(name).getObjectByName('turbine-housing').visible,true,name+' active inlet must retain its housing');assert.deepEqual(TWIN_TURBO_V8,before);assert.equal(validateModel(model).errors.length,0);const markers=[];model.traverse(o=>{if(o.userData.flow)markers.push(o);});assert.ok(markers.length>=8,'flow markers explain the authored feed/charge routes');animateAssembly(model,90,30);const pose=markers.map(o=>o.position.toArray());animateAssembly(model,1,30);animateAssembly(model,90,30);assert.deepEqual(markers.map(o=>o.position.toArray()),pose);}finally{disposeObject(model);}
});
test('assembly cutaway controls validate before invoking part factories',()=>{let calls=0;assert.throws(()=>createAssembly({id:'invalid',version:1,nodes:[{id:'turbo',part:'turbo-small',cutaway:'false'}],connections:[]},()=>{calls++;throw Error('factory invoked');}),/cutaway.*boolean/i);assert.equal(calls,0);});
