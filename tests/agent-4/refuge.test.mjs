import test from 'node:test';
import assert from 'node:assert/strict';
import {REFUGE,refugeTaper,refugeRailZ,refugePavedWidthM,
  fitsStoppedGrandTourer} from '../../production/yunex/tyre_blowout_ep003/look/refuge-profile.ts';

test('refuge widens only in +X travel direction and stays within world-kit road length',()=>{
  assert.equal(refugeRailZ(-50),REFUGE.originalRailZ);
  assert.equal(refugeRailZ(REFUGE.startX),REFUGE.originalRailZ);
  assert.equal(refugeRailZ(REFUGE.fullWidthX),REFUGE.outerRailZ);
  assert.equal(refugeRailZ(109),REFUGE.outerRailZ);
  assert.ok(REFUGE.endX<=110);
  let prev=refugeRailZ(-110);
  for(let x=-109.5;x<=110;x+=.5){
    const z=refugeRailZ(x);
    assert.ok(z<=prev+1e-9,'rail cannot intrude into widening refuge');
    prev=z;
  }
});

test('entry taper is continuous with flat tangents at start/full width',()=>{
  assert.equal(refugeTaper(-1),0);
  assert.equal(refugeTaper(2),1);
  const eps=1e-4;
  assert.ok(Math.abs((refugeTaper(eps)-refugeTaper(0))/eps)<.0004);
  assert.ok(Math.abs((refugeTaper(1)-refugeTaper(1-eps))/eps)<.0004);
});

test('full-width refuge accepts complete GT with 55cm additional lateral reserve',()=>{
  assert.ok(refugePavedWidthM(65)>=6.9);
  assert.equal(fitsStoppedGrandTourer(74,-10.5),true);
  assert.equal(fitsStoppedGrandTourer(74,-1.85),false,'live lane is NOT safe stop');
  assert.equal(fitsStoppedGrandTourer(7,-10.5),false,'taper entry is NOT safe');
  assert.equal(fitsStoppedGrandTourer(109,-10.5),false,'off road end NOT safe');
  assert.equal(fitsStoppedGrandTourer(70,-13.9),false,'guardrail cannot be occupied');
  assert.equal(fitsStoppedGrandTourer(Number.NaN,-10.5),false);
});

test('no invalid infinite coordinates can create geometry',()=>{
  assert.throws(()=>refugeRailZ(Infinity),/Nonfinite/);
  assert.throws(()=>refugeTaper(Number.NaN),/Nonfinite/);
});
