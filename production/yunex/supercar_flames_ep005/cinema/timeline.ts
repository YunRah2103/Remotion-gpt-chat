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
const cameraLocal:Record<CinemaShotId,{p:V3;target:V3;fov:number}>={
 hook:{p:[-9.7,2.45,5.15],target:[-.8,.68,0],fov:47},
 launch:{p:[.55,2.9,12.0],target:[0,.66,0],fov:51},
 'engine-reveal':{p:[10.3,3.45,6.9],target:[.2,.76,0],fov:49},
 mechanism:{p:[4.9,7.3,9.9],target:[0,.67,0],fov:50},
 exhaust:{p:[-9.0,2.1,5.15],target:[-1.8,.57,0],fov:47},
 payoff:{p:[-10.1,2.6,5.5],target:[0,.79,0],fov:47}
};
export function cameraAt(shot:CinemaShot,pose:RoutePose,localFrame:number):CameraView{
 const spec=cameraLocal[shot.id],u=clamp(localFrame/Math.max(1,shot.end-shot.start-1),0,1);
 const eased=smoothstep(u),p:V3=[
  spec.p[0]+(eased-.5)*.42+(shot.id==='payoff'?eased*.45:0),
  spec.p[1]+(eased-.5)*.12,
  spec.p[2]+(shot.id==='payoff'?(eased-.5)*-.92:(eased-.5)*.24)
 ];
 return {position:add(rotateY(p,pose.yaw),pose.position),
 target:add(rotateY(spec.target,pose.yaw),pose.position),fov:spec.fov};
}
export function sampleCinema(frame:number,fps=CINEMA_FPS,routeSampler:RouteSampler=(d)=>sampleRoute(CINEMA_ROUTE,d)):CinemaSample{
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw Error('Finite frame and positive fps required');
 if(fps!==CINEMA_FPS)throw Error('EP005 Agent 3 native timeline is fixed at 30 fps');
 const f=clamp(Math.floor(frame),0,CINEMA_FRAMES-1),t=f/fps,shot=shotAtFrame(f);
 const localFrame=f-shot.start,distanceMeters=distanceAt(t);
 const routeDistanceMeters=CINEMA_START_METRES+distanceMeters;
 const pose=routeSampler(routeDistanceMeters),ahead=routeSampler(routeDistanceMeters+.45);
 const dYaw=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw));
 const steerRadians=clamp(-dYaw*2.78/.45,-.38,.38);
 const afterfireDemand=afterfireAt(t);
 const throttle=afterfireDemand>.2?.08:clamp(.44+.012*t,.44,.77);
 return {frame:f,fps,timeSeconds:t,shot,localFrame,routeDistanceMeters,distanceMeters,
 speedMps:speedAt(t),steerRadians,pose,afterfireDemand,throttle,
 gearChange:afterfireDemand>.15?0:Math.max(0,Math.sin(t*2.1))**16,
 camera:cameraAt(shot,pose,localFrame)};
}
