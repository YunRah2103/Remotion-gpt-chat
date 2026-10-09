import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {EngineeringSurface,StudioLightingRig} from './LightingPresets';

export const StudioMaterialProof:React.FC=()=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const rotate=frame*.013;
  const finishes=['machined-aluminium','rubber','brushed-steel','painted-body','safety-glass','dark-polymer'] as const;
  return <AbsoluteFill style={{background:'#0b131b'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:[5,3.1,10],fov:35,near:.1,far:100}}>
      <StudioLightingRig preset="soft-studio" scale={1.5} showGround={false}/>
      <group rotation={[.17,rotate,0]}>
        {finishes.map((finish,i)=>{
          const a=i*Math.PI/3;
          return <mesh key={finish} castShadow position={[Math.cos(a)*2,Math.sin(a)*2,0]}>
            <sphereGeometry args={[.65,42,24]}/>
            <EngineeringSurface finish={finish}/>
          </mesh>;
        })}
        <mesh castShadow>
          <torusKnotGeometry args={[.9,.26,120,12]}/>
          <EngineeringSurface finish="machined-aluminium"/>
        </mesh>
      </group>
    </ThreeCanvas>
    <div style={{position:'absolute',left:60,top:150,fontFamily:'Arial',fontSize:39,color:'#e1f5f1',fontWeight:800}}>
      STUDIO LIGHTING · MATERIAL TEST
    </div>
    <div style={{position:'absolute',left:60,bottom:170,fontFamily:'Arial',fontSize:28,color:'#bdd3e0'}}>
      Original procedural reference — not manufacturer CAD
    </div>
  </AbsoluteFill>;
};
