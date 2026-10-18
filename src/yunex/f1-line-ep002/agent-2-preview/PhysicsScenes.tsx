import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,Vehicle,WorldLighting,CameraAim} from '../../world-kit/components.tsx';
import {RACE_COLORS} from '../contract.ts';
import type {CarFrameState,RaceCameraPose,RaceFrameState,V3} from '../contract.ts';
import {fixtureSimulator} from '../physics/index.ts';

/** Agent 2 owns physical movie demonstrations; Agent 3 owns final episode cameras. */
const plus=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scaled=(a:V3,k:number):V3=>[a[0]*k,a[1]*k,a[2]*k];
const forward=(yaw:number):V3=>[Math.cos(yaw),0,-Math.sin(yaw)];
const left=(yaw:number):V3=>[Math.sin(yaw),0,Math.cos(yaw)];
const mix=(a:V3,b:V3,f:number):V3=>[a[0]*(1-f)+b[0]*f,a[1]*(1-f)+b[1]*f,a[2]*(1-f)+b[2]*f];
const cameraFor=(state:RaceFrameState,scene:'duel'|'grip'):RaceCameraPose=>{
  const t=state.timeSeconds,a=state.cars.shortcut,b=state.cars.racing;
  const focusCar=scene==='grip'?(t<3.05?b:a):(t<2.3?a:b);
  const p=focusCar.worldPose.position,yaw=focusCar.worldPose.yaw;
  const f=forward(yaw),l=left(yaw),aim=plus(p,[0,.65,0]);
  if(scene==='duel'&&t>=2.3&&t<4.65){
    const center=mix(a.worldPose.position,b.worldPose.position,.5);
    return {position:plus(center,[0,26,17]),target:plus(center,[0,0,0]),fov:37};
  }
  if(scene==='grip'&&t>=4.8){
    const center=mix(a.worldPose.position,b.worldPose.position,.5);
    return {position:plus(center,[11,26,14]),target:center,fov:35};
  }
  if(scene==='duel'&&t>=4.65){
    // Both original cars remain visible as the straight opens up.
    const midpoint=mix(a.worldPose.position,b.worldPose.position,.5);
    const averageYaw=(a.worldPose.yaw+b.worldPose.yaw)*.5;
    const axis=forward(averageYaw),side=left(averageYaw);
    return {position:plus(plus(midpoint,scaled(axis,-19)),plus(scaled(side,8.8),[0,5.1,0])),
      target:plus(plus(midpoint,[0,.8,0]),scaled(axis,1.7)),fov:44};
  }
  if(scene==='duel'){
    // Wider dolly prevents a Formula nose/wing clipping the 9:16 safe area.
    const midpoint=mix(a.worldPose.position,b.worldPose.position,.5);
    const axis=forward((a.worldPose.yaw+b.worldPose.yaw)*.5);
    const side=left((a.worldPose.yaw+b.worldPose.yaw)*.5);
    return {position:plus(plus(midpoint,scaled(axis,-17.5)),plus(scaled(side,9.5),[0,5.3,0])),
      target:plus(midpoint,[0,.85,0]),fov:45};
  }
  // Agent 2 physical close-ups, full vehicle readable even on phone.
  const rear=t>3.05?15:16;
  return {position:plus(plus(p,scaled(f,-rear)),plus(scaled(l,8.8),[0,4.7,0])),
    target:plus(aim,scaled(f,1.5)),fov:45};
};
const kmh=(v:number)=>Math.round(v*3.6);
const overlay:React.CSSProperties={position:'absolute',fontFamily:'Arial,Helvetica,sans-serif',
  color:'#f5f6f4',textShadow:'0 2px 8px #000e'};
const ForceVectors:React.FC<{car:CarFrameState;accent:string}>=({car,accent})=>{
  const yaw=car.worldPose.yaw,pos=car.worldPose.position;
  const lateral=car.lateralAccelMps2;
  const k=car.worldPose.curvatureInvM;
  const latDir=left(yaw).map(v=>v*(k>0?-1:1)) as V3;
  const longDir=forward(yaw).map(v=>v*(car.longitudinalAccelMps2<0?-1:1)) as V3;
  const lateralLength=Math.min(4.8,.32*lateral);
  const longLength=Math.min(3.6,.34*Math.abs(car.longitudinalAccelMps2));
  return <group position={[pos[0],.95,pos[2]]}>
    {lateralLength>.15&&<arrowHelper
      args={[new THREE.Vector3(...latDir),new THREE.Vector3(0,0,0),lateralLength,accent,.65,.36]}/>}
    {longLength>.15&&<arrowHelper
      args={[new THREE.Vector3(...longDir),new THREE.Vector3(0,.1,0),longLength,
        car.longitudinalAccelMps2<0?'#f6c973':'#b9efcd',.50,.29]}/>}
  </group>;
};
const Caption:React.FC<{state:RaceFrameState;scene:'duel'|'grip'}>=({state,scene})=>{
  const a=state.cars.shortcut,b=state.cars.racing;
  const comparison=fixtureSimulator.comparison;
  const delta=comparison.racingFinishAdvantageSeconds;
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <div style={{...overlay,left:'6%',top:'6%',fontSize:16,fontWeight:800,letterSpacing:2}}>
      YUNEX / RACING LINE / PHYSICS REPLAY
    </div>
    <div style={{...overlay,left:'6%',top:'10%',fontSize:14,opacity:.85}}>
      IDENTICAL CARS · IDENTICAL GRIP · SAME START
    </div>
    <div style={{...overlay,left:'6%',top:'14%',fontSize:13,opacity:.75}}>
      GHOST-LAP COMPARISON · NOT A WHEEL-TO-WHEEL OVERTAKE
    </div>
    <div style={{...overlay,left:'6%',bottom:'12%',fontSize:25,fontWeight:700,color:RACE_COLORS.shortcut}}>
      A / INNER LINE — {kmh(a.speedMps)} km/h
    </div>
    <div style={{...overlay,left:'6%',bottom:'8%',fontSize:25,fontWeight:700,color:RACE_COLORS.racing}}>
      B / WIDE LINE — {kmh(b.speedMps)} km/h
    </div>
    <div style={{...overlay,left:'6%',bottom:'4%',fontSize:14}}>
      {scene==='grip'?'3D arrows: lateral tyre demand / longitudinal brake + throttle':
        'COMPUTED FINISH: '+(Math.abs(delta)<.000001?'TIE':
        (delta>0?'B ':'A ')+Math.abs(delta).toFixed(3)+' s ahead')}
    </div>
  </AbsoluteFill>;
};
/** Two fully animated six-second compositions, each generated from one authoritative
 * race-time source. No fake wheelspin, speed readouts or injected overtake animation. */
export const F1Agent2PhysicsPreview:React.FC<{scene:'duel'|'grip'}>=({scene})=>{
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
  const timeSeconds=scene==='duel'?.65+frame/fps*.91:.3+frame/fps*.94;
  const state=fixtureSimulator.sample(Math.round(timeSeconds*fps*100)/100,fps);
  // All scene geometry/wheels use car.pathDistanceM rather than independent timers.
  const camera=cameraFor(state,scene);
  return <AbsoluteFill style={{background:'#a3bdc6'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{fov:45,near:.1,far:400,position:camera.position}}>
      <WorldLighting timeOfDay="dusk" focus={camera.target}/>
      <Environment kind="track" seed={12} timeOfDay="dusk"/>
      <CameraAim position={camera.position} target={camera.target} fov={camera.fov}/>
      <Vehicle variant="formula-modern" color={RACE_COLORS.shortcut} accent="#ecf5f4"
        distance={state.cars.shortcut.travelDistanceM} steer={state.cars.shortcut.steerRad}
        pose={state.cars.shortcut.worldPose}/>
      <Vehicle variant="formula-modern" color={RACE_COLORS.racing} accent="#fff0d5"
        distance={state.cars.racing.travelDistanceM} steer={state.cars.racing.steerRad}
        pose={state.cars.racing.worldPose}/>
      <ForceVectors car={scene==='duel'?state.cars.racing:state.cars.shortcut}
        accent={scene==='duel'?RACE_COLORS.racing:RACE_COLORS.shortcut}/>
      {scene==='grip'&&<ForceVectors car={state.cars.racing} accent={RACE_COLORS.racing}/>}
    </ThreeCanvas>
    <Caption state={state} scene={scene}/>
  </AbsoluteFill>;
};
