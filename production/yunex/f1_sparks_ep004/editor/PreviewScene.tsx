/** Agent 6 genuinely INTEGRATED video-only six-beat picture preview.
 * Accepted Agent 1 hero, Agent 2 physics, Agent 3 actual camera,
 * Agent 4 matching asphalt/lighting and Agent 5 truth/labels.
 * This is not a narration-locked film and contains NO Audio component.
 */
import React,{useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import type {SparkParticle,StoryRequest,CameraPose} from '../shared/contract.ts';
import {F1HeroVehicle,getSkidDescriptors} from '../mechanics/index.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../physics/index.ts';
import {NightCircuitWorld} from '../look/NightCircuitWorld.tsx';
import {sampleRetimedShotCamera} from '../cinema/cameras.ts';
import {ApplyCameraPose} from '../cinema/ShotCamera.tsx';
import {CutawayHero} from '../previews/agent-3/CutawayHero.tsx';
import {getStoryVisualCue} from '../story/visual-cues.ts';
import {projectedActualParts} from '../story/project-actual-parts.ts';
import {CinematicSparkGlints} from './CinematicSparkGlints.tsx';
import {contextualContactCamera} from './macro-camera.ts';
import {PREVIEW_TOTAL_FRAMES,previewFrame,authenticSparkTime} from './preview-plan.ts';
const skids=getSkidDescriptors();

const RealParticleStreaks:React.FC<{particles:readonly SparkParticle[]}>=({particles})=>{
 const mesh=useMemo(()=>{
  const m=new THREE.InstancedMesh(
   new THREE.CylinderGeometry(1,1,1,5),
   new THREE.MeshBasicMaterial({color:'#fff0cb',toneMapped:false,depthWrite:false}),
   260);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;return m;
 },[]);
 const transform=new THREE.Object3D(),color=new THREE.Color(),up=new THREE.Vector3(0,1,0);
 const shown=particles.filter(x=>x.luminance01>.05&&x.ageSec>=0&&x.ageSec<x.lifetimeSec).slice(-260);
 for(let i=0;i<shown.length;i++){
  const p=shown[i],velocity=new THREE.Vector3(...p.velocityWorld);
  transform.position.set(...p.positionWorld);
  transform.quaternion.setFromUnitVectors(up,velocity.lengthSq()>1e-8?velocity.normalize():up);
  const radius=Math.max(.009,p.radiusM*.9);
  transform.scale.set(radius,.05+.20*p.luminance01,radius);
  transform.updateMatrix();
  mesh.setMatrixAt(i,transform.matrix);
  color.setRGB(1,.53+.43*p.luminance01,.19+.45*p.luminance01);
  mesh.setColorAt(i,color);
 }
 mesh.count=shown.length;mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 return <primitive object={mesh}/>;
};
const cardStyle:React.CSSProperties={
 fontFamily:'Arial,Helvetica,sans-serif',fontWeight:800,color:'#fff6e9',
 textShadow:'0 3px 12px rgba(0,0,0,.9)',letterSpacing:1.4,
};
const UnderfloorCallouts:React.FC<{request:StoryRequest;pose:CameraPose}>=({request,pose})=>{
 const labels=projectedActualParts(request.motion,pose);
 return <svg viewBox="0 0 1080 1920" style={{
  position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',
 }}>
  {labels.map((part,i)=>{
   const y=430+i*144;
   return <g key={part.id}>
    <rect x="82" y={y-43} width="550" height="94" rx="14" fill="#07111b" fillOpacity=".79" stroke={part.color} strokeOpacity=".6"/>
    <circle cx="111" cy={y-4} r="9" fill={part.color}/>
    <text x="136" y={y+6} fill={part.color} fontSize="35" fontFamily="Arial" fontWeight="800">{part.title}</text>
    {part.onScreen&&<g>
      <path d={`M 616 ${y-2} L ${part.x.toFixed(2)} ${part.y.toFixed(2)}`} stroke={part.color} strokeWidth="3" fill="none"/>
      <circle cx={part.x} cy={part.y} r="8" fill={part.color}/>
    </g>}
   </g>;
  })}
  <text x="540" y="1302" fontSize="25" textAnchor="middle" fill="#e7edf0">ACTUAL PARTS · OPTICAL CUTAWAY</text>
 </svg>;
};
export const EP004VideoOnlyReview:React.FC=()=>{
 const frame=useCurrentFrame(),config=useVideoConfig();
 if(config.width!==1080||config.height!==1920||config.fps!==30||config.durationInFrames!==PREVIEW_TOTAL_FRAMES)
  throw new Error('EP004 picture review: invalid vertical real 420-frame composition');
 const sparkTime=useMemo(authenticSparkTime,[]);
 const part=previewFrame(frame,sparkTime);
 // Small authentic slow-motion inserts at contact; all other driving uses
 // real Agent 2 motion time at normal velocity, including moving final car.
 const aeroProgress=part.shot==='aero-load'
  ?Math.min(1,Math.max(0,(part.localSec/part.durationSec-.18)/.65)):1;
 const motion=sampleDynamics(part.sourceSec,{aeroLoad01:aeroProgress});
 const {contacts,particles}=sampleContactDrivenSparks(part.sourceSec,motion,skids,{aeroLoad01:aeroProgress});
 const request:StoryRequest={
  shot:part.shot,tSec:part.sourceSec,shotLocalSec:part.localSec,
  shotDurationSec:part.durationSec,motion,contacts,particles
 };
 const cue=getStoryVisualCue(request);
 const cutaway=part.shot==='underfloor-reveal';
 const lensSec=part.shot==='spark-hook'?part.localSec:part.localSec;
 // Preserve Agent3 retimeability but keep its hook view tight for first 0.8s.
 const preset=sampleRetimedShotCamera(part.shot,lensSec,
  part.shot==='spark-hook'?2.8:part.durationSec,motion);
 // Editorial lens trim of the already approved Agent 3 rig, never a new car path.
 // Keep the full vehicle legible in the stable aero comparison and moving exit.
 const framing=part.shot==='aero-load'?.81:part.shot==='racing-payoff'?.92:1;
 const camera=part.shot==='contact-macro'
  ?contextualContactCamera(preset)
  :{...preset,positionWorld:preset.positionWorld.map((v,i)=>
    preset.targetWorld[i]+(v-preset.targetWorld[i])*framing) as [number,number,number]};
 // No fixed caption or invented VO transcript; these are factual on-screen
 // material labels kept well above the lower 326px phone UI reserve.
 return <AbsoluteFill style={{background:'#060e16',overflow:'hidden'}}>
  <ThreeCanvas width={1080} height={1920} shadows
    camera={{position:[0,2,9],fov:50,near:.025,far:350}}>
    <NightCircuitWorld motion={motion} particles={particles} exposure={.9} showEnvironment={!cutaway}/>
    {cutaway&&<>
      <pointLight position={camera.positionWorld} intensity={9} distance={10} color="#d8ecff"/>
      <ambientLight intensity={.35}/>
    </>}
    {cutaway?<CutawayHero motion={motion}/>:<F1HeroVehicle motion={motion}
      reveal01={part.shot==='contact-macro'?.32:0}/>}
    <RealParticleStreaks particles={particles}/>
    <ApplyCameraPose pose={camera} near={.025}/>
  </ThreeCanvas>
  <CinematicSparkGlints particles={particles} pose={camera}
    strength={part.shot==='spark-hook'?1.85:part.shot==='contact-macro'?1.55:1.05}/>
  {part.shot==='underfloor-reveal'&&<UnderfloorCallouts request={request} pose={camera}/>}
  {part.shot==='aero-load'&&<div style={{...cardStyle,position:'absolute',
    top:290,left:92,right:92,fontSize:35}}>
    AIR PRESSURE PUSHES THE CAR LOWER
    <div style={{fontSize:24,marginTop:13,color:'#f3d5aa'}}>
      METAL SKIDS MOVE CLOSER TO THE ROAD
    </div>
  </div>}
  {part.shot==='contact-macro'&&cue.activeContact&&<div style={{...cardStyle,
    position:'absolute',top:300,left:92,right:92,fontSize:33}}>
    METAL SKID SCRAPES ASPHALT
  </div>}
  {part.shot==='spark-hook'&&part.localSec>.33&&particles.length>0&&<div style={{...cardStyle,
    position:'absolute',top:260,left:92,right:92,fontSize:29}}>
    METAL MEETS THE TRACK
  </div>}
 </AbsoluteFill>;
};
