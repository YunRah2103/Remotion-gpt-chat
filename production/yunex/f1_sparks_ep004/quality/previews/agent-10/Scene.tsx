/** GENUINE live 3D review: Remotion, kit V2, physical Agent 2 motion/contact,
 * canonical Agent 4 mesh and camera-coded shots. No decorative emitters.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {sampleDynamics,sampleContactDrivenSparks} from '../../../physics/index.ts';
import {getSkidDescriptors} from '../../../mechanics/skids.ts';
import {NightCircuitWorld} from '../../../look/NightCircuitWorld.tsx';
import type {SparkParticle} from '../../../shared/contract.ts';
import {sampleRetimedShotCamera} from '../../../cinema/cameras.ts';
import {ApplyCameraPose} from '../../../cinema/ShotCamera.tsx';
import {sampleRetimedQualityCamera,QUALITY_SHOTS} from '../../cinema/cameras.ts';
import {sampleQualitySource,sampleCameraComparison} from '../../cinema/shot-plan.ts';
import {PreviewKitV2Hero} from './KitFacade.tsx';

const SKIDS=getSkidDescriptors();
const LiveParticleStreaks:React.FC<{particles:readonly SparkParticle[]}>=({particles})=><>
 {particles.filter(p=>p.luminance01>.12).slice(-108).map(p=>{
   const v=new T.Vector3(...p.velocityWorld);
   if(v.lengthSq()<1e-8)v.set(1,0,0);
   const length=Math.min(.28,.025+v.length()*.009)*p.luminance01;
   const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),v.normalize());
   return <group key={p.id} position={p.positionWorld} quaternion={q}>
     <mesh><boxGeometry args={[.008+.014*p.luminance01,.008+.014*p.luminance01,length]}/>
       <meshBasicMaterial color={p.luminance01>.70?'#fffbdc':'#ffbf75'} toneMapped={false}/></mesh>
   </group>;
 })}
</>;
const TAG:React.CSSProperties={position:'absolute',top:115,left:84,right:84,color:'#e8f4f8',
 fontFamily:'Arial,sans-serif',fontWeight:800,fontSize:31,textShadow:'0 2px 11px #000c',
 letterSpacing:2,textTransform:'uppercase'};
export const Agent10Scene:React.FC<{comparison?:boolean}>=({comparison=false})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const compared=comparison?sampleCameraComparison(frame):null;
 const source=comparison?null:sampleQualitySource(frame);
 const data=(compared??source)!;
 const motion=sampleDynamics(data.sourceSec,{startDistanceM:data.startDistanceM,speedMps:62,aeroLoad01:1});
 const {particles,contacts}=sampleContactDrivenSparks(data.sourceSec,motion,SKIDS);
 const durationSec=compared?.durationSec??source!.shotDurationSec;
 const pose=compared?.baseline
   ?sampleRetimedShotCamera(data.shot,data.localSec,durationSec,motion)
   :sampleRetimedQualityCamera(data.shot,data.localSec,durationSec,motion);
 const sectioned=!comparison&&(data.shot==='underfloor-reveal'||data.shot==='contact-macro');
 const cutaway=sectioned?(data.shot==='contact-macro'?.84:Math.min(.78,.36+data.localSec*.26)):0;
 const active=contacts.some(c=>c.active);
 return <AbsoluteFill style={{background:'#07111b'}}>
   <ThreeCanvas width={width} height={height} shadows
     camera={{position:[0,2.3,9],fov:60,near:.025,far:350}}>
     <NightCircuitWorld motion={motion} particles={particles} exposure={1}/>
     {sectioned&&<>
       <pointLight position={[motion.worldPosition[0],motion.worldPosition[1]+2,motion.worldPosition[2]+1]}
         intensity={4.5} distance={6} decay={2} color='#dcf1ff'/>
     </>}
     <PreviewKitV2Hero motion={motion} cutaway={cutaway}/>
     <LiveParticleStreaks particles={particles}/>
     <ApplyCameraPose pose={pose} near={.025}/>
   </ThreeCanvas>
   <div style={TAG}>YUNEX / EP004 <span style={{color:'#ffd7ae'}}>{comparison
     ?(compared?.baseline?'A3 / BEFORE':'A10 / QUALITY')
     :'A10 / V2 CAMERA ACTION'}</span></div>
   <div style={{...TAG,top:175,fontSize:20,opacity:.8,letterSpacing:1.2}}>
     {data.shot.replaceAll('-',' ')}{sectioned?' · OPTICAL CAR CUTAWAY':''}
   </div>
   <div style={{...TAG,top:1410,fontSize:16,opacity:.86,fontWeight:600,letterSpacing:1}}>
     {sectioned?'SILVER METAL SKID ≠ NON-METAL COMPOSITE PLANK':'TRACK-SAMPLED MOVING FORMULA CAR'}
     <div style={{marginTop:8}}>REAL SIGNED-GAP CONTACT: {active?'YES':'CLEAR'} · PHYSICS PARTICLES: {particles.length}</div>
   </div>
   {/* Last 326 portrait px are deliberately EMPTY for Agent 6 captions. */}
 </AbsoluteFill>;
};
export {QUALITY_SHOTS};
