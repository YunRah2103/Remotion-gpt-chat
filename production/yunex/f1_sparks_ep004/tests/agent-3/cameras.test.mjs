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
    assert.ok(a.fovDeg>=35&&a.fovDeg<=68);
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
test('portrait spark-origin macro and readable full-car racing exit with controlled FOV',()=>{
  const hook=sampleShotCamera('spark-hook',0,fixtures());
  const w=visibleWidthAtTarget(hook);
  assert.ok(w>1.7&&w<3.2,'intentional phone-readable tight first-frame spark macro width '+w);
  assert.ok(hook.positionWorld[1]>=.30&&hook.positionWorld[1]<.9,'true asphalt-skimming first-shot lens height');
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


test('full vehicle outline is safely framed during wide shot phases after intentional close-up inserts',()=>{
  const dot=(a,b)=>a.reduce((acc,v,i)=>acc+v*b[i],0);
  const norm=(a)=>Math.hypot(...a);
  for(const shot of ['spark-hook','rear-mystery','aero-load','racing-payoff']){
    const dur=CAMERA_SHOTS[shot].suggestedDurationSec;
    const fractions=shot==='spark-hook'?[.70,.85,1]:shot==='racing-payoff'?[.66,.85,1]:[0,.25,.5,.75,1];
    for(const fraction of fractions){
      const {positionWorld:eye,targetWorld:target,fovDeg:fov}=sampleShotCamera(shot,fraction*dur,fixtures());
      const forward=target.map((v,i)=>(v-eye[i])/norm(target.map((q,j)=>q-eye[j])));
      const right=[-forward[2],0,forward[0]];
      const rightLength=norm(right),unitRight=right.map(v=>v/rightLength);
      const limit=Math.tan(fov*Math.PI/360)*(1080/1920);
      for(const x of [-2.75,2.75])for(const y of [0,1.05])for(const z of [-1.05,1.05]){
        const displacement=[x-eye[0],y-eye[1],z-eye[2]];
        const distance=dot(displacement,forward);
        assert.ok(distance>0,shot+' corner behind camera');
        const horizontal=dot(displacement,unitRight)/(distance*limit);
        assert.ok(Math.abs(horizontal)<1,shot+' crops a vehicle corner at '+fraction+': '+horizontal);
      }
    }
  }
});
