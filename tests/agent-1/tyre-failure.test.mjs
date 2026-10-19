import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTyreFailure, MAX_LOADED_DROP_M} from '../../production/yunex/tyre_blowout_ep003/mechanics/sampleTyreFailure.ts';
import {sampleRubberVertex,toRoadHeight,referenceRimRoadClearanceM} from '../../production/yunex/tyre_blowout_ep003/mechanics/roadContact.ts';

const frame=(t,spin=0)=>sampleTyreFailure(t,{angularPhaseRad:spin});
test('pressure stays intact before the reference event then drops smoothly and deterministically',()=>{
  const initial=frame(0),pre=frame(.749999),at=frame(.75),mid=frame(.9),after=frame(2);
  for(const f of [initial,pre,at]){
    assert.equal(f.pressureRatio,1);assert.equal(f.failureProgress,0);
    assert.equal(f.effectiveRadiusM,.36);
  }
  assert.ok(mid.pressureRatio<1&&mid.pressureRatio>.10);
  assert.ok(mid.effectiveRadiusM<.36&&mid.effectiveRadiusM>.30);
  assert.ok(Math.abs(after.pressureRatio-.1)<1e-12);
  assert.ok(Math.abs(after.effectiveRadiusM-(.36-MAX_LOADED_DROP_M))<1e-12);
  assert.equal(after.treadSeparation,0);
  assert.deepEqual(frame(.9),mid);
});
test('arbitrary seek / reverse / 30 and 60 fps yield exactly the same state at shared times',()=>{
  const samples=Array.from({length:241},(_,i)=>frame(i/60,-i*.78));
  for(const i of [240,0,120,45,60,30,90])assert.deepEqual(frame(i/60,-i*.78),samples[i]);
  for(let i=0;i<120;i++)assert.deepEqual(frame(i/30,-i*1.56),samples[i*2]);
});
test('severity, onset, phase and invalid inputs are guarded',()=>{
  assert.equal(sampleTyreFailure(9,{severity:0}).pressureRatio,1);
  assert.equal(sampleTyreFailure(9,{severity:0}).effectiveRadiusM,.36);
  assert.equal(sampleTyreFailure(9,{failureStartSec:12}).failureProgress,0);
  assert.throws(()=>frame(-.01));
  assert.throws(()=>frame(NaN));
  assert.throws(()=>sampleTyreFailure(0,{severity:2}));
  assert.throws(()=>sampleTyreFailure(0,{pressureFallSec:0}));
  assert.throws(()=>sampleTyreFailure(0,{angularPhaseRad:Infinity}));
});
test('contact patch remains ground-fixed for spinning tread, grooves and beads',()=>{
  for(const t of [0,.76,.81,.9,.98,1.05,1.8]){
    for(const phase of [-102.3,-6.1,-1.2,0,1.3,9.5,250.8]){
      const f=frame(t,phase);
      for(const kind of ['tyre','groove','bead']){
        for(const r of [.275,.302,.325,.35,.36]){
          for(let i=0;i<128;i++){
            const a=i*Math.PI*2/128;
            const rest=[Math.cos(a)*r,Math.sin(a)*r,.07];
            const deformed=sampleRubberVertex(rest,f,kind);
            const roadY=toRoadHeight(deformed,phase,f.effectiveRadiusM);
            assert.ok(roadY>=-1e-9,`clipping at t=${t}, angle=${a}, phase=${phase}, kind=${kind}, height=${roadY}`);
            for(const v of deformed)assert.ok(Number.isFinite(v));
          }
        }
      }
      assert.ok(referenceRimRoadClearanceM(f)>.020);
    }
  }
});
test('contact deformation is not wheel-phase-locked',()=>{
  const f1=frame(2,0),f2=frame(2,Math.PI/2);
  const south=[0,-.36,.065],west=[-.36,0,.065];
  const a=sampleRubberVertex(south,f1,'tyre');
  const b=sampleRubberVertex(west,f2,'tyre');
  assert.ok(Math.abs(Math.hypot(a[0],a[1])-Math.hypot(b[0],b[1]))<1e-9);
  assert.ok(Math.hypot(a[0],a[1])<.31);
  assert.equal(frame(0).pressureRatio,1);
});
