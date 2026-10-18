/** YUNEX EP001 Agent 6 — editable picture-only 27s master.
 * Integrates A1/A2/A3/A4/A5 from exact pinned, read-only departmental commits.
 * No fake speed/distance, custom car, duplicate environment or fabricated ABS.
 * Agent 7 audio starts ONLY after manager-approved picture lock.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BRAKING_EP001,wheelAnchors} from '../contracts.ts';
import type {CinematicCameraPose,FilmCue,TimedCue,Vec3,BrakingSimulationState} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {sampleRoute} from '../../world-kit/environments.ts';
import {CameraAim,Environment} from '../../world-kit/components.tsx';
// @ts-ignore Integration source supplied by pinned A1 commit in render workflow.
import {BrakingVehicle} from '../engineering/BrakingVehicle.tsx';
// @ts-ignore Integration source supplied by pinned A2 commit in render workflow.
import {sampleBrakingSimulation} from '../physics/simulation.ts';
// @ts-ignore Integration source supplied by pinned A2 commit in render workflow.
import {mapAbsInsertFrameToSimulationSec,mapFilmFrameToSimulationSec} from '../physics/timeline.ts';
// @ts-ignore Integration source supplied by pinned A3 commit in render workflow.
import {sampleCameraPose} from '../cameras/cameraRig.ts';
// @ts-ignore Integration source supplied by pinned A4 commit in render workflow.
import {BrakingLookdev} from '../lookdev/BrakingLookdev.tsx';
// @ts-ignore Integration source supplied by pinned A5 commit in render workflow.
import {BrakingGraphics} from '../graphics/BrakingGraphics.tsx';
// @ts-ignore Integration source supplied by pinned A5 commit in render workflow.
import {heatVisual01,smooth} from '../graphics/logic.ts';

export const EP001_FPS=30;
export const EP001_FRAMES=810; // 27 seconds; first-cut picture, not lock
export const EP001_SHOTS:readonly TimedCue[]=[
 {cue:'hook',fromFrame:0,toFrameExclusive:155},
 {cue:'mechanism',fromFrame:155,toFrameExclusive:305},
 {cue:'heat',fromFrame:305,toFrameExclusive:385},
 {cue:'grip',fromFrame:385,toFrameExclusive:500},
 {cue:'abs',fromFrame:500,toFrameExclusive:682},
 {cue:'finale',fromFrame:682,toFrameExclusive:810},
];
const SPEC=vehicleSpec(BRAKING_EP001.vehicleVariant);
const FRONT=wheelAnchors(SPEC).find(x=>x.id==='front-left');
if(!FRONT)throw Error('Cannot edit without the canonical wheel anchor.');
const HEAT_REFERENCE_J=1700000; // visual normalisation; explicitly NOT a temperature
const START_ROUTE_M=75;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const world=(p:Vec3,route:{position:Vec3;yaw:number}):Vec3=>{
 const c=Math.cos(route.yaw),s=Math.sin(route.yaw);
 return [route.position[0]+c*p[0]+s*p[2],route.position[1]+p[1],
  route.position[2]-s*p[0]+c*p[2]];
};
const zoom=(camera:CinematicCameraPose,t:number):CinematicCameraPose=>({
 ...camera,position:camera.position.map((x,i)=>camera.target[i]+(x-camera.target[i])*t) as unknown as Vec3,
});
const shotFor=(frame:number)=>EP001_SHOTS.find(x=>frame>=x.fromFrame&&frame<x.toFrameExclusive)
 ??EP001_SHOTS[EP001_SHOTS.length-1];

/** Find a real ABS intervention window from A2 physics: never script the ABS on. */
const ABS_START=(()=>{
 let best=0,score=-1;
 for(let i=0;i<=55;i++){
  let hits=0;
  for(let k=0;k<90;k++){
   const sampled=sampleBrakingSimulation(mapAbsInsertFrameToSimulationSec(i+k),'low-grip-abs');
   if(sampled.wheel['front-left'].absIntervening)hits++;
  }
  if(hits>score){score=hits;best=i;}
 }
 return best;
})();

export type BrakingEditorialSample={
 frame:number; cue:FilmCue; local:number; state:BrakingSimulationState;
 route:ReturnType<typeof sampleRoute>; camera:CinematicCameraPose;
 lowGrip:boolean; cutaway:number;
};
export function sampleEditorialFrame(frame:number):BrakingEditorialSample{
 const cue=shotFor(frame),local=Math.max(0,frame-cue.fromFrame);
 const lowGrip=cue.cue==='abs';
 // A low-grip what-if insert, not an unexplained extension of the dry-road stop.
 const simTime=lowGrip
  ?mapAbsInsertFrameToSimulationSec(ABS_START+Math.min(local,94)*.95)
  :mapFilmFrameToSimulationSec(frame*750/EP001_FRAMES);
 const state=sampleBrakingSimulation(simTime,lowGrip?'low-grip-abs':'dry-track');
 // The insert uses a separate chronological physical simulation; avoid positional
 // teleport within that insert while maintaining exactly ONE shared scene car.
 const insertDry=sampleBrakingSimulation(mapFilmFrameToSimulationSec(500*750/EP001_FRAMES));
 const insertAbs=sampleBrakingSimulation(mapAbsInsertFrameToSimulationSec(ABS_START),'low-grip-abs');
 const routeShift=lowGrip?insertDry.traveledM-insertAbs.traveledM:0;
 const route=sampleRoute(BRAKING_EP001.environment,START_ROUTE_M+routeShift+state.traveledM);
 const raw=sampleCameraPose(frame,route,SPEC,{cues:EP001_SHOTS});
 const distance=cue.cue==='hook'?.94:cue.cue==='mechanism'?.86:
  cue.cue==='heat'?.83:cue.cue==='grip'?.85:cue.cue==='abs'?.88:.92;
 const camera=zoom(raw,distance);
 const cutaway=(cue.cue==='mechanism'||cue.cue==='heat'||cue.cue==='abs')
  ?(.62+.23*smooth(local/24)):0;
 return {frame,cue:cue.cue,local,state,route,camera,lowGrip,cutaway};
}
const LookUpper:React.FC<{sample:BrakingEditorialSample}>=({sample})=>{
 const {cue,local,state,lowGrip}=sample,pressure=clamp(state.wheel['front-left'].brakePressure01);
 if(cue==='hook'||cue==='finale')return null;
 const phrase=cue==='mechanism'?'HYDRAULIC PRESSURE':
  cue==='heat'?'MOVEMENT BECOMES HEAT':
  cue==='grip'?'LOAD TRANSFERS FORWARD':'WHEEL LOCK PREVENTION';
 const {fps}=useVideoConfig();
 const fade=smooth(local/Math.max(1,fps*.24));
 return <div style={{position:'absolute',top:190,left:94,right:90,
  pointerEvents:'none',opacity:fade,fontFamily:'Arial,Helvetica,sans-serif',
  textShadow:'0 2px 10px rgba(9,22,31,.78)'}}>
   <div style={{fontSize:29,letterSpacing:5,fontWeight:800,color:'#f6f2e9'}}>{phrase}</div>
   {cue==='mechanism'&&<div style={{height:5,width:280,marginTop:22,
      background:'rgba(243,245,239,.32)',borderRadius:4}}>
     <div style={{height:'100%',width:(pressure*100)+'%',background:'#e9b57c',
      borderRadius:4}}/>
   </div>}
   {cue==='grip'&&<div style={{fontSize:23,letterSpacing:2,color:'#d8dce0',marginTop:11}}>
    FRONT TYRES CARRY MORE LOAD</div>}
   {lowGrip&&<div style={{fontSize:25,color:'#eec28e',marginTop:10,fontWeight:800,
     letterSpacing:3}}>LOW-GRIP EXAMPLE — NOT THE DRY STOP</div>}
 </div>;
};
const FlashCut:React.FC<{frame:number}>=({frame})=>{
 const boundary=EP001_SHOTS.slice(1).map(x=>x.fromFrame);
 const delta=Math.min(...boundary.map(x=>Math.abs(frame-x)));
 if(delta>3)return null;
 // A subtle directional exposure accent ON the image, never blank frames.
 return <div style={{position:'absolute',inset:0,pointerEvents:'none',
  background:'linear-gradient(100deg, transparent 38%, rgba(227,241,245,.26) 52%, transparent 70%)',
  opacity:(1-delta/4)*.50}}/>;
};
/** One live A1 car, one A3 track; A4 decor is not a second environment.
 * Parent vehicle pitch is local -Z: +X nose dips during front load transfer.
 */
export const Braking200FirstCut:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const s=sampleEditorialFrame(frame);
 const {state,cue,local,route,camera,lowGrip,cutaway}=s;
 const localPose={...route,position:[0,0,0] as [number,number,number],yaw:0};
 const rotorFocus=world([FRONT.center[0]+.12,FRONT.center[1]+.07,FRONT.center[2]+.055],route);
 const contactFocus=world([FRONT.center[0],.018,FRONT.center[2]],route);
 const focus=cue==='grip'?contactFocus:rotorFocus;
 const forward=world([1,0,0],{position:[0,0,0],yaw:route.yaw});
 const heat=heatVisual01(state,HEAT_REFERENCE_J);
 return <AbsoluteFill style={{background:'#253642',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows
   camera={{position:[...camera.position],fov:camera.fovDeg,near:.035,far:400}}>
    <Environment kind={BRAKING_EP001.environment}
     seed={BRAKING_EP001.environmentSeed} timeOfDay={BRAKING_EP001.timeOfDay}/>
    <group position={[...route.position]} rotation={[0,route.yaw,0]}>
     <group rotation={[0,0,-state.pitchRad]}>
      <BrakingVehicle simulation={state} pose={localPose}
       cutawayWheel="front-left" cutaway01={cutaway}
       isolateOppositeRimInCutaway={cutaway>.35}
       heatIllustration01={heat}/>
     </group>
    </group>
    <BrakingLookdev state={state} route={route} focus={route.position}
     environmentDressing contactShadow/>
    <CameraAim position={[...camera.position]} target={[...camera.target]}
     fov={camera.fovDeg}/>
  </ThreeCanvas>
  <BrakingGraphics state={state} cue={cue} frame={frame} cueFrame={local}
   cameraPose={camera} focusWorld={focus} wheelKey="front-left"
   heatReferenceJ={HEAT_REFERENCE_J} travelDirectionWorld={forward}
   lowGripExample={lowGrip}
   palette={{ivory:'#f7f3e9',amber:'#d2a36c',steel:'#b4cbd6',shadow:'#0c1e2a'}}/>
  <LookUpper sample={s}/>
  <FlashCut frame={frame}/>
 </AbsoluteFill>;
};
