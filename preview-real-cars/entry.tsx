import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, Composition, registerRoot, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader, useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {Box3, Vector3} from 'three';

const CARS=[
 {filename:'mclaren-p1.glb',name:'MCLAREN P1',creator:'vecarz'},
 {filename:'porsche-911-gt3.glb',name:'PORSCHE 911 GT3',creator:'ChevroletSS'},
 {filename:'lamborghini-aventador.glb',name:'LAMBORGHINI AVENTADOR',creator:'BlackCube'},
] as const;
const FRAMES_PER_CAR=84;

function AimCamera(){
 const {camera}=useThree();
 useLayoutEffect(()=>{camera.position.set(7.5,4.2,12.5);camera.lookAt(0,0.95,0);camera.updateProjectionMatrix()},[camera]);
 return null;
}
function ImportedVehicle({filename}:{filename:string}){
 const frame=useCurrentFrame();
 const {scene:source}=useLoader(GLTFLoader,staticFile('real-github/'+filename),(loader)=>loader.setMeshoptDecoder(MeshoptDecoder));
 const {scene,offset,scale}=useMemo(()=>{
   const scene=source.clone(true);scene.updateMatrixWorld(true);
   scene.traverse(obj=>{if((obj as any).isMesh){(obj as any).castShadow=true;(obj as any).receiveShadow=true;}});
   const box=new Box3().setFromObject(scene);const dims=box.getSize(new Vector3());const center=box.getCenter(new Vector3());
   if(dims.length()===0)throw Error('Empty GitHub vehicle: '+filename);
   const scale=4.6/Math.max(dims.x,dims.y,dims.z);
   return {scene,scale,offset:new Vector3(-center.x*scale,-box.min.y*scale,-center.z*scale)};
 },[source,filename]);
 const angle=-0.46 + frame/FRAMES_PER_CAR*Math.PI*1.55;
 return <group rotation={[0,angle,0]}><group position={offset.toArray()} scale={scale}><primitive object={scene}/></group></group>;
}
function CarShot({index}:{index:number}){
 const {width,height}=useVideoConfig();const car=CARS[index];
 return <AbsoluteFill style={{background:'radial-gradient(circle at 50% 55%,#283442 0%,#11171d 60%,#090d11 100%)',color:'#f4f7f9',fontFamily:'Arial, Helvetica, sans-serif'}}>
    <ThreeCanvas width={width} height={height} camera={{fov:35,near:.01,far:150}} shadows>
       <color attach="background" args={['#141b22']}/>
       <AimCamera/>
       <hemisphereLight args={['#e0edff','#18212c',2.4]}/>
       <ambientLight intensity={0.45}/>
       <directionalLight castShadow position={[-6,10,8]} intensity={3} shadow-mapSize={[1024,1024]}/>
       <directionalLight position={[5,5,-7]} intensity={2.5} color="#a9cbeb"/>
       <directionalLight position={[8,2,5]} intensity={1.1} color="#fce2bb"/>
       <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.055,0]}>
          <planeGeometry args={[50,50]}/><meshStandardMaterial color="#26313a" roughness={0.45} metalness={0.17}/>
       </mesh>
       <ImportedVehicle filename={car.filename}/>
     </ThreeCanvas>
     <div style={{position:'absolute',left:44,right:44,top:83,borderLeft:'5px solid #68d7c2',paddingLeft:20}}>
       <div style={{fontSize:18,fontWeight:700,letterSpacing:4,color:'#9ec4c7'}}>ORIGINAL GITHUB 3D MODEL</div>
       <div style={{fontSize:43,fontWeight:800,marginTop:11,letterSpacing:.5,lineHeight:1.06}}>{car.name}</div>
       <div style={{fontSize:18,marginTop:12,color:'#c5d1d7'}}>Imported GLB geometry inspection</div>
     </div>
     <div style={{position:'absolute',bottom:95,left:44,right:44,borderTop:'1px solid #82909677',paddingTop:15,fontSize:16,color:'#c5d4df',display:'flex',justifyContent:'space-between'}}>
       <span>Original author: {car.creator} · CC BY</span><span>{index+1} / 3</span>
     </div>
     <div style={{position:'absolute',bottom:57,left:44,fontSize:12,color:'#849ba8'}}>Source: pedrosoandre/carros · Models sourced from Sketchfab</div>
  </AbsoluteFill>;
}
const Reel:React.FC=()=> <AbsoluteFill>{CARS.map((_,i)=><Sequence key={i} from={i*FRAMES_PER_CAR} durationInFrames={FRAMES_PER_CAR}><CarShot index={i}/></Sequence>)}</AbsoluteFill>;
const Root:React.FC=()=> <Composition id="RealGitHubCars" component={Reel} width={720} height={1280} fps={24} durationInFrames={FRAMES_PER_CAR*CARS.length}/>;
registerRoot(Root);
