import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const scene=readFileSync(new URL('../../production/yunex/tyre_blowout_ep003/editor/EP003V2ActionSequence.tsx',import.meta.url),'utf8');
const legacy=readFileSync(new URL('../../production/yunex/tyre_blowout_ep003/editor/EP003FinalPicture.tsx',import.meta.url),'utf8');
test('Cedar subtitle pill remains with 320px bottom safety and 114px horizontal inset',()=>{
 assert.match(scene,/bottom:320,left:114,right:114/);
 assert.match(scene,/fontSize:46/);
 assert.match(scene,/cue\.text/);
});
test('Only V4 hides the legacy duplicate story label beneath subtitles',()=>{
 assert.match(scene,/hideStoryLabels/);
 assert.match(legacy,/!hideStoryLabels&&<StoryOverlay/);
});
test('Ending maintains single controlled moving hero angle with minimal orbit',()=>{
 assert.match(scene,/\{from:23\.80,to:END,stage:'safe-slowdown-follow'/);
 assert.match(scene,/time>=23\.80/);
 assert.match(scene,/finalEase\*\.20/);
 assert.doesNotMatch(scene,/\{from:25\.18,to:END/);
});
