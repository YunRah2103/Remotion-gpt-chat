import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {WorldLighting,Environment,CameraAim} from '../../../../src/yunex/world-kit/components';
import {createVehicle} from '../../../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../../../src/yunex/world-kit/motion.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {SteadyHands3D} from '../../story/SteadyHands3D';
import {StoryEffects3D} from '../../story/StoryEffects3D';
import {StoryOverlay} from '../../story/StoryOverlay';
import {samplePreviewFixture} from './fixture.ts';
import type {StoryRequest,Vec3} from '../../shared/contract.ts';

/**
 * Native 1080x1920 isolated review compositions. The fixture is temporary,
 * NOT a validated tyre-physics or safe stopping-place simulation.
 */
const FixtureVehicle:React.FC<{request:StoryRequest;cutaway:boolean}>=({request,cutaway})=>{
  const model=useMemo(()=>createVehicle({
    variant:'grand-tourer', color:'#4A667E',accent:'#C5A576',
    interior:true,cutaway
  }),[cutaway]);
  useEffect(()=>()=>disposeObject(model),[model]);
  const d=request.dynamics;
  animateVehicle(model,d.distanceTravelledM,d.driverSteerRad);
  model.position.set(...d.positionM);
  model.rotation.set(d.rollRad,d.yawRad,d.pitchRad);
  // REVIEW FIXTURE ONLY: Agent 1 will replace this visual with authoritative
  // deformable rubber. Do not export this as tyre physics.
  const frontRight=model.getObjectByName('steer-1.46--0.88');
  if(frontRight){
    const p=request.tyre.failureProgress;
    frontRight.position.y=.36-.08*p;
    const rubber=frontRight.getObjectByName('tyre') as T.Mesh|undefined;
    if(rubber)rubber.scale.set(1-.22*p,1-.22*p,1);
  }
  return <>
    <primitive object={model}/>
    {cutaway && <group position={d.positionM} rotation={[d.rollRad,d.yawRad,d.pitchRad]}>
      <SteadyHands3D dynamics={d}/>
    </group>}
  </>;
};
function intoWorld(origin:Vec3,yaw:number,relative:Vec3):Vec3{
  return [
    origin[0]+relative[0]*Math.cos(yaw)+relative[2]*Math.sin(yaw),
    origin[1]+relative[1],
    origin[2]-relative[0]*Math.sin(yaw)+relative[2]*Math.cos(yaw)
  ];
}
type PreviewShot='hook'|'cutaway'|'force'|'driver'|'recovery';
function previewShot(tSec:number):PreviewShot {
  return tSec<1.5?'hook':tSec<2.6?'cutaway':
    tSec<3.7?'force':tSec<5.25?'driver':'recovery';
}
function storySegment(tSec:number):StoryRequest['segment']{
  return tSec<1.5?'hook':tSec<2.6?'pressure':tSec<3.7?'forces':
    tSec<5.25?'reaction':tSec<7.05?'recovery':'payoff';
}

export const StoryPreview:React.FC<{variant:'hook'|'module'}>=({variant})=>{
  const frame=useCurrentFrame();
  const {fps,width,height}=useVideoConfig();
  // Hook starts just before failure, making deformation visible by source frame 15.
  const tSec=frame/fps+(variant==='hook'?.59:.65);
  const shot=previewShot(tSec);
  const segment=storySegment(tSec);
  const request=samplePreviewFixture(tSec,segment);
  const d=request.dynamics;
  const wheel=request.dynamics.wheels['front-right'].hubWorldM;
  const focus:Vec3=[d.positionM[0],.75,d.positionM[2]];
  const cutaway=shot==='cutaway'||shot==='driver';
  let camera:Vec3,target:Vec3,fov=43;
  if(shot==='hook'){
    camera=[wheel[0]+1.25,wheel[1]+.83,wheel[2]-1.85];
    target=[wheel[0]-.15,wheel[1]-.12,wheel[2]];fov=36;
  }else if(shot==='cutaway'){
    camera=[wheel[0]+1.6,wheel[1]+1.0,wheel[2]-2.3];
    target=[wheel[0]-.22,wheel[1]+.03,wheel[2]];fov=38;
  }else if(shot==='force'){
    camera=intoWorld(d.positionM,d.yawRad,[-1.3,7.1,-3.6]);
    target=focus;fov=39;
  }else if(shot==='driver'){
    camera=intoWorld(d.positionM,d.yawRad,[-.18,1.04,-.50]);
    target=intoWorld(d.positionM,d.yawRad,[2.5,1.00,-.49]);fov=65;
  }else{
    const settle=Math.min(1,Math.max(0,(tSec-5.25)/1.0));
    camera=intoWorld(d.positionM,d.yawRad,[-5.3-settle*2.1,2.75+settle*.4,-4.3]);
    target=intoWorld(d.positionM,d.yawRad,[.6, .76,0]);fov=42;
  }
  return <AbsoluteFill style={{background:'#B7CED8'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:camera,fov,near:.09,far:280}}>
      <WorldLighting timeOfDay="day" focus={focus}/>
      <Environment kind="highway" seed={12} timeOfDay="day"/>
      <CameraAim position={camera} target={target} fov={fov}/>
      <FixtureVehicle request={request} cutaway={cutaway}/>
      <StoryEffects3D request={request} />
    </ThreeCanvas>
    <StoryOverlay request={request} hideLabel={shot==='driver'} placement="bottom"/>
    <div style={{position:'absolute',top:'7.5%',left:'7.5%',maxWidth:'76%',
      color:'#F1F6F4',background:'rgba(13,26,33,.68)',
      fontFamily:'Arial,sans-serif',fontSize:17,fontWeight:600,
      letterSpacing:1.0,lineHeight:1.45,padding:'11px 14px'}}>
      AGENT 5 / ILLUSTRATIVE REVIEW FIXTURE
      <div style={{fontSize:13,opacity:.83,marginTop:3,fontWeight:400}}>
        Awaiting authoritative tyre and vehicle dynamics
      </div>
    </div>
  </AbsoluteFill>;
};
