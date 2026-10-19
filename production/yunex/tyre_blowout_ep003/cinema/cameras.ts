/** Agent 3 cinematography. ALL world movement follows VehicleDynamicsFrame.
 * +X forward, +Y up, +Z left (right-facing rubber lives at negative Z). */
import type {CinemaRequest,Vec3,VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
export type CinemaShot=CinemaRequest['shot']|'low-tracking'|'underbody'|'rear-three-quarter';
export type CameraPose=Readonly<{position:Vec3;target:Vec3;fovDeg:number;nearM:number;farM:number;shot:CinemaShot}>;
export type CinemaCameraInput=Readonly<{tSec:number;shot:CinemaShot;dynamics:VehicleDynamicsFrame;tyre:TyreFrame;progress01?:number;subtleImpactShake?:boolean}>;
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
const smooth=(n:number)=>{const x=clamp(n);return x*x*(3-2*x)};
const mix=(a:number,b:number,k:number)=>a+(b-a)*k;
const lerp3=(a:Vec3,b:Vec3,k:number):Vec3=>[mix(a[0],b[0],k),mix(a[1],b[1],k),mix(a[2],b[2],k)];
export function vehicleLocalToWorld(offset:Vec3,frame:Pick<VehicleDynamicsFrame,'positionM'|'yawRad'>):Vec3{
 const c=Math.cos(frame.yawRad),s=Math.sin(frame.yawRad),p=frame.positionM;
 return [p[0]+c*offset[0]+s*offset[2],p[1]+offset[1],p[2]-s*offset[0]+c*offset[2]];
}
export function sampleCinemaCamera(input:CinemaCameraInput):CameraPose{
 const {shot,dynamics:d,tyre,tSec}=input;
 if(!Number.isFinite(tSec)||tSec<0||!Number.isFinite(d.yawRad)||d.positionM.some(x=>!Number.isFinite(x))||!Number.isFinite(tyre.failureProgress)||input.progress01!==undefined&&!Number.isFinite(input.progress01))throw new Error('Camera needs finite absolute-time sampled state');
 const p=smooth(input.progress01??0),q=clamp(input.progress01??0);
 let from:Vec3,at:Vec3,fov:number,near=.06;
 switch(shot){
  case 'tyre-hook':{
   // The wheel MUST deflate visibly before the camera leaves it; continuous
   // dolly (rather than a magic zoom) exposes original front 3/4 silhouette.
   // Hold the damaged contact patch until the loss is legible, then finish
   // the pullback in the first half-second, WITHOUT clipping the full car.
   const reveal=smooth((q-.22)/.16);
   // Slight front-quarter offset reduces overlapping far-wheel silhouettes.
   // Lower aim exposes the real compressed lower sidewall and contact edge.
   // Last native run frame 23/.77s placed the tracking lens at the road's
   // right lamp-pole line (Z=-9), causing a wide pole occlusion. Pull back
   // from INSIDE the -Z rail, with sidewall held macro until .30s.
   from=lerp3([2.03,.54,-2.43],[8.95,2.52,-5.35],reveal);
   at=lerp3([1.42,.245,-.88],[0,.68,0],reveal);
   fov=mix(37,55,reveal);near=.027;break;
  }
  case 'front-three-quarter':
   // Keep both bumpers inside the tight 9:16 horizontal field of view.
   from=lerp3([8.0,2.50,-7.05],[7.8,2.40,-7.15],p);
   at=lerp3([0,.70,0],[0,.68,0],p);fov=mix(52,53,p);break;
  case 'low-tracking':
   // Previous real frame 36 had a huge guardrail in foreground because camera
   // world-Z was beyond the -7.8m barrier. Track INSIDE on the lane side.
   from=lerp3([7.35,.95,-5.35],[7.05,.90,-5.30],p);
   at=[0,.73,0];fov=56;break;
  case 'wheel-cutaway':
  case 'underbody':
   // Framed directly along the right-side contact patch, lens stays outside
   // the rubber and above road y=0. Original wheel geometry remains coherent.
   from=lerp3([2.58,.23,-2.32],[2.83,.32,-2.49],p);
   at=[1.32,.27,-.78];fov=55;near=.018;break;
  case 'overhead-dynamics':
   from=lerp3([-.42,13.0,-1.65],[-1.2,12.2,-2.00],p);
   at=[.20,.52,-.13];fov=46;break;
  case 'driver-cockpit':
   // Follow the world-kit grand-tourer driver's eye line. The earlier
   // negative-X camera intersected the seat headrest and blocked the lens.
   // Seat shell extends behind x=-.16, keep pupil forward of its trim.
   from=lerp3([.02,1.145,-.456],[.06,1.155,-.474],p);
   at=lerp3([6.8,1.005,-.45],[6.2,.975,-.42],p);fov=mix(70,68,p);near=.025;break;
  case 'chase-recovery':
   // Full original GT in portrait: closer to the road centerline and aim
   // downward toward the rear axle, not into distant sky/right edge.
   from=lerp3([-8.8,2.35,-1.25],[-8.7,2.23,-1.15],p);
   at=lerp3([0,.70,0],[0,.68,0],p);fov=mix(51,50,p);break;
  case 'rear-three-quarter':
   // Make the complete 4.94m car visible; former frame 68 cut BOTH bumpers.
   from=lerp3([-7.35,2.22,-7.3],[-7.65,2.40,-7.50],p);
   at=[0,.72,0];fov=53;break;
  case 'safe-stop':
   // Moving recovery, MEDIAN-side elevated reveal: actual widened right-hand
   // refuge beyond the moving car. Never stage a physically unproved stop.
   from=lerp3([-6.0,3.40,5.70],[-6.55,3.48,5.95],p);
   at=lerp3([2.50,.60,-3.40],[3.0,.62,-3.70],p);
   fov=mix(58,56,p);break;
  default:throw new Error('Unknown camera shot: '+shot);
 }
 const eventAge=tSec-.75;
 const shock=input.subtleImpactShake===false?0:
  .007*Math.sin(2*Math.PI*7.5*eventAge)*clamp(tyre.failureProgress)*Math.exp(-Math.max(0,eventAge)*5);
 return {shot,position:vehicleLocalToWorld([from[0],Math.max(.11,from[1]+shock),from[2]],d),
  target:vehicleLocalToWorld(at,d),fovDeg:fov,nearM:near,farM:360};
}
export type Cut=Readonly<{shot:CinemaShot;fromSec:number;toSec:number;notes:string}>;
export const OPENING_CUTS:readonly Cut[]=[
 {shot:'tyre-hook',fromSec:0,toSec:1.28,notes:'Fast pressure-loss macro within first second, fluid 3/4 dolly'},
 {shot:'front-three-quarter',fromSec:1.28,toSec:2.20,notes:'Read the full moving midnight-blue grand-tourer'},
 {shot:'chase-recovery',fromSec:2.20,toSec:5,notes:'Subject stays ahead; guardrail clears the lens'}
];
export const MONTAGE_CUTS:readonly Cut[]=[
 {shot:'tyre-hook',fromSec:0,toSec:1.20,notes:'Moving deformation; rubber is original Agent 1 geometry'},
 {shot:'low-tracking',fromSec:1.20,toSec:2.23,notes:'Low tracking from inside the right-hand road boundary'},
 {shot:'rear-three-quarter',fromSec:2.23,toSec:3.18,notes:'Distinct three-quarter reveal and apparent forward travel'},
 {shot:'underbody',fromSec:3.18,toSec:4.13,notes:'Wheel/contact patch camera stays outside bodywork'},
 {shot:'overhead-dynamics',fromSec:4.13,toSec:5.02,notes:'Road markings explain trajectory and vehicle orientation'},
 {shot:'driver-cockpit',fromSec:5.02,toSec:6.02,notes:'Subtle cockpit parallax and real steering angle'},
 {shot:'chase-recovery',fromSec:6.02,toSec:7.40,notes:'Controlled stabilisation from authoritative simulation'},
 {shot:'safe-stop',fromSec:7.40,toSec:8.80,notes:'Moving approach with Agent 4 refuge in view: NOT a parked stop'}
];
export function selectCut(tSec:number,cuts:readonly Cut[]):{cut:Cut;progress01:number}{
 if(!Number.isFinite(tSec)||tSec<0||!cuts.length)throw new Error('Invalid cut selection');
 const cut=cuts.find(c=>tSec>=c.fromSec&&tSec<c.toSec)??cuts[cuts.length-1];
 return {cut,progress01:clamp((tSec-cut.fromSec)/(cut.toSec-cut.fromSec))};
}
