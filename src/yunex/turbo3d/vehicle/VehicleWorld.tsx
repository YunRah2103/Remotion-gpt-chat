import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {EngineBayDetail, HingedEngineDeck} from './DetailKit';
import {RoadCarBody} from './NormalCoupe';

/**
 * A1 ORIGINAL VEHICLE / ENVIRONMENT. 1 unit = 1 metre.
 * +Y up, +Z nose/forward, +X right. World road top is y=0.
 * Frame-driven only; A6 controls actual final-shot editing.
 */
export const VEHICLE_SPEC = Object.freeze({
  length: 4.6, width: 1.95, height: 1.25,
  wheelRadius: 0.355, wheelX: 0.858, frontAxleZ: 1.47,
  rearAxleZ: -1.48, wheelCenterY: 0.355,
  paint: '#0D817F', wheels: '#171D27',
});
export const VEHICLE_ANCHORS = Object.freeze({
  CAR_BODY: [0,0.76,0],
  ENGINE_BAY: [0,0.84,-1.33],
  EXHAUST_MANIFOLD_ZONE: [0,0.63,-1.78],
  REAR_CAMERA_TRACK: [0,1.32,-5.6],
  ROAD_SURFACE: [0,0,0],
});
export type VehicleVariant = 'opaque' | 'reveal' | 'hero';
export interface VehicleWorldProps {
  frame: number;
  variant?: VehicleVariant;
  revealProgress?: number; // 0..1, opens rear-deck/engine-bay view
  travelMeters?: number; // cumulative movement, drives tyre rotation + road parallax
}
const Pi=Math.PI;
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const wrap=(z:number,travel:number,extent=190)=>((z+travel+extent/2)%extent+extent)%extent-extent/2;

/** V8 keeps the complete public animation/camera interface while replacing
 * ONLY the rendered body/wheel presentation with an ordinary modern coupe.
 * No camera transforms, frame offsets or film code change.
 */
export const VehicleModel:React.FC<{frame:number;variant?:VehicleVariant;revealProgress?:number;travelMeters?:number}>=
({frame,variant='opaque',revealProgress=0,travelMeters=0})=>{
  const panelOpen=variant==='reveal'?clamp(revealProgress):0;
  const float=Math.sin(frame*.065)*.007;
  return <group name="ORIGINAL_YUNEX_COUPE" position={[0,float,0]}>
    <group name="CAR_BODY">
      <RoadCarBody travelMeters={travelMeters} reveal={variant==='reveal'}/>
      {variant==='reveal'&&<HingedEngineDeck open={panelOpen}/>}
      <EngineBayDetail visible={variant==='reveal'&&panelOpen>.02}/>
    </group>
  </group>;
};

const Tree:React.FC<{x:number;z:number;index:number}>=({x,z,index})=>{
  const h=1.5+(index%6)*.24;
  return <group position={[x,0,z]}>
    <mesh position={[0,h*.28,0]} castShadow><cylinderGeometry args={[.11,.16,h*.58,6]}/>
      <meshStandardMaterial name="TREE_BARK" color="#24333A" roughness={1}/></mesh>
    <mesh position={[0,h*.81,0]} castShadow><coneGeometry args={[.65+(index%3)*.09,h*1.05,6]}/>
      <meshStandardMaterial name="STYLISED_TREES" color={index%4===0?'#254D4D':'#173A40'} roughness={.98}/></mesh>
  </group>;
};
const StreetLamp:React.FC<{x:number;z:number}>=({x,z})=><group position={[x,0,z]}>
  <mesh position={[0,2.55,0]}><cylinderGeometry args={[.06,.09,5.1,8]}/>
    <meshStandardMaterial name="TRACK_LAMP_POLE" color="#344D56" metalness={.55} roughness={.38}/></mesh>
  <mesh position={[-Math.sign(x)*.42,5.0,0]}>
    <boxGeometry args={[.9,.12,.18]}/><meshStandardMaterial color="#5E787D" metalness={.62} roughness={.34}/></mesh>
  <mesh position={[-Math.sign(x)*.78,4.92,0]}>
    <boxGeometry args={[.26,.04,.16]}/><meshBasicMaterial color="#FFD7A0" toneMapped={false}/></mesh>
  <pointLight position={[-Math.sign(x)*.74,4.82,0]} color="#FFB36D" intensity={8} distance={8}/>
</group>;

/** Road and scenery scroll backwards as vehicle distance grows: strong parallax, no frame time. */
export const RoadEnvironment:React.FC<{travelMeters:number}>=({travelMeters})=><group name="ROAD_SURFACE">
  <color attach="background" args={['#08121D']}/>
  <fog attach="fog" args={['#08121D',29,120]}/>
  <hemisphereLight args={['#B8D0D3','#132934',1.5]}/>
  <ambientLight intensity={.32}/>
  <directionalLight position={[-7,13,1]} color="#D6E3E4" intensity={3.25} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}
    shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={18} shadow-camera-bottom={-18}/>
  <directionalLight position={[8,7,-9]} color="#FFA55C" intensity={3.65}/>
  <spotLight position={[-4,9,6]} color="#71BFC8" intensity={20} angle={.75} penumbra={.8}/>
  <mesh position={[0,-.24,0]} receiveShadow><boxGeometry args={[250,.32,250]}/>
    <meshStandardMaterial color="#122630" roughness={.95}/></mesh>
  <mesh position={[0,-.084,0]} receiveShadow><boxGeometry args={[8,.16,240]}/>
    <meshStandardMaterial name="RACE_ASPHALT" color="#243238" roughness={.89} metalness={.06}/></mesh>
  {[-1,1].map(s=><group key={s}>
    <mesh position={[s*3.93,.017,0]} receiveShadow><boxGeometry args={[.13,.025,230]}/>
      <meshStandardMaterial name="WHITE_ROAD_EDGE" color="#C3D3CD" roughness={.68}/></mesh>
    <mesh position={[s*4.17,-.004,0]}><boxGeometry args={[.34,.026,230]}/>
      <meshStandardMaterial name="RUMBLE_STRIP_BASE" color="#2C333A" roughness={.8}/></mesh>
    <mesh position={[s*5.18,.58,0]}><boxGeometry args={[.16,.18,230]}/>
      <meshStandardMaterial name="GUARD_RAIL_SILVER" color="#668087" metalness={.76} roughness={.36}/></mesh>
    {Array.from({length:24},(_,i)=>{
      const z=wrap(-88+i*8,travelMeters);
      return <group key={i} position={[0,0,z]}>
        <mesh position={[s*4.2,.014,0]}><boxGeometry args={[.34,.027,2.1]}/>
          <meshStandardMaterial color={i%2===0?'#D7DBD0':'#A63E45'} roughness={.68}/></mesh>
        <mesh position={[s*5.17,.36,0]}><boxGeometry args={[.12,.73,.15]}/>
          <meshStandardMaterial color="#526B71" roughness={.45} metalness={.65}/></mesh>
        <Tree index={i} x={s*(7.4+(i%4)*1.25)} z={0}/>
      </group>;
    })}
    {Array.from({length:8},(_,i)=><StreetLamp key={i} x={s*6.4} z={wrap(-80+i*26,travelMeters)}/>)}
  </group>)}
  {Array.from({length:22},(_,i)=>{
    const z=wrap(-85+i*8.0,travelMeters);
    return <mesh key={i} position={[0,.005,z]}>
      <boxGeometry args={[.085,.02,3.15]}/><meshStandardMaterial name="CENTRE_DASHED_LINE" color="#BCC8C4" roughness={.82}/></mesh>;
  })}
  {Array.from({length:12},(_,i)=><mesh key={'ridge'+i} position={[i%2?18:-18,2.3,wrap(-110+i*21,travelMeters*.26,240)]} castShadow>
    <dodecahedronGeometry args={[3+(i%4)*.7,0]}/><meshStandardMaterial color={i%3===0?'#1E3C42':'#142F38'} roughness={1}/></mesh>)}
</group>;

/** A restrained road-contact shadow adds visual mass without moving wheel pivots.
 * Each tyre already physically meets road y=0; three transparent concentric
 * ellipses soften the illusion of hovering in the dark A5 environment.
 * Rendered only in the hero variant to preserve mechanism/reveal previews.
 */
const GroundContact:React.FC=()=> <group name="VEHICLE_ROAD_CONTACT">
  {[-1,1].flatMap(side=>[1.47,-1.48].map(axle=><group key={side+'_'+axle} position={[side*.858,0,axle]}>
    {[{r:.21,opacity:.27},{r:.32,opacity:.12},{r:.46,opacity:.04}].map((s,i)=>
      <mesh key={i} position={[0,.006+i*.001,0]} rotation={[-Math.PI/2,0,0]} scale={[s.r,s.r*1.35,1]} renderOrder={i+1}>
        <circleGeometry args={[1,28]}/>
        <meshBasicMaterial color="#000409" transparent opacity={s.opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-1}/>
      </mesh>
    )}
  </group>))}
</group>;

export const VehicleWorld:React.FC<VehicleWorldProps>=({frame,variant='opaque',revealProgress=0,travelMeters})=>{
  const distance=travelMeters??frame*(variant==='hero'?.33:.23);
  return <group name="A1_VEHICLE_WORLD">
    <RoadEnvironment travelMeters={distance}/>
    {variant==='hero'&&<GroundContact/>}
    <VehicleModel frame={frame} variant={variant} revealProgress={revealProgress} travelMeters={distance}/>
  </group>;
};

/** Preview-only camera; A4 owns final cinematic camera system. */
export const VehiclePreviewCamera:React.FC<{frame:number}>=({frame})=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    const t=clamp(frame/119);
    const orbit=-.50+Math.sin(t*Pi*1.4)*.52;
    const track=frame>=68;
    const x=track?-5.15:Math.sin(orbit)*8.6;
    const z=track?-7.9:Math.cos(orbit)*8.6;
    camera.position.set(x,track?2.07:2.5+.3*Math.sin(t*Pi),z);
    camera.lookAt(0,.80,0);
    camera.updateProjectionMatrix();
  },[frame,camera]);
  return null;
};
