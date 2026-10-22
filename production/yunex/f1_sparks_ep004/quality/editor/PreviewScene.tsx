/**
 * Agent 13 six-shot native VIDEO-ONLY assembly, NOT original-voice locked.
 * The five draft departmental sources are isolated snapshots under ./staging.
 * No EP003 media, fake contact emitters, second road, or fabricated word cues.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {getQualitySkidDescriptors,QualityF1Vehicle} from './staging/vehicle/QualityF1Vehicle.tsx';
import {QualityContactSparks} from './staging/sparks/QualityContactSparks.tsx';
import {sampleRetimedQualityCamera} from './staging/cinema/cameras.ts';
import {QualityNightCircuit} from './staging/look/QualityNightCircuit.tsx';
import {QualityScienceCallouts} from './staging/graphics/QualityScienceCallouts.tsx';
import {ApplyCameraPose} from '../../cinema/ShotCamera.tsx';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
import type {StoryRequest} from '../../shared/contract.ts';
import {reviewBeat,REVIEW_TOTAL_FRAMES} from './preview-plan.ts';

const SKIDS=getQualitySkidDescriptors();
const HOOK_DISTANCE_M=63.65;
const PREVIEW_SPEED_MPS=62;
type HookProof=Readonly<{sourceSec:number;active:boolean;visibleParticles:number;score:number}>;
let cachedHook:HookProof|null=null;
/**
 * Choose the first frame's spark plume from ACTUAL A2 metal/road simulation,
 * never from a decorative effect. Fixed startDistanceM must match the shot.
 * Search on real physics data; reject a blank or contactless hook.
 */
export function locateOriginalContactHook():HookProof {
 if(cachedHook)return cachedHook;
 let best:HookProof|null=null;
 for(let i=0;i<=150;i++){
  const t=i/150;
  const motion=sampleDynamics(t,{startDistanceM:HOOK_DISTANCE_M,
   speedMps:PREVIEW_SPEED_MPS,aeroLoad01:1});
  const data=sampleContactDrivenSparks(t,motion,SKIDS);
  const active=data.contacts.some(c=>c.active&&c.signedGapM<=0);
  const count=data.particles.filter(p=>p.ageSec>=0&&p.ageSec<p.lifetimeSec&&p.luminance01>.13).length;
  const score=count+(active?3:0);
  if(active&&count>=6&&(!best||score>best.score))
   best={sourceSec:t,active,visibleParticles:count,score};
 }
 if(!best)throw Error('EP004 first-second hook fails genuine metal-contact spark gate; do not replace with fake sparks');
 cachedHook=best;
 return best;
}

export const EP004Agent13VideoOnlyReview:React.FC=()=>{
 const frame=useCurrentFrame();
 const {width,height,fps,durationInFrames}=useVideoConfig();
 if(width!==1080||height!==1920||fps!==30||durationInFrames!==REVIEW_TOTAL_FRAMES)
  throw Error('EP004 editor: invalid native 1080x1920 30fps 758-frame review');
 const hook=locateOriginalContactHook();
 const beat=reviewBeat(frame,hook.sourceSec);
 const motion=sampleDynamics(beat.sourceSec,{startDistanceM:beat.startDistanceM,
  speedMps:PREVIEW_SPEED_MPS,aeroLoad01:beat.aeroLoad01});
 const {contacts,particles}=sampleContactDrivenSparks(beat.sourceSec,motion,SKIDS,
  {aeroLoad01:beat.aeroLoad01});
 const lensSec=beat.shot==='spark-hook'
  ?Math.min(beat.durationSec,beat.localSec+.18):beat.localSec;
 const pose=sampleRetimedQualityCamera(beat.shot,lensSec,beat.durationSec,motion);
 const uncover=(beat.shot==='underfloor-reveal')?.84:
  beat.shot==='contact-macro'?.64:0;
 const request:StoryRequest={
  shot:beat.shot,tSec:beat.sourceSec,shotLocalSec:beat.localSec,
  shotDurationSec:beat.durationSec,motion,contacts,particles,
 };
 const unloadedMotion=beat.shot==='aero-load'
  ?sampleDynamics(beat.sourceSec,{startDistanceM:beat.startDistanceM,
      speedMps:PREVIEW_SPEED_MPS,aeroLoad01:0}):undefined;
 return <AbsoluteFill style={{backgroundColor:'#061019',overflow:'hidden'}}>
   <ThreeCanvas width={1080} height={1920} shadows
      camera={{position:[0,2.0,9],near:.025,far:350,fov:58}}>
     <QualityNightCircuit motion={motion} particles={particles}
        diagnosticDay={false} showEnvironment/>
     {(uncover>0)&&<pointLight position={[
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
