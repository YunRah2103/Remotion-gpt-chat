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
  return camera(both,yaw,[25+arc*.95,2.1,5.7+arc*.6],[0,1.0,0],53);
 }
 case 'shortcut':{
  const r=reference(state,'shortcut');
  return camera(r.origin,r.yaw,[-12.9,2.7,4.2+arc*.3],[3.7,0.76,0],48);
 }
 case 'wide-entry':{
  const r=reference(state,'racing');
  return camera(r.origin,r.yaw,[19.5,3.45,-5.4-arc*.45],[-.3,.8,0],47);
 }
 case 'apex':{
  return camera(both,yaw,[13.9,3.25,-10.2-arc*.5],[1.2,.82,0],56);
 }
 case 'onboard':{
  // Lens just above the halo, offset from centre. Framing follows actual yaw.
  return camera(racing.worldPose.position,yaw,[-.6,1.62,.48],[20,1.28,.2],66);
 }
 case 'duel':{
  return camera(both,yaw,[-1.8,4.5,24.5+arc*.7],[0,.85,0],43);
 }
 case 'overhead':{
  return camera(both,yaw,[6.0,31,10],[.0,0,0],48);
 }
 case 'force':{
  return camera(both,yaw,[2.8,23.5,16.4+arc*.5],[0,.1,0],52);
 }
 case 'exit':{
  return camera(racing.worldPose.position,yaw,[-18.5-arc*.55,3.4,4.7],[9,.85,0],48);
 }
 case 'final':{
  return camera(both,yaw,[-24-arc*.85,7.3,11],[5,.9,0],50);
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
