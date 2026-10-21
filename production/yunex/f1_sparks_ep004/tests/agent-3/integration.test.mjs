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
test('underfloor and macro lenses stay outside actual 3D tyre volumes, including safe overhead approach',()=>{
  for(const shot of ['underfloor-reveal','contact-macro']){
    const duration=CAMERA_SHOTS[shot].suggestedDurationSec;
    for(let i=0;i<=40;i++){
      const t=i/40*duration,motion=sampleDynamics(.12+t*.14,{startDistanceM:128.2,speedMps:62});
      const pose=sampleShotCamera(shot,t,motion);
      const c=Math.cos(motion.yawRad),ss=Math.sin(motion.yawRad);
      const dx=pose.positionWorld[0]-motion.worldPosition[0],dz=pose.positionWorld[2]-motion.worldPosition[2];
      const forward=dx*c-dz*ss,lateral=dx*ss+dz*c;
      const height=pose.positionWorld[1]-motion.worldPosition[1];
      for(const axle of [-1.71,1.71])for(const side of [-.83,.83]){
        const tyreLateralClearance=Math.abs(lateral-side);
        const tyreRadialClearance=Math.hypot(forward-axle,height-.36);
        // Real car 0.36m radius + 0.06m lens safety, 0.32m tyre width
        // + 0.07m longitudinal section clearance; a lens safely ABOVE the
        // wheel is valid even when inside the tyre's lateral XZ corridor.
        assert.ok(tyreLateralClearance>.23||tyreRadialClearance>.42,
          shot+' intersects wheel at '+t+': lateral '+tyreLateralClearance+' radial '+tyreRadialClearance);
      }
    }
  }
});
