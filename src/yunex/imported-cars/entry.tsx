/** Smoke scene: prove the real imported car mesh renders, not just its checksum. */
import React,{useLayoutEffect} from 'react';
import {Composition,registerRoot,AbsoluteFill,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {ImportedCar} from './index';
const Aim=()=>{const {camera,gl}=useThree();useLayoutEffect(()=>{
 camera.position.set(-6.0,2.3,9);camera.lookAt(0,.9,0);
 if(camera instanceof T.PerspectiveCamera){camera.fov=46;camera.updateProjectionMatrix();}
 gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.15;
},[camera,gl]);return null;};
const Preview:React.FC<{carId:string}>=({carId})=>{
 const {width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:'#10181c'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov:46,near:.05,far:80}}>
   <color attach="background" args={['#10181c']}/>
   <hemisphereLight args={['#e6f0ff','#293b45',1.5]}/>
   <directionalLight color="#f5eddf" intensity={3.2} position={[-5,8,6]} castShadow
     shadow-mapSize={[2048,2048]} shadow-camera-left={-9} shadow-camera-right={9}
     shadow-camera-top={9} shadow-camera-bottom={-9}/>
   <directionalLight color="#8bd9ed" intensity={1.8} position={[5,5,-6]}/>
   <mesh position={[0,-.035,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
    <planeGeometry args={[35,35]}/>
    <meshStandardMaterial color="#28353c" metalness={.45} roughness={.32}/>
   </mesh>
   <ImportedCar id={carId}/>
   <Aim/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
registerRoot(()=> <Composition id="YunexImportedCarPreview" component={Preview}
 defaultProps={{carId:'ferrari-f40'}} width={1080} height={1920} fps={30} durationInFrames={30}/>);
