import React, {useLayoutEffect} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const mint='#92ffd8';
const ease=(f:number,a:number,b:number)=>Math.max(0,Math.min(1,(f-a)/(b-a)));
const lerp=(f:number,frames:number[],values:number[])=>interpolate(f,frames,values,{extrapolateLeft:'clamp',extrapolateRight:'clamp'});

const CameraDrive:React.FC<{frame:number}>=({frame})=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    const x=lerp(frame,[0,65,130,179],[5.2,3.6,-3.8,-4.9]);
    const y=lerp(frame,[0,65,130,179],[2.35,1.78,2.4,2.75]);
    const z=lerp(frame,[0,65,130,179],[8.0,6.7,7.2,8.6]);
    camera.position.set(x,y,z);
    camera.lookAt(0,0.65,0);
    camera.updateProjectionMatrix();
  },[camera,frame]);
  return null;
};

const Wheel:React.FC<{x:number;z:number;frame:number}>=({x,z,frame})=>
  <group position={[x,0.37,z]} rotation={[frame*0.18,0,0]}>
    <mesh castShadow rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[0.395,0.395,0.22,32]}/>
      <meshStandardMaterial color="#080b0e" roughness={0.86}/>
    </mesh>
    <mesh rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[0.27,0.27,0.232,12]}/>
      <meshStandardMaterial color="#b9d3cd" metalness={0.9} roughness={0.25}/>
    </mesh>
    {Array.from({length:5},(_,i)=>
      <mesh key={i} rotation={[i*Math.PI*2/5,0,0]} position={[x>0?0.12:-0.12,0,0]}>
        <boxGeometry args={[0.012,0.47,0.068]}/>
        <meshStandardMaterial color="#1a2629" metalness={0.9} roughness={0.23}/>
      </mesh>
    )}
  </group>;

const Car:React.FC<{frame:number}>=({frame})=>{
 const settle=0.014*Math.sin(frame/8);
 return <group rotation={[settle,lerp(frame,[0,179],[0.04,-0.08]),0]}>
   <mesh castShadow position={[0,0.54,0]}>
     <boxGeometry args={[2.12,0.41,4.38]}/>
     <meshPhysicalMaterial color="#dce9e6" metalness={0.8} roughness={0.19} clearcoat={1} clearcoatRoughness={0.1}/>
   </mesh>
   <mesh castShadow position={[0,0.74,-0.69]} rotation={[0.13,0,0]}>
     <boxGeometry args={[1.92,0.22,1.71]}/>
     <meshPhysicalMaterial color="#e2eee9" metalness={0.82} roughness={0.15}/>
   </mesh>
   <mesh castShadow position={[0,1.02,0.25]}>
     <boxGeometry args={[1.48,0.53,1.71]}/>
     <meshPhysicalMaterial color="#aecbc6" metalness={0.58} roughness={0.13} clearcoat={1}/>
   </mesh>
   <mesh position={[0,1.08,-0.625]} rotation={[0.18,0,0]}>
     <boxGeometry args={[1.39,0.37,0.055]}/>
     <meshPhysicalMaterial color="#09151a" metalness={0.25} roughness={0.08} transparent opacity={0.94}/>
   </mesh>
   <mesh position={[0,1.08,1.125]} rotation={[-0.18,0,0]}>
     <boxGeometry args={[1.38,0.33,0.055]}/>
     <meshPhysicalMaterial color="#09151a" metalness={0.25} roughness={0.08} transparent opacity={0.9}/>
   </mesh>
   <mesh castShadow position={[0,0.45,-2.09]}>
     <boxGeometry args={[1.92,0.24,0.24]}/>
     <meshStandardMaterial color="#0e151a" metalness={0.3} roughness={0.4}/>
   </mesh>
   <mesh castShadow position={[0,0.45,2.09]}>
     <boxGeometry args={[1.98,0.22,0.25]}/>
     <meshStandardMaterial color="#0d151b" metalness={0.3} roughness={0.38}/>
   </mesh>
   <mesh position={[-0.72,0.68,-2.2]}>
     <boxGeometry args={[0.48,0.07,0.055]}/>
     <meshStandardMaterial color="#c4ffdc" emissive="#72ffd1" emissiveIntensity={4} toneMapped={false}/>
   </mesh>
   <mesh position={[0.72,0.68,-2.2]}>
     <boxGeometry args={[0.48,0.07,0.055]}/>
     <meshStandardMaterial color="#c4ffdc" emissive="#72ffd1" emissiveIntensity={4} toneMapped={false}/>
   </mesh>
   <mesh position={[0,0.75,2.22]}>
     <boxGeometry args={[1.68,0.05,0.038]}/>
     <meshStandardMaterial color="#ff697b" emissive="#ff274c" emissiveIntensity={3} toneMapped={false}/>
   </mesh>
   <mesh castShadow position={[0,1.21,1.91]}>
     <boxGeometry args={[2.18,0.065,0.54]}/>
     <meshStandardMaterial color="#172226" metalness={0.5} roughness={0.22}/>
   </mesh>
   {[-1.06,1.06].flatMap(x=>[-1.46,1.46].map(z=><Wheel key={x+'-'+z} x={x} z={z} frame={frame}/>))}
   <mesh position={[-1.064,0.72,0]}><boxGeometry args={[0.023,0.09,2.08]}/><meshStandardMaterial color="#8af8d7" emissive="#226c54" emissiveIntensity={0.45}/></mesh>
   <mesh position={[1.064,0.72,0]}><boxGeometry args={[0.023,0.09,2.08]}/><meshStandardMaterial color="#8af8d7" emissive="#226c54" emissiveIntensity={0.45}/></mesh>
 </group>;
};
const World:React.FC<{frame:number}>=({frame})=>{
 return <group>
   <color attach="background" args={['#04090e']}/>
   <fog attach="fog" args={['#04090e',17,80]}/>
   <ambientLight intensity={0.76}/>
   <hemisphereLight args={['#f4ffed','#173029',2]}/>
   <directionalLight position={[4,11,5]} intensity={3.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
   <pointLight position={[-3,3,-5]} intensity={110} distance={16} color="#56ffc6"/>
   <pointLight position={[3,2,4]} intensity={70} distance={10} color="#a8caff"/>
   <CameraDrive frame={frame}/>
   <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-0.03,-16]}>
     <planeGeometry args={[180,180]}/>
     <meshStandardMaterial color="#050c10" roughness={0.9}/>
   </mesh>
   <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,0,-16]}>
     <planeGeometry args={[6.6,180]}/>
     <meshStandardMaterial color="#101a1d" metalness={0.18} roughness={0.82}/>
   </mesh>
   {Array.from({length:22},(_,i)=>{
      const z=((i*5+frame*0.44)%100)-50;
      return <group key={i}>
         <mesh position={[0,0.014,z]}><boxGeometry args={[0.07,0.024,2.0]}/><meshStandardMaterial color="#9dd7c9" emissive="#2f816a" emissiveIntensity={0.4}/></mesh>
         <mesh position={[-3.18,0.09,z]}><boxGeometry args={[0.12,0.16,0.69]}/><meshStandardMaterial color="#a7ffe1" emissive="#60c9a1" emissiveIntensity={1.2}/></mesh>
         <mesh position={[3.18,0.09,z]}><boxGeometry args={[0.12,0.16,0.69]}/><meshStandardMaterial color="#a7ffe1" emissive="#60c9a1" emissiveIntensity={1.2}/></mesh>
         {[-1,1].map(side=><mesh key={side} position={[side*5.2,1.2,z]}>
          <boxGeometry args={[0.1,2.4,0.13]}/>
          <meshStandardMaterial color="#1b403a" emissive="#2a7d65" emissiveIntensity={0.45}/>
         </mesh>)}
      </group>;
    })}
   {Array.from({length:7},(_,i)=><mesh key={i} position={[-7-i%2*1.2,1.8+(i%3),-i*11-3]} castShadow>
     <boxGeometry args={[2,3+(i%3)*1.4,4.4]}/>
     <meshStandardMaterial color="#101e23" metalness={0.3} roughness={0.8}/>
   </mesh>)}
   {Array.from({length:7},(_,i)=><mesh key={i} position={[7+i%2*1.2,1.6+(i%3),-i*10-7]} castShadow>
     <boxGeometry args={[2,3.0+(i%3),3.7]}/>
     <meshStandardMaterial color="#132029" metalness={0.3} roughness={0.8}/>
   </mesh>)}
   <Car frame={frame}/>
 </group>
};
export const GpuDriveFilm:React.FC=()=>{
 const frame=useCurrentFrame();const {width,height}=useVideoConfig();
 const fadeIn=ease(frame,0,12),fadeOut=1-ease(frame,164,179);
 return <AbsoluteFill style={{background:'#03080b',overflow:'hidden',opacity:Math.min(fadeIn,fadeOut)}}>
   <ThreeCanvas width={width} height={height} shadows camera={{position:[5.2,2.35,8],fov:37,near:0.1,far:130}} gl={{antialias:true,preserveDrawingBuffer:true}}>
     <World frame={frame}/>
   </ThreeCanvas>
   <div style={{position:'absolute',top:74,left:72,fontFamily:'Arial,sans-serif',color:mint,letterSpacing:7,fontSize:24,fontWeight:800}}>GPU / DRIVE / 001</div>
   <div style={{position:'absolute',top:122,right:72,fontFamily:'Arial,sans-serif',color:'#c7dfd6',letterSpacing:3,fontSize:19}}>REAL 3D • REAL DEPTH</div>
   <div style={{position:'absolute',bottom:264,left:72,right:72,fontFamily:'Arial Black,Arial,sans-serif',fontSize:lerp(frame,[0,60,120,179],[118,124,122,126]),letterSpacing:-6,fontWeight:900,lineHeight:0.95,textShadow:'0 7px 23px #000'}}>
       {frame<62?'NO FLAT':frame<123?'OWN THE':'EVERY'}
       <div style={{color:mint}}>{frame<62?'FRAMES.':frame<123?'MOTION.':'ANGLE.'}</div>
   </div>
   <div style={{position:'absolute',bottom:92,left:72,right:72,borderTop:'1px solid #b0ffe37a',paddingTop:22,color:'#d3e7e0',fontFamily:'Arial,sans-serif',fontSize:18,letterSpacing:5,display:'flex',justifyContent:'space-between'}}>
     <span>REMOTION × THREE.JS</span><span>180 FRAMES</span>
   </div>
 </AbsoluteFill>;
};