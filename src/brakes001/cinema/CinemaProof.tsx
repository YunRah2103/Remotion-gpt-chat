import React from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {BrakeCameraRig} from './BrakeCameraRig';
import {GhostCarOutline} from './GhostCarOutline';
import {BrakeLighting} from './BrakeLighting';
import {brakeShotAt} from './cameraMath';
/** Temporary fixed mock ONLY for visual camera proof, not hardware/physics QA. */
const StandInBrake:React.FC=()=>{
 const screws=Array.from({length:12},(_,i)=>i*Math.PI/6);
 return <group name="STAND_IN_ONLY_NOT_PRODUCTION_HARDWARE">
  <mesh rotation={[0,Math.PI/2,0]}>
   <torusGeometry args={[.163,.033,12,96]}/>
   <meshStandardMaterial color="#777c78" roughness={.65} metalness={.19}/>
  </mesh>
  <mesh rotation={[0,0,Math.PI/2]}>
   <cylinderGeometry args={[.072,.072,.045,48]}/>
   <meshStandardMaterial color="#565e60" roughness={.35} metalness={.7}/>
  </mesh>
  {screws.map((a,i)=><mesh key={i} position={[.026,Math.sin(a)*.078,Math.cos(a)*.078]} rotation={[0,0,Math.PI/2]}>
   <cylinderGeometry args={[.007,.007,.004,8]}/>
   <meshStandardMaterial color="#c4bdae" metalness={.75} roughness={.3}/>
  </mesh>)}
  <mesh position={[0,.133,.148]} rotation={[.3,0,0]} castShadow>
   <boxGeometry args={[.118,.105,.10]}/>
   <meshStandardMaterial color="#997b5f" metalness={.62} roughness={.33}/>
  </mesh>
  {[-1,1].map(side=><mesh key={side} position={[side*.046,.123,.129]}>
   <boxGeometry args={[.012,.062,.059]}/>
   <meshStandardMaterial color="#21292c" metalness={.19} roughness={.82}/>
  </mesh>)}
 </group>;
};
export const CinemaProof:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig(),shot=brakeShotAt(frame);
 return <AbsoluteFill style={{background:'#080f19',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[1,.5,.8],fov:34,near:.012,far:75}} gl={{antialias:true,preserveDrawingBuffer:true}}>
   <BrakeCameraRig frame={frame}/>
   <BrakeLighting frame={frame} heat01={shot==='thermal'?.6:0}/>
   {shot==='context'?<GhostCarOutline frame={frame}/>:<StandInBrake/>}
  </ThreeCanvas>
  <div style={{position:'absolute',left:68,top:95,color:'#97bfcc',fontFamily:'Arial',fontSize:23,letterSpacing:3}}>
   CINEMA LOOKDEV / {shot.toUpperCase()}
  </div>
  <div style={{position:'absolute',left:68,bottom:125,color:'#b0bfcb',fontFamily:'Arial',fontSize:20,letterSpacing:2}}>
   AGENT C / PLACEHOLDER GEOMETRY — NOT HARDWARE QA
  </div>
 </AbsoluteFill>;
};
