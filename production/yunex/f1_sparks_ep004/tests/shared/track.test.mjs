import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTrackSurface} from '../../production/yunex/f1_sparks_ep004/shared/track.ts';

test('EP004 track contact profile is finite and deterministic for out-of-order frames',()=>{
  const distances=[0,72,71.7,138,150,72,0,138];
  const values=distances.map(d=>sampleTrackSurface(d));
  assert.deepEqual(values[0],values[6]);
  assert.deepEqual(values[1],values[5]);
  assert.deepEqual(values[3],values[7]);
  for(const {heightM,slopeMPerM} of values){assert.ok(Number.isFinite(heightM)); assert.ok(Number.isFinite(slopeMPerM));assert.ok(heightM>=0);}
  assert.ok(sampleTrackSurface(72).heightM>sampleTrackSurface(90).heightM);
  assert.throws(()=>sampleTrackSurface(NaN));
});
