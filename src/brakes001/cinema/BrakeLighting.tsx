import React from 'react';
import {thermalLightAt,brakeShotAt,type BrakeShotId} from './cameraMath';
export type BrakeLightingProps={
  frame:number;shotId?:BrakeShotId;heat01?:number;
  background?:boolean;ground?:boolean;
};
/** Dark navy cinematic fill, warm key, blue rim and B-driven optional amber accent. */
export const BrakeLighting:React.FC<BrakeLightingProps>=({
 frame,shotId,heat01=0,background=true,ground=false
})=>{
 const contextual=(shotId??brakeShotAt(frame))==='context';
 const warm=thermalLightAt(frame,heat01);
 return <>
  {background&&<color attach="background" args={['#080f19']}/>}
  <hemisphereLight args={['#b2c6d6','#16202a',contextual?.55:.78]}/>
  <ambientLight intensity={contextual?.12:.23}/>
  <directionalLight position={[1.7,2.6,2.0]} intensity={contextual?1.9:3.55} color="#fff2d9" castShadow shadow-mapSize={[1024,1024]}/>
  <directionalLight position={[-1.7,.65,-2.1]} intensity={contextual?.9:2.1} color="#84bfda"/>
  <spotLight position={[.45,1.35,-1.25]} color="#cdefff" intensity={contextual?3.4:5.6} angle={.87} penumbra={.83} decay={2}/>
  <pointLight position={[.55,-.18,.4]} color="#f1a15b" intensity={warm*2.2} distance={2.4} decay={2}/>
  {ground&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.48,0]} receiveShadow>
   <planeGeometry args={[10,10]}/>
   <meshStandardMaterial color="#111b26" roughness={.86} metalness={.15}/>
  </mesh>}
 </>;
};
