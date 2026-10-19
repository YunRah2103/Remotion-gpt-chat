/** Deliberately staged geometric clearance inspection, not a simulated stop. */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim} from '../../../../../src/yunex/world-kit/components';
import {EpisodeLight,EpisodeWorld,EpisodeGrandTourer} from '../../look/world.tsx';
import type {VehicleDynamicsFrame,WheelFrame,WheelId} from '../../shared/contract.ts';
import {REFUGE,fitsStoppedGrandTourer} from '../../look/refuge-profile.ts';

function stagedVehicle():VehicleDynamicsFrame {
  const x=74,z=REFUGE.safeStopCentreZ;
  if(!fitsStoppedGrandTourer(x,z))throw Error('Refuge staging centre failed footprint clearance');
  const wheels={} as Record<WheelId,WheelFrame>;
  for(const id of ['front-left','front-right','rear-left','rear-right'] as WheelId[]) {
    wheels[id]={
      wheel:id,
      hubWorldM:[x+(id.startsWith('front')?1.46:-1.46),.36,
        z+(id.endsWith('left')?.88:-.88)],
      steeringRad:0,spinRad:0,rollingRadiusM:.36,verticalCompressionM:0,
    };
  }
  return {tSec:0,positionM:[x,0,z],yawRad:0,pitchRad:0,rollRad:0,
    worldSpeedMps:0,distanceTravelledM:0,driverSteerRad:0,
    driverThrottle01:0,driverBrake01:0,wheels,stage:'pre-failure'};
}
export const RefugeInspection:React.FC=()=>{
  const {width,height,fps}=useVideoConfig();
  const t=useCurrentFrame()/fps;
  const state=stagedVehicle();
  // Arc entirely above the live-lane side so trees, signs and crash barrier
  // cannot occlude the car's footprint in the centre of the widened refuge.
  const a=-.22 + Math.min(1,t/5)*.80;
  const camera:[number,number,number]=[
    74+Math.sin(a)*13.4, 8.6+1.7*Math.sin(Math.PI*Math.min(1,t/5)),
    -1.1 + Math.cos(a)*1.9
  ];
  return <AbsoluteFill style={{background:'#b7ced8'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{
      position:camera,fov:41,near:.1,far:300,
    }}>
      <EpisodeLight focus={state.positionM}/>
      <EpisodeWorld/>
      <EpisodeGrandTourer dynamics={state}/>
      <CameraAim position={camera} target={[74,.55,-10.5]} fov={41}/>
    </ThreeCanvas>
    <div style={{
      position:'absolute',left:'5%',top:'6%',color:'#f1f4f0',
      fontFamily:'Arial, sans-serif',fontSize:Math.round(width*.027),
      letterSpacing:2,fontWeight:700,textShadow:'0 2px 5px #19252b',
    }}>REFUGE / GEOMETRY INSPECTION</div>
    <div style={{
      position:'absolute',left:'5%',bottom:'6%',color:'#f1f4f0',
      fontFamily:'Arial, sans-serif',fontSize:Math.round(width*.019),
      textShadow:'0 2px 5px #19252b',
    }}>STAGED CLEARANCE ONLY — NOT A PHYSICAL RECOVERY</div>
  </AbsoluteFill>;
};
