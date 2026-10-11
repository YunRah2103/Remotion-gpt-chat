import test from 'node:test';
import assert from 'node:assert/strict';
import {load,validateStructure,validateStrict} from './validate-shotmap.mjs';

test('22 contiguous 16:9 film shots cover exactly 316 frames and >=6 planned marques',()=>{
  const report=validateStructure(load());
  assert.deepEqual(report.errors,[]);
  assert.equal(report.shotCount,22);
  assert.ok(report.plannedMakes.length>=6);
  assert.equal(load().shots[0].from,0);
  assert.equal(load().shots.at(-1).to,316);
});
test('cuts land at the measured 2.60s and later impact frames',()=>{
  const map=load();
  assert.deepEqual(map.impactFrames,[78,158,240]);
  for(const frame of map.impactFrames)
    assert.ok(map.shots.some(s=>s.from===frame),'no shot cut at '+frame);
});
test('gap/repeat and non-GT3 monoculture are rejected',()=>{
  const map=load();
  const mutated=structuredClone(map);
  mutated.shots[5].from+=1;
  assert.ok(validateStructure(mutated).errors.some(e=>e.includes('gap/overlap')));
  const repeated=structuredClone(map);
  for(const s of repeated.shots)s.targetMake='Porsche';
  assert.ok(validateStructure(repeated).errors.some(e=>e.includes('Multi-marque')));
});
test('missing real footage makes strict video gate FAIL rather than a fake PASS',async()=>{
  const result=await validateStrict(load());
  assert.ok(result.errors.length>0);
  assert.ok(result.errors.some(e=>e.includes('lacks verified actual source')));
  assert.equal(result.verifiedMediaCount,0);
});
