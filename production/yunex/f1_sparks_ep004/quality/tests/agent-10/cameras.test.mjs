import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 QUALITY_SHOTS,QUALITY_TOTAL_SEC,qualityCutAtFrame,qualityCutList,
 sampleQualityCamera,sampleRetimedQualityCamera,portraitVisibleWidth
} from '../../cinema/cameras.ts';
import {PHYSICAL_BEATS,SHOT_SOURCE_TABLE,sampleQualitySource,sampleCameraComparison}
 from '../../cinema/shot-plan.ts';

const mock=(x=100,t=0)=>({
 tSec:t,routeDistanceM:100+x,speedMps:62,
 worldPosition:[x,-.04,10],yawRad:.11,pitchRad:0,rollRad:0,
 wheelRotationRad:-40,heaveM:-.04,
 wheelCompressionM:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0},
 downforceProxy01:1,
});
test('all SIX cut IDs distinct, exactly 288 source frames, no gaps',()=>{
 assert.equal(QUALITY_SHOTS.length,6);
 assert.equal(new Set(QUALITY_SHOTS.map(s=>s.shot)).size,6);
 assert.equal(QUALITY_TOTAL_SEC,9.6);
 const cuts=qualityCutList();
 assert.equal(cuts[0].startFrame,0);
 assert.equal(cuts.at(-1).endFrameExclusive,288);
 for(let i=1;i<cuts.length;i++)assert.equal(cuts[i].startFrame,cuts[i-1].endFrameExclusive);
 for(let f=0;f<288;f++)assert.equal(qualityCutAtFrame(f).cut.shot,cuts.find(s=>f<s.endFrameExclusive).shot);
 assert.throws(()=>qualityCutAtFrame(288));
});
test('no independent racing trajectory; correct world translation/yaw and camera safety',()=>{
 const motion=mock(5);
 for(const shot of QUALITY_SHOTS){
  for(const fraction of [0,.12,.25,.50,.75,.87,1]){
   const localSec=shot.durationSec*fraction;
   const p=sampleQualityCamera(shot.shot,localSec,motion);
   const p2=sampleQualityCamera(shot.shot,localSec,mock(19));
   for(let i=0;i<3;i++)assert.ok(Math.abs((p2.positionWorld[i]-p.positionWorld[i])-(i===0?14:0))<1e-7);
   assert.ok(p.fovDeg>=45&&p.fovDeg<=75);
   assert.ok(p.focusDistanceM>1.4);
   assert.equal(p.rollRad,0);
   const posY=p.positionWorld[1]-motion.worldPosition[1];
   assert.ok(posY>=.24-1e-7,'camera too low '+shot.shot);
   if(!shot.cutaway&&shot.shot!=='spark-hook'){
      assert.ok(portraitVisibleWidth(p)>3.1,'car too cropped '+shot.shot);
      assert.ok(portraitVisibleWidth(p)<8.5,'car too small '+shot.shot);
   }
  }
 }
});
test('local retime independent of physical clock: full cut can be shortened',()=>{
 for(const s of QUALITY_SHOTS){
  const first=sampleRetimedQualityCamera(s.shot,0,1.75,mock());
  const last=sampleRetimedQualityCamera(s.shot,1.75,1.75,mock());
  assert.ok(first.positionWorld.every(Number.isFinite));
  assert.ok(last.positionWorld.every(Number.isFinite));
  assert.throws(()=>sampleRetimedQualityCamera(s.shot,.3,0,mock()));
  assert.throws(()=>sampleQualityCamera(s.shot,Number.NaN,mock()));
 }
});
test('independent Agent 2 physical sourcing with explicit honest cut/replay boundaries',()=>{
 assert.equal(PHYSICAL_BEATS.length,6);
 for(let i=0;i<SHOT_SOURCE_TABLE.length;i++){
  const beat=SHOT_SOURCE_TABLE[i];
  assert.equal(beat.shot,QUALITY_SHOTS[i].shot);
  assert.ok(beat.sourceOutSec>beat.sourceInSec);
  assert.ok(beat.sourceRate>=.14,'no near-frozen simulated source');
  assert.ok(beat.handlesSec.every(v=>v>0));
  const start=sampleQualitySource(beat.startFrame),end=sampleQualitySource(beat.endFrameExclusive-1);
  assert.equal(start.shot,beat.shot);
  assert.ok(end.sourceSec>start.sourceSec);
  assert.equal(start.startDistanceM,beat.startDistanceM);
  assert.ok(end.sourceSec-start.sourceSec>.14,'shot should visibly progress in real physics time');
 }
});
test('8s before/after uses precisely matching original source clocks',()=>{
 for(const f of [0,3,18,43,59]){
  const before=sampleCameraComparison(f);
  const after=sampleCameraComparison(f+60);
  assert.equal(before.shot,'spark-hook');assert.equal(after.shot,before.shot);
  assert.equal(before.sourceSec,after.sourceSec);
  assert.equal(before.startDistanceM,after.startDistanceM);
  assert.equal(before.baseline,true);assert.equal(after.baseline,false);
  const beforePayoff=sampleCameraComparison(f+120);
  const afterPayoff=sampleCameraComparison(f+180);
  assert.equal(beforePayoff.shot,'racing-payoff');
  assert.equal(beforePayoff.sourceSec,afterPayoff.sourceSec);
 }
 assert.throws(()=>sampleCameraComparison(240));
});
test('no fake emitters; V2 rig internal decorative spark pool disabled',()=>{
 const path='production/yunex/f1_sparks_ep004/quality/previews/agent-10/';
 const facade=readFileSync(path+'KitFacade.tsx','utf8');
 const scene=readFileSync(path+'Scene.tsx','utf8');
 assert.match(facade,/createCinematicVehicle/);
 assert.match(facade,/node\.name==='contact-sparks'/);
 assert.match(facade,/if\(genericSparks\)genericSparks\.visible=false/);
 assert.match(scene,/sampleContactDrivenSparks/);
 assert.match(scene,/getSkidDescriptors/);
 assert.match(scene,/NightCircuitWorld/);
 assert.doesNotMatch(scene,/Math\.random\(/);
 assert.match(scene,/326 portrait px/);
});
