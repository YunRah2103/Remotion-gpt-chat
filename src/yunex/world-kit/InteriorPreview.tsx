import React from 'react';import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';import {ThreeCanvas} from '@remotion/three';
import {vehicleSpec} from './catalog.ts';import type {VehicleVariant} from './catalog.ts';import {interiorCamera} from './interiors.ts';
import {Vehicle,Environment,WorldLighting,CameraAim} from './components';import type {V3} from './geometry.ts';
export const InteriorPreview:React.FC<{variant:VehicleVariant;mode:'driver'|'cutaway'}>=({variant='saloon',mode='cutaway'})=>{
 const f=useCurrentFrame(),{width,height,fps}=useVideoConfig(),s=vehicleSpec(variant),view=interiorCamera(s),cut=mode==='cutaway',r=s.length*(height>width?1.65:1.12),a=.75+f/fps*.15;
 const position:V3=cut?[Math.cos(a)*r,r*.80,Math.sin(a)*r]:[view.position[0],view.position[1],view.position[2]-1.85];
 const target:V3=cut?[0,s.height*.40,0]:[view.target[0],view.target[1],view.target[2]-1.85];
 return <AbsoluteFill><ThreeCanvas width={width} height={height} shadows camera={{near:.015,far:350,fov:cut?40:view.fov}}>
  <WorldLighting studio={cut}/><CameraAim position={position} target={target} fov={cut?40:view.fov}/>
  {cut?<mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.008,0]}><planeGeometry args={[200,200]}/><meshStandardMaterial color="#a6b2ac"/></mesh>:<Environment kind="highway"/>}
  <Vehicle variant={variant} cutaway={cut} glassOpacity={cut?0:.15} interior steer={Math.sin(f/fps)*.08} pose={cut?undefined:{position:[0,0,-1.85],yaw:0}}/>
 </ThreeCanvas><div style={{position:'absolute',left:'4%',top:'5%',fontFamily:'Arial',fontSize:width*.018,background:'#15232bdd',color:'#edf4ee',padding:'12px 18px'}}>{s.label.toUpperCase()} / {cut?'INTERIOR CUTAWAY':'DRIVER VIEW'}</div></AbsoluteFill>;
};
export const InteriorReel:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),shots=[['saloon','cutaway'],['saloon','driver'],['supercar','cutaway'],['panel-van','cutaway'],['box-truck','driver'],['camper-van','cutaway']] as const,i=Math.min(shots.length-1,Math.floor(frame/fps));
 return <Sequence key={i} from={i*fps} durationInFrames={fps} premountFor={fps}><InteriorPreview variant={shots[i][0]} mode={shots[i][1]}/></Sequence>;
};
