import React,{useMemo,useEffect} from 'react';
import * as T from 'three';
import {createInspectionScenery} from './scenery.ts';
import {disposeObject} from '../world-kit/geometry.ts';
import {asphaltMaps} from './environments.ts';
/** Native geometry and lighting assets shared by kit previews and future agents. */
export const CinematicStage:React.FC<{distance:number;track?:boolean;wetness?:number}>=({distance,track=true,wetness=.35})=>{
 const scenery=useMemo(()=>createInspectionScenery({farSideOnly:true}),[]);useEffect(()=>()=>disposeObject(scenery),[scenery]);
 const maps=useMemo(()=>asphaltMaps(),[]);useEffect(()=>()=>{maps.map.dispose();maps.roughnessMap.dispose();},[maps]);
 return <>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-distance%5, -.018,0]} receiveShadow><planeGeometry args={[240,240]}/><meshStandardMaterial map={maps.map} roughnessMap={maps.roughnessMap} roughness={.85-wetness*.45} metalness={.08} envMapIntensity={.9}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]}><planeGeometry args={[5.7,2.8]}/><shaderMaterial transparent depthWrite={false} uniforms={{}} vertexShader="varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader="varying vec2 v;void main(){float r=length((v-.5)*2.);float a=(1.-smoothstep(.18,1.,r))*.48;gl_FragColor=vec4(0.,.005,.012,a);}"/></mesh>
  {track&&<group position={[-distance%8,0,0]}><primitive object={scenery}/></group>}
 </>;
};
