'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const m=require('./shot-map-v5.json');
test('user requested landscape and exact music-length contract',()=>{
 assert.deepEqual(m.output,{width:1920,height:1080,fps:30,durationFrames:316});
 assert.equal(m.revealFrame,78);assert.equal(m.endFadeFrames,16);
 assert.equal(m.shots.length,15);assert.equal(m.shots[0].startFrame,0);
 assert.equal(m.shots[5].startFrame,78);assert.equal(m.shots.at(-1).endFrameExclusive,316);
});
test('no gaps or overlaps, driving right away and long cinematic visual outro',()=>{
 let f=0;for(const s of m.shots){assert.equal(s.startFrame,f);assert(s.countFrames>5);f=s.endFrameExclusive;}
 assert.equal(f,316);assert.equal(m.shots[0].id,'INSTANT_SIDE_DRIVING');
 assert(m.shots[0].fromCuratedClip.includes('side_profile'));
 assert.equal(m.shots.at(-1).id,'FINAL_RED_HERO');assert(m.shots.at(-1).countFrames>=55);
});
test('genuine film only, no Phantom, no source-original title card, gate not misrepresented',()=>{
 assert.equal(m.sourceNative.height,810);
 assert.equal(m.sourceGatePassed,false);
 assert(m.shots.every(s=>s.uniqueMovingAngleApproved===false));
 assert(m.shots.every(s=>s.sourceStartSeconds<65 && s.sourceStartSeconds>=25));
 assert(m.shots.every(s=>s.cropX>=0&&s.cropX<=640));
 assert(m.shots.every(s=>!s.fromCuratedClip.toLowerCase().includes('phantom')));
});
