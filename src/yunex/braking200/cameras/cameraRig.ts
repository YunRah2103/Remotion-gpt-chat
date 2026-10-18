/**
 * Agent 3 | deterministic portrait cinematic camera choreography.
 *
 * All positions are metres in the world-kit coordinate system: +X forward,
 * +Y up, +Z vehicle-left. This module never samples/changes physics.
 * Shots are deliberately expressed relative to the real kit vehicle and its
 * canonical wheel anchors rather than a stand-in car or a hand-built wheel.
 */
import {PROVISIONAL_CUES, wheelAnchors} from '../contracts.ts';
import type {CinematicCameraPose, FilmCue, TimedCue, Vec3, WheelAnchor} from '../contracts.ts';
import type {VehicleSpec} from '../../world-kit/catalog.ts';
import type {RoutePose} from '../../world-kit/environments.ts';

export type CinematicShot = {
  id: FilmCue;
  label: string;
  editorialIntent: string;
  transitionIn: string;
};
export const CAMERA_SHOTS: readonly CinematicShot[] = [
  {id:'hook', label:'The 200 km/h rush', editorialIntent:'Hero GT already in motion: front three-quarter tracking, low angle and track parallax', transitionIn:'Immediate moving image / no title card'},
  {id:'mechanism', label:'Nose-to-wheel dive', editorialIntent:'Motivated fast dolly from real headlamp toward front-left wheel, then slow settle on rotor target', transitionIn:'Match cut by visible front wheel from hero'},
  {id:'heat', label:'Brake mechanism orbit', editorialIntent:'Cinematic near-side macro that can reveal Agent 1 rotor and static caliper', transitionIn:'Cut on the circular wheel rim'},
  {id:'grip', label:'Tyre meets road', editorialIntent:'Ground-hugging contact-patch track across actual tyre, no exaggerated tyre slip', transitionIn:'Follow arc of wheel to road'},
  {id:'abs', label:'Controlled response', editorialIntent:'Close three-quarter wheel shot, sensor/caliper area remains readable for Agent 2 ABS insert', transitionIn:'Motivated pressure/lock-tendency insert; not an assertion ABS always engages'},
  {id:'finale', label:'Release and stop', editorialIntent:'Reveal full car and racetrack with graceful receding camera; stopping time comes ONLY from physics', transitionIn:'Wheel silhouette to real-world wide shot'},
] as const;

type Key = {eye: Vec3; aim: Vec3; fov: number};
const clamp01=(n:number)=>Math.min(1,Math.max(0,n));
const smooth=(n:number)=>{const t=clamp01(n);return t*t*(3-2*t);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const mix=(a:Vec3,b:Vec3,t:number):Vec3=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
/** Euler +Y yaw maps kit +X forward into the track tangent. */
export function vehicleToWorld(local:Vec3,route:RoutePose):Vec3 {
  const c=Math.cos(route.yaw),s=Math.sin(route.yaw);
  return [route.position[0]+c*local[0]+s*local[2],
    route.position[1]+local[1],
    route.position[2]-s*local[0]+c*local[2]];
}
export function cameraShotAtFrame(
  filmFrame:number,cues:readonly TimedCue[]=PROVISIONAL_CUES,
):{shot:FilmCue;progress01:number;fromFrame:number;toFrameExclusive:number} {
  if(!Number.isFinite(filmFrame))throw new Error('filmFrame must be finite');
  if(!cues.length)throw new Error('Camera cue list must not be empty');
  const active=cues.find(c=>filmFrame>=c.fromFrame&&filmFrame<c.toFrameExclusive)
    ??(filmFrame<cues[0].fromFrame?cues[0]:cues[cues.length-1]);
  const span=Math.max(1,active.toFrameExclusive-active.fromFrame);
  return {shot:active.cue,progress01:clamp01((filmFrame-active.fromFrame)/span),
    fromFrame:active.fromFrame,toFrameExclusive:active.toFrameExclusive};
}
function keyPose(spec:VehicleSpec,wheel:WheelAnchor,shot:FilmCue,progress:number):Key {
  const length=spec.length,height=spec.height,width=spec.width;
  const [wx,wy,wz]=wheel.center;
  const eased=smooth(progress);
  const wR=wheel.radiusM;
  // Full-car portrait shots keep the entire silhouette legible in the 9:16
  // narrow horizontal field of view. Macros may intentionally crop bodywork.
  switch(shot){
    case 'hook': {
      const a:Key={eye:[length*1.55,height*.82,width*2.35],
        aim:[length*.10,height*.59,0],fov:53};
      const b:Key={eye:[length*1.39,height*.71,width*2.38],
        aim:[length*.12,height*.59,width*.04],fov:53};
      return {eye:mix(a.eye,b.eye,eased),aim:mix(a.aim,b.aim,eased),fov:lerp(a.fov,b.fov,eased)};
    }
    case 'mechanism': {
      const a:Key={eye:[wx+length*.90,wy+height*.65,wz+width*1.25],
        aim:[wx,wy+.15,wz-.12],fov:46};
      const b:Key={eye:[wx+.39,wy+.38,wz+2.38],
        aim:[wx,wy,wz],fov:48};
      return {eye:mix(a.eye,b.eye,eased),aim:mix(a.aim,b.aim,eased),fov:lerp(a.fov,b.fov,eased)};
    }
    case 'heat': {
      const theta=lerp(.42,-.32,eased);
      return {eye:[wx+.25+Math.sin(theta)*.48,wy+.34+Math.cos(theta)*.28,wz+lerp(2.20,1.65,eased)],
        aim:[wx,wy+.02,wz-.025],fov:lerp(48,43,eased)};
    }
    case 'grip': {
      const low=wR*.10;
      return {eye:[wx+lerp(.47,-.25,eased),low+.14,wz+2.33],
        aim:[wx+lerp(.05,-.05,eased),low,wz+.005],fov:46};
    }
    case 'abs': {
      return {eye:[wx+lerp(.38,.75,eased),wy+lerp(.27,.47,eased),wz+lerp(2.42,2.72,eased)],
        aim:[wx+.04,wy*.90,wz-.04],fov:47};
    }
    case 'finale': {
      const a:Key={eye:[-length*1.42,height*1.28,width*2.84],
        aim:[-.12,height*.52,0],fov:53};
      const b:Key={eye:[-length*1.51,height*1.37,width*3.02],
        aim:[-.26,height*.53,0],fov:53};
      return {eye:mix(a.eye,b.eye,eased),aim:mix(a.aim,b.aim,eased),fov:lerp(a.fov,b.fov,eased)};
    }
  }
}
export type CameraSampleOptions={cues?:readonly TimedCue[];eyeOffsetM?:Vec3;lookOffsetM?:Vec3};
/**
 * Sample a seek-stable camera from ANY frame and the real track pose.
 * source of routePose: sampleRoute('track', startMetres + state.traveledM).
 * The named target stays anchored to the real kit wheel/body as it moves.
 */
export function sampleCameraPose(
  filmFrame:number, routePose:RoutePose, spec:VehicleSpec,
  options:CameraSampleOptions={},
):CinematicCameraPose {
  const {shot,progress01}=cameraShotAtFrame(filmFrame,options.cues);
  const wheel=wheelAnchors(spec).find(a=>a.id==='front-left');
  if(!wheel)throw new Error('Missing canonical front-left wheel anchor');
  const k=keyPose(spec,wheel,shot,progress01);
  const eye=add(k.eye,options.eyeOffsetM??[0,0,0]);
  const aim=add(k.aim,options.lookOffsetM??[0,0,0]);
  return {
    position:vehicleToWorld(eye,routePose),
    target:vehicleToWorld(aim,routePose),
    fovDeg:k.fov,
    focusId:shot==='mechanism'||shot==='heat'||shot==='abs'?'front-left':
      shot==='grip'?'road':'vehicle',
  };
}
