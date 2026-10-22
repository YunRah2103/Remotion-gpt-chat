import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {plantedMetrics,polishFollowCamera,motionFromCinema,defaultPolishRoute} from './dynamics.ts';
const specimen=(frame=0)=>{
 const distanceMeters=12*frame/30+.3*(frame/30)**2;
 const routeDistanceMeters=55+distanceMeters;
 return {frame,fps:30,speedMps:12+.6*frame/30,distanceMeters,routeDistanceMeters,
  steerRadians:.11,pose:sampleRoute('track',routeDistanceMeters),gearChange:0,afterfireDemand:0};
};
test('deterministic finite pose for shuffled frames',()=>{
 for(const f of [0,29,80,149,179,80,0]){
  const s=specimen(f),a=plantedMetrics(s),b=plantedMetrics(s);
  assert.deepEqual(a,b);
  for(const v of Object.values(a))assert.ok(Number.isFinite(v));
  assert.ok(Math.abs(a.roll)<=.018&&Math.abs(a.pitch)<=.019);
  assert.ok(a.compression>=0&&a.compression<=.018);
 }
});
test('pure adapter and canonical V3 track route',()=>{
 const s=specimen(80);
 assert.deepEqual(motionFromCinema(s),s);
 assert.deepEqual(defaultPolishRoute(s.routeDistanceMeters),sampleRoute('track',s.routeDistanceMeters));
});
test('follow camera remains bounded, stateless and aim shifts forward',()=>{
 const s=specimen(100),cam={position:[0,3,5],target:[0,.7,0],fov:42};
 const p=polishFollowCamera(cam,s);
 assert.deepEqual(p,polishFollowCamera(cam,s));
 assert.deepEqual(p.position,cam.position);
 assert.equal(p.fov,cam.fov);
 assert.ok(Math.abs(p.target[0]-cam.target[0])<=.38);
 assert.ok(Math.abs(p.target[2]-cam.target[2])<=.38);
});
test('nonfinite / invalid samples fail closed',()=>{
 assert.throws(()=>plantedMetrics({...specimen(0),fps:0}));
 assert.throws(()=>plantedMetrics({...specimen(0),speedMps:NaN}));
});
