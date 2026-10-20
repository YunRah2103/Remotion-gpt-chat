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
/** Ride-height contrast uses two Agent 2 physics samples at same route & time.
 * Vertical root Y, pitch, heave and compression MUST be allowed to change:
 * that's the aerodynamic comparison itself. X/Z, speed, yaw and t stay locked. */
export function validateAeroPair(unloaded:VehicleMotionState,loaded:VehicleMotionState):void{
 const near=(a:number,b:number,epsilon:number)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=epsilon;
 if(!near(unloaded.tSec,loaded.tSec,1e-5)
 || !near(unloaded.routeDistanceM,loaded.routeDistanceM,1e-4)
 || !near(unloaded.yawRad,loaded.yawRad,1e-4)
 || !near(unloaded.speedMps,loaded.speedMps,1e-4)
 || !near(unloaded.worldPosition[0],loaded.worldPosition[0],1e-4)
 || !near(unloaded.worldPosition[2],loaded.worldPosition[2],1e-4)
 || !Number.isFinite(unloaded.worldPosition[1]) || !Number.isFinite(loaded.worldPosition[1])){
  throw new Error('Aero comparisons must retain identical route, time, lateral path, heading and speed');
 }
}
