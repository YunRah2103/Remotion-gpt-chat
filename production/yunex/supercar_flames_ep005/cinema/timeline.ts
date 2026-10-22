import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import type {RoutePose} from '../../../../src/yunex/world-kit/environments.ts';
import type {V3} from '../../../../src/yunex/world-kit/geometry.ts';

/** Agent 3: canonical frame-locked edit and continuous V3 route motion.
 * Visual kinematics, not a calibrated vehicle dynamics simulation. */
export const CINEMA_FPS=30;
export const CINEMA_FRAMES=750;
export const CINEMA_ROUTE='track' as const;
export const CINEMA_START_METRES=55;
export const CINEMA_SHOTS=[
 {id:'hook',start:0,end:45,camera:'rear-flame'},
 {id:'launch',start:45,end:165,camera:'side-tracking'},
 {id:'engine-reveal',start:165,end:285,camera:'front-three-quarter'},
 {id:'mechanism',start:285,end:420,camera:'elevated'},
 {id:'exhaust',start:420,end:555,camera:'rear-exhaust'},
 {id:'payoff',start:555,end:750,camera:'final-chase'}
] as const;
export type CinemaShotId=typeof CINEMA_SHOTS[number]['id'];
export type CinemaShot=typeof CINEMA_SHOTS[number];
export type CameraView={position:V3;target:V3;fov:number};
export type RouteSampler=(distanceMetres:number)=>RoutePose;
export type CinemaSample={
 frame:number;fps:number;timeSeconds:number;shot:CinemaShot;localFrame:number;
 routeDistanceMeters:number;distanceMeters:number;speedMps:number;steerRadians:number;
 longitudinalAcceleration:number;lateralAcceleration:number;curvature:number;
 bodyPitch:number;bodyRoll:number;suspensionCompression:number;
 pose:RoutePose;afterfireDemand:number;throttle:number;gearChange:number;camera:CameraView;
};
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const smoothstep=(v:number)=>{const x=clamp(v,0,1);return x*x*(3-2*x);};
export function shotAtFrame(frame:number):CinemaShot{
 const f=clamp(Math.floor(frame),0,CINEMA_FRAMES-1);
 return CINEMA_SHOTS.find(s=>f<s.end)!;
}
/** Exact analytic speed integral avoids per-cut resets, accumulated drift and reverse-seek bugs. */
export function speedAt(t:number):number{
 const u=clamp(t,0,CINEMA_FRAMES/CINEMA_FPS);
 return 12+.60*u+2*Math.sin(Math.PI*u/25)**2;
}
export function distanceAt(t:number):number{
 const u=clamp(t,0,CINEMA_FRAMES/CINEMA_FPS);
 return 12*u+.30*u*u+u-25/(2*Math.PI)*Math.sin(2*Math.PI*u/25);
}
function afterfirePulse(t:number,start:number,end:number):number{
 if(t<start||t>=end)return 0;
 const attack=start===0?1:smoothstep((t-start)/.12);
 const release=1-smoothstep((t-(end-.22))/.22);
 return clamp(attack*release*(.86+.14*Math.sin((t-start)*37)**2),0,1);
}
/** Deterministic command for Agent 2. FX is not emitted until genuine mounts are integrated. */
export function afterfireAt(t:number):number{
 return Math.max(afterfirePulse(t,0,1),afterfirePulse(t,14.33,16.33),afterfirePulse(t,22.47,23.67));
}
const rotateY=(v:V3,yaw:number):V3=>[
 v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw),v[1],
 -v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw)
];
const add=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
/** All coordinates are relative to the moving car (+X = forward, +Z = left).
 * Lenses and deliberately small, evolving camera tracks keep hero present in 9:16
 * while allowing parallax rather than an artificial video-game lock-on. */
type LensPose={p:V3;target:V3;fov:number};
const cameraLocal:Record<CinemaShotId,{from:LensPose;to:LensPose}>={
 hook:{
  from:{p:[-8.45,2.20,4.45],target:[-1.16,.62,0],fov:52},
  to:{p:[-8.10,1.94,4.23],target:[-1.35,.56,0],fov:54}
 },
 launch:{
  from:{p:[2.6,1.72,10.75],target:[.30,.66,0],fov:53},
  to:{p:[-1.00,1.45,9.85],target:[.08,.60,0],fov:56}
 },
 'engine-reveal':{
  from:{p:[8.6,2.74,5.95],target:[.45,.77,0],fov:54},
  to:{p:[7.7,2.22,4.60],target:[.36,.74,0],fov:57}
 },
 mechanism:{
  from:{p:[3.8,7.9,9.6],target:[0,.69,0],fov:51},
  to:{p:[1.1,5.6,7.5],target:[-.15,.65,0],fov:58}
 },
 exhaust:{
  from:{p:[-8.3,1.93,4.10],target:[-1.7,.53,0],fov:54},
  to:{p:[-7.8,1.53,3.65],target:[-1.82,.50,0],fov:58}
 },
 payoff:{
  from:{p:[-9.5,2.35,5.20],target:[-.74,.71,0],fov:52},
  to:{p:[-7.9,1.60,4.45],target:[-1.13,.62,0],fov:54}
 }
};
const lerp=(a:number,b:number,u:number)=>a+(b-a)*u;
const lerp3=(a:V3,b:V3,u:number):V3=>[lerp(a[0],b[0],u),lerp(a[1],b[1],u),lerp(a[2],b[2],u)];
export function cameraAt(shot:CinemaShot,pose:RoutePose,localFrame:number):CameraView{
 const u=clamp(localFrame/Math.max(1,shot.end-shot.start-1),0,1),eased=smoothstep(u);
 const spec=cameraLocal[shot.id];
 const arc=Math.sin(Math.PI*u);
 const p=lerp3(spec.from.p,spec.to.p,eased);
 // A restrained dolly arc, zero at both endpoints; never frame-random shake.
 p[1]+=.075*arc;
 p[2]+=.12*arc*(shot.id==='payoff'?-1:1);
 const target=lerp3(spec.from.target,spec.to.target,eased);
 return {
  position:add(rotateY(p,pose.yaw),pose.position),
  target:add(rotateY(target,pose.yaw),pose.position),
  fov:lerp(spec.from.fov,spec.to.fov,eased)
 };
}
export function sampleCinema(frame:number,fps=CINEMA_FPS,routeSampler:RouteSampler=(d)=>sampleRoute(CINEMA_ROUTE,d)):CinemaSample{
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw Error('Finite frame and positive fps required');
 if(fps!==CINEMA_FPS)throw Error('EP005 Agent 3 native timeline is fixed at 30 fps');
 const f=clamp(Math.floor(frame),0,CINEMA_FRAMES-1),t=f/fps,shot=shotAtFrame(f);
 const localFrame=f-shot.start,distanceMeters=distanceAt(t);
 const routeDistanceMeters=CINEMA_START_METRES+distanceMeters;
 const pose=routeSampler(routeDistanceMeters);
 const ahead=routeSampler(routeDistanceMeters+.65),behind=routeSampler(routeDistanceMeters-.65);
 const turn=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 // Symmetric curvature sample for correct steering and sprung-mass load transfer.
 const curvature=turn(ahead.yaw,behind.yaw)/1.30;
 const steerRadians=clamp(-Math.atan(2.78*curvature),-.38,.38);
 const speedMps=speedAt(t);
 const longitudinalAcceleration=.60+(2*Math.PI/25)*Math.sin(2*Math.PI*t/25);
 const lateralAcceleration=clamp(speedMps*speedMps*curvature,-12,12);
 // Conservative chassis response: < 2.8 degrees roll and < 1 degree pitch.
 // Deterministic distance-based road texture (no unseeded jitter or wheel wobble).
 const bodyRoll=clamp(lateralAcceleration*.0036,-.044,.044);
 const bodyPitch=clamp(-longitudinalAcceleration*.006,-.013,.008);
 const suspensionCompression=clamp(
  .008+.002*Math.sin(distanceMeters*.16)+.001*Math.sin(distanceMeters*.34)+
   .00035*Math.abs(lateralAcceleration),.003,.022);
 const afterfireDemand=afterfireAt(t);
 const throttle=afterfireDemand>.2?.08:clamp(.44+.012*t,.44,.77);
 return {frame:f,fps,timeSeconds:t,shot,localFrame,routeDistanceMeters,distanceMeters,
 speedMps,steerRadians,longitudinalAcceleration,lateralAcceleration,curvature,
 bodyRoll,bodyPitch,suspensionCompression,pose,afterfireDemand,throttle,
 gearChange:afterfireDemand>.15?0:Math.max(0,Math.sin(t*2.1))**16,
 camera:cameraAt(shot,pose,localFrame)};
}
