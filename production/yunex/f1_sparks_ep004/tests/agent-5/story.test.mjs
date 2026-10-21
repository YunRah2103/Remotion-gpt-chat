import test from 'node:test';
import assert from 'node:assert/strict';
import {
 DEFAULT_BEATS,defaultTiming,storyDuration,storyLayers,storyLocation,compareRideHeight,
 onMetalContact,contactMessage,SHOT_TO_SCRIPT,validateTiming
} from '../../story/beats.ts';
const approx=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const motion=(heave=0,compress=0)=>({
 tSec:0,routeDistanceM:72,speedMps:62,worldPosition:[0,0,0],yawRad:0,
 pitchRad:0,rollRad:0,wheelRotationRad:0,heaveM:heave,
 wheelCompressionM:{'front-left':compress,'front-right':compress,'rear-left':compress,'rear-right':compress},
 downforceProxy01:0.5
});
test('six canonical retimeable chapters in correct order',()=>{
 assert.equal(DEFAULT_BEATS.length,6);
 assert.deepEqual(SHOT_TO_SCRIPT.map(x=>x.shot),defaultTiming.map(x=>x.shot));
 approx(storyDuration(),26.2);
 assert.equal(storyLocation(0).shot,'spark-hook');
 assert.equal(storyLocation(2.8).shot,'rear-mystery');
 assert.equal(storyLocation(5.8).shot,'underfloor-reveal');
 assert.equal(storyLocation(26.2).shot,'racing-payoff');
});
test('retime changes chapter boundary, without editing global physics time',()=>{
 const t=defaultTiming.map(x=>({...x}));
 t[0]={...t[0],durationSec:4};
 assert.equal(storyLocation(3,t).shot,'spark-hook');
 assert.equal(storyLocation(4.01,t).shot,'rear-mystery');
 assert.throws(()=>validateTiming([t[0]]),/six shots/);
 assert.throws(()=>storyLocation(Number.NaN),/finite/);
});
test('two transition layers sum to exactly one, prior and next only',()=>{
 const layers=storyLayers(2.89,defaultTiming,.18);
 assert.equal(layers.length,2);
 approx(layers[0].opacity+layers[1].opacity,1);
 assert.equal(layers[0].shot,'spark-hook');
 assert.equal(layers[1].shot,'rear-mystery');
 assert.deepEqual(storyLayers(1),[{...storyLocation(1),opacity:1}]);
});
test('contact label demands actual signed-gap metal contact, positive relative speed and intensity',()=>{
 const base={skidId:'forward',pointWorld:[0,0,0],normalWorld:[0,1,0],signedGapM:0.004,relativeSpeedMps:62,contactIntensity01:.5,active:true};
 assert.equal(onMetalContact([base]),false);
 assert.equal(onMetalContact([{...base,signedGapM:-.001,active:false}]),false);
 assert.equal(onMetalContact([{...base,signedGapM:-.001,relativeSpeedMps:0}]),false);
 assert.equal(onMetalContact([{...base,signedGapM:-.001,contactIntensity01:0}]),false);
 assert.equal(onMetalContact([{...base,signedGapM:0}]),true);
 assert.equal(contactMessage({contacts:[base],particles:[]}), 'CLEAR');
});
test('aero claim only when the actual externally supplied motion is lower',()=>{
 const lowered=compareRideHeight(motion(0,.004),motion(-.019,.024));
 assert.equal(lowered.safeToLabelLower,true);
 assert.equal(lowered.compressionIncreased,true);
 assert.equal(compareRideHeight(motion(-.02,.03),motion(0,0)).safeToLabelLower,false);
});
