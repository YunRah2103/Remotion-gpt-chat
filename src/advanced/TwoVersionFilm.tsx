import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {StudioLightingRig} from '../studio/LightingPresets';
import {BrakeDisc, BrakeCaliper, WheelSpeedSensor} from '../mechanics/parts';
import * as THREE from 'three';

export type ProductionVariant = 'studio' | 'circuit';
export type TwoVersionProps = {variant:ProductionVariant};

const Camera:React.FC<{frame:number;variant:ProductionVariant}>=({frame,variant})=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    const t=frame/750;
    const a=variant==='circuit' ? -.4+t*.42 : -.6+t*.75;
    const radius=variant==='circuit'?4.6:4.0;
    camera.position.set(Math.sin(a)*radius+1.0,variant==='circuit'?1.72:1.95,Math.cos(a)*radius+2.2);
    camera.lookAt(0,1.0,0);
    camera.updateProjectionMatrix();
  },[frame,variant,camera]);
  return null;
};

const Environment:React.FC<{variant:ProductionVariant;frame:number}>=({variant,frame})=>{
  if(variant==='studio')return <>
    <StudioLightingRig preset="soft-studio" showGround={false}/>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.05,0]}>
      <planeGeometry args={[28,28]}/>
      <meshStandardMaterial color="#17232e" metalness={.23} roughness={.6}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.047,0]}>
      <ringGeometry args={[1.8,2.05,90]}/>
      <meshStandardMaterial color="#557f83" metalness={.55} roughness={.34}/>
    </mesh>
  </>;
  return <>
    <StudioLightingRig preset="hard-metal" showGround={false}/>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.05,0]}>
      <planeGeometry args={[65,65]}/>
      <meshStandardMaterial color="#252d2e" metalness={.06} roughness={.94}/>
    </mesh>
    {Array.from({length:20},(_,i)=><mesh key={'lane-'+i}
      rotation={[-Math.PI/2,0,0]} position={[-8+i*.84,-.044,-4.1]}>
      <planeGeometry args={[.5,.11]}/>
      <meshStandardMaterial color="#dce3d8" roughness={.8}/>
    </mesh>)}
    {Array.from({length:14},(_,i)=><mesh key={'kerb-'+i}
      rotation={[-Math.PI/2,0,0]} position={[-8+i*1.2,-.041,1.9]}>
      <planeGeometry args={[1.2,.72]}/>
      <meshStandardMaterial color={i%2?'#e6e4df':'#d96c48'} roughness={.8}/>
    </mesh>)}
    {Array.from({length:11},(_,i)=><mesh key={'barrier-'+i}
      position={[-7+i*1.4,.35,-6]}>
      <boxGeometry args={[1.35,.65,.26]}/>
      <meshStandardMaterial color={i%2?'#cbd2d3':'#506474'} metalness={.13} roughness={.75}/>
    </mesh>)}
  </>;
};

const Mechanics:React.FC<{frame:number;variant:ProductionVariant}>=({frame,variant})=>{
  const angle=frame*.07;
  const active=variant==='circuit'?Math.sin(frame/28)*.04:0;
  return <group position={[0,1.17+active,0]}>
    <group rotation={[0,0,angle]}>
      <BrakeDisc scale={1.25}/>
      {Array.from({length:10},(_,i)=>{
        const angle=i*Math.PI*2/10;
        return <mesh key={i} position={[Math.cos(angle)*.70,Math.sin(angle)*.70,.2]}
          rotation={[0,0,angle]}>
          <boxGeometry args={[.07,.28,.09]}/>
          <meshStandardMaterial color="#647983" metalness={.86} roughness={.27}/>
        </mesh>;
      })}
    </group>
    <BrakeCaliper scale={1.2}/>
    <WheelSpeedSensor scale={1.2}/>
    <mesh rotation={[0,0,angle]} position={[0,0,-.16]}>
      <torusGeometry args={[1.04,.18,14,80]}/>
      <meshStandardMaterial color="#202528" metalness={.05} roughness={.95}/>
    </mesh>
  </group>;
};

export const TwoVersionFilm:React.FC<TwoVersionProps>=({variant})=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const studio=variant==='studio';
  const kicker=studio?'ENGINEERING / STUDIO':'ENGINEERING / CIRCUIT';
  const title=frame<240?'THE BRAKE ASSEMBLY':frame<510?'DISC · CALIPER · SENSOR':'THE SAME MECHANISM';
  const opacity=interpolate(frame,[0,15,720,749],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{overflow:'hidden',background:'#0a1420',color:'#f0faf8',fontFamily:'Arial,Helvetica,sans-serif'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:[1,2.4,6],fov:35,near:.1,far:100}}>
      <Camera frame={frame} variant={variant}/>
      <Environment variant={variant} frame={frame}/>
      <Mechanics frame={frame} variant={variant}/>
    </ThreeCanvas>
    <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(4,13,20,.72),transparent 30%,transparent 70%,rgba(4,13,20,.84))'}}/>
    <div style={{position:'absolute',top:120,left:70,right:60,opacity}}>
      <div style={{fontSize:24,letterSpacing:5,color:'#8dd5c5',fontWeight:800}}>{kicker}</div>
      <div style={{fontSize:55,fontWeight:850,lineHeight:1.14,marginTop:22}}>{title}</div>
    </div>
    <div style={{position:'absolute',bottom:140,left:72,right:75,fontSize:29,opacity}}>
      <div style={{color:'#cae9e3'}}>ORIGINAL 3D TECHNICAL DEMONSTRATION</div>
      <div style={{color:'#a7bec5',fontSize:23,marginTop:10}}>
        Illustrative geometry · not manufacturer CAD or ABS simulation
      </div>
    </div>
  </AbsoluteFill>;
};
