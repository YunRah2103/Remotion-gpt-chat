import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraRigForLook} from '../../look/camera-rig.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
import {getSkidDescriptors} from '../../mechanics/skids.ts';

test('portrait camera stays close to actual moving hero and deterministic at any frame',()=>{
 for(const mode of ['trackside-pass','race-follow']){
  const duration=mode==='trackside-pass'?5:7;
  let first;
  for(let frame=0;frame<duration*30;frame+=11){
   const t=frame/30;
   const motion=sampleDynamics(t,{startDistanceM:69,speedMps:62});
   const pose=cameraRigForLook(motion,mode,t);
   const dist=Math.hypot(...pose.eye.map((v,i)=>v-motion.worldPosition[i]));
   assert.ok(dist>5.1&&dist<12,mode+' camera must be cinematic, not overhead long shot');
   assert.ok(pose.fov>=42&&pose.fov<=58,'credible film lens');
   assert.deepEqual(pose,cameraRigForLook(motion,mode,t),'no frame-order jitter/random');
   if(!first)first=pose;
  }
  assert.ok(first);
 }
});
test('preview at shared 69m crest genuinely emits ONLY metal-contact particles',()=>{
 const skids=getSkidDescriptors();
 assert.ok(skids.length>=1&&skids.every(s=>s.metal));
 let contacted=0,validSparks=0,clearFrames=0;
 for(let frame=0;frame<=66;frame++){
  const t=frame/30;
  const motion=sampleDynamics(t,{startDistanceM:69,speedMps:62});
  const {contacts,particles}=sampleContactDrivenSparks(t,motion,skids);
  if(contacts.some(c=>c.active))contacted++;
  else clearFrames++;
  for(const p of particles){
   assert.ok(skids.some(s=>s.id===p.emitterSkidId));
   assert.ok(p.ageSec>=0&&p.ageSec<p.lifetimeSec);
   assert.ok(p.positionWorld.every(Number.isFinite));
  }
  if(particles.length)validSparks++;
 }
 assert.ok(contacted>=1,'real road must produce an active contact interval');
 assert.ok(validSparks>=2,'camera scene must include contact-born spark glints');
 assert.ok(clearFrames>=1,'not a persistent decorative spark sheet');
});
