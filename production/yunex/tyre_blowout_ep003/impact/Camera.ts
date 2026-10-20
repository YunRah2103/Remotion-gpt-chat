/** Agent8 camera-only lens plan. Zero changes to world/physics/vehicle samples.
 * All target positions remain in the same scene-local world as the GT and rail.
 * Mobile 9:16: never a high drone; front-right bumper and steel stay readable.
 */
import type {CrashOutcomeFrame} from './model.ts';
export type CrashLens='establish'|'contact'|'damage';
export type CrashCamera=Readonly<{
 position:[number,number,number];target:[number,number,number];fov:number;
 lens:CrashLens;
}>;
const clamp=(a:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,a));
const smooth=(v:number)=>{const s=clamp(v,0,1);return s*s*(3-2*s)};
/** Reusable in Agent10 camera rig: traffic-side at contact, rail-side only
 * once crumpling exists. Rail NEVER lies between camera and bumper at impact. */
export function sampleCrashCamera(frame:CrashOutcomeFrame,lens:CrashLens):CrashCamera{
 const [x,,z]=frame.scenePositionM;
 const age=frame.contact.firstContactSec===null?-99:
  frame.relativeTimeSec-frame.contact.firstContactSec;
 const impulse=age>=0&&age<.34?(1-smooth(age/.34))*Math.sin(age*76)*.077:0;
 if(lens==='establish'){
  // Chase from carriageway, strongly visible lateral movement and road speed.
  return {position:[x-10.6,3.15,z+1.45],target:[x+.42,.85,z-.35],
   fov:47,lens};
 }
 if(lens==='contact'){
  // Critical BEFORE/HIT/AFTER: in front and INSIDE the right barrier.
  // The rail is BEHIND the original blue GT and remains in same frame.
  // 2.45m eye height retains horizon, NOT a drone view.
  return {position:[x+6.65+impulse,2.42,z+5.18],
   target:[x+.98,.88,z-.22],fov:45,lens};
 }
 // Front-right headlamp/bumper reveal from AHEAD, still INSIDE the road.
 // The rail runs BESIDE the bonnet, NOT between lens and crumpled car.
 // Lower 2.2m eye height and 6.1m forward offset are close enough to read
 // the approved 0.24m nose dent without falsely increasing its magnitude.
 return {position:[x+6.1+impulse,2.20,z-.35],
  target:[x+1.12,.79,z-.58],fov:43,lens};
}
/** Hard editorial camera cuts only; physical car path NEVER jumps. */
export function lensForHydratedTime(t:number):CrashLens{
 return t<1.42?'establish':t<2.26?'contact':'damage';
}
export function lensForCloseTime(t:number):CrashLens{
 return t<2.26?'contact':'damage';
}
