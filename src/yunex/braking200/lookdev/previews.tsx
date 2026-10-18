import React from 'react';
import {AbsoluteFill,Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Vehicle,Environment,CameraAim} from '../../world-kit/components.tsx';
import {sampleRoute} from '../../world-kit/environments.ts';
import {BrakingLookdev} from './BrakingLookdev.tsx';
import type {Vec3} from '../contracts.ts';

export const BrakingLookdevContextProof:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig(),t=frame/fps;
 const distance=28+t*10,pose=sampleRoute('track',distance);
 const yaw=pose.yaw,c=Math.cos(yaw),s=Math.sin(yaw);
 const eyeLocal:Vec3=[7.6+.3*Math.sin(t*.8),2.12,7.9-.3*Math.cos(t*.7)];
 const aimLocal:Vec3=[.25,.55,0];
 const toWorld=(v:Vec3):[number,number,number]=>
   [pose.position[0]+c*v[0]+s*v[2],v[1],
    pose.position[2]-s*v[0]+c*v[2]];
 const eye=toWorld(eyeLocal),aim=toWorld(aimLocal);
 return <AbsoluteFill style={{background:'#9eb9c7'}}>
  <ThreeCanvas width={width} height={height} shadows
   camera={{position:eye,fov:45,near:.05,far:350}}>
   <Environment kind="track" seed={12} timeOfDay="day"/>
   <Vehicle variant="grand-tourer" color="#35546e" accent="#d2a36c"
      pose={pose} distance={distance}/>
   <BrakingLookdev route={pose}/>
   <CameraAim position={eye} target={aim} fov={45}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:'6%',left:'7%',padding:'8px 13px',
   color:'#e8f0f0',background:'#172934b3',
   borderLeft:'3px solid #d2a36c',font:'600 21px Arial',letterSpacing:2}}>
   YUNEX / AUTOMOTIVE LOOKDEV
  </div>
  <div style={{position:'absolute',bottom:'8%',left:'7%',padding:'14px 18px',
   background:'#142733c9',borderLeft:'3px solid #d2a36c',
   color:'#f3f5f3',font:'600 28px Arial',letterSpacing:1}}>
   METALLIC SLATE / CIRCUIT
   <div style={{font:'400 18px Arial',marginTop:8,opacity:.78}}>Episode-owned lighting and material finish</div>
  </div>
 </AbsoluteFill>;
};
/** Isolated source-tree showcase. The actual A1 3D rotor macro is registered
 * only by the A1+A2 integration QA harness, NOT an opaque kit wheel stand-in. */
export const BrakingLookdevCompositions:React.FC=()=> <>
 <Composition id="BrakingLookdevContext" component={BrakingLookdevContextProof}
    width={1080} height={1920} fps={30} durationInFrames={120}/>
</>;
