/* Run after bundling fx/beat.ts to out/fx/beat.cjs with esbuild. */
const assert=require('node:assert/strict');
const {validateCuts,evaluateBeatFx,buildChapterFx,requiredOverscan}=require('../../out/fx/beat.cjs');
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

// Check actual inverse-transform corner coverage, not just a heuristic divisor.
for(const [width,height] of [[540,960],[1080,1920],[1920,1080],[2160,3840]]){
  for(const dx of [-96,-40,0,40,96]){
    for(const tilt of [-6,-2.5,0,2.5,6]){
      const scale=requiredOverscan(width,height,dx,tilt,1);
      const t=tilt*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
      for(const x of [-width/2,width/2]){
        for(const y of [-height/2,height/2]){
          const px=c*(x-dx)+s*y, py=-s*(x-dx)+c*y;
          assert.ok(Math.abs(px)<=scale*width/2,'X edge leak');
          assert.ok(Math.abs(py)<=scale*height/2,'Y edge leak');
        }
      }
    }
  }
}
const enhanced=[{frame:0},{frame:17,style:'zoom-through'},{frame:34,style:'light-leak'}];
assert.ok(evaluateBeatFx(17,enhanced,51,.6).zoom>1.1);
assert.ok(evaluateBeatFx(34,enhanced,51,.6).leak>0);
assert.equal(evaluateBeatFx(39,enhanced,51,.6).leak,0);
assert.throws(()=>evaluateBeatFx(17,enhanced,51,Number.NaN));
assert.throws(()=>validateCuts([{frame:0},{frame:16,style:'unsupported'}],40));
assert.throws(()=>buildChapterFx([0,17,17]));
assert.throws(()=>requiredOverscan(0,1920,30,2));
console.log('FX_BEAT_FRAME_ACCURACY_PASS 63 frames/4 distinct cuts; corner coverage 500 combos; new styles validated');
