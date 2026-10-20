import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMERA_SHOTS,sampleShotCamera,sampleRetimedShotCamera,
  blendCameraPoses,visibleWidthAtTarget,cameraLocalToWorld,
} from '../../cinema/cameras.ts';
const fixtures=(x=0,yaw=0)=>({
  tSec:0,routeDistanceM:72,speedMps:62,worldPosition:[x,0,0],
  yawRad:yaw,pitchRad:0,rollRad:0,heaveM:0,wheelRotationRad:0,
  wheelCompressionM:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0},
  downforceProxy01:0.6,
});
const shots=Object.keys(CAMERA_SHOTS);
test('all six distinctive shots are registered',()=>{
  assert.deepEqual(shots,['spark-hook','rear-mystery','underfloor-reveal','aero-load','contact-macro','racing-payoff']);
  assert.equal(new Set(shots.map(s=>sampleShotCamera(s,0,fixtures()).positionWorld.join(','))).size,6);
});
test('stateless time-seeking and no mutable camera accumulation',()=>{
  for(const shot of shots){
    const m=fixtures(42,.8),d=CAMERA_SHOTS[shot].suggestedDurationSec;
    const a=sampleShotCamera(shot,d*.65,m);
    sampleShotCamera(shot,d*.91,m);sampleShotCamera(shot,d*.05,m);
    assert.deepEqual(sampleShotCamera(shot,d*.65,m),a);
    assert.ok(a.fovDeg>=35&&a.fovDeg<=62);
    assert.ok(Number.isFinite(a.focusDistanceM)&&a.focusDistanceM>.4);
  }
});
test('camera follows authoritative translation/yaw only',()=>{
  for(const shot of shots){
    const a=sampleShotCamera(shot,.7,fixtures(0,0));
    const b=sampleShotCamera(shot,.7,fixtures(123,0));
    assert.ok(Math.abs(b.positionWorld[0]-a.positionWorld[0]-123)<1e-9,shot);
    assert.ok(Math.abs(b.targetWorld[0]-a.targetWorld[0]-123)<1e-9,shot);
  }
  assert.deepEqual(cameraLocalToWorld([1,2,0],fixtures(0,Math.PI/2)).map(v=>Math.round(v)),[0,2,-1]);
});
test('rear->underfloor->macro camera cut-free endpoints',()=>{
  const m=fixtures(9,.2);
  for(const [a,b] of [['rear-mystery','underfloor-reveal'],['underfloor-reveal','contact-macro']]){
    const end=sampleShotCamera(a,CAMERA_SHOTS[a].suggestedDurationSec,m);
    const begin=sampleShotCamera(b,0,m);
    assert.deepEqual(end,begin, a+' to '+b);
  }
});
test('portrait FOV and stable passing car frame',()=>{
  const hook=sampleShotCamera('spark-hook',0,fixtures());
  const w=visibleWidthAtTarget(hook);
  assert.ok(w>3.5&&w<8, '9:16 projected width '+w);
  assert.ok(hook.positionWorld[1]<.7);
  const finish=sampleShotCamera('racing-payoff',CAMERA_SHOTS['racing-payoff'].suggestedDurationSec,fixtures());
  assert.ok(finish.positionWorld[1]>0.8);
});
test('retime, crossfade, finite guards and invalid duration',()=>{
  const m=fixtures();
  const a=sampleShotCamera('aero-load',1.5,m),b=sampleRetimedShotCamera('aero-load',2,4,m);
  assert.deepEqual(a,b);
  assert.deepEqual(blendCameraPoses(a,b,.5),a);
  assert.throws(()=>sampleRetimedShotCamera('aero-load',0,0,m));
  assert.throws(()=>sampleShotCamera('aero-load',NaN,m));
});
