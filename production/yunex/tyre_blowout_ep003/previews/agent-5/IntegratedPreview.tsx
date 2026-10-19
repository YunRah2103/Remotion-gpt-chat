import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim} from '../../../../../src/yunex/world-kit/components';
import {disposeTyreRig,prepareTyreRig,applyTyreFrame} from '../../mechanics/tyreRig.ts';
import {sampleTyreFailure} from '../../mechanics/sampleTyreFailure.ts';
import {sampleDynamics,DYNAMICS_DEFAULTS} from '../../dynamics/model.ts';
import {EpisodeWorld,EpisodeLight,finishGrandTourer} from '../../look/world.tsx';
import {sampleCinemaCamera,vehicleLocalToWorld} from '../../cinema/cameras.ts';
import type {CinemaShot} from '../../cinema/cameras.ts';
import {StoryEffects3D} from '../../story/StoryEffects3D';
import {StoryOverlay} from '../../story/StoryOverlay';
import {SteadyHands3D} from '../../story/SteadyHands3D';
import type {StoryRequest,VehicleDynamicsFrame,Vec3,WheelId} from '../../shared/contract.ts';

/**
 * TRUE CROSS-DEPARTMENT preview. On Agent 5's PR, each dependency is sourced
 * from its authoritative branch by the integration render workflow ONLY.
 * No duplicate vehicle model, pseudo-force fixture or fake stop.
 * Simulation time is absolute. X is camera-space rebased solely AT HARD CUTS,
 * keeping four wheel hubs and body relative pose exactly unchanged.
 */
export type IntegratedKind='hook'|'module';
type Beat={from:number;to:number;shot:CinemaShot;segment:StoryRequest['segment'];exposure:number};
const HOOK_BEATS:readonly Beat[]=[
  {from:0,to:1.08,shot:'tyre-hook',segment:'pressure',exposure:0},
  {from:1.08,to:2.07,shot:'wheel-cutaway',segment:'pressure',exposure:.38},
  {from:2.07,to:3.04,shot:'driver-cockpit',segment:'reaction',exposure:0},
  {from:3.04,to:4.5,shot:'rear-three-quarter',segment:'recovery',exposure:0}
];
const MODULE_BEATS:readonly Beat[]=[
  {from:0,to:1.06,shot:'tyre-hook',segment:'pressure',exposure:0},
  {from:1.06,to:2.12,shot:'wheel-cutaway',segment:'pressure',exposure:.42},
  {from:2.12,to:3.22,shot:'underbody',segment:'forces',exposure:0},
  {from:3.22,to:4.32,shot:'overhead-dynamics',segment:'forces',exposure:0},
  {from:4.32,to:5.43,shot:'driver-cockpit',segment:'reaction',exposure:0},
  {from:5.43,to:7.6,shot:'chase-recovery',segment:'recovery',exposure:0},
];
const wheelIds:readonly WheelId[]=['front-left','front-right','rear-left','rear-right'];
export function selectIntegratedBeat(localSec:number,kind:IntegratedKind):{beat:Beat;progress01:number;anchorSec:number}{
  const beats=kind==='hook'?HOOK_BEATS:MODULE_BEATS;
  const beat=beats.find(b=>localSec>=b.from&&localSec<b.to)??beats[beats.length-1];
  return {beat,progress01:Math.min(1,Math.max(0,(localSec-beat.from)/(beat.to-beat.from))),anchorSec:beat.from};
}
export function rebaseSceneX(d:VehicleDynamicsFrame,offsetX:number):VehicleDynamicsFrame{
  if(!Number.isFinite(offsetX))throw new Error('Invalid cinematic scene rebase');
  const wheels={...d.wheels};
  for(const id of wheelIds) {
    const w=d.wheels[id];
    wheels[id]={...w,hubWorldM:[w.hubWorldM[0]+offsetX,w.hubWorldM[1],w.hubWorldM[2]]};
  }
  return {...d,positionM:[d.positionM[0]+offsetX,d.positionM[1],d.positionM[2]],wheels};
}
const RealMechanicalHero:React.FC<{request:StoryRequest;exposure:number}>=({request,exposure})=>{
  const rig=useMemo(()=>{
    const r=prepareTyreRig('front-right',exposure);
    finishGrandTourer(r.vehicle);
    return r;
  },[exposure]);
  useEffect(()=>()=>disposeTyreRig(rig),[rig]);
  applyTyreFrame(rig,request.tyre,{dynamics:request.dynamics,exposure});
  const d=request.dynamics;
  return <>
    <primitive object={rig.vehicle}/>
    {request.segment==='reaction' &&
      <group position={d.positionM} rotation={[d.rollRad,d.yawRad,d.pitchRad]} >
        <SteadyHands3D dynamics={d}/>
      </group>}
  </>;
};
export const IntegratedStoryPreview:React.FC<{variant:IntegratedKind}>=({variant})=>{
  const frame=useCurrentFrame();
  const {fps,width,height}=useVideoConfig();
  const localSec=frame/fps;
  // The camera opens on an already rapidly rotating tyre. Actual pressure loss
  // begins at 0.75s; it becomes pronounced well before preview frame 15.
  const tSec=localSec+.72;
  const {beat,progress01,anchorSec}=selectIntegratedBeat(localSec,variant);
  const authoritative=sampleDynamics(tSec,DYNAMICS_DEFAULTS);
  // Roadway geometry is local and finite. Scene-space X rebases only at an
  // editorial hard cut, preserving all real physical displacements / forces.
  const anchor=sampleDynamics(anchorSec+.72,DYNAMICS_DEFAULTS);
  const offsetX=-47-anchor.positionM[0];
  const dynamics=rebaseSceneX(authoritative,offsetX);
  const tyre=sampleTyreFailure(tSec,{angularPhaseRad:authoritative.wheels['front-right'].spinRad});
  const request:StoryRequest={tSec,dynamics,tyre,segment:beat.segment};
  const sampledCamera=sampleCinemaCamera({tSec,shot:beat.shot,dynamics,tyre,
    progress01,subtleImpactShake:true});
  // Agent 3's stock cockpit POV sits behind the seat shell on this particular
  // grand-tourer body. Shift the EYE FORWARD of that shell, preserving the
  // genuine steering column/hand animation and the authoritative car pose.
  // Keep all other shots on Agent 3's sampled cinematic presets.
  const pose=beat.shot==='driver-cockpit'
    ? {...sampledCamera,
        position:vehicleLocalToWorld([.20,1.13,-.45],dynamics),
        target:vehicleLocalToWorld([2.9,1.025,-.45],dynamics),
        fovDeg:66,nearM:.018}
    : beat.shot==='wheel-cutaway'
    ? {...sampledCamera,
        // Keep failed wheel and the surrounding factory wheel arch in the SAME
        // perspective; former 0.8m underbody camera made the wheel appear
        // detached/oversized against a transparent ghost-like body.
        position:vehicleLocalToWorld([3.35,1.08,-3.20],dynamics),
        target:vehicleLocalToWorld([1.25,.43,-.78],dynamics),
        fovDeg:40,nearM:.06}
    : sampledCamera;
  const focus:Vec3=[dynamics.positionM[0],0,dynamics.positionM[2]];
  return <AbsoluteFill style={{background:'#BDD0D6'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{
      position:[...pose.position] as [number,number,number],
      near:pose.nearM,far:pose.farM,fov:pose.fovDeg
    }}>
      <EpisodeLight focus={focus}/>
      <EpisodeWorld/>
      <CameraAim position={pose.position as [number,number,number]}
        target={pose.target as [number,number,number]} fov={pose.fovDeg}/>
      <RealMechanicalHero request={request} exposure={beat.exposure}/>
      <StoryEffects3D request={request} showForce={beat.shot==='overhead-dynamics'}/>
    </ThreeCanvas>
    <StoryOverlay request={request} placement="bottom" hideLabel={
      // Movement, tread and road read BEFORE explanatory type.
      localSec<.76 || beat.shot==='driver-cockpit' || beat.shot==='overhead-dynamics'
    }/>
  </AbsoluteFill>;
};
