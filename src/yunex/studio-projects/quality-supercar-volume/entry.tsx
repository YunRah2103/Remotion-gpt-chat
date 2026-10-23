import React,{useMemo,useEffect} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {createCinematicVehicle} from '../../modelling-kit/rig';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {CameraAim} from '../../world-kit/components';
import {disposeObject} from '../../world-kit/geometry';
import recipe from './recipe.json';
/** Editable proportion review: quiet studio, front three-quarter to side profile. */
const VolumeProof=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const model=useMemo(()=>createCinematicVehicle({...recipe.vehicle,variant:'supercar',quality:'hero'}),[]);
 useEffect(()=>()=>disposeObject(model),[model]);
 const t=Math.min(1,frame/89),a=.72+(Math.PI/2-.72)*(t*t*(3-2*t));
 return <ThreeCanvas width={width} height={height} shadows camera={{fov:36,near:.025,far:100}}>
  <CinematicLighting/>
  <primitive object={model}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.012,0]} receiveShadow><planeGeometry args={[100,100]}/><meshStandardMaterial color="#273039" roughness={.55} metalness={.12}/></mesh>
  <CameraAim position={[Math.cos(a)*8.1,1.75,Math.sin(a)*8.1]} target={[0,.75,0]} fov={36}/>
 </ThreeCanvas>;
};
const Root=()=> <Composition id="StudioEpisode" component={VolumeProof} width={1920} height={1080} fps={30} durationInFrames={90}/>;
registerRoot(Root);
