/** Agent12 native picture-only proof. IMPORTANT: samples true EP004 contacts.
 * Kit V2 hero appears in exterior payoff; actual original Agent1 geometry is
 * used for projected underfloor labels until Agent8 certifies its V2 adapter.
 * Not the final six-cut edit, not the original-VO caption timing.
 */
import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {WorldLighting} from '../../../../../../src/yunex/world-kit/components.tsx';
import {disposeObject} from '../../../../../../src/yunex/world-kit/geometry.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../../../../../src/yunex/modelling-kit/rig.ts';
import {NightCircuitWorld} from '../../../look/NightCircuitWorld.tsx';
import {F1HeroVehicle,getSkidDescriptors} from '../../../mechanics/F1HeroVehicle.tsx';
import {StoryMechanicalCutaway} from '../../../story/StoryMechanicalCutaway.tsx';
import {SparkLensGlints} from '../../../story/SparkLensGlints.tsx';
import {integratedStoryCamera} from '../../../story/IntegratedPreview.tsx';
import {sampleDynamics} from '../../../physics/dynamics.ts';
import {sampleContactDrivenSparks} from '../../../physics/sparks.ts';
import {sampleRetimedShotCamera} from '../../../cinema/cameras.ts';
import type {CameraPose,ShotId,StoryRequest,VehicleMotionState} from '../../../shared/contract.ts';
import {QualityScienceCallouts} from '../../graphics/QualityScienceCallouts.tsx';
import {QualitySubtitleOverlay} from '../../graphics/QualitySubtitleOverlay.tsx';
import type {NarratorWord,SubtitleCue} from '../../graphics/core.ts';
const SKIDS=getSkidDescriptors();
const START_M=138-62*8.82;
const previewWords:readonly NarratorWord[]=[
 {text:'Metal',startSec:0,endSec:.5},{text:'skid',startSec:.5,endSec:1.0},
 {text:'Composite',startSec:1,endSec:1.6},{text:'plank',startSec:1.6,endSec:2.1},
 {text:'Downforce',startSec:2.4,endSec:3.05},{text:'lowers',startSec:3.05,endSec:3.55},
 {text:'the',startSec:3.55,endSec:3.8},{text:'car',startSec:3.8,endSec:4.25},
 {text:'Only',startSec:4.3,endSec:4.72},{text:'metal',startSec:4.72,endSec:5.15},
 {text:'contact',startSec:5.15,endSec:5.68},{text:'sparks',startSec:5.68,endSec:6.15},
 {text:'Then',startSec:6.4,endSec:6.8},{text:'race',startSec:6.8,endSec:7.25},
 {text:'on',startSec:7.25,endSec:7.7},
];
const previewCues:readonly SubtitleCue[]=[
 {startFrame:0,endFrame:30,wordIndices:[0,1]},
 {startFrame:30,endFrame:64,wordIndices:[2,3]},
 {startFrame:72,endFrame:128,wordIndices:[4,5,6,7]},
 {startFrame:129,endFrame:185,wordIndices:[8,9,10,11]},
 {startFrame:192,endFrame:231,wordIndices:[12,13,14]},
];
const Camera:React.FC<{pose:CameraPose}>=({pose})=>{
 const {camera}=useThree();
 camera.position.set(...pose.positionWorld);camera.up.set(0,1,0);
 camera.lookAt(...pose.targetWorld);
 if(camera instanceof THREE.PerspectiveCamera){
  camera.fov=pose.fovDeg;camera.near=.025;camera.far=350;camera.updateProjectionMatrix();
 }
 return null;
};
/** This is the PREMADE V2 kit; internal scripted demo sparks and generic skids are hidden.
 * V2-to-real-metal underside adaptation is Agent8's job, so no material callouts
 * ever point at V2 generic floor nodes in these proofs. */
const ExternalKitV2Hero:React.FC<{motion:VehicleMotionState;frame:number}>=({motion,frame})=>{
 const root=useMemo(()=>createCinematicVehicle({
  variant:'formula-modern',quality:'hero',paintPreset:'lacquer',color:'#10b5ac',
  accent:'#e3ad6d',wheelColor:'#bfcdd4',lights:true,interior:false
 }),[]);
 useEffect(()=>()=>disposeObject(root),[root]);
 animateCinematicVehicle(root,{frame,fps:30,distance:-motion.wheelRotationRad*.36,
   compression:Math.min(.05,Math.max(0,-motion.heaveM))});
 root.position.set(...motion.worldPosition);
 root.rotation.order='YXZ';
 root.rotation.set(motion.rollRad,motion.yawRad,motion.pitchRad);
 root.traverse(node=>{
  if(node.name==='contact-sparks'||node.name==='metal-skid'||node.name==='floor-sparks')
   node.visible=false;
 });
 return <primitive object={root}/>;
};
function shotFor(local:number,mode:'technical'|'ui'):readonly [ShotId,number,number]{
 const beats:readonly (readonly [ShotId,number])[]=mode==='technical'
   ?[['underfloor-reveal',2.1],['contact-macro',2.2],['racing-payoff',1.7]]
   :[['underfloor-reveal',2.4],['aero-load',1.9],['contact-macro',1.9],['racing-payoff',2.8]];
 let at=0;
 for(const [shot,length] of beats){
  if(local<at+length||at+length>=beats.reduce((s,b)=>s+b[1],0)-1e-6)
   return [shot,local-at,length] as const;
  at+=length;
 }
 return ['racing-payoff',0,2.8] as const;
}
export const Agent12Preview:React.FC<{mode:'technical'|'ui'}>=({mode})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),local=frame/fps;
 // Shared Agent2 clock. Contact around source 8.82 seconds, never manually emitted.
 const sourceSec=(mode==='technical'?6:4.7)+local;
 const [shot,shotLocalSec,shotDurationSec]=shotFor(local,mode);
 const aeroLoad01=shot==='aero-load'?Math.max(0,Math.min(1,shotLocalSec/shotDurationSec)):1;
 const params={startDistanceM:START_M,speedMps:62,aeroLoad01};
 const motion=sampleDynamics(sourceSec,params);
 const {contacts,particles}=sampleContactDrivenSparks(sourceSec,motion,SKIDS,params);
 const request:StoryRequest={shot,tSec:sourceSec,shotLocalSec,shotDurationSec,motion,contacts,particles};
 // Underfloor is A1 physical mesh source; no material pointers into generic V2 skids.
 const pose=shot==='underfloor-reveal'?integratedStoryCamera(request):
   sampleRetimedShotCamera(shot,shotLocalSec,shotDurationSec,motion);
 const reveal=shot==='underfloor-reveal';
 const kit=shot==='racing-payoff';
 const unloaded=shot==='aero-load'?sampleDynamics(sourceSec,{...params,aeroLoad01:0}):undefined;
 const cue=mode==='ui'?previewCues.find(c=>frame>=c.startFrame&&frame<c.endFrame)??null:null;
 return <AbsoluteFill style={{backgroundColor:'#07121a'}}>
  <ThreeCanvas width={1080} height={1920}
   camera={{position:[...pose.positionWorld] as [number,number,number],fov:pose.fovDeg,near:.025,far:350}}
   shadows>
   {reveal?<><WorldLighting timeOfDay="night"/>
     <pointLight position={motion.worldPosition} intensity={38} color="#e6f4ff" distance={11}/>
    </>:<NightCircuitWorld motion={motion} particles={particles} exposure={.85}/>}
   <Camera pose={pose}/>
   {reveal?<StoryMechanicalCutaway motion={motion}/>:
    kit?<ExternalKitV2Hero motion={motion} frame={Math.round(sourceSec*fps)}/>:
      <F1HeroVehicle motion={motion}/>}
  </ThreeCanvas>
  {!reveal&&!kit&&<SparkLensGlints particles={particles} pose={pose}/>}
  <QualityScienceCallouts request={request} cameraPose={pose} unloadedMotion={unloaded}/>
  {mode==='ui'&&<QualitySubtitleOverlay words={previewWords} caption={cue}
    frame={frame} fps={fps} timingStatus="provisional-test-fixture" allowProvisionalPreview/>}
  {mode==='technical'&&<div style={{position:'absolute',left:85,top:160,color:'#e8e4dc',
   fontFamily:'Arial,sans-serif',fontWeight:750,fontSize:21,letterSpacing:1.2,
   textShadow:'0 2px 8px black'}}>TECHNICAL PREVIEW • AGENT 2 CONTACT DATA</div>}
 </AbsoluteFill>;
};
