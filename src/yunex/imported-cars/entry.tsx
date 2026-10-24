/** Smoke scene: prove the real imported car mesh renders, not just its checksum. */
import React,{useLayoutEffect,useMemo} from 'react';
import {Composition,registerRoot,AbsoluteFill,useVideoConfig,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {ImportedCar} from './index';
/** Neutral softbox reflections expose authored paint, glazing and wheel detail. */
const StudioEnvironment=()=>{
 const {gl,scene}=useThree();
 const environment=useMemo(()=>{
  const room=new RoomEnvironment();
  const generator=new T.PMREMGenerator(gl);
  const target=generator.fromScene(room,.04);
  room.dispose();generator.dispose();return target;
 },[gl]);
 useLayoutEffect(()=>{
  const previous=scene.environment;const intensity=scene.environmentIntensity;
  scene.environment=environment.texture;scene.environmentIntensity=.35;
  return ()=>{scene.environment=previous;scene.environmentIntensity=intensity;};
 },[scene,environment]);
 useLayoutEffect(()=>()=>environment.dispose(),[environment]);
 return null;
};
const Aim=()=>{const {camera,gl}=useThree();const frame=useCurrentFrame();const {durationInFrames}=useVideoConfig();
 useLayoutEffect(()=>{
  const angle=-.59+frame/Math.max(1,durationInFrames-1)*1.18;
  camera.position.set(Math.sin(angle)*12.6,2.6,Math.cos(angle)*12.6);camera.lookAt(0,.85,0);
  if(camera instanceof T.PerspectiveCamera){camera.fov=46;camera.updateProjectionMatrix();}
  gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1;
 },[camera,gl,frame,durationInFrames]);return null;};
const Preview:React.FC<{carId:string}>=({carId})=>{
 const {width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:'#10181c'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov:46,near:.05,far:300}}>
   <color attach="background" args={['#10181c']}/>
   <fog attach="fog" args={['#10181c',20,65]}/>
   <StudioEnvironment/>
   <hemisphereLight args={['#e6f0ff','#293b45',.6]}/>
   <directionalLight color="#f5eddf" intensity={2.6} position={[-5,8,6]} castShadow
     shadow-mapSize={[2048,2048]} shadow-camera-left={-9} shadow-camera-right={9}
     shadow-camera-top={9} shadow-camera-bottom={-9}/>
   <directionalLight color="#8bd9ed" intensity={.8} position={[5,5,-6]}/>
   <mesh position={[0,0,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
    <planeGeometry args={[200,200]}/>
    <meshStandardMaterial color="#28353c" metalness={.05} roughness={.72}/>
   </mesh>
   <ImportedCar id={carId}/>
   <Aim/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
registerRoot(()=> <Composition id="YunexImportedCarPreview" component={Preview}
 defaultProps={{carId:'ferrari-f40'}} width={1080} height={1920} fps={30} durationInFrames={120}/>);
