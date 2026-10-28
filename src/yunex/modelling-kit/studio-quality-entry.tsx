/** Native matched-camera geometry inspection; both body variants use identical lights/lens/trajectory. */
import React,{useMemo,useEffect} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {createCinematicVehicle} from './rig';
import type {CinematicOptions} from './rig';
import {CinematicLighting} from './Lighting';
import {CameraAim} from '../world-kit/components';
import {disposeObject} from '../world-kit/geometry';
import {createGroundContactShadows,updateGroundContactShadows} from './ground-contact';
import type {VehicleVariant,TimeOfDay} from '../world-kit/catalog';
type Props={variant:VehicleVariant;bodyDetail:NonNullable<CinematicOptions['bodyDetail']>;timeOfDay:TimeOfDay;look?:'original'|'grounded'};
const ModelInspection:React.FC<Props>=({variant,bodyDetail,timeOfDay,look='original'})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const model=useMemo(()=>createCinematicVehicle({variant,bodyDetail,quality:'hero',color:variant==='rally-hatch'?'#c88735':'#246d75',driver:true}),[variant,bodyDetail]);
 useEffect(()=>()=>disposeObject(model),[model]);
 const contact=useMemo(()=>look==='grounded'?createGroundContactShadows(model):null,[model,look]);
 useEffect(()=>()=>{if(contact)disposeObject(contact);},[contact]);
 if(contact)updateGroundContactShadows(contact,model,-.014);
 const u=frame/119,t=u*u*(3-2*u),a=.64+(2.25-.64)*t,radius=width<height?13.4:8.1;
 return <ThreeCanvas width={width} height={height} shadows camera={{fov:38,near:.025,far:1000}}>
 <CinematicLighting timeOfDay={timeOfDay}/><primitive object={model}/>{contact?<primitive object={contact}/>:null}
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.014,0]} receiveShadow><planeGeometry args={[2000,2000]}/>{look==='grounded'?<meshStandardMaterial color="#323a42" metalness={.06} roughness={.68}/>:<meshStandardMaterial color="#343d44" roughness={.67} metalness={.06}/>}</mesh>
 <CameraAim position={[Math.cos(a)*radius,2.15,Math.sin(a)*radius]} target={[0,.80,0]} fov={38}/>
 </ThreeCanvas>;
};
const Root=()=> <><Composition id="StudioModelPortrait" component={ModelInspection} width={1080} height={1920} fps={30} durationInFrames={120} defaultProps={{variant:'supercar',bodyDetail:'studio',timeOfDay:'day'}}/><Composition id="StudioModelLandscape" component={ModelInspection} width={1920} height={1080} fps={30} durationInFrames={120} defaultProps={{variant:'supercar',bodyDetail:'studio',timeOfDay:'day'}}/></>;
registerRoot(Root);
