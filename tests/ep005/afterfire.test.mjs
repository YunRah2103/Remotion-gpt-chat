import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleAfterfire,validateExhaustMounts,ep005PreviewEngineState,stateFromCinemaDemand} from '../../production/yunex/supercar_flames_ep005/flames/afterfire.ts';
const ports=[{name:'exhaust-tip-left',position:[-2,.38,.6],direction:[-1,0,0],radius:.07},{name:'exhaust-tip-right',position:[-2,.38,-.6],direction:[-1,0,0],radius:.07}];
const hot={throttle:.07,unburntFuel:1,exhaustTemperatureC:850,overrun:true};
test('first-second visual hook actually ignites both tips',()=>{
 const a=sampleAfterfire(0,30,hot,ports);
 assert.equal(a.mode,'overrun');assert.equal(a.ports.length,2);
 assert.ok(a.ports.some(p=>p.intensity>.25));
 for(const p of a.ports){assert.ok(p.intensity>=0&&p.intensity<=1);assert.ok(p.length>=0);}
});
test('no persistent torch at idle or normal acceleration',()=>{
 for(const input of [{...hot,overrun:false,throttle:.7},{...hot,exhaustTemperatureC:100},{...hot,unburntFuel:0}]){
  for(const f of [0,2,14,42,120])assert.equal(sampleAfterfire(f,30,input,ports).ports[0].intensity,0);
 }
});
test('condition-specific tuned events and absence of universal power claim',()=>{
 assert.equal(sampleAfterfire(0,30,{...hot,overrun:false,antiLag:true,throttle:.9},ports).mode,'anti-lag');
 assert.equal(sampleAfterfire(0,30,{...hot,overrun:false,ignitionCut:true,throttle:.9},ports).mode,'ignition-cut');
 assert.equal(sampleAfterfire(0,30,{...hot,overrun:true,throttle:.9},ports).mode,'off');
});
test('out-of-order absolute frames reproduce identical transforms and phases',()=>{
 const first=[0,5,22,1,90,5,0].map(f=>sampleAfterfire(f,30,hot,ports));
 assert.deepEqual(first[0],first[6]);assert.deepEqual(first[1],first[5]);
 assert.deepEqual(sampleAfterfire(22,30,hot,ports),first[2]);
});
test('port validation fails closed on missing, corrupt or duplicate mounts',()=>{
 assert.doesNotThrow(()=>validateExhaustMounts(ports));
 assert.throws(()=>validateExhaustMounts(ports.slice(0,1)));
 assert.throws(()=>validateExhaustMounts([ports[0],ports[0]]));
 assert.throws(()=>validateExhaustMounts([{...ports[0],direction:[0,0,0]},ports[1]]));
 assert.throws(()=>sampleAfterfire(Infinity,30,hot,ports));
 assert.throws(()=>sampleAfterfire(0,30,{...hot,unburntFuel:2},ports));
});
test('defined preview control is a short condition-specific overrun, never continuous normal idle',()=>{
 assert.equal(ep005PreviewEngineState('hook',.1).overrun,true);
 assert.equal(ep005PreviewEngineState('mechanism',1).overrun,false);
});

test('Agent 3 afterfireDemand gates all emissions and preserves exact off frames',()=>{
 const off=stateFromCinemaDemand(0,.56),on=stateFromCinemaDemand(1,.08);
 assert.equal(off.afterfireDemand,0);assert.equal(on.overrun,true);
 assert.equal(sampleAfterfire(0,30,off,ports).mode,'off');
 assert.ok(sampleAfterfire(0,30,on,ports).ports.some(p=>p.intensity>.20));
 assert.ok(sampleAfterfire(0,30,stateFromCinemaDemand(.35,.08),ports).ports[0].intensity
  <sampleAfterfire(0,30,on,ports).ports[0].intensity);
 assert.throws(()=>stateFromCinemaDemand(1.1,.08));
});
test('preview storyboard shows finite flash bursts instead of indefinite jet at wide view',()=>{
 assert.equal(ep005PreviewEngineState('wide',0).overrun,false);
 assert.equal(ep005PreviewEngineState('wide',.45).overrun,true);
 assert.equal(ep005PreviewEngineState('wide',1.2).overrun,false);
 assert.equal(ep005PreviewEngineState('tailpipe',.8).overrun,false);
});
