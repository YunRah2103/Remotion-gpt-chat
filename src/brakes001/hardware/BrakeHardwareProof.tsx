/**
 * Agent A isolated native moving-frame proof. The Master may temporarily
 * register it under a separate composition ID to render genuine software-WebGL
 * frames. Does NOT alter src/Root.tsx or claim to be the 25-second film.
 *
 * 0-39: face/orbit; 40-79: pad closure; 80-119: exploded hierarchy/orbit.
 * Dimensions are real metres; no scientific heat simulation here.
 */
import React, {useLayoutEffect} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {BrakeAssembly} from './BrakeAssembly';

const ease = (t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};

const ProofCamera: React.FC<{frame:number}>=({frame})=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    const a=0.18+frame*.011;
    const exploded=frame>=80;
    const distance=exploded?.61:.47;
    camera.position.set(
      distance*Math.cos(a),
      .21 + Math.sin(a*.75)*.06,
      distance*Math.sin(a)+.18
    );
    camera.lookAt(.008,.048,.065);
    camera.updateProjectionMatrix();
  },[camera,frame]);
  return null;
};

export const BrakeHardwareProof:React.FC=()=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const closing=ease((frame-40)/34);
  const padGap=interpolate(closing,[0,1],[.003,0]);
  const explode=ease((frame-80)/32);
  const rotorAngle=frame*.08;
  return <AbsoluteFill style={{backgroundColor:'#080e15',color:'#dce8ec'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:[.48,.25,.45],fov:32,near:.02,far:20}}
      gl={{antialias:true,preserveDrawingBuffer:true}}>
      <color attach="background" args={['#080e15']}/>
      <ambientLight color="#b0c8d8" intensity={0.64}/>
      <directionalLight position={[.28,.50,.55]} intensity={2.9}
        color="#cbe4ff" castShadow/>
      <directionalLight position={[-.5,.30,-.42]} intensity={3.0}
        color="#f6c29b"/>
      <pointLight position={[.28,-.02,-.28]} intensity={1.0}
        color="#77cafa"/>
      <ProofCamera frame={frame}/>
      <BrakeAssembly rotorAngleRad={rotorAngle}
        padGapMetres={padGap} exploded01={explode}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:110,left:76,fontSize:24,
      fontWeight:800,letterSpacing:6}}>AGENT A / HARDWARE PROOF</div>
    <div style={{position:'absolute',left:76,bottom:230,
      fontWeight:900,fontSize:56,letterSpacing:-1}}>
      {frame<40?'VENTED CARBON-CERAMIC':frame<80?'OPPOSED PAD CLAMP':'NAMED EXPLODED PARTS'}
    </div>
    <div style={{position:'absolute',left:76,bottom:174,
      fontSize:24,color:'#91a9b5',letterSpacing:3}}>
      390 MM ORIGINAL ILLUSTRATIVE ASSEMBLY • NOT FACTORY CAD
    </div>
  </AbsoluteFill>;
};
