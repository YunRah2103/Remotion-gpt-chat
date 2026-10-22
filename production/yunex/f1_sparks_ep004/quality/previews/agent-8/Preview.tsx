import React,{useEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import * as T from 'three';
import {sampleDynamics} from '../../../physics/dynamics.ts';
import type {VehicleMotionState} from '../../../shared/contract.ts';
import {QualityF1Vehicle} from '../../vehicle/QualityF1Vehicle.tsx';
import {NightCircuitWorld} from '../../../look/NightCircuitWorld.tsx';

type Mode='technical'|'cinematic';
const colors={sky:'#070e18',warm:'#ffbf7b',teal:'#5ed9db'};
const smooth=(v:number)=>{const x=Math.min(1,Math.max(0,v));return x*x*(3-2*x);};

/** A genuine vehicle chase: positions are measured from the same A2 world route,
 * not a spinning showroom camera or a second independent car path.
 */
function CameraTrack({motion,tSec,mode}:{motion:VehicleMotionState;tSec:number;mode:Mode}){
  const {camera}=useThree();
  const pose=(x:number,y:number,z:number)=>{
    const a=motion.yawRad,c=Math.cos(a),s=Math.sin(a);
    return new T.Vector3(motion.worldPosition[0]+c*x+s*z,
      motion.worldPosition[1]+y,motion.worldPosition[2]-s*x+c*z);
  };
  if(mode==='technical'){
    const travel=smooth(tSec/6),offset=1.55-travel*2.95;
    camera.position.copy(pose(offset,-.63,2.75+.26*Math.sin(tSec*.9)));
    camera.lookAt(pose(.20-travel*.63,.105,0));
    if(camera instanceof T.PerspectiveCamera){camera.fov=52;camera.near=.025;camera.updateProjectionMatrix();}
  }else{
    // Three purposeful MOVING 3D racing shots over 8 seconds:
    // close frontal 3/4  -> clear tracking side profile -> low rear pursuit.
    const a=tSec<2.6;
    const b=tSec>=2.6&&tSec<5.1;
    const angle=a?[8.3,1.75,4.9]:b?[-.8,1.55,5.1]:[-7.6,1.24,-3.1];
    const sw=Math.sin(tSec*(a?.8:b?.48:.72));
    camera.position.copy(pose(angle[0]+sw*.33,angle[1]+.16*Math.sin(tSec*.42),angle[2]));
    camera.lookAt(pose(a?.7:b?0:-.6,.53,0));
    if(camera instanceof T.PerspectiveCamera){camera.fov=a?34:b?35:36;camera.near=.05;camera.updateProjectionMatrix();}
  }
  return null;
}
function TechBackdrop({motion}:{motion:VehicleMotionState}){
  const floor=useMemo(()=>new T.MeshStandardMaterial({color:'#14222b',metalness:.15,roughness:.79}),[]);
  return <group position={[motion.worldPosition[0],motion.worldPosition[1]-2.7,motion.worldPosition[2]]} rotation={[0,motion.yawRad,0]}>
    <mesh rotation={[-Math.PI/2,0,0]} material={floor} receiveShadow>
      <planeGeometry args={[18,10]}/>
    </mesh>
    {[-1,1].map(s=><mesh key={s} position={[0,.015,s*2.2]}>
      <boxGeometry args={[17,.012,.035]}/>
      <meshStandardMaterial color="#345862" emissive="#0e6973" emissiveIntensity={.2}/>
    </mesh>)}
  </group>;
}
export const QualityAgent8Preview:React.FC<{mode:Mode}>=({mode})=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),tSec=frame/fps;
  const technical=mode==='technical';
  const motion=sampleDynamics(tSec,{speedMps:technical?34:62,aeroLoad01:1});
  const fade=technical?smooth((tSec-.5)/1.2):0;
  const tag=technical?'PHYSICAL METAL SKID  /  COMPOSITE PLANK  /  CARBON FLOOR':
    tSec<2.6?'FORMULA // FULL-AERO HERO':tSec<5.1?'WHEELS  /  SUSPENSION  /  FLOOR':'NIGHT-CIRCUIT  /  ROLLING HERO';
  return <AbsoluteFill style={{background:colors.sky}}>
    <ThreeCanvas width={1080} height={1920}
      camera={{position:[0,2,9],fov:45,near:.025,far:900}}
      gl={{antialias:true,preserveDrawingBuffer:true}}>
      <color attach="background" args={[colors.sky]}/>
      <ambientLight color="#98b8d6" intensity={technical?1.1:.7}/>
      <hemisphereLight args={['#cfe8f2','#12212d',technical?1.3:.78]}/>
      <directionalLight position={[motion.worldPosition[0]+8,16,motion.worldPosition[2]+1]}
        color="#d9e8ff" intensity={technical?3.4:2.1} castShadow/>
      <pointLight position={[motion.worldPosition[0]-3,motion.worldPosition[1]+4,motion.worldPosition[2]+4]}
        color={colors.teal} intensity={technical?38:25} distance={18}/>
      <pointLight position={[motion.worldPosition[0]+3,motion.worldPosition[1]+5,motion.worldPosition[2]-3]}
        color={colors.warm} intensity={technical?28:20} distance={17}/>
      {technical?<TechBackdrop motion={motion}/>:<NightCircuitWorld motion={motion} particles={[]}/>}
      <QualityF1Vehicle motion={motion} reveal01={fade} driver={false}/>
      <CameraTrack motion={motion} mode={mode} tSec={tSec}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:88,left:70,color:'#f0f7f6',fontFamily:'Arial,sans-serif',
      fontSize:31,fontWeight:800,letterSpacing:5,textShadow:'0px 3px 12px #000c'}}>YUNEX / EP004</div>
    <div style={{position:'absolute',left:70,right:70,bottom:130,color:'#e4eeef',
      fontFamily:'Arial,sans-serif',fontSize:23,fontWeight:700,letterSpacing:2.1,
      textShadow:'0px 2px 10px #000d'}}>{tag}</div>
    <div style={{position:'absolute',right:70,top:133,color:'#9ebbc3',
      fontFamily:'Arial,sans-serif',fontSize:16,letterSpacing:2}}>V2 KIT // A2 ROUTE // PHYSICAL CONTACT</div>
  </AbsoluteFill>;
};
