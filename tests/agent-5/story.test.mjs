import test from 'node:test';
import assert from 'node:assert/strict';
import {samplePreviewFixture} from '../../production/yunex/tyre_blowout_ep003/previews/agent-5/fixture.ts';
import {sampleStoryVisuals} from '../../production/yunex/tyre_blowout_ep003/story/state.ts';

test('hook sees genuine progressing relative deflation in supplied frames',()=>{
  const before=samplePreviewFixture(.70,'pressure');
  const after=samplePreviewFixture(1.18,'pressure');
  const start=sampleStoryVisuals(before),end=sampleStoryVisuals(after);
  assert.equal(start.pressureLoss01,0);
  assert.ok(end.pressureLoss01>0);
  assert.ok(end.contactGlow01>0);
  assert.deepEqual(end.wheelCenterM,after.dynamics.wheels['front-right'].hubWorldM);
});
test('force arrow derives direction only from full supplied wheel force values',()=>{
  const r=samplePreviewFixture(1.40,'forces');
  const a=sampleStoryVisuals(r);
  assert.equal(a.lateralCue.side,-1);
  const missing=structuredClone(r);
  delete missing.dynamics.wheels['rear-right'].lateralForceN;
  assert.equal(sampleStoryVisuals(missing).lateralCue,null);
  const flipped=structuredClone(r);
  for (const v of Object.values(flipped.dynamics.wheels)) v.lateralForceN=200;
  assert.equal(sampleStoryVisuals(flipped).lateralCue.side,1);
});
test('repeated and unordered frame sampling is pure and deterministic',()=>{
  const times=[3.2,.60,1.11,2.47,3.2,.60];
  const out=times.map(t=>sampleStoryVisuals(samplePreviewFixture(t,'forces')));
  assert.deepEqual(out[0],out[4]);
  assert.deepEqual(out[1],out[5]);
});
test('invalid mixed-time or nonphysical tyre values fail rather than invent graphic',()=>{
  const request=samplePreviewFixture(1.2,'pressure');
  const mixed=structuredClone(request);mixed.tyre.tSec+=.2;
  assert.throws(()=>sampleStoryVisuals(mixed),/same simulation time/);
  const damaged=structuredClone(request);damaged.tyre.pressureRatio=-1;
  assert.throws(()=>sampleStoryVisuals(damaged),/Invalid wheel/);
});
test('driver and recovery microtype obey authoritative dynamics stages',()=>{
  const stabilise=samplePreviewFixture(1.55,'reaction');
  assert.equal(sampleStoryVisuals(stabilise).label,'STEADY THE WHEEL');
  const slowed=samplePreviewFixture(3.2,'recovery');
  assert.equal(sampleStoryVisuals(slowed).label,'SLOW DOWN GRADUALLY');
  assert.equal(sampleStoryVisuals(samplePreviewFixture(.25,'hook')).label,null);
});
