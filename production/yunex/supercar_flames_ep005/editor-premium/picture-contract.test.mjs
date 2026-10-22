import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root='production/yunex/supercar_flames_ep005/editor-premium/';
const src=JSON.parse(readFileSync(root+'review-sources.json','utf8'));
const recipe=JSON.parse(readFileSync('src/yunex/studio-projects/ep005-a5-premium/recipe.json','utf8'));
const entry=readFileSync('src/yunex/studio-projects/ep005-a5-premium/entry.tsx','utf8');
const template=readFileSync(root+'review-entry.template.txt','utf8');
const overlay=readFileSync('src/yunex/studio-projects/ep005-a5-premium/PremiumOverlay.tsx','utf8');
test('all six cinematic cuts exactly match A3 750f',()=>{
 assert.deepEqual(src.beats.map(b=>b.slice(1)),[[0,45],[45,165],[165,285],[285,420],[420,555],[555,750]]);
 assert.equal(recipe.shots.length,6);
 assert.deepEqual(recipe.shots.map(s=>s.id),src.beats.map(b=>b[0]));
 assert.deepEqual(recipe.shots.map(s=>Math.round(s.duration*30)),[45,120,120,135,135,195]);
 assert.equal(recipe.shots.reduce((a,s)=>a+Math.round(s.duration*30),0),750);
});
test('flame windows exactly preserve A3 real mount demand',()=>assert.deepEqual(src.afterfireWindows,[[0,30],[430,490],[674,710]]));
test('real 3D source reviews remain unapproved without explicit manager acceptance',()=>{
 assert.equal(src.kind,'SILENT_PINNED_VISUAL_REVIEW_ONLY');
 assert.equal(src.requiresExplicitAgent0Approval,true);
 for(const value of Object.values(src.sources)){
  assert.match(value.sha,/^[a-f0-9]{40}$/);
  assert.equal(value.approved,false);
 }
});
test('narration and captions never fabricated',()=>{
 assert.equal(src.masterAudio.provided,false);
 assert.equal(src.masterAudio.timingVerified,false);
 assert.equal(src.masterAudio.sourcePath,null);
 assert.ok(!recipe.audio && !recipe.words && recipe.shots.every(s=>!s.caption));
 assert.match(overlay,/originalAudioVerified/);
});
test('native review swaps the gate using live A1 ports, A2 demand, A3 shots and A4 world',()=>{
 assert.match(entry,/SOURCE GATE/);
 assert.match(template,/resolveEp005ExhaustPorts/);
 assert.match(template,/sampleCinema\(frame,CINEMA_FPS,sampleEP005Route\)/);
 assert.match(template,/stateFromCinemaDemand/);
 assert.match(template,/createEP005NightCircuit/);
 assert.match(template,/PremiumOverlay/);
});
test('safe caption lane, conditional tracked port arrow and first 12 bare frames',()=>{
 assert.match(overlay,/frame<12/);
 assert.match(overlay,/top:1578,height:207/);
 assert.match(overlay,/exhaustTarget\?\.visible/);
});


test('editorial hook and final burst remain visually open',()=>{
 assert.match(overlay,/introSafe=frame<12/);
 assert.match(overlay,/flameMoment=payoff&&frame>=674&&frame<=710/);
 assert.match(overlay,/!introSafe&&!flameMoment/);
 assert.match(overlay,/finale=payoff&&frame>=711/);
 assert.match(overlay,/THAT IS AFTERFIRE/);
});
test('mechanical schematic is expressly illustrative, not fake 3D tracking',()=>{
 assert.match(overlay,/UNBURNT FUEL/);
 assert.match(overlay,/HOT EXHAUST/);
 assert.match(overlay,/POSSIBLE IGNITION/);
 assert.match(overlay,/ILLUSTRATIVE PATH — NOT TO SCALE/);
 assert.match(overlay,/showMount&&exhaustTarget/);
 assert.match(overlay,/labelX\+55/);
});
test('picture subtitles cannot appear without both original audio and verified text',()=>{
 assert.match(overlay,/originalAudioVerified&&verifiedCaptions.length>0/);
 assert.match(overlay,/SILENT PICTURE REVIEW \/ NOT FINAL/);
 assert.match(overlay,/top:1578,height:207/);
});
