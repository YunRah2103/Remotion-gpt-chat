import type {RaceCameraPose,RaceCameraShot,RaceCarId,RaceFrameState,V3} from '../contract.ts';
import {add,angleDelta,assertFiniteVector,clamp,localOffset,magnitude,mix,subtract} from './math.ts';

export type CinematicShotId=RaceCameraShot|'onboard'|'duel'|'overhead';
export type CameraSubject='both'|RaceCarId;
export type ShotDefinition={id:CinematicShotId;subject:CameraSubject;purpose:string;maxRecommendedSeconds:number};

/** All shots are stateless evaluations of the same simulation frame; no animated car stand-ins. */
export const CINEMA_SHOT_LIST:readonly ShotDefinition[]=[
 {id:'opening',subject:'both',purpose:'Low oncoming three-quarter hero; establish both coloured cars immediately',maxRecommendedSeconds:2.4},
 {id:'shortcut',subject:'shortcut',purpose:'Low rear/side pursuit that exposes the tempting short inside trajectory',maxRecommendedSeconds:2.8},
 {id:'wide-entry',subject:'racing',purpose:'Front quarter telephoto tracking reveals the different entry angle',maxRecommendedSeconds:2.8},
 {id:'apex',subject:'both',purpose:'Moving apex-side pan with both vehicles and kerb in context',maxRecommendedSeconds:2.6},
 {id:'onboard',subject:'racing',purpose:'Bonnet/halo-height cockpit-like POV looking through the corner',maxRecommendedSeconds:2.1},
 {id:'duel',subject:'both',purpose:'Side-by-side long-lens dolly to compare real positions without a fake pass',maxRecommendedSeconds:2.5},
 {id:'overhead',subject:'both',purpose:'Brief high oblique reveal of complete road placement',maxRecommendedSeconds:2},
 {id:'force',subject:'both',purpose:'High oblique tracking provides empty ground for world-space force graphics',maxRecommendedSeconds:2.5},
 {id:'exit',subject:'racing',purpose:'Low rear chase looking up the exit straight, accelerating perspective',maxRecommendedSeconds:3},
 {id:'final',subject:'both',purpose:'Cinematic pullback following the pair into the distance',maxRecommendedSeconds:3},
] as const;

function center(state:RaceFrameState):V3{
 return mix(state.cars.shortcut.worldPose.position,state.cars.racing.worldPose.position,.5);
}
function reference(state:RaceFrameState,subject:CameraSubject){
 const car=subject==='both'?state.cars.racing:state.cars[subject];
 return {origin:subject==='both'?center(state):car.worldPose.position,yaw:car.worldPose.yaw};
}
function camera(origin:V3,yaw:number,pos:[number,number,number],look:[number,number,number],fov:number):RaceCameraPose{
 const result={position:localOffset(origin,yaw,...pos),target:localOffset(origin,yaw,...look),fov};
 assertFiniteVector(result.position,'camera position');assertFiniteVector(result.target,'camera target');
 if(!(result.fov>=24&&result.fov<=73)||magnitude(subtract(result.position,result.target))<1)throw new Error('Invalid cinematic lens/target');
 return result;
}
/**
 * Protect all four wheels and both front/rear wings in the actual 9:16 output.
 * Fit is purely derived from the real RaceFrameState (never moves either car).
 * The camera retains its shot direction and target while pulling back only as
 * far as needed to keep both full-scale formula cars inside the portrait gate.
 * This is especially important as A1/A2 trajectories diverge through the turn.
 */
function fitPairInPortrait(initial:RaceCameraPose,state:RaceFrameState):RaceCameraPose{
 const target=initial.target,axis=subtract(initial.position,target);
 const norm=(v:V3):V3=>{const d=magnitude(v);return [v[0]/d,v[1]/d,v[2]/d];};
 const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const focal=Math.tan(initial.fov*Math.PI/360),aspect=9/16;
 const corners:V3[]=[];
 for(const id of ['shortcut','racing'] as const){
  const car=state.cars[id],o=car.worldPose.position,yaw=car.worldPose.yaw;
  const co=Math.cos(yaw),si=Math.sin(yaw);
  for(const front of [-2.9,2.9])for(const lateral of [-1.18,1.18])for(const height of [.13,1.45]){
   corners.push([o[0]+front*co+lateral*si,o[1]+height,o[2]-front*si+lateral*co]);
  }
 }
 const forward=norm(subtract(target,initial.position));
 const right=norm(cross(forward,[0,1,0]));
 const up=norm(cross(right,forward));
 let scale=1;
 for(let i=0;i<45;i++){
  const p=add(target,[axis[0]*scale,axis[1]*scale,axis[2]*scale]);
  const safe=corners.every(c=>{
   const ray=subtract(c,p),z=dot(ray,forward);
   return z>.5&&Math.abs(dot(ray,right)/(z*focal*aspect))<.87&&
     Math.abs(dot(ray,up)/(z*focal))<.89;
  });
  if(safe)return {...initial,position:p};
  scale*=1.09;
 }
 // Extreme pathological states must remain finite even if no single attractive
 // portrait shot can contain cars arbitrarily far apart.
 return {...initial,position:add(target,[axis[0]*scale,axis[1]*scale,axis[2]*scale])};
}
/**
 * Deterministic camera poses in metres. Reads authoritative car poses; NEVER advances cars.
 * frame can be sought out of order. The time wobble is small and continuous, not a whip effect.
 * Camera values are tuned for portrait 9:16 and framed to leave title-safe sky/track space.
 */
export function getRaceCamera(shotId:CinematicShotId,state:RaceFrameState,frame:number):RaceCameraPose{
 if(!Number.isFinite(frame)||!Number.isFinite(state.fps)||state.fps<=0)throw new Error('Invalid frame/fps');
 const t=frame/state.fps,arc=Math.sin(t*.77),racing=state.cars.racing,shortcut=state.cars.shortcut;
 const both=center(state);
 const yaw=racing.worldPose.yaw;
 const relative=angleDelta(shortcut.worldPose.yaw,yaw);
 if(!Number.isFinite(relative)||!Number.isFinite(racing.speedMps))throw new Error('Invalid vehicle state');
 switch(shotId){
 case 'opening':{
  // Approach cars face-on, camera's tracking speed lets tarmac slide below them.
  return fitPairInPortrait(camera(both,yaw,[15.8+arc*.35,1.28,.65+arc*.12],[0,-.55,0],57),state);
 }
 case 'shortcut':{
  const r=reference(state,'shortcut');
  return camera(r.origin,r.yaw,[13.6,2.55,-5.8-arc*.3],[-.7,.74,0],50);
 }
 case 'wide-entry':{
  const r=reference(state,'racing');
  return camera(r.origin,r.yaw,[-12.5,3.15,3.9+arc*.3],[3.7,.83,.15],50);
 }
 case 'apex':{
  return camera(both,yaw,[13.9,3.25,-10.2-arc*.5],[1.2,.82,0],56);
 }
 case 'onboard':{
  // Lens just above the halo, offset from centre. Framing follows actual yaw.
  return camera(racing.worldPose.position,yaw,[-1.15,1.44,.12],[16,.94,0],65);
 }
 case 'duel':{
  return fitPairInPortrait(camera(both,yaw,[3.2,13.2,14.8+arc*.3],[0,.89,0],71),state);
 }
 case 'overhead':{
  return fitPairInPortrait(camera(both,yaw,[4.5,26,8],[0,0,0],48),state);
 }
 case 'force':{
  return camera(both,yaw,[2.8,23.5,16.4+arc*.5],[0,.1,0],52);
 }
 case 'exit':{
  return camera(both,yaw,[-15.0-arc*.3,3.9,2.7],[4,.86,0],57);
 }
 case 'final':{
  return fitPairInPortrait(camera(both,yaw,[-17.2-arc*.55,6.1,8.5],[4,.9,0],51),state);
 }
 default:
  throw new Error('Unknown cinema shot '+String(shotId));
 }
}
/** A stable shot choice for each contiguous 2-second preview beat. */
export type PreviewReel='A'|'B';
export const PREVIEW_A_SHOTS:readonly CinematicShotId[]=['opening','shortcut','onboard','exit'];
export const PREVIEW_B_SHOTS:readonly CinematicShotId[]=['duel','wide-entry','overhead','final'];
export function previewShotAt(frame:number,fps:number,reel:PreviewReel):CinematicShotId{
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw new Error('Invalid preview frame');
 const shots=reel==='A'?PREVIEW_A_SHOTS:PREVIEW_B_SHOTS;
 return shots[clamp(Math.floor(frame/(fps*2)),0,shots.length-1)];
}
