import React,{useMemo,useEffect} from 'react';
import * as T from 'three';
import {asphaltMaps} from './environments.ts';
/** Native geometry and lighting assets shared by kit previews and future agents. */
export const CinematicStage:React.FC<{distance:number;track?:boolean;wetness?:number}>=({distance,track=true,wetness=.35})=>{
 const maps=useMemo(()=>asphaltMaps(),[]);useEffect(()=>()=>{maps.map.dispose();maps.roughnessMap.dispose();},[maps]);
 return <>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-distance%5, -.018,0]} receiveShadow><planeGeometry args={[240,240]}/><meshStandardMaterial map={maps.map} roughnessMap={maps.roughnessMap} roughness={.85-wetness*.45} metalness={.08} envMapIntensity={.9}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]}><planeGeometry args={[5.7,2.8]}/><shaderMaterial transparent depthWrite={false} uniforms={{}} vertexShader="varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader="varying vec2 v;void main(){float r=length((v-.5)*2.);float a=(1.-smoothstep(.18,1.,r))*.48;gl_FragColor=vec4(0.,.005,.012,a);}"/></mesh>
  {track&&<group position={[-distance%8,0,0]}>{Array.from({length:22},(_,i)=><group key={i} position={[(i-11)*8,0,0]}>
   <mesh position={[0,-.008,-2.7]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3,.10]}/><meshStandardMaterial color="#c7d3d5" roughness={.55}/></mesh>
   {[-1,1].map(side=><group key={side}>
    <mesh position={[0,.32,side*5.4]} castShadow><boxGeometry args={[7.95,.24,.12]}/><meshStandardMaterial color="#71828b" roughness={.38} metalness={.7}/></mesh>
    {[0,4].map(offset=><group key={offset} position={[offset,0,side*5.4]}><mesh position={[0,.16,0]}><boxGeometry args={[.08,.32,.10]}/><meshStandardMaterial color="#53616a" roughness={.5} metalness={.6}/></mesh></group>)}
    {Array.from({length:8},(_,j)=><mesh key={j} position={[j-4,.018,side*4.5]} receiveShadow><boxGeometry args={[.99,.06,.48]}/><meshStandardMaterial color={j%2?'#a23832':'#c4ceca'} roughness={.7}/></mesh>)}
    {i%3===0&&<group position={[0,0,side*7]}><mesh position={[0,3,0]}><cylinderGeometry args={[.045,.075,6,8]}/><meshStandardMaterial color="#44525b" metalness={.5}/></mesh><mesh position={[0,6,-side*.55]}><boxGeometry args={[.5,.05,1.3]}/><meshStandardMaterial color="#d3efff" emissive="#9ccde9" emissiveIntensity={2}/></mesh></group>}
   </group>)}
  </group>)}</group>}
 </>;
};
