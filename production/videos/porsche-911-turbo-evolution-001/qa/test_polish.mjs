import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluatePolish,validatePolishBeats,recommendCrop,CHAPTER_STARTS,CHAPTER_PRESETS} from '../../../../src/porsche-turbo-evolution/polish/presets.ts';
const map=JSON.parse(fs.readFileSync(new URL('../beat-map.json',import.meta.url),'utf8'));
const cuts=map.cuts;validatePolishBeats(cuts);
assert.equal(map.output.frames,510);assert.equal(map.output.fps,30);
const chapters=[67,136,205,274,343,429];
assert.deepEqual(Object.keys(CHAPTER_STARTS).map(Number),chapters);
let fx=0,visible=0;const slots=new Set();
for(let frame=0;frame<510;frame++){
 const s=evaluatePolish(frame,cuts);slots.add(s.slot);
 const expected=cuts.find(x=>x.startFrame<=frame&&x.endFrame>=frame);
 assert.equal(s.slot,expected.slot);assert.equal(s.videoOpacity,1);assert.equal(s.generation,expected.generation);
 if(s.active){fx++;assert.ok(s.age<3);assert.ok(s.scale>=1&&s.scale<=1.04);assert.ok(s.flashOpacity<=.055);}
 else visible++;
 if(frame>0){const p=evaluatePolish(frame-1,cuts);
  if(s.slot!==p.slot)assert.equal(frame,expected.startFrame,'cut precisely at incoming source frame');}
}
assert.equal(slots.size,30);assert.ok(fx<=9);assert.ok(visible>=501);
for(const f of chapters){
 const s=evaluatePolish(f,cuts);assert.equal(s.chapterStart,true);assert.equal(s.videoOpacity,1);
 assert.notEqual(evaluatePolish(f-1,cuts).generation,s.generation);
}
const bad=structuredClone(cuts);bad[11].startFrame+=1;
assert.throws(()=>validatePolishBeats(bad),/gap/);
assert.throws(()=>evaluatePolish(510,cuts),/frame outside/);
assert.throws(()=>evaluatePolish(67,cuts,{...CHAPTER_PRESETS,67:{style:'soft-luma',frames:8,strength:.8}}),/Unsafe preset/);
assert.equal(recommendCrop(720,576).mode,'same-source-ambient-panel');
assert.equal(recommendCrop(1080,1920).mode,'full-bleed');
assert.equal(recommendCrop(3840,2160,.65,.45).objectPosition,'65% 45%');
assert.throws(()=>recommendCrop(0,1080),/Invalid source/);
console.log(JSON.stringify({status:'PASS',tests:'510 frames, 30 clips, 6 chapter cuts, FX under 3 frames, opacity=1, crop safety',fxFrames:fx,clearFrames:visible,chapters}));
