import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {LightShell, FrontDuct, SideDuct, PremiumWheel, EngineBayDetail, HingedEngineDeck, RearSignature} from './DetailKit';

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
const C = {paint:'#0D817F', dark:'#101A22', carbon:'#17242D', glass:'#152A38',
  edge:'#B6D5D4', tyre:'#111317', rim:'#171D27', head:'#D5FDFF', tail:'#FF405C'};
const Pi=Math.PI;
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const wrap=(z:number,travel:number,extent=190)=>((z+travel+extent/2)%extent+extent)%extent-extent/2;

/** Shape loft: real bevel-like varying cross-sections, not overlapping car boxes. */
function loft(sections:ReadonlyArray<readonly [number,number,number,number]>,openFront=false):THREE.BufferGeometry {
  const vertices:number[]=[]; const indices:number[]=[];
  for(const [z,halfW,low,high] of sections){
    vertices.push(-halfW,low,z, halfW,low,z, halfW,high,z, -halfW,high,z);
  }
  for(let s=0;s<sections.length-1;s++){
    for(let j=0;j<4;j++){
      // Leave actual rear-quarter side apertures for inboard deep duct geometry.
      if(s===2 && (j===1 || j===3)) continue;
      const a=4*s+j,b=4*s+(j+1)%4,c=a+4,d=b+4;
      indices.push(a,b,c,b,d,c);
    }
  }
  indices.push(0,2,1,0,3,2);
  const n=4*(sections.length-1);
  if(!openFront) indices.push(n,n+1,n+2,n,n+2,n+3);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}
const BODY_SECTIONS:ReadonlyArray<readonly [number,number,number,number]>=[
  [-2.30,.66,.48,.63],[-2.09,.83,.41,.77],[-1.58,.97,.43,.85],
  [-.75,.955,.42,.80],[.25,.94,.41,.83],[1.29,.96,.40,.76],
  [1.98,.79,.44,.65],[2.30,.62,.40,.68]
];
const ROOF_SECTIONS:ReadonlyArray<readonly [number,number,number,number]>=[
  [-1.38,.72,.80,.82],[-.91,.63,.82,1.17],[-.60,.58,.82,1.25],
  [.23,.56,.82,1.24],[.46,.59,.82,1.17],[1.09,.78,.76,.78]
];
/** Close-up wheel and air-inlet geometry is owned by DetailKit.tsx (A1 v2). */

export const VehicleModel:React.FC<{frame:number;variant?:VehicleVariant;revealProgress?:number;travelMeters?:number}>=
({frame,variant='opaque',revealProgress=0,travelMeters=0})=>{
  const chassis=useMemo(()=>loft(BODY_SECTIONS,true),[]);
  // The two openings are real holes in the front fascia, not black decals over a body cap.
  const fascia=useMemo(()=>{
    const shape=new THREE.Shape();
    shape.moveTo(-.62,.40);shape.lineTo(.62,.40);shape.lineTo(.62,.68);shape.lineTo(-.62,.68);shape.closePath();
    for(const side of [-1,1]){
      const cx=side*.42, p=new THREE.Path(),x0=cx-.18,x1=cx+.18;
      p.moveTo(x0,.46);p.lineTo(x0,.61);p.lineTo(x1,.61);p.lineTo(x1,.46);p.closePath();
      shape.holes.push(p);
    }
    return new THREE.ExtrudeGeometry(shape,{depth:.07,steps:1,bevelEnabled:false,curveSegments:3});
  },[]);
  const canopy=useMemo(()=>loft(ROOF_SECTIONS),[]);
  const r=clamp(revealProgress);
  const panelOpen=variant==='reveal'?r:0;
  // Hero emissive settings are carried by the layered lamps in DetailKit.
  const float=Math.sin(frame*.065)*.007;
  return <group name="ORIGINAL_YUNEX_COUPE" position={[0,float,0]}>
    <group name="CAR_BODY">
      <mesh geometry={chassis} castShadow receiveShadow>
        <meshPhysicalMaterial name="BODY_TEAL_ENAMEL" color={C.paint} metalness={.67} roughness={.24} clearcoat={.85} clearcoatRoughness={.17}/>
      </mesh>
      <mesh geometry={fascia} position={[0,0,2.265]} castShadow>
        <meshPhysicalMaterial name="ACTUAL_PERFORATED_BUMPER_FASCIA" color={C.paint} metalness={.67} roughness={.24} clearcoat={.85}/>
      </mesh>
      <mesh geometry={canopy} castShadow>
        <meshPhysicalMaterial name="DARK_TINTED_GLASS" color={C.glass} roughness={.10} metalness={.54} transparent opacity={.9} clearcoat={1}/>
      </mesh>
      <mesh position={[0,1.247,-.16]}><boxGeometry args={[1.07,.016,.73]}/>
        <meshStandardMaterial name="ROOFLINE_TEAL" color="#245D63" metalness={.8} roughness={.25}/></mesh>
      {[-1,1].map(s=><group key={s}>
        <LightShell side={s}/>
        <SideDuct side={s}/>
        <RearSignature side={s}/>
        <mesh position={[s*.71,.92,-2.05]} rotation={[0,0,s*.1]}>
          <boxGeometry args={[.23,.038,.26]}/><meshStandardMaterial color="#0D1C22" roughness={.3} metalness={.4}/>
        </mesh>
        <mesh position={[s*.76,.68,1.07]} rotation={[0,s*.22,0]}>
          <boxGeometry args={[.12,.035,.24]}/><meshStandardMaterial name="SIDE_MIRROR_DARK" color="#0B171E" metalness={.52} roughness={.38}/>
        </mesh>
        <FrontDuct side={s}/>
        <mesh position={[s*.79,.53,-2.21]}>
          <boxGeometry args={[.37,.09,.09]}/><meshStandardMaterial color="#071116" metalness={.45} roughness={.33}/>
        </mesh>
      </group>)}
      <mesh position={[0,.51,2.293]}><boxGeometry args={[.91,.12,.05]}/><meshStandardMaterial color="#08161C" metalness={.28} roughness={.56}/></mesh>
      <mesh position={[0,.50,-2.288]}><boxGeometry args={[1.07,.12,.05]}/><meshStandardMaterial name="REAR_DIFFUSER" color="#0A151C" metalness={.32} roughness={.53}/></mesh>
      {[-.38,0,.38].map(x=><mesh key={x} position={[x,.43,-2.33]}>
        <boxGeometry args={[.09,.17,.13]}/><meshStandardMaterial color="#2B3940" metalness={.47}/></mesh>)}
      <HingedEngineDeck open={panelOpen}/>
      <EngineBayDetail visible={variant==='reveal' && panelOpen>.02}/>
      <mesh position={[0,.96,-2.04]}><boxGeometry args={[1.61,.065,.37]}/>
        <meshStandardMaterial name="AERO_REAR_SPOILER" color="#17242B" metalness={.73} roughness={.28}/></mesh>
      <mesh position={[0,.43,2.30]}><boxGeometry args={[1.58,.04,.29]}/>
        <meshStandardMaterial name="FRONT_SPLITTER" color="#10151B" metalness={.49} roughness={.44}/></mesh>
      {[-1,1].flatMap(s=>[1.47,-1.48].map(z=><PremiumWheel key={s+'_'+z} side={s} z={z} travelMeters={travelMeters}/>))}
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

export const VehicleWorld:React.FC<VehicleWorldProps>=({frame,variant='opaque',revealProgress=0,travelMeters})=>{
  const distance=travelMeters??frame*(variant==='hero'?.33:.23);
  return <group name="A1_VEHICLE_WORLD">
    <RoadEnvironment travelMeters={distance}/>
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
