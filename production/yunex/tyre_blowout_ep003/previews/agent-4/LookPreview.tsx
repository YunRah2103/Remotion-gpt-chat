import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim,Environment,Vehicle,WorldLighting} from '../../../../../src/yunex/world-kit/components';
import {EP003_SCENE} from '../../shared/contract.ts';
import type {VehicleDynamicsFrame,WheelFrame,WheelId} from '../../shared/contract.ts';
import {EpisodeWorld,EpisodeLight,EpisodeGrandTourer} from '../../look/world.tsx';

export type LookPreviewProps={
  mode:'beauty'|'portrait';
  baseline:boolean;
};
const INITIAL_X=-99;
const SPEED=EP003_SCENE.illustrativeInitialSpeedMps;
const wheelKeys:WheelId[]=['front-left','front-right','rear-left','rear-right'];
/** TEMPORARY CAMERA/LOOK FIXTURE ONLY. Agent 2 replaces it at integration.
 * Not an illustration of failure, true yaw, tyre loads or safe-stop dynamics.
 */
export function lookOnlyMotionFixture(tSec:number):VehicleDynamicsFrame {
  if(!Number.isFinite(tSec)||tSec<0)throw new Error('Invalid preview time');
  const x=INITIAL_X+SPEED*tSec,z=-1.85;
  const wheels={} as Record<WheelId,WheelFrame>;
  for(const key of wheelKeys) {
    const front=key.startsWith('front'),right=key.endsWith('right');
    wheels[key]={
      wheel:key,hubWorldM:[x+(front?1.46:-1.46),.36,z+(right?-.88:.88)],
      spinRad:-SPEED*tSec/.36,steeringRad:0,rollingRadiusM:.36,
      verticalCompressionM:0,
    };
  }
  return {
    tSec,positionM:[x,0,z],yawRad:0,pitchRad:0,rollRad:0,
    worldSpeedMps:SPEED,distanceTravelledM:SPEED*tSec,
    driverSteerRad:0,driverThrottle01:1,driverBrake01:0,
    wheels,stage:'pre-failure',
  };
}
export const LookPreview:React.FC<LookPreviewProps>=({mode,baseline})=>{
  const {width,height,fps}=useVideoConfig();
  const t=useCurrentFrame()/fps;
  const state=lookOnlyMotionFixture(t),x=state.positionM[0];
  const portrait=mode==='portrait';
  // Identical deterministic camera poses in BEFORE and AFTER versions.
  let camera:[number,number,number],target:[number,number,number],fov=40;
  if(!portrait) {
    camera=[x+6.25,2.7,-9.0];target=[x,.73,-1.85];fov=40;
  } else if(t<2.1) {
    camera=[x+2.15,.89,-5.2];target=[x+1.46,.36,-2.73];fov=29;
  } else if(t<4.65) {
    camera=[x+6.7,2.75,-8.9];target=[x,.77,-1.85];fov=45;
  } else {
    // The camera demonstrates the independently modelled refuge. This preview
    // NEVER claims the still-moving car has stopped safely.
    camera=[x+3.0,9.0,-25.5];target=[x+4,.1,-10.5];fov=51;
  }
  return <AbsoluteFill style={{background:'#b7ced8'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{
      position:camera,fov,near:.08,far:310,
    }}>
      {baseline?
        <><WorldLighting timeOfDay="day" focus={[x,0,-1.85]}/>
          <Environment kind="highway" seed={12} timeOfDay="day"/>
          <Vehicle variant="grand-tourer" color={EP003_SCENE.paint}
            distance={state.distanceTravelledM} steer={0}
            pose={{position:[x,0,-1.85],yaw:0}}/></>:
        <><EpisodeLight focus={state.positionM}/><EpisodeWorld/>
          <EpisodeGrandTourer dynamics={state}/></>
      }
      <CameraAim position={camera} target={target} fov={fov}/>
    </ThreeCanvas>
    <div style={{
      position:'absolute',left:width*.054,top:height*.045,
      color:'#edf2ee',fontFamily:'Arial, sans-serif',
      fontSize:Math.round(width*(portrait?.025:.016)),letterSpacing:2,
      textShadow:'0 2px 6px #13212e',fontWeight:700,
    }}>{baseline?'ORIGINAL HIGHWAY':'EP003 / PREMIUM WORLD LOOK'}</div>
    <div style={{
      position:'absolute',bottom:height*.05,left:width*.054,
      color:'#e9eee8',fontFamily:'Arial, sans-serif',
      fontSize:Math.round(width*(portrait?.018:.012)),
      letterSpacing:1.1,textShadow:'0 2px 5px #15212a',
    }}>{portrait?'MATERIAL MACRO → REFUGE SWEEP':'IDENTICAL CAMERA / COMPARATIVE LIGHTING'}</div>
  </AbsoluteFill>;
};
