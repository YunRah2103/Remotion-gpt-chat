import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BrakeAssembly} from './BrakeAssembly.tsx';
import {BrakingVehicle} from './BrakingVehicle.tsx';
import {poseFromSimulation} from './mechanics.ts';
import {sampleBrakePreviewFixture} from './previewFixture.ts';
import {Environment,WorldLighting,CameraAim} from '../../world-kit/components.tsx';
import {sampleRoute} from '../../world-kit/environments.ts';
import {wheelAnchors,BRAKING_EP001} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import type {V3} from '../../world-kit/geometry.ts';

const frontLeft=wheelAnchors(vehicleSpec(BRAKING_EP001.vehicleVariant))
  .find(anchor=>anchor.id==='front-left');
if(!frontLeft)throw new Error('A1 front-left kit wheel anchor unavailable');
const BRAND='#e8f1f4';
const strip: React.CSSProperties = {
  position:'absolute',left:'7%',right:'7%',bottom:'8%',
  padding:'22px 24px',background:'linear-gradient(90deg, #0c1924dd, #0a162155)',
  borderLeft:'4px solid #d2a36c',color:BRAND,fontFamily:'Arial,sans-serif',
};
const heading:React.CSSProperties={fontSize:43,fontWeight:800,letterSpacing:1.2};
const eyebrow:React.CSSProperties={fontSize:22,fontWeight:700,letterSpacing:2.4,color:'#c0ccce'};

/** A1 proof 1: close enough to see actual perforations, vents, pads and pistons. */
export const BrakeMacroProof:React.FC=()=>{
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
  const progress=frame/Math.max(1,fps*4-1);
  // Slow-motion preview time dilation is explicit and monotonic.
  const state=sampleBrakePreviewFixture(progress*2.4);
  const cutaway=.15+.55*Math.max(0,Math.min(1,(progress-.24)/.35));
  const brakePose=poseFromSimulation(state,'front-left',cutaway,.15*progress);
  const eye:V3=[.23+Math.sin(progress*1.7)*.18,.21+Math.sin(progress*2)*.10,1.65-.20*progress];
  return <AbsoluteFill style={{background:'#121e29'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:[0,.2,1.6],fov:33,near:.01,far:80}}>
      <color attach="background" args={['#111d29']}/>
      <ambientLight intensity={1.35} color="#b5cde0"/>
      <directionalLight position={[1.0,2.4,2.5]} intensity={3.5} color="#f6d6ae"/>
      <directionalLight position={[-2,1.5,-1.5]} intensity={2} color="#7db5de"/>
      <pointLight position={[-.45,.12,1.1]} intensity={12} color="#d2a36c" distance={4}/>
      <CameraAim position={eye} target={[0,0,0]} fov={32}/>
      <BrakeAssembly wheelRadiusM={.36} wheel="front-left"
        accent="#d2a36c" pose={brakePose}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:'8%',left:'7%',right:'7%',color:BRAND,fontFamily:'Arial,sans-serif'}}>
      <div style={eyebrow}>YUNEX / BRAKING 200 / MECHANISM</div>
      <div style={{...heading,marginTop:20}}>INSIDE THE BRAKE</div>
    </div>
    <div style={strip}>
      <div style={eyebrow}>EDUCATIONAL CUTAWAY / NOT TO SCALE SEPARATION</div>
      <div style={{...heading,fontSize:38,marginTop:12}}>DRILLED VENTILATED DISC</div>
      <div style={{fontSize:28,marginTop:10,lineHeight:1.4}}>Stationary four-piston caliper  ·  rotating hub</div>
      <div style={{fontSize:28,marginTop:9,color:'#f1cf9c'}}>
        {'TRUE PAD TRAVEL  '+(brakePose.padTravelM*1000).toFixed(2)+' mm'}
      </div>
    </div>
  </AbsoluteFill>;
};

/** A1 proof 2: actual reusable grand-tourer and track, one corner cut away. */
export const BrakeTrackProof:React.FC=()=>{
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
  const progress=frame/Math.max(1,fps*4-1);
  const state=sampleBrakePreviewFixture(progress*3.4);
  const carPose=sampleRoute('track',state.traveledM+30);
  const theta=carPose.yaw;
  const c=Math.cos(theta),s=Math.sin(theta);
  // Start with an actual whole-car contextual composition, then smoothly
  // dolly to the exposed front-left assembly (no arbitrary hard cuts).
  const t=Math.max(0,Math.min(1,(progress-.12)/.88));
  const zoom=t*t*(3-2*t);
  // Dampen the camera's dolly, targeting the EXACT kit front-left pivot.
  // Begin as a three-quarter full-car context, end on a readable disc macro.
  const side=8.6+(1.65-8.6)*zoom,fore=8.2+(1.05-8.2)*zoom;
  const forward=.15+(frontLeft.center[0]-.15)*zoom;
  const left=.10+(frontLeft.center[2]-.10)*zoom;
  const center:V3=[
    carPose.position[0]+c*forward+s*left,
    .67+(frontLeft.center[1]+.07-.67)*zoom,
    carPose.position[2]-s*forward+c*left,
  ];
  const eye:V3=[
    center[0]+c*fore+s*side,
    3.05+(1.05-3.05)*zoom,
    center[2]-s*fore+c*side,
  ];
  return <AbsoluteFill style={{background:'#c3d4dd'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:[7,3,5],fov:42,near:.1,far:380}}>
      <WorldLighting timeOfDay="day" focus={carPose.position}/>
      <Environment kind="track" seed={12} timeOfDay="day"/>
      <CameraAim position={eye} target={center} fov={42-4*zoom}/>
      <BrakingVehicle simulation={state} pose={carPose}
        cutawayWheel="front-left" cutaway01={.88}
        heatIllustration01={.06*progress}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:0,left:0,right:0,height:'24%',background:'linear-gradient(#132332bb,transparent)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',top:'7%',left:'7%',right:'7%',color:BRAND,fontFamily:'Arial,sans-serif',textShadow:'0 2px 9px #15232a'}}>
      <div style={eyebrow}>ORIGINAL 3D / REUSABLE GRAND-TOURER / TRACK</div>
      <div style={{...heading,marginTop:18,fontSize:42}}>BRAKE FORCE, EXPLAINED.</div>
    </div>
    <div style={strip}>
      <div style={eyebrow}>FRONT-LEFT WHEEL REMOVED FOR CUTAWAY</div>
      <div style={{...heading,fontSize:36,marginTop:10}}>THE ROTOR SPINS WITH THE HUB.</div>
      <div style={{fontSize:27,marginTop:10}}>The caliper remains fixed to the steering knuckle.</div>
      <div style={{fontSize:21,marginTop:12,color:'#d2dfe4'}}>
        TEST FIXTURE ONLY · AGENT 2 PHYSICS REPLACES PREVIEW DATA
      </div>
    </div>
  </AbsoluteFill>;
};
