import React, {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {PremiumCar} from './PremiumCar';

// Original turbocharger mechanics remain independent from the CC0 car exterior.
const blue = '#5cddff';
const amber = '#ffb25f';
const steel = '#bcc8c7';
const M:React.FC<{color:string;emissive?:string;roughness?:number;metalness?:number;opacity?:number}>=({color,emissive,roughness=.32,metalness=.72,opacity=1})=><meshPhysicalMaterial color={color} emissive={emissive} emissiveIntensity={emissive?1.3:0} metalness={metalness} roughness={roughness} clearcoat={.65} transparent={opacity<1} opacity={opacity} side={THREE.DoubleSide}/>;

/**
 * Studio-style original reflection map, generated from pixels locally.
 * No external HDRI, paid files, or YUNEX dependencies.
 * Reflective car paint needs environment energy as well as direct light.
 */
const RoadReflections:React.FC=()=>{
 const texture=useMemo(()=>{
   const w=512,h=256;
   const pixels=new Uint8Array(w*h*4);
   for(let y=0;y<h;y++){
     const lat=y/(h-1);
     for(let x=0;x<w;x++){
       const lon=x/(w-1);
       const above=lat<.51;
       const horizon=Math.max(0,1-Math.abs(lat-.49)*2.3);
       let r=above?148+Math.round(72*horizon):24+Math.round(47*horizon);
       let g=above?180+Math.round(56*horizon):38+Math.round(51*horizon);
       let b=above?210+Math.round(36*horizon):52+Math.round(55*horizon);
       // Large architectural softboxes reflected in body panels.
       const boxA=(lon>.08&&lon<.23&&lat>.23&&lat<.57);
       const boxB=(lon>.54&&lon<.77&&lat>.16&&lat<.44);
       const strip=(lon>.32&&lon<.51&&lat>.43&&lat<.46);
       if(boxA||boxB||strip){r=247;g=248;b=247;}
       const idx=(y*w+x)*4;
       pixels[idx]=r;pixels[idx+1]=g;pixels[idx+2]=b;pixels[idx+3]=255;
     }
   }
   const t=new THREE.DataTexture(pixels,w,h,THREE.RGBAFormat);
   t.colorSpace=THREE.SRGBColorSpace;
   t.mapping=THREE.EquirectangularReflectionMapping;
   t.needsUpdate=true;
   return t;
 },[]);
 // Declarative attachment occurs before the actual WebGL draw in every
 // independently rendered Remotion frame. useEffect() was too late and caused
 // alternating dark/bright bodywork in adjacent moving video frames.
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <primitive attach="environment" object={texture}/>;
};
export const RoadWorld:React.FC<{frame:number;hero?:boolean}>=({frame,hero=false})=>{
 const scroll=frame*(hero?.63:.43);
 const asphalt=useMemo(()=>{
   const w=128,h=128,bytes=new Uint8Array(w*h*4);
   let seed=0x2d081a9;
   for(let i=0;i<w*h;i++){
     seed=(1664525*seed+1013904223)>>>0;
     const noise=((seed>>>24)&255)/255;
     const c=37+Math.round(noise*24);
     bytes[i*4]=c;bytes[i*4+1]=c+3;bytes[i*4+2]=c+5;bytes[i*4+3]=255;
   }
   const tex=new THREE.DataTexture(bytes,w,h,THREE.RGBAFormat);
   tex.colorSpace=THREE.SRGBColorSpace;
   tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
   tex.repeat.set(3,45);
   tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
   tex.needsUpdate=true;
   return tex;
 },[]);
 useEffect(()=>()=>asphalt.dispose(),[asphalt]);
 return <group>
  <RoadReflections/>
  <color attach="background" args={['#0c1820']}/>
  <fog attach="fog" args={['#0c1820',20,110]}/>
  <hemisphereLight args={['#e0f0f9','#1d3137',3.2]}/>
  <ambientLight intensity={.93}/>
  <directionalLight position={[-8,13,-6]} intensity={4.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={17} shadow-camera-bottom={-17}/>
  <spotLight color="#85e4f8" position={[5,10,12]} intensity={58} angle={.65} penumbra={.75}/>
  <spotLight color="#f4f9ff" position={[-5,8,-5]} intensity={94} angle={.78} penumbra={.75}/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-.046,0]}>
    <planeGeometry args={[180,180]}/>
    <meshStandardMaterial color="#15252b" roughness={1}/>
  </mesh>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-.033,0]}>
    <planeGeometry args={[7.6,180]}/>
    <meshStandardMaterial map={asphalt} roughness={.92} metalness={.06}/>
  </mesh>
  {[-3.61,3.61].map(x=><mesh key={x} position={[x,-.007,0]}>
   <boxGeometry args={[.105,.015,180]}/><meshStandardMaterial color="#b5c7c9" roughness={.73}/>
  </mesh>)}
  {Array.from({length:26},(_,i)=>{
   const z=((i*6.6+scroll+77)%171)-88;
   return <group key={i}>
    <mesh position={[0,-.003,z]}><boxGeometry args={[.10,.018,2.55]}/><meshStandardMaterial color="#c6d1d0" roughness={.85}/></mesh>
    {[-1,1].map(side=><group key={side}>
      {/* Layered highway barrier with continuous-length rails and support uprights */}
      <mesh position={[side*4.34,.36,z]} castShadow><boxGeometry args={[.13,.095,6.55]}/><M color="#788c95" roughness={.43}/></mesh>
      <mesh position={[side*4.34,.70,z]} castShadow><boxGeometry args={[.11,.10,6.55]}/><M color="#9bb3ba" roughness={.34}/></mesh>
      <mesh position={[side*4.34,.33,z]}><boxGeometry args={[.16,.66,.13]}/><M color="#5b747d" roughness={.47}/></mesh>
      {/* Low modern sound wall, rather than oversized polygonal cones */}
      <mesh position={[side*12.7,1.13,z]}><boxGeometry args={[.20,2.26,6.42]}/><meshStandardMaterial color={i%4===0?'#1e323c':'#20343d'} metalness={.24} roughness={.64}/></mesh>
      <mesh position={[side*12.62,1.75,z]}><boxGeometry args={[.05,.044,6.5]}/><M color="#70868f" roughness={.49}/></mesh>
      {i%5===0?<group>
        <mesh position={[side*9.3,3.6,z]} castShadow><cylinderGeometry args={[.055,.08,7.2,8]}/><M color="#627982" roughness={.41}/></mesh>
        <mesh position={[side*8.5,7.05,z]}><boxGeometry args={[1.85,.09,.22]}/><M color="#859ca6" roughness={.29}/></mesh>
        <mesh position={[side*7.7,6.96,z]}><boxGeometry args={[.42,.04,.32]}/><meshStandardMaterial color="#e6e8dc" emissive="#a3d5ea" emissiveIntensity={2.5}/></mesh>
      </group>:null}
    </group>)}
   </group>;
  })}
  {Array.from({length:12},(_,i)=>{
    const side=i%2?1:-1,z=((i*21+scroll*.27)%240)-128;
    const width=5+(i%3)*1.6,height=6+(i%4)*1.8;
    return <group key={i} position={[side*(23+i%3*4),0,z]}>
      <mesh position={[0,height/2,0]} castShadow><boxGeometry args={[width,height,10+(i%3)*2]}/><meshStandardMaterial color={i%2?'#162a33':'#1a303a'} roughness={.83} metalness={.1}/></mesh>
      {Array.from({length:4},(_,k)=><mesh key={k} position={[-side*width*.501,1.4+k*1.5,0]}><boxGeometry args={[.03,.10,7.8]}/><meshStandardMaterial color="#63808d" emissive="#315364" emissiveIntensity={.45}/></mesh>)}
    </group>;
  })}
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
