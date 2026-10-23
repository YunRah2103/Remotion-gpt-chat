import React from 'react';
import {AbsoluteFill,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,Vehicle,CameraAim,WorldLighting} from './components';
import {sampleRoute} from './environments.ts';
import {environmentSpec} from './world-catalog.ts';
import type {EnvironmentKind,TimeOfDay} from './catalog.ts';
import type {V3} from './geometry.ts';
export const EnvironmentOverview:React.FC<{environment:EnvironmentKind;seed:number;timeOfDay:TimeOfDay}>=({environment='coast',seed=12,timeOfDay='day'})=>{
 const {width,height}=useVideoConfig(),spec=environmentSpec(environment),pose=sampleRoute(environment,-42),display=spec.mode==='display';
 const camera:V3=display?[21,11,20]:environment==='city'?[pose.position[0]+22,70,pose.position[2]+22]:environment==='track'?[106,73,105]:environment==='bridge'?[72,34,67]:environment==='tunnel'?[pose.position[0]+23,4.7,2.4]:[pose.position[0]+31,20,pose.position[2]+33];
 const target:V3=display?[0,1,-3]:environment==='track'?[0,0,0]:environment==='bridge'?[0,3,0]:[pose.position[0],1,pose.position[2]];
 return <AbsoluteFill><ThreeCanvas width={width} height={height} shadows camera={{near:.1,far:550,fov:46}}>
  <WorldLighting timeOfDay={timeOfDay} studio={display} focus={target}/>{!display&&<fog attach="fog" args={[timeOfDay==='night'?'#34485c':timeOfDay==='dusk'?'#c1b5b4':'#b7ced8',130,500]}/>}<Environment kind={environment} seed={seed} timeOfDay={timeOfDay}/><CameraAim position={camera} target={target} fov={46}/><Vehicle variant="coupe" pose={pose} lights={timeOfDay!=='day'}/>
 </ThreeCanvas><div style={{position:'absolute',left:'4%',top:'5%',fontFamily:'Arial',fontSize:width*.022,color:'#eaf2ed',background:'#16272de8',padding:'12px 18px'}}>{spec.label.toUpperCase()} / WORLD OVERVIEW</div></AbsoluteFill>;
};
