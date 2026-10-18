import test from 'node:test';
import assert from 'node:assert/strict';
import {BRAKING_EP001,PROVISIONAL_CUES,wheelAnchors} from '../contracts.ts';
import {CAMERA_SHOTS,cameraShotAtFrame,sampleCameraPose,vehicleToWorld} from './cameraRig.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';

const car=vehicleSpec(BRAKING_EP001.vehicleVariant);
const route={position:[5,0,12],yaw:0};
test('all six cinematic cues are covered in order, 750 frames',()=>{
  assert.deepEqual(CAMERA_SHOTS.map(s=>s.id),PROVISIONAL_CUES.map(c=>c.cue));
  for(const cue of PROVISIONAL_CUES){
    assert.equal(cameraShotAtFrame(cue.fromFrame).shot,cue.cue);
    assert.equal(cameraShotAtFrame(cue.toFrameExclusive-1).shot,cue.cue);
  }
  assert.equal(cameraShotAtFrame(-100).shot,'hook');
  assert.equal(cameraShotAtFrame(999).shot,'finale');
  assert.throws(()=>cameraShotAtFrame(NaN),/finite/);
});
test('camera samples remain deterministic, physical and finite on all shots',()=>{
  for(let frame=0;frame<750;frame+=5){
    const p=sampleCameraPose(frame,route,car);
    assert.deepEqual(sampleCameraPose(frame,route,car),p);
    assert.ok(p.fovDeg>=20&&p.fovDeg<=60);
    assert.ok([...p.position,...p.target].every(Number.isFinite));
    const distance=Math.hypot(...p.position.map((v,i)=>v-p.target[i]));
    assert.ok(distance>.2&&distance<40,'camera should frame real subject, not disappear');
  }
});
test('camera is route-locked, including yaw and translation',()=>{
  const base=sampleCameraPose(70,{position:[0,0,0],yaw:0},car);
  const shifted=sampleCameraPose(70,{position:[27,2,-40],yaw:0},car);
  for(const [actual,expected] of [
    [shifted.position.map((v,i)=>v-base.position[i]),[27,2,-40]],
    [shifted.target.map((v,i)=>v-base.target[i]),[27,2,-40]],
  ]){
    for(let i=0;i<3;i++)assert.ok(Math.abs(actual[i]-expected[i])<1e-9,
      'route-translation invariance within floating-point precision');
  }
  const q=vehicleToWorld([1,2,0],{position:[10,0,20],yaw:Math.PI/2});
  assert.ok(Math.abs(q[0]-10)<1e-9);
  assert.ok(Math.abs(q[1]-2)<1e-9);
  assert.ok(Math.abs(q[2]-19)<1e-9);
});
test('mechanism, heat and ABS aim at the actual front-left wheel',()=>{
  const front=wheelAnchors(car).find(w=>w.id==='front-left');
  assert.ok(front);assert.equal(front.center[0],car.wheelbase/2);
  assert.equal(front.center[2],car.width/2-.09);
  for(const f of [180,310,570]){
    const p=sampleCameraPose(f,route,car);
    assert.equal(p.focusId,'front-left');
    assert.ok(Math.abs(p.target[0]-(route.position[0]+front.center[0]))<.3);
    assert.ok(Math.abs(p.target[2]-(route.position[2]+front.center[2]))<.3);
  }
});
test('individual shots move meaningfully, but do not teleport during a shot',()=>{
  for(const cue of PROVISIONAL_CUES){
    const frames=[cue.fromFrame+4,cue.fromFrame+11,cue.fromFrame+18];
    const points=frames.map(f=>sampleCameraPose(f,route,car).position);
    const step=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
    assert.ok(step(points[0],points[2])>.005,'shots must have genuine camera movement');
    assert.ok(step(points[0],points[1])<2,'no intra-shot teleport');
  }
});

/**
 * Software-projection guard for a narrow 9:16 viewport.
 * A 16:9-only camera can silently crop the entire tyre or both bumpers
 * in portrait; checking target distance alone does not catch this.
 */
test('hero silhouette and front-left wheel remain composed for 9:16',()=>{
  const plus=(a,b)=>a.map((v,i)=>v+b[i]);
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],
    a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=(v)=>v.map(n=>n/Math.hypot(...v));
  const project=(camera,point)=>{
    const forward=norm(sub(camera.target,camera.position));
    const right=norm(cross(forward,[0,1,0]));
    const up=cross(right,forward),delta=sub(point,camera.position);
    const depth=dot(delta,forward);
    assert.ok(depth>.05,'projected subject must be in front of the lens');
    const halfHeight=depth*Math.tan(camera.fovDeg*Math.PI/360);
    return [dot(delta,right)/(halfHeight*(1080/1920)),dot(delta,up)/halfHeight];
  };
  const w=wheelAnchors(car).find(w=>w.id==='front-left');
  assert.ok(w);
  for(const cue of PROVISIONAL_CUES){
    const isMacro=['mechanism','heat','grip','abs'].includes(cue.cue);
    // Once the front rim is removed in the actual A1 integration heat shot,
    // its real rotor is the visible subject. Do not force a physically
    // nonexistent opaque tyre to fit the exposed rotor macro.
    const radius=cue.cue==='heat'?w.radiusM*.645:w.radiusM;
    const targetPoints=isMacro?
      Array.from({length:24},(_,j)=>[
        w.center[0]+Math.cos(j*Math.PI/12)*radius,
        w.center[1]+Math.sin(j*Math.PI/12)*radius,
        w.center[2]+(cue.cue==='heat'?.05:.14),
      ]):
      [-car.length/2,car.length/2].flatMap(x=>
        [0,car.height].flatMap(y=>
          [-car.width/2,car.width/2].map(z=>[x,y,z])));
    for(const frame of [cue.fromFrame,Math.floor((cue.fromFrame+cue.toFrameExclusive)/2),
       cue.toFrameExclusive-1]){
      const camera=sampleCameraPose(frame,route,car);
      const imagePoints=targetPoints.map(local=>project(camera,plus(route.position,local)));
      const maxX=Math.max(...imagePoints.map(p=>Math.abs(p[0])));
      const maxY=Math.max(...imagePoints.map(p=>Math.abs(p[1])));
      assert.ok(maxX<1.09,`${cue.cue} frame ${frame}: 9:16 horizontal clip (NDC ${maxX})`);
      assert.ok(maxY<.88,`${cue.cue} frame ${frame}: 9:16 vertical clip (NDC ${maxY})`);
    }
  }
});
