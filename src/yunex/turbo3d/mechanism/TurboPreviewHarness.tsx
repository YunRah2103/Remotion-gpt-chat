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
   const distance=(mode==='full'?10.3:6.9) - Math.min(40,frame)/40*.40;
   camera.position.set(distance*Math.sin(.20+t*.19),distance*.36+Math.sin(t*.36)*.13,distance*Math.cos(.20+t*.19));
   camera.lookAt(mode==='full'?.25:0,mode==='full'?-.30:0,mode==='full'?-1.4:0);
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
     camera={{position:[2,4,10],fov:39,near:.1,far:100}}>
      <color attach="background" args={['#08121D']}/>
      <ambientLight intensity={.37}/>
      <hemisphereLight args={['#CDE9EA','#162637',1.55]}/>
      <directionalLight position={[-3,7,6]} intensity={3.5}/>
      <spotLight position={[-3,3,3]} angle={.75} intensity={31} color="#FF9E57"/>
      <pointLight position={[4,2,2]} intensity={25} color="#64D4F4"/><directionalLight position={[1,3,-5]} intensity={2.0} color="#C2DDDF"/>
      <Camera frame={frame} mode={mode}/>
      {/* Presentation roll alone: physical model axes and exported A3 port transforms remain unchanged. */}
      <group rotation={[0,0,mode==='full'?1.08:1.20]}>
        <TurboMechanism frame={frame} cutaway={mode==='cutaway'?.80+.20*open:1}
          exploded={mode==='exploded'?Math.min(1,frame/40):0}
          variant={mode==='full'?'full':'turbo'}/>
      </group>
   </ThreeCanvas>
 </AbsoluteFill>;
};
