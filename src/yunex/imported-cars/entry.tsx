/** Native 6-second moving model inspection, not a finished driving film. */
import React,{useLayoutEffect} from 'react';
import {Composition,registerRoot,AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {ImportedCar} from './index';

const Orbit=()=>{
 const frame=useCurrentFrame();
 const {camera,gl}=useThree();
 useLayoutEffect(()=>{
  // Six-second deterministic low-three-quarter orbit for checking shape/glass.
  const theta=-.73+1.53*(frame/179);
  camera.position.set(Math.sin(theta)*12.7,2.55+Math.sin(frame/179*Math.PI)*.22,Math.cos(theta)*12.7);
  camera.lookAt(0,.84,0);
  if(camera instanceof T.PerspectiveCamera){
   camera.fov=43;
   camera.updateProjectionMatrix();
  }
  gl.toneMapping=T.ACESFilmicToneMapping;
  gl.toneMappingExposure=1.04;
 },[camera,gl,frame]);
 return null;
};
type PreviewProps={carId:string;privateReview:boolean;lengthMeters:number};
const Preview:React.FC<PreviewProps>=({carId,privateReview,lengthMeters})=>{
 const {width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:'#101820'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov:43,near:.05,far:80}}>
   <color attach="background" args={['#101820']}/>
   <fog attach="fog" args={['#101820',20,48]}/>
   <hemisphereLight args={['#e6f0ff','#233037',1.25]}/>
   <directionalLight color="#fff0e6" intensity={3.0} position={[-5,9,7]} castShadow
     shadow-mapSize={[2048,2048]} shadow-camera-left={-11} shadow-camera-right={11}
     shadow-camera-top={11} shadow-camera-bottom={-11}/>
   <directionalLight color="#9dd8f4" intensity={1.7} position={[6,5,-7]}/>
   <directionalLight color="#ffe8bb" intensity={.7} position={[-7,3,-5]}/>
   <mesh position={[0,-.035,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
    <planeGeometry args={[65,65]}/>
    <meshStandardMaterial color="#293640" metalness={.3} roughness={.3}/>
   </mesh>
   <ImportedCar id={carId} privateReview={privateReview} lengthMeters={lengthMeters}/>
   <Orbit/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
registerRoot(()=> <Composition id="YunexImportedCarPreview" component={Preview}
 defaultProps={{carId:'ferrari-f40',privateReview:false,lengthMeters:4.7}}
 width={1080} height={1920} fps={30} durationInFrames={180}/>);
