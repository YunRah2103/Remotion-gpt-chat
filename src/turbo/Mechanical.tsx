import React, {useMemo} from 'react';
import * as THREE from 'three';
import {PremiumCar} from './PremiumCar';

// Original turbocharger mechanics remain independent from the CC0 car exterior.
const blue = '#5cddff';
const amber = '#ffb25f';
const steel = '#bcc8c7';
const M:React.FC<{color:string;emissive?:string;roughness?:number;metalness?:number;opacity?:number}>=({color,emissive,roughness=.32,metalness=.72,opacity=1})=><meshPhysicalMaterial color={color} emissive={emissive} emissiveIntensity={emissive?1.3:0} metalness={metalness} roughness={roughness} clearcoat={.65} transparent={opacity<1} opacity={opacity} side={THREE.DoubleSide}/>;

export const RoadWorld:React.FC<{frame:number;hero?:boolean}>=({frame,hero=false})=>{
 const scroll=frame*(hero?.63:.43);
 return <group>
  <color attach="background" args={['#09141d']}/>
  <fog attach="fog" args={['#09141d',17,89]}/>
  <hemisphereLight args={['#d6edf4','#213b42',3.1]}/>
  <ambientLight intensity={.32}/>
  <directionalLight position={[-8,13,-6]} intensity={4.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={15} shadow-camera-bottom={-15}/>
  <spotLight color="#78d9e5" position={[4,9,12]} intensity={65} angle={.65} penumbra={.65}/><spotLight color="#eef5ff" position={[-5,8,2]} intensity={45} angle={.68} penumbra={.65}/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-.045,0]}><planeGeometry args={[180,180]}/><meshStandardMaterial color="#101b20" roughness={.9}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-.034,0]}><planeGeometry args={[7.4,180]}/><meshStandardMaterial color="#263238" metalness={.08} roughness={.9}/></mesh>
  {[-3.59,3.59].map(x=><mesh key={x} position={[x,-.006,0]}><boxGeometry args={[.082,.014,180]}/><meshStandardMaterial color="#a7b9b9"/></mesh>)}
  {Array.from({length:26},(_,i)=>{
   const z=((i*6.6+scroll+77)%171)-88;
   return <group key={i}>
    <mesh position={[0,-.004,z]}><boxGeometry args={[.10,.017,2.3]}/><meshStandardMaterial color="#ced7cf" roughness={.85}/></mesh>
    {[-1,1].map(s=><group key={s}>
      <mesh position={[s*4.3,.27,z]}><boxGeometry args={[.18,.38,2.9]}/><M color="#536a70" roughness={.52}/></mesh>
      <mesh position={[s*4.3,.58,z]}><boxGeometry args={[.12,.1,4.2]}/><M color="#97c1c7" roughness={.4}/></mesh>
      <mesh position={[s*6.7,1.5,z]}><coneGeometry args={[1.6,3.5,7]}/><meshStandardMaterial color={i%3?'#172f31':'#254044'} roughness={1}/></mesh>
      <mesh position={[s*6.7,.45,z]}><cylinderGeometry args={[.13,.15,1,8]}/><M color="#162622" roughness={1}/></mesh>
    </group>)}
   </group>;
  })}
  {Array.from({length:14},(_,i)=><mesh key={i} position={[i%2?15:-15,2.7,(i*16+scroll*.43)%230-130]} castShadow><dodecahedronGeometry args={[3.7+(i%3),1]}/><meshStandardMaterial color="#152930" roughness={1}/></mesh>)}
  <PremiumCar frame={frame} hero={hero}/>
 </group>;
};

const linePoints=(coords:number[][])=>new THREE.CatmullRomCurve3(coords.map(p=>new THREE.Vector3(p[0],p[1],p[2])),false,'catmullrom',.5);
const gasPath=[[-4.1,-1.1,0],[-3.1,-.5,0],[-2.45,.58,0],[-1.7,1,0],[-1.33,.7,0]];
const intakePath=[[4.9,0,0],[3.65,0,0],[2.42,0,0],[1.17,0,0]];
const hotPath=[[1.12,.78,0],[1.8,1.55,0],[2.65,1.42,0],[3.55,.55,0]];
const coldPath=[[3.55,-.49,0],[4.13,-1.05,0],[5.2,-1.25,0]];
const Tube:React.FC<{points:number[][];color:string;radius?:number;opacity?:number}>=({points,color,radius=.15,opacity=1})=>{
 const curve=useMemo(()=>linePoints(points),[points]);
 return <mesh castShadow><tubeGeometry args={[curve,55,radius,12,false]}/><M color={color} roughness={.29} opacity={opacity}/></mesh>;
};
const Flow:React.FC<{points:number[][];frame:number;color:string;speed?:number;count?:number;radius?:number}>=({points,frame,color,speed=1,count=12,radius=.065})=>{
 const curve=useMemo(()=>linePoints(points),[points]);
 return <group>{Array.from({length:count},(_,i)=>{
  const t=((i/count + frame*speed/80)%1+1)%1;
  const p=curve.getPointAt(t);
  return <mesh key={i} position={p.toArray() as [number,number,number]}><sphereGeometry args={[radius,9,7]}/><meshBasicMaterial color={color} transparent opacity={.35+.6*Math.sin(Math.PI*t)} toneMapped={false}/></mesh>;
 })}</group>;
};
const Rotor:React.FC<{x:number;frame:number;compressor:boolean}>=({x,frame,compressor})=>{
 const color=compressor?'#b1dfe8':'#cda17b';
 return <group position={[x,0,0]} rotation={[frame*.34,0,0]}>
  <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.2,.25,.21,22]}/><M color={steel} roughness={.16}/></mesh>
  {Array.from({length:12},(_,i)=>{
   const a=i*Math.PI/6, r=.45;
   return <group key={i} rotation={[a,0,0]}>
     <mesh position={[0,r,0]} rotation={[compressor?.30:-.30,0,.2]} castShadow>
      <boxGeometry args={[.095,.47,.14]}/><M color={color} roughness={.2}/>
     </mesh>
     <mesh position={[0,.68,0]}><boxGeometry args={[.11,.06,.10]}/><M color={steel} roughness={.2}/></mesh>
   </group>;
  })}
 </group>;
};
const Housing:React.FC<{x:number;compressor:boolean;transparent:boolean}>=({x,compressor,transparent})=>{
 const c=compressor?'#698f9d':'#916c57';
 return <group position={[x,0,0]}>
  <mesh rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[.81,.27,18,80]}/><M color={c} roughness={.44} opacity={transparent?.22:.93}/></mesh>
  <mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.72,.035,9,78]}/><M color="#c6d1ce" roughness={.19}/></mesh>
  {Array.from({length:12},(_,i)=>{let a=i*Math.PI/6;return <mesh key={i} rotation={[a,0,0]} position={[0,Math.cos(a)*.92,Math.sin(a)*.92]}><boxGeometry args={[.18,.11,.13]}/><M color="#808e8b" roughness={.28}/></mesh>;})}
 </group>;
};
const Intercooler:React.FC=()=> <group position={[3.55,0,0]}>
 <mesh><boxGeometry args={[.65,1.45,1.5]}/><M color="#263d47" roughness={.38}/></mesh>
 {Array.from({length:13},(_,i)=><mesh key={i} position={[.344,(i-6)*.096,0]}><boxGeometry args={[.028,.045,1.44]}/><M color={i%2?'#8fa9af':'#b8cdd0'} roughness={.34}/></mesh>)}
 {[-.72,.72].map(z=><mesh key={z} position={[0,0,z]}><boxGeometry args={[.74,1.5,.065]}/><M color="#65808a"/></mesh>)}
 </group>;
const EngineHint:React.FC=()=> <group position={[-1.9,-1.7,-1.85]}>
  <mesh castShadow><boxGeometry args={[2.6,1.8,1.7]}/><M color="#46545a" roughness={.57} opacity={.63}/></mesh>
  {Array.from({length:6},(_,i)=><mesh key={i} position={[(i%3-1)*.7,.75,(i<3?-.38:.38)]}><cylinderGeometry args={[.26,.26,.26,16]}/><M color="#8b9693" roughness={.4}/></mesh>)}
  <mesh position={[0,-.4,1]}><boxGeometry args={[1.7,.33,.25]}/><M color="#54656e"/></mesh>
 </group>;

export const TurboWorld:React.FC<{frame:number;stage:number}>=({frame,stage})=>{
 const transparent=stage!==1;
 return <group>
  <color attach="background" args={['#0a141d']}/><fog attach="fog" args={['#0a141d',17,49]}/>
  <ambientLight intensity={.55}/><hemisphereLight args={['#e2f5fc','#142c39',2.4]}/>
  <directionalLight position={[0,7,5]} intensity={3.7} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
  <spotLight position={[-5,2,5]} color={amber} intensity={35} angle={.52}/>
  <spotLight position={[5,1,6]} color={blue} intensity={42} angle={.6}/>
  <mesh position={[0,-2.45,-.75]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[70,70]}/><meshStandardMaterial color="#101c23" roughness={.6} metalness={.15}/></mesh>
  {Array.from({length:10},(_,i)=><mesh key={i} position={[(i-5)*2,0,-8]}><boxGeometry args={[.028,9,.07]}/><meshBasicMaterial color="#30505c" transparent opacity={.4}/></mesh>)}
  <EngineHint/>
  <mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.13,.13,3.15,24]}/><M color="#d9e5df" roughness={.18}/></mesh>
  <Rotor frame={frame} x={-1.13} compressor={false}/><Rotor frame={frame} x={1.13} compressor/>
  <Housing x={-1.13} compressor={false} transparent={transparent}/>
  <Housing x={1.13} compressor transparent={transparent}/>
  <Tube points={gasPath} color="#654f49" radius={.20}/>
  <Tube points={intakePath} color="#344d60" radius={.22} opacity={stage===1?.26:.83}/>
  <Tube points={hotPath} color="#546f7b" radius={.18} opacity={stage===1?.2:1}/>
  <Intercooler/>
  <Tube points={coldPath} color="#416777" radius={.19}/>
  {stage===1||stage===2?<Flow points={gasPath} frame={frame} color={amber} count={19} speed={1.1} radius={.085}/>:null}
  {stage>=2?<Flow points={intakePath} frame={frame} color="#5bdcfe" count={22} speed={1.08} radius={.074}/>:null}
  {stage===3?<><Flow points={hotPath} frame={frame} color="#ffb16a" count={13} speed={1} radius={.065}/><Flow points={coldPath} frame={frame} color="#67d5fa" count={15} speed={.87} radius={.065}/></>:null}
  <mesh position={[-1.35,-1.59,0]}><cylinderGeometry args={[.20,.27,.56,14]}/><M color="#b1b8b9" roughness={.3}/></mesh>
  <mesh position={[1.25,-1.55,0]}><cylinderGeometry args={[.20,.27,.56,14]}/><M color="#b1b8b9" roughness={.3}/></mesh>
 </group>;
};
