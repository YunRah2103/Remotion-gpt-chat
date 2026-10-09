/** Agent G: four genuine 3D inspection viewpoints for the tyre, alloy and brake. */
import React,{useLayoutEffect} from 'react';
import {Composition,AbsoluteFill,useCurrentFrame,useVideoConfig,registerRoot} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {WheelAssembly} from './WheelAssembly';
import {BrakeAssembly} from '../hardware/BrakeAssembly';

function BeautyCamera({frame}:{frame:number}){
  const {camera,size,invalidate}=useThree();
  useLayoutEffect(()=>{
    const poses:[number,number,number][]=[
      [1.75,.30,.40],[1.24,.44,1.18],[.30,.38,1.76],
      [-1.78,.32,.52],
    ];
    const p=poses[Math.min(3,Math.floor(frame/30))];
    camera.position.set(...p);camera.lookAt(0,0,0);
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=37;camera.aspect=size.width/size.height;
      camera.near=.01;camera.far=30;camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();invalidate();
  },[camera,frame,size.height,size.width,invalidate]);
  return null;
}
export const WheelBeautyProof:React.FC=()=>{
  const frame=useCurrentFrame(),{width,height}=useVideoConfig();
  return <AbsoluteFill style={{background:'#0b1119'}}>
    <ThreeCanvas width={width} height={height} camera={{position:[1.7,.3,.4],fov:37}}
      gl={{antialias:true,preserveDrawingBuffer:true}}>
      <color attach="background" args={['#0b1119']}/>
      <BeautyCamera frame={frame}/>
      <ambientLight intensity={.60}/>
      <hemisphereLight args={['#d0d9e2','#18202a',1.5]}/>
      <directionalLight color="#fff4df" intensity={4.8} position={[1.0,2.4,2.1]}/>
      <directionalLight color="#8caace" intensity={3.4} position={[-1.7,.4,-1.8]}/>
      <pointLight intensity={3} color="#e9eefa" position={[.6,.2,1.4]}/>
      <BrakeAssembly rotorAngleRad={0} showUpright/>
      <WheelAssembly angleRad={0}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:210,left:70,color:'#d7e6e9',
      fontFamily:'Arial,sans-serif',fontSize:34,letterSpacing:5}}>
      ORIGINAL 3D WHEEL / {['FACE','THREE-QUARTER','PROFILE','INBOARD'][Math.min(3,Math.floor(frame/30))]}
    </div>
  </AbsoluteFill>;
};
const Root=()=> <Composition id="WheelBeautyG" component={WheelBeautyProof}
  width={1080} height={1920} durationInFrames={120} fps={30}/>;
registerRoot(Root);
