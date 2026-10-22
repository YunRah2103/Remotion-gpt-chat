import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {inspect,load} from './verify-editor.mjs';
test('EP005 provisional storyboard has six beats and exact 780 frames',()=>{
 const result=inspect(load()); assert.equal(result.ok,true,JSON.stringify(result.problems));assert.equal(result.frames,780);
});
test('no Agent 1–4 footage may be promoted before explicit approval',()=>{
 const result=inspect(load(),true); assert.equal(result.ok,false);
 assert.deepEqual(result.problems.filter(s=>s.startsWith('Agent ')).length,4);
});
test('fabricated narration timing is rejected',()=>{
 const input=structuredClone(load());input.recipe.words=[{text:'not real',start:0,end:0.5}];
 assert.ok(inspect(input).problems.some(s=>s.includes('Word timing')));
});
test('approved clips require pinned Git SHAs and MP4 SHA256s',()=>{
 const input=structuredClone(load());
 for(const a of Object.values(input.manifest.agents)){a.approved=true;a.headSha='a'.repeat(40);a.artifactSha256='b'.repeat(64);}
 assert.equal(inspect(input,true).ok,true);
 input.manifest.agents['2'].artifactSha256='not-a-hash';
 assert.equal(inspect(input,true).ok,false);
});
