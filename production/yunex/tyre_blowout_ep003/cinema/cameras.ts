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
   const reveal=smooth((q-.26)/.56);
   from=lerp3([1.52,.58,-2.34],[5.15,1.83,-5.62],reveal);
   at=lerp3([1.45,.33,-.88],[.38,.67,-.1],reveal);
   fov=mix(37,49,reveal);near=.027;break;
  }
  case 'front-three-quarter':
   from=lerp3([6.9,2.22,-5.25],[6.00,1.83,-5.65],p);
   at=lerp3([.48,.72,-.15],[.07,.67,-.12],p);fov=mix(49,46,p);break;
  case 'low-tracking':
   // Road-inside-barrier camera, not outside the right-hand highway rail.
   from=lerp3([3.9,.80,-5.20],[2.90,.66,-5.40],p);
   at=[.55,.77,-.14];fov=51;break;
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
   from=lerp3([-.52,1.07,-.39],[-.48,1.08,-.40],p);
   at=lerp3([9.7,1.08,-.34],[9.5,1.10,-.22],p);fov=69;near=.012;break;
  case 'chase-recovery':
   from=lerp3([-7.8,2.13,-2.55],[-6.65,1.86,-2.48],p);
   at=lerp3([.51,.84,-.18],[1.20,.80,-.14],p);fov=mix(48,44,p);break;
  case 'rear-three-quarter':
   from=lerp3([-5.45,1.72,-4.82],[-5.82,1.94,-4.95],p);
   at=[-.10,.72,-.10];fov=47;break;
  case 'safe-stop':
   // Camera shows an APPROACH along Agent 4's refuge, not a fabricated stop.
   from=lerp3([6.15,1.97,-5.30],[5.28,1.63,-5.54],p);
   at=[.35,.75,-.1];fov=mix(48,45,p);break;
  default:throw new Error('Unknown camera shot: '+shot);
 }
 const eventAge=tSec-.26;
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
