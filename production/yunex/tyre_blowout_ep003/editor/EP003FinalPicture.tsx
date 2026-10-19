/**
 * EP003 final film — Agent 6 ONLY: composition/integration, not a replacement
 * for Agents 1–5. Their exact pinned source folders are hydrated by CI.
 * Actual Remotion source 1080x1920 at 30 FPS.
 */
import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill,Audio,useCurrentFrame,useVideoConfig,staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import type {TyreFrame,VehicleDynamicsFrame,StoryRequest} from '../shared/contract.ts';
import {pictureFrame} from './timeline.ts';
import {sampleCinemaCamera} from '../cinema/cameras.ts';
import {CinematicCameraRig,CinematicVehicle} from '../cinema/scene.tsx';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {ContactOcclusion} from '../look/contact.tsx';
import {StoryEffects3D} from '../story/StoryEffects3D.tsx';
import {StoryOverlay} from '../story/StoryOverlay.tsx';
import {SteadyHands3D} from '../story/SteadyHands3D.tsx';

/** One cockpit-only instance: retains Agent 1's original wheel and Grand Tourer,
 * adds Agent 5's hands as children of the original car model (no extra wheel).
 * Roof is hidden ONLY for in-cabin lens clearance, matching Agent 3. */
const CockpitWithHands:React.FC<{d:VehicleDynamicsFrame;tyre:TyreFrame}>=({d,tyre})=>{
 const rig=useMemo(()=>{
  const r=prepareTyreRig(EP003_SCENE.failedWheel,0);
  finishGrandTourer(r.vehicle);
  r.vehicle.traverse(node=>{
   if(node instanceof T.Mesh && (node.name==='roof'||node.name==='roof-liner'||node.name==='windshield-seal'))node.visible=false;
   if(node instanceof T.Mesh && (node.name==='tyre'||node.name==='sidewall-bead') &&
      node.material instanceof T.MeshStandardMaterial){
    node.material.color.set('#32393d');
    node.material.roughness=.91;
    node.material.metalness=.015;
   }
  });
  return r;
 },[]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>{
  // Agent 1 applies the authoritative vehicle pose, ALL hub/steer/spin states,
  // then deforms rubber. Never apply an additional root Euler or corner drop.
  applyTyreFrame(rig,tyre,{dynamics:d,exposure:0});
 },[rig,d,tyre]);
 return <primitive object={rig.vehicle}>
  <SteadyHands3D dynamics={d} steeringSide="right"/>
 </primitive>;
};

export const EP003FinalPicture:React.FC<{includeVoice?:boolean}>=({includeVoice=true})=>{
 const frame=useCurrentFrame();
 const {fps,width,height}=useVideoConfig();
 const time=frame/fps;
 const {dynamics,tyre,cut,segment,progress01,sourceTimeSec}=pictureFrame(time);
 const pose=sampleCinemaCamera({dynamics,tyre,tSec:sourceTimeSec,shot:cut.shot,progress01});
 const highway=useMemo(buildEpisodeHighway,[]);
 useEffect(()=>()=>disposeObject(highway),[highway]);
 const request:StoryRequest={tSec:sourceTimeSec,dynamics,tyre,segment};
 const inside=cut.shot==='driver-cockpit';
 // Native Remotion picture is primary 3D footage; no screenshot animations.
 return <AbsoluteFill style={{backgroundColor:'#b8cad5'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{
   position:[...pose.position],near:pose.nearM,far:pose.farM,fov:pose.fovDeg
  }}>
   <EpisodeLight focus={dynamics.positionM}/>
   <primitive object={highway}/>
   <ContactOcclusion dynamics={dynamics}/>
   {inside
    ? <CockpitWithHands d={dynamics} tyre={tyre}/>
    : <CinematicVehicle dynamics={dynamics} tyre={tyre} cutaway={false}/>}
   {/* Scene-anchored Agent 5 effects use the SAME rebased Agent 2 state. */}
   {(segment==='pressure'||segment==='forces') &&
    <StoryEffects3D request={request} showForce={segment==='forces'}/>}
   <pointLight position={[dynamics.positionM[0]+2.8,4.6,dynamics.positionM[2]-4.1]}
    color="#e1e9eb" intensity={24} distance={14} decay={2}/>
   <pointLight position={[dynamics.positionM[0]+1.85,1.48,dynamics.positionM[2]-2.5]}
    color="#dce6ed" intensity={7} distance={5} decay={2}/>
   <CinematicCameraRig pose={pose}/>
  </ThreeCanvas>
  <StoryOverlay request={request}
   hideLabel={!(segment==='pressure'||segment==='forces')||cut.shot==='driver-cockpit'}
   placement="bottom"/>
  {/* The WAV source lives in public/ep003/vo_master.wav in the full-audio
      staging bundle. Picture-only GitHub Action is deliberately silent;
      no fake replacement voice is generated and no SFX/music here. */}
  {includeVoice && <Audio src={staticFile('ep003/vo_master.wav')} volume={1}/>}
 </AbsoluteFill>;
};
