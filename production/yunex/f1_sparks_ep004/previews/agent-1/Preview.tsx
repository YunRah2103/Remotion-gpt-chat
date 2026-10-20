import React, {useEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import * as T from 'three';
import {createEnvironment,disposeObject} from '../../../../../src/yunex/world-kit/index.ts';
import {F1HeroVehicle,UnderfloorReveal} from '../../mechanics/index.ts';
import {sampleAgent1Fixture} from './fixture.ts';

function CameraFollow({position,yaw,tSec,technical}:{
 position:readonly[number,number,number],yaw:number,tSec:number,technical:boolean
}) {
 const {camera}=useThree();
 const sweep=Math.max(0,Math.min(1,tSec/5.7));
 const ox=technical?1.15-2.25*sweep:-10.8;
 const oy=technical?.035:3.25;
 const oz=technical?1.95+.08*Math.cos(tSec*.55):9.0;
 const localToWorld=(dx:number,dz:number)=>{
   return [Math.cos(yaw)*dx+Math.sin(yaw)*dz,-Math.sin(yaw)*dx+Math.cos(yaw)*dz] as const;
 };
 const [xx,zz]=localToWorld(ox,oz);
 const [tx,tz]=localToWorld(technical?1.18-2.16*sweep:0,0);
 const camPosition=new T.Vector3(position[0]+xx,position[1]+oy,position[2]+zz);
 const lookTarget=new T.Vector3(position[0]+tx,position[1]+(technical?.095:.55),position[2]+tz);
 // Camera property setting during frame evaluation is deterministic and seek safe.
 if(camera instanceof T.PerspectiveCamera){camera.fov=technical?48:47;camera.updateProjectionMatrix();}
 camera.position.copy(camPosition);camera.lookAt(lookTarget);
 return null;
}
const TechnicalStage:React.FC<{position:readonly[number,number,number];yaw:number}>=({position,yaw})=>{
 const matte=useMemo(()=>new T.MeshStandardMaterial({color:'#1e2832',metalness:.16,roughness:.82}),[]);
 return <group position={[position[0],-.25,position[2]]} rotation={[0,yaw,0]}>
  <mesh material={matte} rotation={[-Math.PI/2,0,0]} receiveShadow>
    <planeGeometry args={[24,13]}/>
  </mesh>
  {[-1,1].map(z=><mesh key={z} position={[0,.005,z*1.65]}>
   <boxGeometry args={[24,.012,.05]}/>
   <meshStandardMaterial color="#2d8e91" emissive="#0e555d" emissiveIntensity={.24}/>
  </mesh>)}
 </group>;
};
const RacingWorld:React.FC=()=>{
 const env=useMemo(()=>createEnvironment({kind:'track',timeOfDay:'night',seed:12}),[]);
 useEffect(()=>()=>disposeObject(env),[env]);
 return <primitive object={env}/>;
};

export const MechanicsPreview:React.FC<{mode:'technical'|'context'}>=({mode})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),tSec=frame/fps;
 const motion=sampleAgent1Fixture(tSec);
 const technical=mode==='technical';
 const fade=technical?Math.min(1,Math.max(0,(tSec-.35)/1.35)):0;
 return <AbsoluteFill style={{backgroundColor:'#071320'}}>
  <ThreeCanvas width={1080} height={1920}
    camera={{fov:technical?48:47,near:.02,far:500,position:[0,1.8,6]}}
    gl={{antialias:true,preserveDrawingBuffer:true}}>
   <color attach="background" args={[technical?'#0d1720':'#0b1421']}/>
   <fog attach="fog" args={['#0b1421',technical?22:90,technical?90:220]}/>
   <ambientLight color="#aecde2" intensity={.92}/>
   <hemisphereLight args={['#d9efff','#15282d',1.10]}/>
   <directionalLight position={[motion.worldPosition[0]+6,10,motion.worldPosition[2]+1]}
     color="#cce6ff" intensity={3.2} castShadow/>
   <pointLight position={[motion.worldPosition[0]-3,4,motion.worldPosition[2]+4]}
     color="#42d6cb" intensity={50} distance={14}/>
   <pointLight position={[motion.worldPosition[0]+3,5,motion.worldPosition[2]-5]}
     color="#ffc08c" intensity={50} distance={14}/>
   {technical?<TechnicalStage position={motion.worldPosition} yaw={motion.yawRad}/>:<RacingWorld/>}
   {technical?
     <UnderfloorReveal motion={motion} reveal01={fade}/>:
     <F1HeroVehicle motion={motion}/>}
   <CameraFollow position={motion.worldPosition} yaw={motion.yawRad}
     tSec={tSec} technical={technical}/>
  </ThreeCanvas>
  <div style={{
    position:'absolute',left:64,right:64,bottom:135,fontFamily:'Arial, sans-serif',
    fontSize:24,letterSpacing:3,color:'#d6ebeb',textTransform:'uppercase',
    textShadow:'0 1px 8px #000',
  }}>{technical?'ENGINEERED UNDERFLOOR • METAL SKIDS':'FORMULA-INSPIRED / ILLUSTRATIVE 62 M/S PREVIEW'}</div>
 </AbsoluteFill>;
};
