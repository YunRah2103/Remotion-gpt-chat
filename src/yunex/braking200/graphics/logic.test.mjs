import test from 'node:test';
import assert from 'node:assert/strict';
import {
 projectWorldPoint,activeCueAtFrame,safePin,speedText,heatVisual01,
 shouldShowAbs,oppositeTravelPoint,roadGripVisual01,
} from './logic.ts';
import {sampleGraphicsProofOnly} from './proof-state.ts';

test('speed label is always derived from input state',()=>{
 const first=sampleGraphicsProofOnly(0),next=sampleGraphicsProofOnly(2);
 assert.equal(speedText(first),'200');
 assert.ok(Number(speedText(next))<200);
 assert.ok(Number(speedText(next))>0);
});
test('perspective pin projects camera target to portrait centre',()=>{
 const cam={position:[0,2,5],target:[0,0,0],fovDeg:40};
 const p=projectWorldPoint([0,0,0],cam);
 assert.ok(p.visible);
 assert.ok(Math.abs(p.x-540)<1e-4&&Math.abs(p.y-960)<1e-4);
 const behind=projectWorldPoint([0,2,10],cam);
 assert.equal(behind.visible,false);
 const safe=safePin({...p,x:-500,y:1900});
 assert.ok(safe.x>=80&&safe.y<=1670);
});
test('projection tracks 3D offset, not fake HUD coordinates',()=>{
 const cam={position:[0,1,6],target:[0,0,0],fovDeg:40};
 const a=projectWorldPoint([1,0,0],cam);
 assert.ok(a.x>540&&a.visible);
 assert.deepEqual(a,projectWorldPoint([1,0,0],cam));
});
test('road force points backwards along travel direction',()=>{
 assert.deepEqual(oppositeTravelPoint([4,0,2],[1,0,0],.8),[3.2,0,2]);
});
test('heat is proportional to energy budget, not temperature',()=>{
 const s=sampleGraphicsProofOnly(1);
 assert.ok(heatVisual01(s,1500000)>0);
 assert.equal(heatVisual01(s,0),0);
 assert.equal(heatVisual01({...s,brakeHeatJ:-40},1500000),0);
});
test('ABS appears only when ABS intervention flag is active',()=>{
 assert.equal(shouldShowAbs(sampleGraphicsProofOnly(.5),'front-left'),false);
 assert.equal(shouldShowAbs(sampleGraphicsProofOnly(4),'front-left'),true);
 assert.equal(shouldShowAbs(sampleGraphicsProofOnly(7),'front-left'),false);
});
test('contact-force graphic scales from state and is bounded',()=>{
 const s=sampleGraphicsProofOnly(1);
 assert.ok(roadGripVisual01(s,'front-left')>.6);
 const overloaded={...s,wheel:{...s.wheel,'front-left':{
   ...s.wheel['front-left'],roadLongitudinalForceN:1e10,
 }}};
 assert.equal(roadGripVisual01(overloaded,'front-left'),1);
});
test('chapter fallback follows the shared contract',()=>{
 assert.equal(activeCueAtFrame(0),'hook');
 assert.equal(activeCueAtFrame(200),'mechanism');
 assert.equal(activeCueAtFrame(300),'heat');
 assert.equal(activeCueAtFrame(450),'grip');
 assert.equal(activeCueAtFrame(530),'abs');
 assert.equal(activeCueAtFrame(680),'finale');
});
