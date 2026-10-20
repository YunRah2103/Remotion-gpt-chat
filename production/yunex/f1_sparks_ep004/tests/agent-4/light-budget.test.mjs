import test from 'node:test';
import assert from 'node:assert/strict';
import {routeLength} from '../../../../../src/yunex/world-kit/environments.ts';
import {lampIntensityWeight} from '../../look/fixture-lighting.ts';

test('night lamps select finite nearby track towers without strobe or distant fill', () => {
  const lap = routeLength('track');
  const lamps = Array.from({length:12},(_,i)=>lap*(i+.18)/12);
  for (const d of [0, 30, 72, 101, 138, 175, lap-0.12]) {
    const values = lamps.map(p=>lampIntensityWeight(d,p,lap));
    assert.ok(values.every(v=>v>=0 && v<=1 && Number.isFinite(v)));
    assert.ok(values.filter(v=>v>0.08).length<=4, 'far light sources must be culled');
    assert.deepEqual(values, lamps.map(p=>lampIntensityWeight(d,p,lap)));
    assert.deepEqual(values, lamps.map(p=>lampIntensityWeight(d+lap,p,lap)));
  }
});
test('light budget follows lap closure and has smooth spatial falloff', () => {
  const lap = routeLength('track');
  for(const offset of [-45,-42,-20,0,20,42,45]) {
    const a=lampIntensityWeight(lap+offset,0,lap);
    const b=lampIntensityWeight(offset,0,lap);
    assert.ok(Math.abs(a-b)<1e-11);
  }
  assert.equal(lampIntensityWeight(0,0,lap),1);
  assert.equal(lampIntensityWeight(42,0,lap),0);
  assert.ok(lampIntensityWeight(6,0,lap)>lampIntensityWeight(12,0,lap));
});
