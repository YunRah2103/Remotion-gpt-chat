import {test} from 'node:test';import assert from 'node:assert/strict';
import * as showcases from '../../src/yunex/modelling-kit/showcases.ts';
import {compileRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
test('six editable showcase recipes cover road, loose terrain, Formula, mechanics, world and complete silent film',()=>{
 assert.deepEqual(Object.keys(showcases.SHOWCASES??{}),['A','B','C','D','E','F']);
 const all=Object.values(showcases.SHOWCASES).map(r=>compileRecipe(r));assert.equal(new Set(all.map(r=>r.id)).size,6);
 for(const r of all){assert.ok(r.durationInFrames>=180);assert.equal(r.audio,undefined);}
 assert.ok(showcases.SHOWCASES.B.world.roughness>0);assert.equal(showcases.SHOWCASES.C.vehicle.variant,'formula-modern');
 assert.ok(all[5].durationInFrames>=600&&all[5].durationInFrames<=900);
});
