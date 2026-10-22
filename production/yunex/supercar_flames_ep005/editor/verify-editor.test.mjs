import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {inspect,load} from './verify-editor.mjs';

test('Six semantic cuts align to exact Agent 3 25s/750f timeline',()=>{
 const r=inspect(load());assert.equal(r.ok,true,JSON.stringify(r.problems));
 assert.deepEqual(r.cutBoundaries,[0,45,165,285,420,555,750]);
 assert.equal(r.frames,750);
});
test('780-frame independent edit is rejected so no blind 30-frame trim',()=>{
 const input=structuredClone(load());
 input.recipe.shots[5].duration+=1;
 assert.equal(inspect(input).ok,false);
 assert.ok(inspect(input).problems.some(s=>s.includes('boundary drift')));
});
test('Absolute afterfire windows cannot silently shift',()=>{
 const input=structuredClone(load());input.map.afterfireDemand[1][0]+=30;
 assert.ok(inspect(input).problems.some(s=>s.includes('Afterfire')));
});
test('Agent approvals are REQUIRED before any full source integration',()=>{
 const result=inspect(load(),true);assert.equal(result.ok,false);
 assert.equal(result.problems.filter(s=>s.startsWith('Agent ')).length,4);
});
test('Original voice and word timing cannot be fabricated',()=>{
 const input=structuredClone(load());
 input.recipe.words=[{text:'FAKE',start:0,end:.3}];
 assert.ok(inspect(input).problems.some(s=>s.includes('Word timing')));
 input.recipe.audio={narration:'audio/unknown.mp3'};
 assert.ok(inspect(input).problems.some(s=>s.includes('unauthenticated narration')));
});
test('Explicit reviewed hashes permit gate and malformed hash blocks it',()=>{
 const input=structuredClone(load());
 for(const a of Object.values(input.manifest.agents)){
  a.approved=true;a.headSha='a'.repeat(40);a.artifactSha256='b'.repeat(64);
 }
 assert.equal(inspect(input,true).ok,true);
 input.manifest.agents['2'].artifactSha256='invalid';
 assert.equal(inspect(input,true).ok,false);
});
test('Subtitle reserved safe lane cannot silently drift',()=>{
 const input=structuredClone(load());input.map.captionLane.topPercent=78;
 assert.ok(inspect(input).problems.some(s=>s.includes('Subtitle')));
});
