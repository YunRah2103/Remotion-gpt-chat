import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,Composition,useCurrentFrame} from 'remotion';
import {VehicleWorld,VehiclePreviewCamera} from '../VehicleWorld';

/** Self-contained proof registration. Does not touch A6-owned src/Root.tsx. */
const VehiclePreview:React.FC=()=>{
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{background:'#08121D'}}>
    <ThreeCanvas width={540} height={960} shadows
      camera={{fov:35,position:[-5,2.7,9],near:.1,far:160}}
      gl={{antialias:true,preserveDrawingBuffer:true}}>
      <VehiclePreviewCamera frame={frame}/>
      <VehicleWorld frame={frame} variant={frame>=68?'hero':'opaque'} travelMeters={frame*.24}/>
    </ThreeCanvas>
  </AbsoluteFill>;
};
export const VehiclePreviewRoot:React.FC=()=> <Composition id="A1VehiclePreview"
  component={VehiclePreview} width={540} height={960} fps={30} durationInFrames={120}/>;
