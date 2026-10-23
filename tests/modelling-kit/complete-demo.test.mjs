import {test} from 'node:test';import assert from 'node:assert/strict';
import {TWIN_TURBO_DEMO} from '../../src/yunex/modelling-kit/twin-turbo-demo.ts';
import {compileRecipe,sampleRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
import {inspectRecipe} from '../../scripts/modelling-kit/studio-v3.mjs';
test('complete silent demo has 750 contiguous frames, connected engines and editable variants',()=>{
 const r=compileRecipe(TWIN_TURBO_DEMO);assert.equal(r.durationInFrames,750);assert.equal(r.audio,undefined);
 assert.ok(r.vehicle.powertrain.connections.every(c=>c.flow));assert.ok(new Set(r.shots.map(s=>s.camera)).size>=3);
 for(const f of [0,59,60,179,180,299,300,419,420,539,540,629,630,749])assert.ok(sampleRecipe(r,f).shot);
 for(const report of Object.values(inspectRecipe(TWIN_TURBO_DEMO)))assert.deepEqual(report.errors,[]);
});
