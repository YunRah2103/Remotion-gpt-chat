import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileRecipe,sampleRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
import {V3_PROOFS} from '../../src/yunex/modelling-kit/v3-proofs.ts';
const recipe=()=>{const r=structuredClone(V3_PROOFS.sports);r.shots[0].jointTracks={'v3-rear-wing':[{time:0,value:0},{time:1,value:1},{time:2,value:0}]};return r;};
test('joint animation samples local seconds deterministically, including reverse frame order',()=>{
 const r=compileRecipe(recipe());
 assert.equal(sampleRecipe(r,15).joints['v3-rear-wing'],.5);
 assert.equal(sampleRecipe(r,30).joints['v3-rear-wing'],1);
 assert.equal(sampleRecipe(r,0).joints['v3-rear-wing'],0);
 assert.equal(sampleRecipe(r,15).joints['v3-rear-wing'],.5);
});
test('joint tracks reject duplicate times, values outside joint limits, and keys beyond shot duration',()=>{
 for(const track of [[{time:0,value:0},{time:0,value:1}],[{time:0,value:2}],[{time:3,value:.5}]]){
 const r=recipe();r.shots[0].jointTracks={'v3-rear-wing':track};assert.throws(()=>compileRecipe(r),/joint track/i);
 }
});
