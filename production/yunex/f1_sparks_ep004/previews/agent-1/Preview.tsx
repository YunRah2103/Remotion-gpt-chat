import React, {useEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import * as T from 'three';
import {createEnvironment,disposeObject} from '../../../../../src/yunex/world-kit/index.ts';
import {F1HeroVehicle,UnderfloorReveal} from '../../mechanics/index.ts';
import {sampleAgent1Fixture} from './fixture.ts';

/**
 * Three intentionally different moving camera setups in portrait, all bound
 * to the exact same absolute world motion state. No second vehicle/route.
 */
export function getAgent1CameraShot(tSec:number,technical:boolean) {
 if(technical){
   const u=Math.max(0,Math.min(1,tSec/5.85));
   const s=u*u*(3-2*u);
   return {
     local:[1.13-2.19*s,-1.05,2.30+.13*Math.sin(u*Math.PI)] as const,
     look:[1.14-2.15*s,.10,0] as const,
     fov:49,
     label:'UNDERSIDE / METALLIC CONTACT POINTS',
   };
 }
 if(tSec<2.6)return {
   local:[8.10+.18*tSec,1.55,7.25] as const,
   look:[.65,.47,0] as const,
   fov:44,label:'01 / FRONT AERODYNAMICS',
 };
 if(tSec<5.4)return {
   local:[-.85,1.54,10.5-.14*(tSec-2.6)] as const,
   look:[-.05,.48,0] as const,
   fov:43,label:'02 / RIDE HEIGHT & WHEEL MOTION',
 };
 return {
   local:[-8.55,2.02,6.7-.18*(tSec-5.4)] as const,
   look:[-.60,.56,0] as const,
   fov:46,label:'03 / REAR WING & DIFFUSER',
 };
}
function CameraFollow({position,yaw,tSec,technical}:{
 position:readonly[number,number,number];yaw:number;tSec:number;technical:boolean
}) {
 const {camera}=useThree();
 const shot=getAgent1CameraShot(tSec,technical);
 const rotate=(x:number,z:number)=>{
   return [Math.cos(yaw)*x+Math.sin(yaw)*z,
      -Math.sin(yaw)*x+Math.cos(yaw)*z] as const;
 };
 const [cx,cz]=rotate(shot.local[0],shot.local[2]);
 const [tx,tz]=rotate(shot.look[0],shot.look[2]);
 camera.position.set(position[0]+cx,position[1]+shot.local[1],position[2]+cz);
 if(camera instanceof T.PerspectiveCamera){
   if(camera.fov!==shot.fov){camera.fov=shot.fov;camera.updateProjectionMatrix();}
 }
 camera.lookAt(position[0]+tx,position[1]+shot.look[1],position[2]+tz);
 return null;
}
const TechnicalStage:React.FC<{position:readonly[number,number,number];yaw:number}>=({position,yaw})=>{
 const matte=useMemo(()=>new T.MeshStandardMaterial({
   color:'#0b1e28',metalness:.12,roughness:.93,
 }),[]);
 return <group position={[position[0],-2.12,position[2]]} rotation={[0,yaw,0]}>
  <mesh material={matte} rotation={[-Math.PI/2,0,0]} receiveShadow>
   <planeGeometry args={[26,20]}/>
  </mesh>
  {[-1,1].map(z=><mesh key={z} position={[0,.014,z*1.60]}>
   <boxGeometry args={[24,.012,.018]}/>
   <meshStandardMaterial color="#2f8f8e" emissive="#0d7575" emissiveIntensity={.35}/>
  </mesh>)}
 </group>;
};
const RacingWorld:React.FC=()=>{
 const env=useMemo(()=>createEnvironment({kind:'track',timeOfDay:'night',seed:12}),[]);
 useEffect(()=>()=>disposeObject(env),[env]);
 return <primitive object={env}/>;
};

const TitleOverlay:React.FC<{technical:boolean;tSec:number}>=({technical,tSec})=>{
 const shot=getAgent1CameraShot(tSec,technical);
 return <div style={{
    position:'absolute',inset:0,pointerEvents:'none',color:'#eef9fa',
    fontFamily:'Arial, Helvetica, sans-serif',
  }}>
   {/* Filmic contrast holds artwork together without tinting geometry materials. */}
   <div style={{position:'absolute',inset:0,background:
     'linear-gradient(180deg, rgba(1,9,18,.80) 0%, rgba(1,9,18,.34) 23%, transparent 42%, transparent 67%, rgba(1,9,18,.60) 100%)'}}/>
   <div style={{position:'absolute',top:125,left:82,right:82,
     display:'flex',justifyContent:'space-between',alignItems:'center'}}>
     <span style={{fontSize:23,letterSpacing:5.5,fontWeight:700,color:'#58f4dc'}}>YUNEX</span>
     <span style={{fontSize:18,letterSpacing:3.5,color:'#b6cdd4'}}>EPISODE 004</span>
   </div>
   <div style={{position:'absolute',top:190,left:82,right:80}}>
     <div style={{width:112,height:4,background:'#eab871',marginBottom:28}}/>
     <div style={{fontSize:technical?73:70,fontWeight:800,letterSpacing:-2.6,
       lineHeight:1.04,maxWidth:830,textTransform:'uppercase',
       textShadow:'0 3px 20px rgba(0,0,0,.40)'}}>
       {technical?'BENEATH THE BODY':'BUILT FOR SPEED'}
     </div>
     <div style={{marginTop:22,fontSize:21,fontWeight:500,letterSpacing:3.3,
       color:'#d0e9ed',textTransform:'uppercase'}}>
       {technical?'THREE PARTS. ONE SOURCE OF SPARKS.':'THE SAME RACE CAR / THREE MOVING ANGLES'}
     </div>
   </div>
   <div style={{position:'absolute',bottom:195,left:82,right:82}}>
     <div style={{height:1,background:'rgba(224,243,242,.42)',marginBottom:27}}/>
     <div style={{fontWeight:800,fontSize:31,letterSpacing:1.5,
       textTransform:'uppercase',textShadow:'0 2px 14px rgba(0,0,0,.6)'}}>
       {technical?'THE TITANIUM SKID / NOT THE PLANK':shot.label}
     </div>
     <div style={{fontSize:19,letterSpacing:1.5,lineHeight:1.5,color:'#c6d7db',
       marginTop:10,maxWidth:840,textTransform:'uppercase'}}>
       {technical?
         'Separate metal inserts • nonmetal composite plank • carbon underfloor':
         'Illustrative 62 m/s tracking preview • unbranded F1-inspired design'}
     </div>
   </div>
 </div>;
};

export const MechanicsPreview:React.FC<{mode:'technical'|'context'}>=({mode})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),tSec=frame/fps;
 const motion=sampleAgent1Fixture(tSec);
 const technical=mode==='technical';
 const fade=technical?Math.min(.95,Math.max(0,(tSec-.20)/1.15)):0;
 return <AbsoluteFill style={{backgroundColor:'#071320'}}>
  <ThreeCanvas width={1080} height={1920}
    camera={{fov:technical?49:44,near:.02,far:500,position:[0,1.8,6]}}
    gl={{antialias:true,preserveDrawingBuffer:true}}>
   <color attach="background" args={[technical?'#061521':'#0b1624']}/>
   <fog attach="fog" args={['#0b1825',technical?23:80,technical?95:225]}/>
   <hemisphereLight args={['#d4f1ff','#09131b',technical?1.45:1.25]}/>
   <ambientLight color="#99b7d5" intensity={technical?.70:.61}/>
   <directionalLight
     position={[motion.worldPosition[0]+8,12,motion.worldPosition[2]+7]}
     intensity={4.8} color="#d8e9ff" castShadow/>
   <pointLight position={[motion.worldPosition[0]-4,4,motion.worldPosition[2]+3]}
     intensity={65} color="#23ffde" distance={15}/>
   <pointLight position={[motion.worldPosition[0]+3,5,motion.worldPosition[2]-4]}
     intensity={78} color="#ffc28a" distance={17}/>
   <pointLight position={[motion.worldPosition[0]-1.5,3,motion.worldPosition[2]-4.5]}
     intensity={42} color="#8ac8ff" distance={13}/>
   {technical&&<>
    <pointLight position={[motion.worldPosition[0]+.2,motion.worldPosition[1]-.58,motion.worldPosition[2]+1.4]}
      color="#ffddb0" intensity={48} distance={6}/>
    <pointLight position={[motion.worldPosition[0]-1,motion.worldPosition[1]-.45,motion.worldPosition[2]-.9]}
      color="#69ffff" intensity={26} distance={5}/>
   </>}
   {technical?<TechnicalStage position={motion.worldPosition} yaw={motion.yawRad}/>:<RacingWorld/>}
   {technical?
     <UnderfloorReveal motion={motion} reveal01={fade}/>:
     <F1HeroVehicle motion={motion}/>}
   <CameraFollow position={motion.worldPosition} yaw={motion.yawRad}
     tSec={tSec} technical={technical}/>
  </ThreeCanvas>
  <TitleOverlay technical={technical} tSec={tSec}/>
 </AbsoluteFill>;
};
