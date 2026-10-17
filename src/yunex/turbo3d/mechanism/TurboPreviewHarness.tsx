import React,{useLayoutEffect} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {TurboMechanism} from './TurboMechanism';

/** Isolated A2 native preview; A6 alone owns Root registration. */
const Camera:React.FC<{frame:number;mode:'cutaway'|'exploded'|'full'}>=({frame,mode})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
   const t=frame/30;
   const distance=mode==='full'?17.6:9.3;
   camera.position.set(distance*Math.sin(.20+t*.19),distance*.27+Math.sin(t*.36)*.2,distance*Math.cos(.20+t*.19));
   camera.lookAt(mode==='full'?.15:0,mode==='full'?-.65:0,mode==='full'?-1.48:0);
   camera.updateProjectionMatrix();
 },[camera,frame,mode]);
 return null;
};
export const TurboMechanismPreview:React.FC<{mode?:'cutaway'|'exploded'|'full'}>=({mode='cutaway'})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const open=Math.min(1,frame/24);
 return <AbsoluteFill style={{background:'#08121D'}}>
   <ThreeCanvas width={width} height={height}
     gl={{antialias:true,preserveDrawingBuffer:true}}
     camera={{position:[2,4,10],fov:48,near:.1,far:100}}>
      <color attach="background" args={['#08121D']}/>
      <ambientLight intensity={.62}/>
      <hemisphereLight args={['#B6DCE3','#162637',1.8]}/>
      <directionalLight position={[-3,7,6]} intensity={3.1}/>
      <spotLight position={[3,3,3]} angle={.75} intensity={32} color="#FFB16E"/>
      <pointLight position={[4,1,1]} intensity={20} color="#64D4F4"/>
      <Camera frame={frame} mode={mode}/>
      <TurboMechanism frame={frame} cutaway={mode==='cutaway'?open:1}
        exploded={mode==='exploded'?Math.min(1,frame/40):0}
        variant={mode==='full'?'full':'turbo'}/>
   </ThreeCanvas>
 </AbsoluteFill>;
};
