/**
 * EP004 Agent 4 premium night review compositions.
 * Integrated REAL Agent 1 F1HeroVehicle and Agent 2 metal-road contact sparks.
 * These source previews illustrate physical contact; they are not the final edit.
 */
import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import type {SparkParticle,VehicleMotionState} from '../shared/contract.ts';
import {F1HeroVehicle,getSkidDescriptors} from '../mechanics/F1HeroVehicle.tsx';
import {sampleDynamics,sampleContactDrivenSparks} from '../physics/index.ts';
import {NightCircuitWorld} from './NightCircuitWorld.tsx';
import {ContactGlints} from './ContactGlints.tsx';
import {cameraRigForLook} from './camera-rig.ts';

export type LookPreviewMode='trackside-pass'|'race-follow';
export type LookPreviewProps={
 mode:LookPreviewMode;
 motion?:VehicleMotionState;
 particles?:readonly SparkParticle[];
 tStartSec?:number;
};

const RacePreview3D:React.FC<{
 mode:LookPreviewMode;
 tSec:number;
 motion?:VehicleMotionState;
 particles?:readonly SparkParticle[];
}>=({mode,tSec,motion,particles})=>{
 // Real Authoritative chassis/route solver. The 69m opening crosses the genuine
 // hump near 72m; the second contact event is naturally governed by 138m.
 const resolvedMotion=motion??sampleDynamics(tSec,{startDistanceM:69,speedMps:62});
 const sparks=particles??sampleContactDrivenSparks(
  resolvedMotion.tSec,resolvedMotion,getSkidDescriptors(),
 ).particles;
 const rig=cameraRigForLook(resolvedMotion,mode,tSec);
 return <>
  <NightCircuitWorld motion={resolvedMotion} particles={sparks}/>
  <F1HeroVehicle motion={resolvedMotion}/>
  <ContactGlints particles={sparks}/>
  <CameraAim position={rig.eye} target={rig.target} fov={rig.fov}/>
 </>;
};

export const LookPreview:React.FC<LookPreviewProps>=({
 mode,motion,particles,tStartSec=0,
})=>{
 const frame=useCurrentFrame();
 const {fps,width,height}=useVideoConfig();
 const tSec=tStartSec+frame/fps;
 return <ThreeCanvas
    width={width} height={height}
    camera={{position:[70,3,-9],fov:48,near:.045,far:320}}
    gl={{antialias:true,alpha:false,preserveDrawingBuffer:true}}
   >
    <RacePreview3D mode={mode} tSec={tSec} motion={motion} particles={particles}/>
   </ThreeCanvas>;
};

/** Composition names/durations preserved for existing manager native QA. */
export const Agent4LookCompositions:React.FC=()=><>
 <Composition id="EP004Agent4Trackside"
  component={LookPreview} defaultProps={{mode:'trackside-pass' as const}}
  durationInFrames={150} fps={30} width={1080} height={1920}/>
 <Composition id="EP004Agent4RaceFollow"
  component={LookPreview} defaultProps={{mode:'race-follow' as const}}
  durationInFrames={210} fps={30} width={1080} height={1920}/>
</>;
