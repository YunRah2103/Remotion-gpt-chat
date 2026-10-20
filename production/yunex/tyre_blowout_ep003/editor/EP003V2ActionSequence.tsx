/**
 * YUNEX EP003 V2 — AGENT 6 EDITOR ONLY.
 * Replaces the rejected static 12.83–26.67s V1 outcome with the exact
 * user-approved A8 crash, A9 physical rewind and A10 3D cinematic cameras.
 * No changes to narration, specialist authored simulations, or approved art.
 */
import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill,Audio,useCurrentFrame,useVideoConfig,staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import type {CrashOutcomeFrame} from '../impact/model.ts';
import type {BranchReplaySample} from '../rewind/branchReplay.ts';
import {EP003FinalPicture as ApprovedOriginalOpening} from './EP003FinalPicture.tsx';
import {EP003_DURATION_FRAMES,EP003_FPS,VO_CUES} from './timeline.ts';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {ContactOcclusion} from '../look/contact.tsx';
import {CinematicVehicle} from '../cinema/scene.tsx';
import {SteadyHands3D} from '../story/SteadyHands3D.tsx';
import {CrashBarrierWorld} from '../impact/Barrier.tsx';
import {ImpactEffects3D} from '../impact/Preview.tsx';
import {Agent10DamagedOriginalCar} from '../action/CrashCar.tsx';
import {actionPreviewState} from '../action/previewState.ts';
import {rebaseActionFrame,sampleActionCamera} from '../action/cameras.ts';
import type {ActionStage,ActionCameraPose} from '../action/cameras.ts';
import {sampleControlledFrame} from '../rewind/agent8Integration.ts';
import {sampleBranchReplay,DEFAULT_BRANCH_REPLAY} from '../rewind/branchReplay.ts';
import {ChoiceOverlay,RewindVisualTransition} from '../rewind/RewindVisualTransition.tsx';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import {sampleCrashCamera} from '../impact/Camera.ts';

const CHOICE=DEFAULT_BRANCH_REPLAY.choiceFilmSec; // 12.830
const CORRECT=DEFAULT_BRANCH_REPLAY.correctFilmSec; // 16.015
const END=EP003_DURATION_FRAMES/EP003_FPS;
const CRASH_REVIEW_SECONDS=6;

/** Deliberate <2s moving, contrasting camera cuts, each anchored to Cedar VO. */
export const V2_RECOVERY_CUTS:readonly {
  from:number;to:number;stage:ActionStage;sceneX:number
}[]=[
 {from:16.015,to:16.93,stage:'steady-driver',sceneX:-55},
 {from:16.93,to:17.76,stage:'moving-recovery-hero',sceneX:-58},
 {from:17.76,to:18.08,stage:'emergency-pull',sceneX:-56},
 {from:18.08,to:18.95,stage:'steady-driver',sceneX:-55},
 {from:18.95,to:19.84,stage:'emergency-pull',sceneX:-58},
 {from:19.84,to:20.425,stage:'moving-recovery-hero',sceneX:-51},
 {from:20.425,to:21.905,stage:'safe-slowdown-follow',sceneX:-52},
 {from:21.905,to:23.30,stage:'moving-recovery-hero',sceneX:-46},
 {from:23.30,to:24.12,stage:'emergency-pull',sceneX:-55},
 {from:24.12,to:25.18,stage:'safe-slowdown-follow',sceneX:30},
 {from:25.18,to:END,stage:'moving-recovery-hero',sceneX:-55},
] as const;

type V2Frame={
 dynamics:VehicleDynamicsFrame;tyre:TyreFrame;impact:CrashOutcomeFrame|null;
 stage:ActionStage;progress01:number;sourceTimeSec:number;
 replay:BranchReplaySample;
};
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
/** Absolute 800f master film clock -> real specialist source poses. */
export function sampleEditorV2Frame(time:number):V2Frame {
 if(!Number.isFinite(time)||time<CHOICE||time>=END)throw Error('V2 action time out of range');
 if(time<CORRECT){
  // A10 preview clocks 6 local seconds across A9's 3.185s master sequence.
  // A9's resolveBranchFrame physically reverses original A8 bumper, rail,
  // tyre hub, debris and wheel rotation; no reversed image sequence.
  const local=(time-CHOICE)*CRASH_REVIEW_SECONDS/(CORRECT-CHOICE);
  const s=actionPreviewState(local,'crash-action');
  return {dynamics:s.dynamics,tyre:s.tyre,impact:s.impact,
    stage:s.stage,progress01:s.progress01,sourceTimeSec:s.sourceTimeSec,
    replay:s.replay!};
 }
 const cut=V2_RECOVERY_CUTS.find(c=>time>=c.from&&time<c.to)
   ?? V2_RECOVERY_CUTS[V2_RECOVERY_CUTS.length-1];
 const sourceTimeSec=DEFAULT_BRANCH_REPLAY.choiceSourceSec+
   (time-CORRECT)*DEFAULT_BRANCH_REPLAY.controlledTimeRate;
 const startSec=DEFAULT_BRANCH_REPLAY.choiceSourceSec+
   (cut.from-CORRECT)*DEFAULT_BRANCH_REPLAY.controlledTimeRate;
 const raw=sampleControlledFrame(sourceTimeSec);
 const anchor=sampleControlledFrame(startSec);
 const dynamics=rebaseActionFrame(raw,cut.sceneX-anchor.positionM[0]);
 const tyre=sampleTyreFailure(sourceTimeSec,{
   angularPhaseRad:dynamics.wheels['front-right'].spinRad
 });
 return {dynamics,tyre,impact:null,stage:cut.stage,
   progress01:clamp((time-cut.from)/(cut.to-cut.from)),sourceTimeSec,
   replay:sampleBranchReplay(time)};
}

const CameraRig:React.FC<{pose:ActionCameraPose}>=({pose})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  camera.up.set(0,1,0);
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  if(camera instanceof T.PerspectiveCamera){
   camera.fov=pose.fovDeg;
   camera.near=pose.nearM;
   camera.far=pose.farM;
   camera.updateProjectionMatrix();
  }
 },[camera,pose]);
 return null;
};

/** The original A1 tyre, original A4 Grand Tourer, actual A5 hands. */
const OriginalMovingCockpit:React.FC<{d:VehicleDynamicsFrame;tyre:TyreFrame}>=({d,tyre})=>{
 const rig=useMemo(()=>{
  const original=prepareTyreRig(EP003_SCENE.failedWheel,0);
  finishGrandTourer(original.vehicle);
  original.vehicle.traverse(o=>{
   if(o instanceof T.Mesh&&['roof','roof-liner','windshield-seal'].includes(o.name))
    o.visible=false;
  });
  return original;
 },[]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>applyTyreFrame(rig,tyre,{dynamics:d,exposure:0}),[rig,d,tyre]);
 return <primitive object={rig.vehicle}>
  <SteadyHands3D dynamics={d} steeringSide="right"/>
 </primitive>;
};

const OriginalMovingActionScene:React.FC<{time:number}>=({time})=>{
 const {width,height}=useVideoConfig();
 const state=sampleEditorV2Frame(time);
 const {dynamics,tyre,impact,replay}=state;
 const basePose=sampleActionCamera({
  stage:state.stage,sourceTimeSec:state.sourceTimeSec,
  progress01:state.progress01,dynamics,
  impactFrame:{contact01:impact?.contact.occurred?
     clamp(impact.bumperCrushM/.24):0,actualBarrierContact:!!impact?.contact.occurred}
 });
 // Director's V3 close coverage: exact Agent8 camera on the SAME
 // approved impact frame. Do not increase dent, modify the physical car,
 // or manufacture a new hit. Three hard cuts reveal approach/contact/metal.
 const lens=impact ? (time<13.40?'establish'
   :time<13.88?'contact'
   :time<14.87?'damage'
   :time<15.26?'contact'
   :null) : null;
 const crashLens=lens&&impact?sampleCrashCamera(impact,lens):null;
 const pose:ActionCameraPose=crashLens
   ? {...basePose,position:crashLens.position,target:crashLens.target,
      fovDeg:crashLens.fov,nearM:.055,insideCabin:false}
   : basePose;
 const world=useMemo(buildEpisodeHighway,[]);
 useEffect(()=>()=>disposeObject(world),[world]);
 return <AbsoluteFill style={{backgroundColor:'#b8cad5'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{
   position:[...pose.position],near:pose.nearM,far:pose.farM,fov:pose.fovDeg
  }}>
   <EpisodeLight focus={dynamics.positionM}/>
   {impact
     ? <CrashBarrierWorld frame={impact} worldFactory={buildEpisodeHighway}/>
     : <primitive object={world}/>}
   <ContactOcclusion dynamics={dynamics}/>
   {impact
     ? <Agent10DamagedOriginalCar dynamics={dynamics} tyre={tyre} impact={impact}/>
     : pose.insideCabin
       ? <OriginalMovingCockpit d={dynamics} tyre={tyre}/>
       : <CinematicVehicle dynamics={dynamics} tyre={tyre}/>}
   {impact&&<ImpactEffects3D frame={impact}/>}
   <pointLight position={[dynamics.positionM[0]+2.6,4.5,dynamics.positionM[2]-4]}
     color="#dee9f0" intensity={22} distance={14} decay={2}/>
   <CameraRig pose={pose}/>
  </ThreeCanvas>
  <ChoiceOverlay replay={replay}/>
  <RewindVisualTransition replay={replay}/>
  {(replay.phase==='wrong-outcome'||replay.phase==='freeze-impact')&&
   <div style={{position:'absolute',bottom:86,left:65,right:65,
    textAlign:'center',color:'#f1f8fa',fontSize:22,fontWeight:700,
    textShadow:'0 3px 12px #142534',fontFamily:'Arial,sans-serif'}}>
    ILLUSTRATIVE PANIC OUTCOME · NOT INEVITABLE
   </div>}
 </AbsoluteFill>;
};

/**
 * Editor V2 first-cut master: original user Cedar MP3 is not replaced.
 * In public GitHub CI we render EP003PictureOnly, then mux the exact original
 * file locally after full native picture and audio decode.
 */
/** Phrase subtitles use the 16 REAL waveform-aligned Cedar cue boundaries. */
const CaptionTrack:React.FC<{time:number}>=({time})=>{
 const cue=VO_CUES.find(c=>time>=c.start&&time<c.end);
 if(!cue)return null;
 const fade=Math.min(1,(time-cue.start)/.13,(cue.end-time)/.15);
 const emphasis=cue.id==='vo-08'||cue.id==='vo-09'?'#ffcc9b':'#ffffff';
 return <AbsoluteFill style={{pointerEvents:'none'}}>
  <div style={{position:'absolute',bottom:146,left:60,right:60,
   display:'flex',justifyContent:'center',opacity:Math.max(0,fade)}}>
   <span style={{display:'inline-block',maxWidth:'100%',textAlign:'center',
    padding:'19px 26px',borderRadius:22,boxSizing:'border-box',
    fontFamily:'Arial,sans-serif',fontSize:50,lineHeight:1.2,fontWeight:800,
    color:emphasis,background:'rgba(7,20,32,.67)',
    boxShadow:'0 5px 25px rgba(0,0,0,.14)',
    textShadow:'0 2px 9px rgba(0,0,0,.70)'}}>
    {cue.text}
   </span>
  </div>
 </AbsoluteFill>;
};

/** V3 finishing is picture-only; Cedar is never regenerated or time-shifted. */
export const EP003V2FinalPicture:React.FC<{includeVoice?:boolean}>=({includeVoice=true})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const time=frame/fps;
 return <AbsoluteFill style={{background:'#a9bfcb'}}>
  <AbsoluteFill style={{filter:'contrast(1.12) saturate(1.16)'}}>
   {time<CHOICE
     ? <ApprovedOriginalOpening includeVoice={false}/>
     : <OriginalMovingActionScene time={time}/>}
  </AbsoluteFill>
  <AbsoluteFill style={{pointerEvents:'none',
   background:'radial-gradient(ellipse at center, transparent 57%, rgba(9,22,32,.20) 100%)'}}/>
  {time<1.2&&<div style={{position:'absolute',top:110,left:75,
   fontFamily:'Arial,sans-serif',letterSpacing:7,fontWeight:900,
   fontSize:34,color:'#f7fbfd',textShadow:'0 3px 14px #102633'}}>
   70 MPH · MOTORWAY SPEED
  </div>}
  <CaptionTrack time={time}/>
  {includeVoice&&<Audio src={staticFile('ep003/vo_master.wav')} volume={1}/>}
 </AbsoluteFill>;
};
