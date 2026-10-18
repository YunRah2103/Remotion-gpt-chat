/**
 * A5 INTEGRATED NATIVE MOTION PROOFS — real A1/A2/A3/A4 peers.
 *
 * This file deliberately imports unmerged peer-owned departments. The A5
 * GitHub Actions proof job hydrates those exact branch directories into its
 * TEMPORARY checkout before TypeScript/bundling; PR only changes graphics/**.
 * No copies of peers' source enter the A5 PR. This is NOT an isolated mock.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BRAKING_EP001,wheelAnchors} from '../contracts.ts';
import type {BrakingSimulationState,CinematicCameraPose,FilmCue,TimedCue,Vec3} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {sampleRoute} from '../../world-kit/environments.ts';
import {Environment,CameraAim,WorldLighting} from '../../world-kit/components.tsx';
// @ts-ignore Agent 1 source is hydrated at render time from owned upstream branch.
import {BrakingVehicle} from '../engineering/BrakingVehicle.tsx';
// @ts-ignore Agent 2 source is hydrated at render time from owned upstream branch.
import {sampleBrakingSimulation} from '../physics/simulation.ts';
// @ts-ignore Agent 2 dedicated film-time map is hydrated at render time.
import {mapAbsInsertFrameToSimulationSec} from '../physics/timeline.ts';
// @ts-ignore Agent 3 authoritative camera rig is hydrated at render time.
import {sampleCameraPose} from '../cameras/cameraRig.ts';
import {BrakingGraphics,DEFAULT_BRAKING_GRAPHICS_PALETTE} from './BrakingGraphics.tsx';
import {heatVisual01,smooth} from './logic.ts';

const SPEC=vehicleSpec(BRAKING_EP001.vehicleVariant);
const FRONT=wheelAnchors(SPEC).find(a=>a.id==='front-left');
if(!FRONT)throw Error('Missing canonical A1 front-left wheel anchor');
const FOCUS=FRONT.center;
const ROTOR_POINT:Vec3=[FOCUS[0]+.12,FOCUS[1]+.07,FOCUS[2]+.055];
const CONTACT_POINT:Vec3=[FOCUS[0],.018,FOCUS[2]];
const startDistance=75;
const HEAT_REF_J=1700000; // fixed ARTISTIC NORMALISATION for A2's energy budget
const cuesMacro:readonly TimedCue[]=[
 {cue:'mechanism',fromFrame:0,toFrameExclusive:55},
 {cue:'heat',fromFrame:55,toFrameExclusive:96},
 {cue:'grip',fromFrame:96,toFrameExclusive:120},
 {cue:'abs',fromFrame:120,toFrameExclusive:150},
];
const cuesTrack:readonly TimedCue[]=[
 {cue:'hook',fromFrame:0,toFrameExclusive:48},
 {cue:'mechanism',fromFrame:48,toFrameExclusive:84},
 {cue:'heat',fromFrame:84,toFrameExclusive:118},
 {cue:'grip',fromFrame:118,toFrameExclusive:150},
];
const cueAt=(f:number,cues:readonly TimedCue[])=>cues.find(c=>f>=c.fromFrame&&f<c.toFrameExclusive)??cues[cues.length-1];
function intoWorld(local:Vec3,route:{position:readonly [number,number,number];yaw:number}):Vec3{
 const c=Math.cos(route.yaw),s=Math.sin(route.yaw);
 return [
  route.position[0]+c*local[0]+s*local[2],
  route.position[1]+local[1],
  route.position[2]-s*local[0]+c*local[2],
 ];
}
function dryTime(f:number,mode:'macro'|'track'):number{
 if(mode==='track'){
  if(f<48)return f/48*1.05;
  if(f<84)return 1.05+(f-48)/36*.85;
  if(f<118)return 1.9+(f-84)/34*.95;
  return 2.85+(f-118)/32*.90;
 }
 if(f<55)return .37+f/55*1.07;
 if(f<96)return 1.44+(f-55)/41*1.04;
 return 2.48+(f-96)/24*.83;
}
function shortenCamera(camera:CinematicCameraPose,amount:number):CinematicCameraPose{
 return {...camera,position:camera.position.map((v,i)=>camera.target[i]+
  (v-camera.target[i])*amount) as unknown as Vec3};
}
const hexPalette={
 ...DEFAULT_BRAKING_GRAPHICS_PALETTE,
 amber:'#d2a36c',steel:'#a2becb',ivory:'#f5f2e8',shadow:'#10232c',
};
/**
 * A1/A2/A3 share the exact state and real route on each frame.
 * ABS segment is a separately labelled low-grip scenario, never dry-stop ABS.
 */
const Proof:React.FC<{mode:'macro'|'track'}>=({mode})=>{
 const f=useCurrentFrame(),{width,height}=useVideoConfig();
 const cues=mode==='macro'?cuesMacro:cuesTrack;
 const segment=cueAt(f,cues);
 const cue:FilmCue=segment.cue;
 const local=f-segment.fromFrame;
 const lowGripExample=mode==='macro'&&cue==='abs';
 const simTime=lowGripExample
  ?mapAbsInsertFrameToSimulationSec(local/30*145)
  :dryTime(f,mode);
 const state:BrakingSimulationState=sampleBrakingSimulation(simTime,
  lowGripExample?'low-grip-abs':'dry-track');
 const lastDry=sampleBrakingSimulation(dryTime(119,'macro'),'dry-track').traveledM;
 const absStart=sampleBrakingSimulation(mapAbsInsertFrameToSimulationSec(0),'low-grip-abs').traveledM;
 const offset=lowGripExample?lastDry-absStart:0;
 const route=sampleRoute('track',startDistance+state.traveledM+offset);
 const sampledCamera:CinematicCameraPose=sampleCameraPose(f,route,SPEC,{cues});
 const camera=shortenCamera(sampledCamera,
  cue==='hook'?.70:cue==='mechanism'?.87:cue==='heat'?.85:cue==='grip'?.84:.91);
 const focus=intoWorld(cue==='grip'?CONTACT_POINT:ROTOR_POINT,route);
 const forward=intoWorld([1,0,0],{position:[0,0,0],yaw:route.yaw});
 const heatIllustration01=heatVisual01(state,HEAT_REF_J);
 const cutaway=(cue==='mechanism'||cue==='heat'||cue==='abs')
  ?(.63+.22*smooth(local/21)):0;
 const absActive=state.wheel['front-left'].absIntervening;
 return <AbsoluteFill style={{background:'#bacbd0'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{
   position:[...camera.position],fov:camera.fovDeg,near:.035,far:350,
  }}>
   <WorldLighting timeOfDay="day" focus={route.position}/>
   <Environment kind="track" seed={BRAKING_EP001.environmentSeed} timeOfDay="day"/>
   <CameraAim position={[...camera.position]} target={[...camera.target]}
    fov={camera.fovDeg}/>
   <BrakingVehicle simulation={state} pose={route} cutawayWheel="front-left"
    cutaway01={cutaway} heatIllustration01={heatIllustration01}/>
  </ThreeCanvas>
  <BrakingGraphics state={state} cue={cue} cueFrame={local}
   cameraPose={camera} focusWorld={focus} heatReferenceJ={HEAT_REF_J}
   travelDirectionWorld={forward} wheelKey="front-left"
   lowGripExample={lowGripExample} palette={hexPalette}/>
  {lowGripExample&&<div style={{
    position:'absolute',bottom:'8%',left:'9%',right:'9%',
    fontFamily:'Arial,Helvetica,sans-serif',fontSize:22,fontWeight:800,
    letterSpacing:4,color:'#f5f2e8',textShadow:'0px 2px 7px #10232c',
    opacity:absActive?1:.74,
   }}>LOW-GRIP EXAMPLE · ABS ONLY IF WHEEL LOCK IS IMMINENT</div>}
 </AbsoluteFill>;
};
export const BrakingGraphicsMacroProof:React.FC=()=> <Proof mode="macro"/>;
export const BrakingGraphicsTrackProof:React.FC=()=> <Proof mode="track"/>;
