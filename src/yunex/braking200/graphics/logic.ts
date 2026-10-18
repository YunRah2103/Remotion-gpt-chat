/** Deterministic, presentation-only helpers. No physics integration lives here. */
import {PROVISIONAL_CUES} from '../contracts.ts';
import type {
  BrakingSimulationState, CinematicCameraPose, FilmCue, Vec3,
  WheelKey,
} from '../contracts.ts';

export type ScreenPoint = {x:number; y:number; depth:number; visible:boolean};
export const clamp01=(x:number)=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
export const smooth=(x:number)=>{const a=clamp01(x);return a*a*(3-2*a);};
export const rad=(degrees:number)=>degrees*Math.PI/180;
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:Vec3,b:Vec3):Vec3=>[
  a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],
];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const unit=(a:Vec3):Vec3=>{
  const length=Math.hypot(...a);
  return length<1e-8?[1,0,0]:[a[0]/length,a[1]/length,a[2]/length];
};

/** Vertical-FOV pinhole projection, matching Three's unrolled PerspectiveCamera. */
export function projectWorldPoint(
  point:Vec3, camera:CinematicCameraPose, width=1080,height=1920,
):ScreenPoint {
  const forward=unit(sub(camera.target,camera.position));
  const right=unit(cross(forward,[0,1,0]));
  const up=unit(cross(right,forward));
  const relative=sub(point,camera.position);
  const depth=dot(relative,forward);
  if(depth<=.001)return {x:width/2,y:height/2,depth,visible:false};
  const focal=height/(2*Math.tan(rad(camera.fovDeg)/2));
  const x=width/2+dot(relative,right)*focal/depth;
  const y=height/2-dot(relative,up)*focal/depth;
  return {x,y,depth,visible:x>=0&&x<=width&&y>=0&&y<=height};
}
export const wheelFromState=(state:BrakingSimulationState,key:WheelKey='front-left')=>state.wheel[key];
export function speedText(state:BrakingSimulationState):string{
  return String(Math.max(0,Math.round(Math.max(0,state.speedMps)*3.6)));
}
export function activeCueAtFrame(frame:number):FilmCue{
  return PROVISIONAL_CUES.find(c=>frame>=c.fromFrame&&frame<c.toFrameExclusive)?.cue??'finale';
}
export function cueStartFrame(cue:FilmCue):number {
  return PROVISIONAL_CUES.find(c=>c.cue===cue)?.fromFrame??0;
}
export function cueEndFrame(cue:FilmCue):number {
  return PROVISIONAL_CUES.find(c=>c.cue===cue)?.toFrameExclusive??750;
}
/** Heat J is energy budget, NOT temperature. Reference must come from caller. */
export function heatVisual01(state:BrakingSimulationState,referenceJ:number):number {
  return referenceJ>0?clamp01(Math.max(0,state.brakeHeatJ)/referenceJ):0;
}
export function roadGripVisual01(state:BrakingSimulationState,key:WheelKey):number{
  const w=wheelFromState(state,key);
  return clamp01(Math.abs(w.roadLongitudinalForceN)/Math.max(1,w.normalLoadN));
}
export const shouldShowAbs=(state:BrakingSimulationState,key:WheelKey)=>wheelFromState(state,key).absIntervening;
export function safePin(p:ScreenPoint,margin=80):ScreenPoint{
  return {...p,x:Math.max(margin,Math.min(1080-margin,p.x)),y:Math.max(245,Math.min(1670,p.y))};
}
/** Returns line endpoint for road-on-tyre friction opposing direction of travel. */
export function oppositeTravelPoint(contact:Vec3,direction:Vec3,length:number):Vec3{
  const u=unit(direction);
  return [contact[0]-u[0]*length,contact[1]-u[1]*length,contact[2]-u[2]*length];
}
