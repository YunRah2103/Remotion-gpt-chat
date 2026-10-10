'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const map=require('./shot-map-landscape.json');
const {validate}=require('./validate-landscape-edit.cjs');
test('full HD landscape, 316 frames and real cut-map',()=>{
 const result=validate();
 assert.equal(result.format,'1920x1080');assert.equal(result.frames,316);
 assert.equal(result.scenes,14);assert.equal(map.shots[4].startFrame,78);
});
test('all timeline frames exactly once',()=>{
 const n=Array(316).fill(0);
 for(const s of map.shots)for(let f=s.startFrame;f<s.endFrameExclusive;f++)n[f]++;
 assert(n.every(v=>v===1));
});
test('three real 1080p originals and no fictional source gate claims',()=>{
 assert.equal(Object.keys(map.sourceFiles).length,3);
 assert(Object.values(map.sourceFiles).every(s=>s.width===1920&&s.height===1080&&/^[0-9a-f]{64}$/.test(s.sha256)));
 assert(map.shots.every(s=>s.movingAngleVerified===false&&s.uniqueMovingAngleKey===null));
 assert.equal(map.sourceGatePassed,false);
});
test('release refuses shots with unverified moving angles',()=>assert.throws(()=>validate({release:true}),/source gate not passed|missing physical shot/));
