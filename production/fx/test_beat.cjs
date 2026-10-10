/* Run after bundling fx/beat.ts to out/fx/beat.cjs with esbuild. */
const assert=require('node:assert/strict');
const {validateCuts,evaluateBeatFx,buildChapterFx}=require('../../out/fx/beat.cjs');
const cuts=[{frame:0,style:'cut'},{frame:16,style:'whip-right'},{frame:31,style:'flash'},{frame:47,style:'punch'}];
validateCuts(cuts,63);
let previous=-1;
for(let f=0;f<63;f++){
  const s=evaluateBeatFx(f,cuts,63,.58);
  assert.equal(s.cutFrame,cuts[s.cutIndex].frame);
  assert.ok(s.cutIndex>=previous);
  assert.ok(s.zoom>=1&&s.zoom<1.2);
  assert.ok(Math.abs(s.shiftX)<100);
  assert.ok(s.flash<.4);
  if(s.age>5){assert.equal(s.shiftX,0);assert.equal(s.flash,0)}
  previous=s.cutIndex;
}
assert.equal(evaluateBeatFx(16,cuts,63).cutIndex,1);
assert.equal(evaluateBeatFx(31,cuts,63).cutIndex,2);
assert.equal(evaluateBeatFx(47,cuts,63).cutIndex,3);
assert.equal(evaluateBeatFx(62,cuts,63).untilNext,1);
assert.throws(()=>validateCuts([{frame:0},{frame:3}],20));
assert.throws(()=>validateCuts([{frame:2}],20));
assert.throws(()=>evaluateBeatFx(-1,cuts,63));
assert.equal(buildChapterFx([0,16,31])[0].style,'cut');
console.log('FX_BEAT_FRAME_ACCURACY_PASS 63 frames/4 distinct cuts');
