import test from 'node:test';
import assert from 'node:assert/strict';
import {getSkidDescriptors} from '../../mechanics/skids.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';

// Exposes real A2 particle brightness and contact coverage as facts, not
// guesswork, to choose strong first/last editorial camera source intervals.
test('enumerate genuine EP004 metal-road spark contact sources for cinematic payoff',()=>{
 const skids=getSkidDescriptors();
 const observations=[];
 for(const startDistanceM of [35,55,63.55,63.65,100,125,132.3,134,150,180,220]){
  let total=0,peaks=0,contactSamples=0,best={score:-1,sourceSec:0,active:0,visible:0};
  for(let i=1;i<=50;i++){
   const t=i*.08;
   const motion=sampleDynamics(t,{startDistanceM,speedMps:62,aeroLoad01:1});
   const {contacts,particles}=sampleContactDrivenSparks(t,motion,skids);
   const active=contacts.filter(c=>c.active&&c.signedGapM<=0).length;
   const visible=particles.filter(p=>p.ageSec>=0&&p.ageSec<p.lifetimeSec&&p.luminance01>.13).length;
   const score=visible+active*3;
   total+=visible;contactSamples+=Number(active>0);peaks=Math.max(peaks,visible);
   if(score>best.score)best={score,sourceSec:Number(t.toFixed(3)),active,visible};
  }
  observations.push({startDistanceM,peak:peaks,meanParticles:Number((total/50).toFixed(1)),contactSamples,best});
 }
 observations.sort((a,b)=>b.meanParticles-a.meanParticles);
 console.log('A13_A2_CONTACT_SOURCE_CANDIDATES='+JSON.stringify(observations));
 assert.ok(observations.some(o=>o.peak>=6),'An authentic A2 spark event must exist in physics');
});
