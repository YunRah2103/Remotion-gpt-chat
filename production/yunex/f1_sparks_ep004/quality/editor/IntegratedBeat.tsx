/**
 * ONE physics-synchronised moving 3D scene for BOTH original-VO and video-only versions.
 * All five quality inputs below are DRAFT source snapshots, NOT approved merges.
 * Authoritative A1 skid geometry and A2 track dynamics drive every quality department.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import type {ShotId,StoryRequest} from '../../shared/contract.ts';
import {getQualitySkidDescriptors,QualityF1Vehicle} from './staging/vehicle/QualityF1Vehicle.tsx';
import {QualityContactSparks} from './staging/sparks/QualityContactSparks.tsx';
import {sampleRetimedQualityCamera} from './staging/cinema/cameras.ts';
import {QualityNightCircuit} from './staging/look/QualityNightCircuit.tsx';
import {QualityScienceCallouts} from './staging/graphics/QualityScienceCallouts.tsx';
import {ApplyCameraPose} from '../../cinema/ShotCamera.tsx';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
import {PREVIEW_SPEED_MPS} from './hook.ts';
export type EditorBeat=Readonly<{
 shot:ShotId;localSec:number;durationSec:number;
 sourceSec:number;startDistanceM:number;aeroLoad01:number;
}>;
const SKIDS=getQualitySkidDescriptors();
export const IntegratedBeat:React.FC<{beat:EditorBeat}>=({beat})=>{
 const motion=sampleDynamics(beat.sourceSec,{startDistanceM:beat.startDistanceM,
  speedMps:PREVIEW_SPEED_MPS,aeroLoad01:beat.aeroLoad01});
 const {contacts,particles}=sampleContactDrivenSparks(beat.sourceSec,motion,SKIDS,
  {aeroLoad01:beat.aeroLoad01});
 // Retain genuine A2 contact at frame zero, but reveal the recognisable V2
 // Formula car IMMEDIATELY. The old camera's 0.18-second offset kept the
 // 3.4-second hook in an almost full-width skid macro for its entire first
 // second. A cinematic tracking view at 57% of the A10 camera spline shows
 // both the actual car and the actual spark plume from frame zero.
 const openingReveal01=Math.max(0,Math.min(1,beat.localSec/.56));
 const openingEased=openingReveal01*openingReveal01*(3-2*openingReveal01);
 const lensSec=beat.shot==='spark-hook'
  ?(.57+.36*openingEased)*beat.durationSec:beat.localSec;
 const pose=sampleRetimedQualityCamera(beat.shot,lensSec,beat.durationSec,motion);
 const uncover=beat.shot==='underfloor-reveal'?0.84:
  beat.shot==='contact-macro'?0.64:0;
 const request:StoryRequest={shot:beat.shot,tSec:beat.sourceSec,
  shotLocalSec:beat.localSec,shotDurationSec:beat.durationSec,
  motion,contacts,particles};
 const unloadedMotion=beat.shot==='aero-load'
  ?sampleDynamics(beat.sourceSec,{startDistanceM:beat.startDistanceM,
    speedMps:PREVIEW_SPEED_MPS,aeroLoad01:0}):undefined;
 return <AbsoluteFill style={{backgroundColor:'#061019',overflow:'hidden'}}>
   <ThreeCanvas width={1080} height={1920} shadows
       camera={{position:[0,2,9],near:.025,far:350,fov:58}}>
     <QualityNightCircuit motion={motion} particles={particles} diagnosticDay={false} showEnvironment/>
     {uncover>0&&<pointLight position={[
       motion.worldPosition[0]+1,motion.worldPosition[1]+1.6,motion.worldPosition[2]+1.4
     ]} intensity={4} distance={6} decay={2} color="#daefff"/>}
     <QualityF1Vehicle motion={motion} reveal01={uncover}/>
     <QualityContactSparks contacts={contacts} particles={particles}
       shutterSec={.014} enableContactLights={false}/>
     <ApplyCameraPose pose={pose} near={.025}/>
   </ThreeCanvas>
   <QualityScienceCallouts request={request} cameraPose={pose}
     unloadedMotion={unloadedMotion}/>
 </AbsoluteFill>;
};
