import React,{useMemo,useEffect} from 'react';
import {Composition,registerRoot,useCurrentFrame,AbsoluteFill,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {createFleetVehicle} from './fleet';
import {vehicleSpec,VehicleVariant} from '../world-kit/catalog';
import {CinematicLighting} from './Lighting';
import {CameraAim} from '../world-kit/components';
import {disposeObject} from '../world-kit/geometry';
const Scene:React.FC<{variant:VehicleVariant;view:'front'|'side'|'rear'|'orbit'}>=({variant,view})=>{
 const f=useCurrentFrame(),{width,height}=useVideoConfig(),s=vehicleSpec(variant);
 const car=useMemo(()=>createFleetVehicle({variant,quality:'hero'}),[variant]);useEffect(()=>()=>disposeObject(car),[car]);
 const a=view==='side'?Math.PI/2:view==='rear'?2.55:view==='orbit'?.45+f/119*2.15:.55,r=Math.max(s.length*1.35,s.height*3.3);
 return <AbsoluteFill><ThreeCanvas width={width} height={height} shadows camera={{fov:40,near:.03,far:200}}>
 <CinematicLighting timeOfDay="day"/><primitive object={car}/><mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[150,150]}/><meshStandardMaterial color="#3c474e" roughness={.85}/></mesh>
 <CameraAim position={[Math.cos(a)*r,s.height*.68,Math.sin(a)*r]} target={[0,s.height*.48,0]} fov={40}/>
 </ThreeCanvas></AbsoluteFill>;
};
registerRoot(()=> <Composition id="GroundUpCarReview" component={Scene} width={1920} height={1080} fps={30} durationInFrames={120} defaultProps={{variant:'grand-tourer',view:'orbit'}}/>);
