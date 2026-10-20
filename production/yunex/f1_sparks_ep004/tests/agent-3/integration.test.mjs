import test from 'node:test';
import assert from 'node:assert/strict';
import {getSkidDescriptors,SKID_BOTTOM_Y_M} from '../../mechanics/skids.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
import {CAMERA_SHOTS,sampleShotCamera} from '../../cinema/cameras.ts';
import {sampleCircuitRoadPoint} from '../../look/road.ts';
import {sampleTrackSurface} from '../../shared/track.ts';
const SETUP={startDistanceM:63.65,speedMps:62,aeroLoad01:1};
test('first opening frame samples actual Agent 1 metal contact and Agent 2 historic births',()=>{
  const tSec=.12,motion=sampleDynamics(tSec,SETUP);
  const skids=getSkidDescriptors(),{contacts,particles}=sampleContactDrivenSparks(tSec,motion,skids);
  assert.ok(skids.some(s=>s.id==='forward'&&s.metal&&s.localBottomPoint[1]===SKID_BOTTOM_Y_M));
  assert.ok(contacts.some(c=>c.active&&c.signedGapM<=0),'opening must begin with actual metal-asphalt contact');
  assert.ok(particles.length>0,'no contact-driven particles by frame 0');
  assert.ok(particles.every(p=>p.startSec<=tSec&&p.emitterSkidId!=='exhaust'));
  const knownIds=new Set(contacts.map(c=>c.skidId));
  assert.ok(particles.every(p=>knownIds.has(p.emitterSkidId)));
});
test('night asphalt matches exactly same profile used for contact',()=>{
  const point=sampleCircuitRoadPoint(72,0);
  assert.ok(Math.abs(point.y-sampleTrackSurface(72).heightM)<1e-9);
});
test('underfloor glide and contact macro lenses never occupy the wheel corridor',()=>{
  for(const shot of ['underfloor-reveal','contact-macro']){
    const duration=CAMERA_SHOTS[shot].suggestedDurationSec;
    for(let i=0;i<=20;i++){
      const t=i/20*duration,motion=sampleDynamics(.12+t*.14,{startDistanceM:128.2,speedMps:62});
      const pose=sampleShotCamera(shot,t,motion);
      const c=Math.cos(motion.yawRad),s=Math.sin(motion.yawRad);
      const dx=pose.positionWorld[0]-motion.worldPosition[0],dz=pose.positionWorld[2]-motion.worldPosition[2];
      const lateral=dx*s+dz*c;
      if(t>=.5||shot==='contact-macro')assert.ok(lateral>1.16,shot+' inside tyre envelope '+lateral);
    }
  }
});
