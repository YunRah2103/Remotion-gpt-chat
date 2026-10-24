/**
 * YUNEX / ROSSO AFTER DARK — Black Snow's original Ferrari F40 GLB.
 * The only car geometry in this film is the imported attributed asset.
 * 180 deterministic frames, 1080x1920 / 30fps. No Porsche assets.
 */
import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill,Composition,registerRoot,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader,useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';

const FPS=30, FRAMES=180;
type V3=[number,number,number];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const x=clamp(n);return x*x*(3-2*x)};
const shots:{start:V3;end:V3;look:V3;fov:number}[]=[
  // 0-2s: headlights, nose, dramatic low front-three-quarter tracking.
  {start:[-3.45,1.04,6.35],end:[-3.05,1.00,5.95],look:[-.48,.69,0],fov:43},
  // 2-4s: genuine wheels, side-intake and recognisable F40 side profile.
  {start:[-.9,1.03,7.9],end:[.85,1.02,7.4],look:[0,.68,0],fov:45},
  // 4-6s: big wing, broad rear stance and luminous architectural reveal.
  {start:[3.65,1.22,6.5],end:[3.35,1.00,5.9],look:[.55,.80,0],fov:43}
];
function CameraRig(){
  const frame=useCurrentFrame(),{camera}=useThree();
  const shotIndex=Math.min(2,Math.floor(frame/60));
  const shot=shots[shotIndex];
  const u=ease((frame-shotIndex*60)/59);
  useLayoutEffect(()=>{
    const p=shot.start.map((n,i)=>n+(shot.end[i]-n)*u) as V3;
    camera.position.set(...p);
    camera.lookAt(...shot.look);
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=shot.fov;camera.near=.06;camera.far=100;camera.updateProjectionMatrix();
    }
  },[camera,frame,shot,u]);
  return null;
}
function PhysicalPipeline(){
  const {gl,scene}=useThree();
  useLayoutEffect(()=>{
    const tone=gl.toneMapping,exposure=gl.toneMappingExposure,background=scene.background;
    const previous=scene.environment;
    const pmrem=new THREE.PMREMGenerator(gl);
    const envScene=new RoomEnvironment();
    const renderTarget=pmrem.fromScene(envScene,.03);
    scene.environment=renderTarget.texture;
    scene.environmentIntensity=.92;
    gl.toneMapping=THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure=.73;
    gl.outputColorSpace=THREE.SRGBColorSpace;
    return()=>{scene.environment=previous;scene.background=background;
      gl.toneMapping=tone;gl.toneMappingExposure=exposure;
      renderTarget.dispose();envScene.dispose();pmrem.dispose();
    };
  },[gl,scene]);
  return null;
}
function tuneMaterial(material:THREE.Material,object:THREE.Mesh){
  if(!(material instanceof THREE.MeshStandardMaterial))return material;
  const label=(material.name+' '+object.name).toLowerCase();
  // Preserve all source textures and geometry. Tuning is conservative.
  if(/rubber|tyre|tire/.test(label)){
    const m=material.clone();m.metalness=.015;m.roughness=Math.max(.68,m.roughness);return m;
  }
  if(!/paint|body.?work|car.?body|rosso/.test(label))return material;
  const m=new THREE.MeshPhysicalMaterial({
    name:material.name,color:material.color.clone(),map:material.map,
    metalness:Math.max(.22,Math.min(.52,material.metalness)),
    roughness:Math.max(.15,Math.min(.30,material.roughness)),
    normalMap:material.normalMap,roughnessMap:material.roughnessMap,
    metalnessMap:material.metalnessMap,aoMap:material.aoMap,
    emissive:material.emissive.clone(),emissiveMap:material.emissiveMap,
    transparent:material.transparent,opacity:material.opacity,
    side:material.side,clearcoat:.82,clearcoatRoughness:.12
  });return m;
}
function FerrariAsset(){
  const gltf=useLoader(GLTFLoader,staticFile('f40-noir/ferrari_f40.glb'),loader=>{
    loader.setMeshoptDecoder(MeshoptDecoder);
    const draco=new DRACOLoader();
    draco.setDecoderPath(staticFile('f40-noir/draco/'));
    loader.setDRACOLoader(draco);
  });
  const pivot=useMemo(()=>{
    const source=gltf.scene.clone(true);
    source.updateMatrixWorld(true);
    const bb=new THREE.Box3().setFromObject(source,true);
    if(bb.isEmpty())throw new Error('Source Ferrari F40 GLB is empty');
    const dimensions=bb.getSize(new THREE.Vector3());
    const center=bb.getCenter(new THREE.Vector3());
    const longAxis=Math.max(dimensions.x,dimensions.z);
    if(!Number.isFinite(longAxis)||longAxis<=0||dimensions.y<=0)throw new Error('Invalid Ferrari bounding box');
    const scale=4.36/longAxis;
    source.scale.setScalar(scale);
    source.position.set(-center.x*scale,-bb.min.y*scale,-center.z*scale);
    source.traverse(obj=>{
      if(!(obj instanceof THREE.Mesh))return;
      obj.castShadow=true;obj.receiveShadow=true;
      const mat=obj.material;
      obj.material=Array.isArray(mat)?mat.map(m=>tuneMaterial(m,obj)):tuneMaterial(mat,obj);
    });
    const group=new THREE.Group();
    group.name='BlackSnow-CC-BY-Ferrari-F40-imported-GLB';
    if(dimensions.z>dimensions.x)group.rotation.y=-Math.PI/2;
    group.add(source);
    group.userData.source='https://sketchfab.com/3d-models/ferrari-f40-52a66c41cfcd4f999fb1b1c49bf24d70';
    group.userData.trianglesApprox=245600;
    return group;
  },[gltf.scene]);
  return <primitive object={pivot}/>;
}
const CONCRETE='#0d141a',STEEL='#141e26',WHITE='#dae5ed',CYAN='#59bac5';
function LightBar({position,length=5,vertical=false,blue=false}:{position:V3;length?:number;vertical?:boolean;blue?:boolean}){
  const color=blue?CYAN:WHITE;
  return <group position={position}>
    <mesh>
      <boxGeometry args={vertical?[.055,length,.08]:[length,.055,.08]}/>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} toneMapped={false}/>
    </mesh>
    <pointLight intensity={blue?2.9:2.4} color={color} distance={6} decay={2}/>
  </group>;
}
function Hangar(){
  const puddles=useMemo(()=>Array.from({length:24},(_,i)=>{
    const a=Math.sin(i*19.123),b=Math.cos(i*7.81);
    return {x:a*8,z:b*9,sx:.3+(i%6)*.17,sz:.2+(i%5)*.23};
  }),[]);
  return <group>
    <color attach="background" args={['#0c151b']}/>
    <fog attach="fog" args={['#0c151b',15,46]}/>
    {/* Wet floor, flush with real tyre ground contact */}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.027,0]} receiveShadow>
      <planeGeometry args={[90,90]}/>
      <meshPhysicalMaterial color="#0b1015" metalness={.52} roughness={.12}
        clearcoat={.95} clearcoatRoughness={.08}/>
    </mesh>
    {puddles.map((p,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]}
       position={[p.x,-.017,p.z]} receiveShadow>
       <planeGeometry args={[p.sx,p.sz]}/>
       <meshPhysicalMaterial color="#141e25" metalness={.62} roughness={.065}
         transparent opacity={.31} depthWrite={false}/>
    </mesh>)}
    {/* A deep believable architecture: concrete bays, load-bearing columns,
        wall cladding, suspended ceiling, light coves, drainage grates. */}
    <mesh position={[0,4.55,-8.4]} receiveShadow>
      <boxGeometry args={[30,9,.9]}/>
      <meshStandardMaterial color={CONCRETE} roughness={.87}/>
    </mesh>
    <mesh position={[0,6.85,0]} receiveShadow>
      <boxGeometry args={[30,.45,28]}/>
      <meshStandardMaterial color="#111a20" roughness={.82}/>
    </mesh>
    {[-10,-5,0,5,10].map((x,i)=><group key={i}>
      <mesh position={[x,3,-8.0]} castShadow receiveShadow>
        <boxGeometry args={[.54,6.2,1.05]}/>
        <meshStandardMaterial color="#303a43" roughness={.84}/>
      </mesh>
      <mesh position={[x,2.8,-7.4]}>
        <boxGeometry args={[.13,4.2,.08]}/>
        <meshStandardMaterial color="#506675" metalness={.57} roughness={.38}/>
      </mesh>
      <mesh position={[x,.04,-5]} receiveShadow>
        <boxGeometry args={[.09,.015,10]}/>
        <meshStandardMaterial color="#10171d" metalness={.5} roughness={.47}/>
      </mesh>
      <LightBar position={[x,5.65,-7.25]} length={4.4} vertical blue={i%2===0}/>
    </group>)}
    {[-6,6].map((x,i)=><group key={i}>
      {[-5,1].map((z,j)=><group key={j}>
        <mesh position={[x,3,z]} receiveShadow castShadow>
          <boxGeometry args={[.62,6,.62]}/>
          <meshStandardMaterial color={STEEL} metalness={.24} roughness={.72}/>
        </mesh>
        <mesh position={[x*.97,3,z+.37]}>
          <boxGeometry args={[.09,3.3,.035]}/>
          <meshStandardMaterial color="#7d8892" metalness={.88} roughness={.21}/>
        </mesh>
      </group>)}
    </group>)}
    {[-5,0,5].map((z,i)=><group key={i}>
      <mesh position={[0,5.9,z]} castShadow>
        <boxGeometry args={[13,.2,.3]}/>
        <meshStandardMaterial color="#37404a" metalness={.48} roughness={.46}/>
      </mesh>
      <LightBar position={[0,5.71,z]} length={11.5} blue={i===1}/>
    </group>)}
    {/* Fine floor seams and central drainage grate sell physical scale. */}
    {[-4,-1,2,5].map((z,i)=><mesh key={i} position={[0,-.022,z]}>
      <boxGeometry args={[22,.004,.022]}/>
      <meshStandardMaterial color="#090d11" roughness={.9}/>
    </mesh>)}
    {Array.from({length:12},(_,i)=><mesh key={i} position={[-7+i*.23,-.015,1.5]}>
      <boxGeometry args={[.095,.015,2.8]}/>
      <meshStandardMaterial color="#0a1217" metalness={.38} roughness={.65}/>
    </mesh>)}
  </group>;
}
function Scene(){
  const {width,height}=useVideoConfig();
  return <ThreeCanvas width={width} height={height} shadows
    camera={{fov:43,near:.06,far:100,position:[-5,1.7,11]}}>
    <PhysicalPipeline/>
    <Hangar/>
    <hemisphereLight args={['#d9eaf2','#111921',.49]}/>
    <ambientLight intensity={.07}/>
    <directionalLight color="#eef5ff" intensity={2.8} position={[-3.8,7.2,5.3]} castShadow
      shadow-mapSize={[2048,2048]} shadow-camera-left={-10} shadow-camera-right={10}
      shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={.1}
      shadow-camera-far={35} shadow-bias={-.00012} shadow-normalBias={.025}/>
    <directionalLight color="#69a6e1" intensity={1.3} position={[7,4,-4]}/>
    <spotLight color="#b9f8ff" intensity={26} position={[-3,7,-4]}
      angle={.48} penumbra={.9} distance={22}/>
    <FerrariAsset/>
    <CameraRig/>
  </ThreeCanvas>;
}
const Film:React.FC=()=> <AbsoluteFill style={{backgroundColor:'#070a0c'}}>
  <AbsoluteFill style={{filter:'contrast(1.14) saturate(1.14)'}}><Scene/></AbsoluteFill>
  <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(ellipse at 50% 48%, transparent 25%, rgba(0,5,10,0.54) 105%)'}}/>
</AbsoluteFill>;
registerRoot(()=> <Composition id="YunexRossoAfterDark" component={Film}
  width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>);
