/** Non-production integration evidence. Real Agent 1 brake assembly and A2 state
 * are loaded from their UNMODIFIED worktree sources on this QA-only branch.
 * The A4 PR does not import or duplicate their files. */
import React from 'react';
import {AbsoluteFill,Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,CameraAim} from '../../world-kit/components.tsx';
import {sampleRoute} from '../../world-kit/environments.ts';
import {BrakingVehicle} from '../engineering/BrakingVehicle.tsx';
import {BrakeAssembly} from '../engineering/BrakeAssembly.tsx';
import {poseFromSimulation} from '../engineering/mechanics.ts';
import {sampleBrakingSimulation} from '../physics/simulation.ts';
import {BrakingLookdev,BrakingFinishes} from './BrakingLookdev.tsx';
import {BrakingLighting} from './lighting.tsx';
import {illustrativeHeatFromEnergy} from './materials.ts';
import type {Vec3} from '../contracts.ts';
const contrast:React.CSSProperties={
 fontFamily:'Arial,Helvetica,sans-serif',color:'#f4f7f6',
 textShadow:'0 2px 14px #091821dd',
};
const tag:React.CSSProperties={fontSize:21,fontWeight:700,letterSpacing:3,
 color:'#e5edf2',marginBottom:16};
export const BrakingA4V2Car:React.FC=()=>{
 const f=useCurrentFrame(),{width,height,fps}=useVideoConfig(),t=f/fps;
 const state=sampleBrakingSimulation(.40+t*.65);
 const route=sampleRoute('track',28+state.traveledM);
 const c=Math.cos(route.yaw),s=Math.sin(route.yaw);
 const transform=(v:Vec3):[number,number,number]=>
  [route.position[0]+c*v[0]+s*v[2],v[1],route.position[2]-s*v[0]+c*v[2]];
 const eye=transform([7.95+.2*Math.sin(t*.9),2.18,7.40+.2*Math.sin(t*.6)]);
 const target=transform([.16,.72,0]);
 return <AbsoluteFill style={{background:'#9eb9c7'}}>
  <ThreeCanvas width={width} height={height} shadows
    camera={{position:eye,fov:45,near:.04,far:360}}>
   <Environment kind="track" seed={12} timeOfDay="day"/>
   <BrakingVehicle simulation={state} pose={route}/>
   <BrakingLookdev route={route} state={state}/>
   <CameraAim position={eye} target={target} fov={45}/>
  </ThreeCanvas>
  <div style={{...contrast,position:'absolute',top:'6%',left:'7%',right:'7%'}}>
   <div style={tag}>YUNEX  /  BRAKING 200</div>
   <div style={{fontSize:44,fontWeight:800,letterSpacing:-1}}>MOTION INTO HEAT.</div>
  </div>
  <div style={{...contrast,position:'absolute',left:'7%',bottom:'9%',
    right:'9%',padding:'18px 19px',background:'linear-gradient(105deg,#10212bdb,#10212b77)',
    borderLeft:'4px solid #d2a36c'}}>
   <div style={{fontSize:24,letterSpacing:2,fontWeight:700}}>THE GRAND TOURER</div>
   <div style={{marginTop:10,fontSize:19,opacity:.84}}>Sculpted light. Tyre contact. Actual A2 motion.</div>
  </div>
 </AbsoluteFill>;
};
export const BrakingA4V2Macro:React.FC=()=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps;
 const state=sampleBrakingSimulation(.64+t*.34),heat=illustrativeHeatFromEnergy(state);
 // This is the ORIGINAL Agent 1 assembly: real perforations, opposed pads,
 // stationary forged caliper and ventilated rotating disc.
 const pose=poseFromSimulation(state,'front-left',.28+.12*Math.min(1,t/3),heat);
 const eye:[number,number,number]=[.13+.08*Math.sin(t*.62),.14+.03*Math.sin(t*.5),
   1.13+.025*Math.cos(t*.5)];
 return <AbsoluteFill style={{background:'#354755'}}>
  <ThreeCanvas width={width} height={height} shadows
    camera={{position:eye,fov:45,near:.01,far:60}}>
   <mesh position={[0,0,-.37]} receiveShadow>
    <planeGeometry args={[7,7]}/>
    <meshStandardMaterial color="#273947" roughness={.92} metalness={.15}/>
   </mesh>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.43,0]} receiveShadow>
    <planeGeometry args={[5,5]}/>
    <meshStandardMaterial color="#28343b" roughness={.91}/>
   </mesh>
   <BrakingLighting focus={[0,0,0]} studio/>
   <BrakeAssembly wheelRadiusM={.36} wheel="front-left" accent="#d2a36c" pose={pose}/>
   <BrakingFinishes state={state}/>
   <CameraAim position={eye} target={[.015,.02,0]} fov={45}/>
  </ThreeCanvas>
  <div style={{...contrast,position:'absolute',top:'6%',left:'7%',right:'7%'}}>
   <div style={tag}>YUNEX  /  REAL BRAKE ASSEMBLY</div>
   <div style={{fontSize:45,fontWeight:800,letterSpacing:-1}}>THE HEAT INSIDE.</div>
  </div>
  <div style={{...contrast,position:'absolute',left:'7%',bottom:'8%',right:'8%',
    background:'linear-gradient(105deg,#0d1f2be8,#10222bbf)',
    padding:'18px 20px',borderLeft:'4px solid #d2a36c'}}>
   <div style={{fontSize:24,fontWeight:700,letterSpacing:1.5}}>VENTILATED IRON DISC</div>
   <div style={{fontSize:19,lineHeight:1.4,opacity:.85,marginTop:9}}>
    Rotating drilled faces  /  fixed four-piston caliper
   </div>
   <div style={{fontSize:17,marginTop:8,color:'#e7b887'}}>
    Heat illumination is illustrative, derived from Agent 2 friction work
   </div>
  </div>
 </AbsoluteFill>;
};
export const V2Proof:React.FC=()=> <>
 <Composition id="BrakingA4V2Car" component={BrakingA4V2Car}
   width={1080} height={1920} fps={30} durationInFrames={90}/>
 <Composition id="BrakingA4V2Macro" component={BrakingA4V2Macro}
   width={1080} height={1920} fps={30} durationInFrames={90}/>
</>;
