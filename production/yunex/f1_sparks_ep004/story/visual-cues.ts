import type {ShotId,StoryRequest,VehicleMotionState} from '../shared/contract';
import {clamp01,smoothstep,onMetalContact} from './beats.ts';
/** These are editorial animation controls, never physics calculations.
 * The camera/mechanics collaborators must use true geometry and supplied motion. */
export type StoryVisualCue=Readonly<{
 shot:ShotId;
 sectionReveal01:number;
 aeroComparison01:number;
 focusMetalSkid:boolean;
 activeContact:boolean;
 allowedToShowParticles:boolean;
 /** World-space continuity: never reposition vehicle to suit transition. */
 keepWorldTrajectory:true;
}>;
export function getStoryVisualCue(req:StoryRequest):StoryVisualCue{
 const p=clamp01(req.shotDurationSec>0?req.shotLocalSec/req.shotDurationSec:0);
 const activeContact=onMetalContact(req.contacts);
 const sectionReveal01=req.shot==='underfloor-reveal'?smoothstep((p-.12)/.63):0;
 const aeroComparison01=req.shot==='aero-load'?smoothstep((p-.22)/.52):0;
 return {
  shot:req.shot,sectionReveal01,aeroComparison01,
  focusMetalSkid:req.shot==='underfloor-reveal'||req.shot==='contact-macro',
  activeContact,
  // Already alive particles may coast after the skid loses contact; DO NOT spawn new ones here.
  allowedToShowParticles:req.particles.length>0,
  keepWorldTrajectory:true,
 };
}
/** Full-vehicle ride-height contrast MUST use two physics samples at same route & time.
 * Changes to speed, route distance, yaw or world position would be two trajectories, not
 * an underbody aero comparison. Each arm is computed and provided by Agent 2. */
export function validateAeroPair(unloaded:VehicleMotionState,loaded:VehicleMotionState):void{
 const near=(a:number,b:number,epsilon:number)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=epsilon;
 if(!near(unloaded.tSec,loaded.tSec,1e-5)
 || !near(unloaded.routeDistanceM,loaded.routeDistanceM,1e-4)
 || !near(unloaded.yawRad,loaded.yawRad,1e-4)
 || unloaded.worldPosition.some((v,i)=>!near(v,loaded.worldPosition[i],1e-4))){
  throw new Error('Aero comparisons must retain the identical physics route, time and pose');
 }
}
