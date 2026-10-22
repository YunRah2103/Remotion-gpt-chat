/** Moving portrait review: approved A2 contact physics, V2 formula kit context.
 * Technical angle uses the exact old A1 named metallic skid mesh until Agent8
 * supplies the premium V2 adapter; cinematic uses actual V2 full-car geometry.
 */
import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../../../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../../../../src/yunex/world-kit/geometry.ts';
import {F1HeroVehicle,getSkidDescriptors} from '../../mechanics/index.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
import {NightCircuitWorld} from '../../look/index.ts';
import {sampleRetimedShotCamera} from '../../cinema/cameras.ts';
import {ApplyCameraPose} from '../../cinema/ShotCamera.tsx';
import {QualityContactSparks} from '../../sparks/index.ts';
import {selectRealSparkTakes,sourceTakeAt} from './SourceTimeline.ts';
import type {VehicleMotionState} from '../../shared/contract.ts';

const SKIDS=getSkidDescriptors();
const KIT_OPTIONS={variant:'formula-modern' as const,quality:'hero' as const,
 paintPreset:'lacquer' as const,color:'#13b4a4',accent:'#c9ae81',
 driver:true,optimize:false};
export function disableNonPhysicalKitSparks(model:THREE.Object3D){
 let disabled=0;
 model.traverse(o=>{
  if(o.name==='contact-sparks'){o.visible=false;disabled++;}
  if(o.name==='metal-skid'){o.visible=false;}
 });
 return disabled;
}
/** The preview-only kit hero is NOT Agent8's final skid-accurate adapter.
 * No kit compression: authoritative A2 chassis heave/pitch/roll is already applied.
 * The generic kit skid parts and scripted spark emitter are suppressed each frame.
 */
const KitV2PreviewHero:React.FC<{motion:VehicleMotionState}>=({motion})=>{
 const model=useMemo(()=>createCinematicVehicle(KIT_OPTIONS),[]);
 useEffect(()=>()=>disposeObject(model),[model]);
 animateCinematicVehicle(model,{
  frame:motion.tSec*30,fps:30,distance:motion.routeDistanceM,
  compression:0,tyreDamage:0,cutaway:0,highlight:'wheels',
 });
 disableNonPhysicalKitSparks(model);
 model.position.set(...motion.worldPosition);
 model.rotation.set(0,motion.yawRad,0);
 model.rotateZ(motion.pitchRad);model.rotateX(motion.rollRad);
 return <primitive object={model}/>;
};
export const Agent9SparkReview:React.FC<{mode:'technical'|'cinematic'}>=({mode})=>{
 const f=useCurrentFrame(),{fps,width,height}=useVideoConfig(),screenSec=f/fps;
 const takes=useMemo(selectRealSparkTakes,[]);
 const scene=sourceTakeAt(screenSec,mode,takes);
 const motion=sampleDynamics(scene.sourceSec,{startDistanceM:scene.startDistanceM,speedMps:62,aeroLoad01:1});
 const {contacts,particles}=sampleContactDrivenSparks(scene.sourceSec,motion,SKIDS);
 const technical=mode==='technical';
 const shot=technical?(scene.kind==='release'?'underfloor-reveal':'contact-macro'):scene.shot;
 const camera=sampleRetimedShotCamera(shot,scene.localSec,scene.shotDurationSec,motion);
 const touching=contacts.some(c=>c.active&&c.signedGapM<=0);
 return <AbsoluteFill style={{background:'#07111b'}}>
  <ThreeCanvas width={width} height={height} shadows
    camera={{position:[0,2.1,9],fov:54,near:.025,far:350}}>
   <NightCircuitWorld motion={motion} particles={[]} exposure={.94}/>
   {technical?<F1HeroVehicle motion={motion} reveal01={.58}/>:<KitV2PreviewHero motion={motion}/>}
   {technical&&<pointLight position={[motion.worldPosition[0]+1.1,motion.worldPosition[1]+.65,motion.worldPosition[2]+.8]}
    color="#f1f5ff" intensity={3.5} distance={4.0} decay={2}/>}
   <QualityContactSparks particles={particles} contacts={contacts} maxParticles={260}/>
   <ApplyCameraPose pose={camera} near={.025}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:118,left:72,right:72,color:'#e7f5f4',
    fontFamily:'Arial,sans-serif',fontSize:23,fontWeight:800,letterSpacing:3,
    textShadow:'0 2px 16px #061018'}}>
    YUNEX / EP004 <span style={{color:'#ffcd91'}}>CONTACT VFX V2</span>
  </div>
  <div style={{position:'absolute',bottom:145,left:72,right:72,padding:'14px 18px',
    borderLeft:'4px solid #ffbf79',background:'#081323bd',color:'#edf2eb',
    fontFamily:'Arial,sans-serif',textShadow:'0 2px 8px #09121a'}}>
   <div style={{fontSize:25,fontWeight:800,letterSpacing:1.7}}>
    {touching?'METAL SKID / CONTACT':particles.length?'METAL CLEAR / LINGERING GLINTS':'METAL SKID / NO CONTACT'}
   </div>
   <div style={{fontSize:15,marginTop:8,opacity:.9}}>
    {particles.length} REAL A2 PARTICLES · {Math.round(motion.speedMps*3.6)} KM/H
    · SHOT {scene.segment+1}
   </div>
  </div>
 </AbsoluteFill>;
};
