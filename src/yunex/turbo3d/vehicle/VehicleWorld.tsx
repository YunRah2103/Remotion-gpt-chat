import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';

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
function loft(sections:ReadonlyArray<readonly [number,number,number,number]>):THREE.BufferGeometry {
  const vertices:number[]=[]; const indices:number[]=[];
  for(const [z,halfW,low,high] of sections){
    vertices.push(-halfW,low,z, halfW,low,z, halfW,high,z, -halfW,high,z);
  }
  for(let s=0;s<sections.length-1;s++){
    for(let j=0;j<4;j++){
      const a=4*s+j,b=4*s+(j+1)%4,c=a+4,d=b+4;
      indices.push(a,b,c,b,d,c);
    }
  }
  indices.push(0,2,1,0,3,2);
  const n=4*(sections.length-1);
  indices.push(n,n+1,n+2,n,n+2,n+3);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}
const BODY_SECTIONS:ReadonlyArray<readonly [number,number,number,number]>=[
  [-2.30,.66,.48,.63],[-2.09,.83,.41,.77],[-1.58,.97,.43,.85],
  [-.75,.955,.42,.80],[.25,.94,.41,.83],[1.29,.96,.40,.76],
  [1.98,.79,.44,.64],[2.30,.62,.48,.59]
];
const ROOF_SECTIONS:ReadonlyArray<readonly [number,number,number,number]>=[
  [-1.38,.72,.80,.82],[-.91,.63,.82,1.17],[-.60,.58,.82,1.25],
  [.23,.56,.82,1.24],[.46,.59,.82,1.17],[1.09,.78,.76,.78]
];
const SideStripe:React.FC<{side:number}>=({side})=><group>
  <mesh position={[side*.923,.51,.09]} rotation={[0,0,side*.12]} castShadow>
    <boxGeometry args={[.031,.072,2.2]}/><meshStandardMaterial name="SIDE_METAL_EDGE" color={C.edge} metalness={.83} roughness={.25}/>
  </mesh>
  <mesh position={[side*.967,.67,-.65]} rotation={[0,side*.08,0]} castShadow>
    <boxGeometry args={[.044,.17,.65]}/><meshStandardMaterial name="SIDE_AIR_INTAKE" color="#061119" roughness={.48} metalness={.35}/>
  </mesh>
  <mesh position={[side*.992,.665,-.37]}>
    <boxGeometry args={[.020,.135,.026]}/><meshStandardMaterial color="#AACDD0" metalness={.88} roughness={.29}/>
  </mesh>
</group>;

const Wheel:React.FC<{side:number;z:number;travelMeters:number}>=({side,z,travelMeters})=>{
  const spin=-travelMeters/VEHICLE_SPEC.wheelRadius;
  return <group name={z>0?'FRONT_WHEEL':'REAR_WHEEL'} position={[side*VEHICLE_SPEC.wheelX,VEHICLE_SPEC.wheelCenterY,z]}>
    <group name="STATIONARY_BRAKE_CALIPER">
      <mesh position={[side*.085,.155,.085]}><boxGeometry args={[.046,.135,.13]}/>
        <meshStandardMaterial name="BRAKE_CALIPER_SILVER" color="#A5BCBC" metalness={.78} roughness={.26}/></mesh>
    </group>
    <group name="WHEEL_PIVOT_X" rotation={[spin,0,0]}>
      <mesh rotation={[0,0,Pi/2]} castShadow>
        <cylinderGeometry args={[.315,.315,.24,36,1]}/>
        <meshStandardMaterial name="RUBBER_SIDEWALL" color={C.tyre} roughness={.9}/>
      </mesh>
      <mesh rotation={[0,Pi/2,0]} castShadow>
        <torusGeometry args={[.282,.073,12,42]}/>
        <meshStandardMaterial name="TYRE_TREAD" color="#090C10" roughness={.96}/>
      </mesh>
      {Array.from({length:18},(_,i)=><mesh key={'t'+i} position={[side*.115,Math.cos(i*Pi/9)*.31,Math.sin(i*Pi/9)*.31]} rotation={[i*Pi/9,0,0]}>
        <boxGeometry args={[.012,.055,.087]}/><meshStandardMaterial color="#25282B" roughness={.89}/>
      </mesh>)}
      <mesh rotation={[0,Pi/2,0]} position={[side*.128,0,0]}>
        <torusGeometry args={[.238,.027,12,32]}/>
        <meshStandardMaterial name="RIM_OUTER_LIP" color="#74888F" metalness={.93} roughness={.19}/>
      </mesh>
      <mesh rotation={[0,0,Pi/2]} position={[side*.136,0,0]}>
        <cylinderGeometry args={[.235,.235,.027,32]}/>
        <meshStandardMaterial name="RIM_GRAPHITE" color={C.rim} metalness={.82} roughness={.3}/>
      </mesh>
      {Array.from({length:10},(_,i)=>{
        const a=Pi*2*i/10;
        return <group key={i} rotation={[a,0,0]}>
          <mesh position={[side*.164,.137,0]} castShadow rotation={[.0,0,side*-.05]}>
            <boxGeometry args={[.027,.211,.037]}/>
            <meshStandardMaterial name="RIM_MACHINED_SPOKE" color={i%2?'#758C91':'#93A9AC'} metalness={.91} roughness={.25}/>
          </mesh>
          <mesh position={[side*.180,.220,0]}><boxGeometry args={[.022,.030,.068]}/>
            <meshStandardMaterial color="#2B3941" metalness={.7} roughness={.32}/></mesh>
        </group>;
      })}
      <mesh rotation={[0,0,Pi/2]} position={[side*.196,0,0]}>
        <cylinderGeometry args={[.074,.074,.048,24]}/>
        <meshStandardMaterial name="UNBRANDED_WHEEL_HUB" color="#B4CACC" metalness={.95} roughness={.21}/>
      </mesh>
    </group>
  </group>;
};

export const VehicleModel:React.FC<{frame:number;variant?:VehicleVariant;revealProgress?:number;travelMeters?:number}>=
({frame,variant='opaque',revealProgress=0,travelMeters=0})=>{
  const chassis=useMemo(()=>loft(BODY_SECTIONS),[]);
  const canopy=useMemo(()=>loft(ROOF_SECTIONS),[]);
  const r=clamp(revealProgress);
  const panelOpen=variant==='reveal'?r:0;
  const hero=variant==='hero';
  const float=Math.sin(frame*.065)*.007;
  return <group name="ORIGINAL_YUNEX_COUPE" position={[0,float,0]}>
    <group name="CAR_BODY">
      <mesh geometry={chassis} castShadow receiveShadow>
        <meshPhysicalMaterial name="BODY_TEAL_ENAMEL" color={C.paint} metalness={.67} roughness={.24} clearcoat={.85} clearcoatRoughness={.17}/>
      </mesh>
      <mesh geometry={canopy} castShadow>
        <meshPhysicalMaterial name="DARK_TINTED_GLASS" color={C.glass} roughness={.10} metalness={.54} transparent opacity={.9} clearcoat={1}/>
      </mesh>
      <mesh position={[0,1.247,-.16]}><boxGeometry args={[1.07,.016,.73]}/>
        <meshStandardMaterial name="ROOFLINE_TEAL" color="#245D63" metalness={.8} roughness={.25}/></mesh>
      {[-1,1].map(s=><group key={s}>
        <SideStripe side={s}/>
        <mesh position={[s*.76,.79,1.82]} rotation={[0,s*-.19,0]} castShadow>
          <boxGeometry args={[.42,.075,.36]}/>
          <meshStandardMaterial name="HEADLAMP_WHITE" color="#EBFEFF" emissive={C.head} emissiveIntensity={hero?2.8:1.4} roughness={.15}/>
        </mesh>
        <mesh position={[s*.765,.817,1.82]}>
          <boxGeometry args={[.44,.025,.37]}/><meshStandardMaterial color="#071823" roughness={.25}/>
        </mesh>
        <mesh position={[s*.72,.775,-2.28]}>
          <boxGeometry args={[.52,.068,.042]}/><meshStandardMaterial name="REAR_LED_CRIMSON" emissive={C.tail} emissiveIntensity={3.5} color={C.tail}/>
        </mesh>
        <mesh position={[s*.71,.92,-2.05]} rotation={[0,0,s*.1]}>
          <boxGeometry args={[.23,.038,.26]}/><meshStandardMaterial color="#0D1C22" roughness={.3} metalness={.4}/>
        </mesh>
        <mesh position={[s*.76,.68,1.07]} rotation={[0,s*.22,0]}>
          <boxGeometry args={[.12,.035,.24]}/><meshStandardMaterial name="SIDE_MIRROR_DARK" color="#0B171E" metalness={.52} roughness={.38}/>
        </mesh>
        <mesh position={[s*.75,.44,1.95]} rotation={[0,s*-.17,0]}>
          <boxGeometry args={[.39,.14,.40]}/><meshStandardMaterial name="FRONT_BUMPER_INTAKE" color="#07161E" metalness={.26} roughness={.55}/>
        </mesh>
        <mesh position={[s*.79,.53,-2.21]}>
          <boxGeometry args={[.37,.09,.09]}/><meshStandardMaterial color="#071116" metalness={.45} roughness={.33}/>
        </mesh>
      </group>)}
      <mesh position={[0,.51,2.293]}><boxGeometry args={[.91,.12,.05]}/><meshStandardMaterial color="#08161C" metalness={.28} roughness={.56}/></mesh>
      <mesh position={[0,.50,-2.288]}><boxGeometry args={[1.07,.12,.05]}/><meshStandardMaterial name="REAR_DIFFUSER" color="#0A151C" metalness={.32} roughness={.53}/></mesh>
      {[-.38,0,.38].map(x=><mesh key={x} position={[x,.43,-2.33]}>
        <boxGeometry args={[.09,.17,.13]}/><meshStandardMaterial color="#2B3940" metalness={.47}/></mesh>)}
      <group name="ENGINE_ACCESS_DECK" position={[0,.85,-1.43]} rotation={[panelOpen*-.45,0,0]}>
        <mesh position={[0,.016,0]} castShadow>
          <boxGeometry args={[1.53,.055,.88]}/><meshPhysicalMaterial name="ENGINE_COVER" color={C.paint} metalness={.61} roughness={.28} clearcoat={.78}/>
        </mesh>
        {[-.48,-.24,0,.24,.48].map(x=><mesh key={x} position={[x,.052,-.13]}>
          <boxGeometry args={[.06,.008,.54]}/><meshStandardMaterial name="ENGINE_DECK_VENT" color="#0A1C24" roughness={.48}/></mesh>)}
      </group>
      <mesh name="ENGINE_BAY" position={[0,.78,-1.45]}>
        <boxGeometry args={[1.37,.12,.73]}/><meshStandardMaterial color="#182630" metalness={.51} roughness={.45}/></mesh>
      <mesh name="EXHAUST_MANIFOLD_ZONE" visible={variant==='reveal' && panelOpen>.25} position={[0,.84,-1.75]}>
        <boxGeometry args={[.72,.19,.21]}/><meshStandardMaterial color="#A47355" metalness={.7} roughness={.39}/></mesh>
      <mesh position={[0,.96,-2.04]}><boxGeometry args={[1.61,.065,.37]}/>
        <meshStandardMaterial name="AERO_REAR_SPOILER" color="#17242B" metalness={.73} roughness={.28}/></mesh>
      <mesh position={[0,.43,2.30]}><boxGeometry args={[1.58,.04,.29]}/>
        <meshStandardMaterial name="FRONT_SPLITTER" color="#10151B" metalness={.49} roughness={.44}/></mesh>
      {[-1,1].flatMap(s=>[1.47,-1.48].map(z=><Wheel key={s+'_'+z} side={s} z={z} travelMeters={travelMeters}/>))}
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
