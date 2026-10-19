/**
 * Actual Agent1+Agent2+Agent4 hydration review. Only run after GitHub workflow
 * hydrates the approved immutable sources from the separate agent branches.
 * Never substitutes A8 PREVIEW_INCIDENT for authoritative 4s / 70mph A2 state.
 */
import React,{useCallback,useMemo} from 'react';
import {AbsoluteFill,Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import {DYNAMICS_DEFAULTS,sampleDynamics} from '../dynamics/model.ts';
import {prepareTyreRig,deformRubber} from '../mechanics/tyreRig.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {crashIncidentFromDynamics,sampleCrashOutcome} from './model.ts';
import type {CrashOutcomeFrame} from './model.ts';
import {CrashBarrierWorld} from './Barrier.tsx';
import {CrashCarRig,ImpactEffects3D} from './Preview.tsx';

const wheelIds=['front-left','front-right','rear-left','rear-right'] as const;
const sourceSec=4;
const sourceParams={...DYNAMICS_DEFAULTS,initialSpeedMps:70*0.44704};
const seed=sampleDynamics(sourceSec,sourceParams);
const incident=crashIncidentFromDynamics(seed);
export const sampleHydratedCrash=(tSec:number)=>sampleCrashOutcome(tSec,{
 incident,reaction:'panic-brake-and-overcorrect',worldCutX:-86,
});
/** Just a deterministically rebased view, NOT an imaginary movement of the car. */
const HydroCar:React.FC<{frame:CrashOutcomeFrame}>=({frame})=>{
 const rig=useMemo(()=>prepareTyreRig('front-right',0),[]);
 const makeVehicle=useCallback(()=>finishGrandTourer(rig.vehicle),[rig]);
 const afterPose=useCallback((vehicle:T.Group,f:CrashOutcomeFrame)=>{
  vehicle.updateMatrixWorld(true);
  const angle=f.headingRad-seed.yawRad;
  const cs=Math.cos(angle),sn=Math.sin(angle);
  const pivots:T.Group[]=[];
  vehicle.traverse(o=>{
   if(o instanceof T.Group&&o.userData.steering&&o.name.startsWith('steer-'))pivots.push(o);
  });
  for(const pivot of pivots){
   const id=(pivot.position.x>0?'front':'rear')+'-'+(pivot.position.z<0?'right':'left');
   if(!wheelIds.includes(id as typeof wheelIds[number]))continue;
   const wheel=seed.wheels[id as typeof wheelIds[number]];
   const relX=wheel.hubWorldM[0]-seed.positionM[0];
   const relZ=wheel.hubWorldM[2]-seed.positionM[2];
   const localX=relX*cs+relZ*sn,localZ=-relX*sn+relZ*cs;
   const hubWorld=new T.Vector3(
    f.scenePositionM[0]+localX,
    wheel.hubWorldM[1]+(f.pitchRad-seed.pitchRad)*localX-(f.rollRad-seed.rollRad)*localZ,
    f.scenePositionM[2]+localZ);
   pivot.position.copy(vehicle.worldToLocal(hubWorld));
   pivot.rotation.y=id.startsWith('front')?f.driverSteerRad:0;
   const roll=pivot.children.find(o=>o.userData.wheel);
   if(roll)roll.rotation.z=id==='front-right'?f.frontRightWheelSpinRad:
    wheel.spinRad-f.distanceTravelledM/wheel.rollingRadiusM;
  }
  const tyre=sampleTyreFailure(f.sourceTimeSec,{angularPhaseRad:f.frontRightWheelSpinRad});
  rig.roll.rotation.z=f.frontRightWheelSpinRad;
  vehicle.updateMatrixWorld(true);
  deformRubber(rig,tyre);
 },[rig]);
 return <CrashCarRig frame={frame} makeVehicle={makeVehicle} afterPose={afterPose}/>;
};
export const HydratedCrashPreview:React.FC=()=>{
 const videoFrame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const f=sampleHydratedCrash(videoFrame/fps),[x,,z]=f.scenePositionM;
 // Mobile-friendly elevated 3/4 geometry camera: original GT and actual right
 // rail both visible, car always on carriageway side at source time 4s.
 const position:[number,number,number]=[x-9.9,5.5,Math.min(-1.15,z+1.3)];
 const target:[number,number,number]=[x+.65,.7,z-.54];
 return <AbsoluteFill style={{background:'#a9c8d0'}}>
  <ThreeCanvas width={width} height={height} shadows
   camera={{position,fov:49,near:.1,far:310}}>
   <EpisodeLight focus={[x,0,z]}/>
   <CrashBarrierWorld frame={f} worldFactory={buildEpisodeHighway}/>
   <CameraAim position={position} target={target} fov={49}/>
   <HydroCar frame={f}/>
   <ImpactEffects3D frame={f}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:'8%',left:'7%',right:'7%',
   fontSize:29,fontWeight:800,color:'#f0f7f7',fontFamily:'Arial,sans-serif',
   textShadow:'0 2px 8px #12252a'}}>
   HYPOTHETICAL BAD REACTION
  </div>
  <div style={{position:'absolute',bottom:'7%',left:'7%',right:'7%',
   fontSize:16,color:'#f1f4f4',fontFamily:'Arial,sans-serif',
   background:'rgba(16,27,32,.7)',padding:14}}>
   REAL A1 TYRE + A2 70 MPH SEED + A4 ROAD · ILLUSTRATIVE PANIC BRANCH
  </div>
 </AbsoluteFill>;
};
export const HydratedCrashRoot:React.FC=()=> <Composition
 id="EP003Agent8HydratedCrash" component={HydratedCrashPreview}
 width={1080} height={1920} fps={30} durationInFrames={120}/>;
