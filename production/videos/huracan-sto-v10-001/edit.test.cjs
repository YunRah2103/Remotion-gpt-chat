'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const map=require('./shot-map.json');
const {validate}=require('./validate-edit.cjs');
const copy=()=>structuredClone(map);
test('locked 316-frame edit and 2.60s reveal',()=>{
 const o=validate(copy());assert.equal(o.frameCount,316);assert.equal(o.shotCount,14);
 assert.equal(o.revealFrame,78);assert.match(o.gate,/PROVISIONAL/);
});
test('distinct planned scene slots, not false source claims',()=>{
 assert.equal(new Set(map.shots.map(s=>s.desiredCameraAngle)).size,14);
 assert.ok(map.shots.every(s=>s.source.stoIdentityVerified===false));
 assert.ok(map.shots.every(s=>s.source.file===null));
});
test('every output frame belongs to exactly one sequence',()=>{
 const coverage=Array(316).fill(0);
 for(const s of map.shots)for(let f=s.startFrame;f<s.endFrameExclusive;f++)coverage[f]++;
 assert.ok(coverage.every(v=>v===1));assert.equal(map.shots[4].startFrame,78);
});
test('tampered beats, crop frames and clipped zoom fail',()=>{
 const gap=copy();gap.shots[2].startFrame++;assert.throws(()=>validate(gap),/gap or overlap/);
 const crop=copy();crop.shots[5].cropKeyframes[1].zoom=2.2;assert.throws(()=>validate(crop),/zoom/);
 const neg=copy();neg.shots[0].endFrameExclusive=3;assert.throws(()=>validate(neg),/too short/);
});
test('final gate rejects unapproved footage instead of passing placeholder render',()=>{
 assert.throws(()=>validate(copy(),{final:true}),/source filename pending/);
});
