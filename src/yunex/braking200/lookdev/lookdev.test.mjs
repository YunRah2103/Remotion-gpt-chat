import test from 'node:test';
import assert from 'node:assert/strict';
import {clamp01,heatLuminance,calibrationHeat,worldFromCar} from './math.ts';
test('heat is non-negative, monotone, capped, bounded and deterministic',()=>{
  assert.equal(clamp01(-2),0);
  assert.equal(clamp01(1.8),1);
  assert.equal(clamp01(NaN),0);
  const a=[0,.1,.4,.8,1,2].map(heatLuminance);
  assert.ok(a.every(Number.isFinite));
  assert.ok(a.every((v,i)=>i===0||v>=a[i-1]));
  assert.equal(a[0],0);assert.equal(a.at(-1),.24);
  assert.equal(heatLuminance(0.2),heatLuminance(0.2));
});
test('preview heat is temporary and never a claimed temperature',()=>{
  assert.equal(calibrationHeat(0),0);assert.equal(calibrationHeat(.8),0);
  assert.ok(calibrationHeat(1.8)>0);
  assert.ok(calibrationHeat(3.5)<calibrationHeat(2));
});
test('kit axis conversion +X forward and +Z left',()=>{
  assert.deepEqual(worldFromCar([2,1,3],[10,0,20],0),[12,1,23]);
  const p=worldFromCar([2,1,0],[0,0,0],Math.PI/2);
  assert.ok(Math.abs(p[0])<1e-10);assert.ok(Math.abs(p[2]+2)<1e-10);
});
