import test from 'node:test';
import assert from 'node:assert/strict';
import {EDIT,FILM_FPS,FILM_FRAMES,editAtFrame} from '../../src/yunex/f1-line-ep002/editor/timeline.ts';
import {AUTHORITATIVE_RACE_PATHS,getRaceComparison,sampleRaceFrame} from '../../src/yunex/f1-line-ep002/physics/index.ts';

test('picture is contiguous and exactly 26s at 30fps, all 780 frames covered',()=>{
 assert.equal(FILM_FRAMES,780);
 assert.equal(FILM_FPS,30);
 assert.equal(EDIT.at(0)?.start,0);
 assert.equal(EDIT.at(-1)?.end,780);
 for(let i=0;i<EDIT.length;i++){
   assert.equal(EDIT[i].start,i===0?0:EDIT[i-1].end);
   assert.ok(EDIT[i].end>EDIT[i].start);
   assert.ok(EDIT[i].sourceRate>0);
 }
 for(let i=0;i<FILM_FRAMES;i++){
   const e=editAtFrame(i);
   assert.ok(Number.isFinite(e.sourceSeconds));
   assert.ok(e.localFrame>=0 && e.localFrame<e.end-e.start);
 }
 assert.throws(()=>editAtFrame(780));
 assert.throws(()=>editAtFrame(-1));
});
test('16.0–21.8s payoff is synchronous unedited A2 physics at matched gate',()=>{
 const a=AUTHORITATIVE_RACE_PATHS.shortcut,b=AUTHORITATIVE_RACE_PATHS.racing;
 assert.deepEqual(a.sampleAtDistance(0).position,b.sampleAtDistance(0).position);
 assert.deepEqual(a.sampleAtDistance(a.lengthM).position,b.sampleAtDistance(b.lengthM).position);
 for(const i of [480,495,520,550,600,630,650,653]){
   const edit=editAtFrame(i);
   assert.equal(edit.beat,'payoff');
   assert.equal(edit.replay,false);
   assert.ok(Math.abs(edit.sourceSeconds-(i-480)/30)<1e-8);
   const fromEdit=sampleRaceFrame(edit.sourceFrame,30);
   const fromPhysics=sampleRaceFrame(i-480,30);
   assert.deepEqual(fromEdit,fromPhysics);
   for(const car of [fromEdit.cars.shortcut,fromEdit.cars.racing]){
    assert.ok(Math.abs(car.pathDistanceM-car.travelDistanceM)<1e-8);
    assert.ok(Number.isFinite(car.steerRad));
    assert.ok(car.speedMps>=0);
   }
 }
 const r=getRaceComparison();
 assert.equal(r.fasterAtCommonFinish,'racing');
 assert.ok(r.racingFinishAdvantageSeconds>.13&&r.racingFinishAdvantageSeconds<.135);
 assert.ok(r.racing.finishTimeSeconds<r.shortcut.finishTimeSeconds);
 assert.ok(r.racing.pathLengthM>r.shortcut.pathLengthM);
});
test('cut coverage never freezes source for extended interval',()=>{
 for(const s of EDIT){
   const start=sampleRaceFrame(s.sourceStart*30,30);
   const end=sampleRaceFrame((s.sourceStart+(s.end-s.start-1)/30*s.sourceRate)*30,30);
   assert.ok(end.cars.racing.pathDistanceM>=start.cars.racing.pathDistanceM);
   assert.ok(end.cars.shortcut.pathDistanceM>=start.cars.shortcut.pathDistanceM);
   // No block may consist entirely of parked cars at the final gate.
   assert.ok(end.cars.racing.pathDistanceM>start.cars.racing.pathDistanceM+.1
     ||end.cars.shortcut.pathDistanceM>start.cars.shortcut.pathDistanceM+.1,
     'frozen picture segment '+s.start);
 }
});
