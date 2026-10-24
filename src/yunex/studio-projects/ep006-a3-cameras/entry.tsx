/** Camera-only native preview (silent), using a declared pose fixture until Agent 2 integration.
 * This is NOT the episode master and does not assert validated jump dynamics.
 */
import React,{useMemo,useEffect} from 'react';
import {Composition,registerRoot,AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim} from '../../world-kit/components';
import {disposeObject} from '../../world-kit/geometry.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../modelling-kit/environments.ts';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {rallySurfaceHeight} from '../../modelling-kit/rough-road.ts';
import {sampleEp006Camera} from '../../ep006/cameras/shot-motion.ts';
import {samplePreviewPose} from './preview-fixture.ts';

const RallyCameraPreview:React.FC<{globalStart:number}>=({globalStart})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig(),absolute=globalStart+frame;
 const pose=samplePreviewPose(absolute);
 const view=sampleEp006Camera(absolute,pose,{aspect:width/height,terrainHeightM:(x,z)=>rallySurfaceHeight(x,z,.8)});
 const world=useMemo(()=>createCinematicEnvironment({kind:'rally',timeOfDay:'day',roughness:.8,quality:'hero',seed:12}),[]);
 const vehicle=useMemo(()=>createCinematicVehicle({variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true,lights:true,color:'#d1ac4d',optimize:true}),[]);
 useEffect(()=>()=>disposeObject(world),[world]);useEffect(()=>()=>disposeObject(vehicle),[vehicle]);
 // Animate only the existing V4 rig. Vehicle translation/orientation are fixture samples.
 // Agent 1's rig adapter and Agent 2's authoritative dynamics replace this on integration.
 animateCinematicVehicle(vehicle,{frame:absolute,fps:30,distance:absolute*.55,speed:16.5,compression:Math.min(.12,pose.wheels['front-left'].compressionM),
  steer:pose.wheels['front-left'].steerRad,braking:0,impact:pose.impact01});
 vehicle.position.fromArray(pose.positionM);
 vehicle.rotation.set(...pose.rotationRad);
 vehicle.updateMatrixWorld(true);
 return <AbsoluteFill style={{background:'#bacaca'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov:view.fov,near:view.near,far:view.far}} gl={{antialias:true}}>
   <CinematicLighting timeOfDay="day" focus={pose.positionM}/>
   <primitive object={world}/>
   <primitive object={vehicle}/>
   <CameraAim position={view.position} target={view.target} fov={view.fov}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};

const NativeProofs:React.FC=()=> <React.Fragment>
 <Composition id="Ep006A3Hook" component={RallyCameraPreview} width={1080} height={1920} fps={30} durationInFrames={66} defaultProps={{globalStart:0}}/>
 <Composition id="Ep006A3Impact" component={RallyCameraPreview} width={1080} height={1920} fps={30} durationInFrames={55} defaultProps={{globalStart:65}}/>
 <Composition id="Ep006A3FinalLaunch" component={RallyCameraPreview} width={1080} height={1920} fps={30} durationInFrames={64} defaultProps={{globalStart:675}}/>
 <Composition id="Ep006A3FinalLanding" component={RallyCameraPreview} width={1080} height={1920} fps={30} durationInFrames={62} defaultProps={{globalStart:748}}/>
 </React.Fragment>;
registerRoot(NativeProofs);
