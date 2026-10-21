import test from 'node:test';
import assert from 'node:assert/strict';
import {getStoryVisualCue,validateAeroPair} from '../../story/visual-cues.ts';
const m=(t=2,route=72,heave=0)=>({
 tSec:t,routeDistanceM:route,speedMps:62,worldPosition:[2,0,1],yawRad:.35,
 pitchRad:0,rollRad:0,wheelRotationRad:0,heaveM:heave,
 wheelCompressionM:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0},
 downforceProxy01:.3
});
const req=(shot,sec,contacts=[],particles=[])=>({
 shot,tSec:sec,shotLocalSec:sec,shotDurationSec:5,motion:m(sec),contacts,particles
});
test('underfloor reveal has no decorative sparks and ramps into selective section only',()=>{
 assert.equal(getStoryVisualCue(req('underfloor-reveal',0)).sectionReveal01,0);
 const mid=getStoryVisualCue(req('underfloor-reveal',2.5));
 assert.ok(mid.sectionReveal01>0&&mid.sectionReveal01<1);
 assert.equal(mid.allowedToShowParticles,false);
 assert.equal(getStoryVisualCue(req('rear-mystery',2)).sectionReveal01,0);
});
test('contact cue is based on actual active signed-gap and particles persist independently',()=>{
 const fake={skidId:'forward',pointWorld:[0,0,0],normalWorld:[0,1,0],signedGapM:.004,relativeSpeedMps:62,contactIntensity01:.7,active:true};
 assert.equal(getStoryVisualCue(req('contact-macro',2,[fake])).activeContact,false);
 assert.equal(getStoryVisualCue(req('contact-macro',2,[{...fake,signedGapM:-.001}])).activeContact,true);
 assert.equal(getStoryVisualCue(req('contact-macro',2,[],[{id:1}])).allowedToShowParticles,true);
});
test('comparison enforces a shared route, pose and exact source time',()=>{
 assert.doesNotThrow(()=>validateAeroPair(m(),m(2,72,-.02)));
 // Agent 2 places the same car lower in WORLD Y under load: this is legitimate.
 assert.doesNotThrow(()=>validateAeroPair(m(),{...m(2,72,-.02),worldPosition:[2,-.043,1]}));
 assert.throws(()=>validateAeroPair(m(),m(2.3)),/identical route/);
 assert.throws(()=>validateAeroPair(m(),m(2,75)),/identical route/);
 assert.throws(()=>validateAeroPair(m(),{...m(),worldPosition:[3,0,1]}),/identical route/);
});
