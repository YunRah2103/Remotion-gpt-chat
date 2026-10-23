import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill,Composition,cancelRender,continueRender,delayRender,registerRoot,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Agent 6 replacement candidate B. KhronosGroup CarConcept CC-BY 4.0,
 * source: 15cd02d304e54cb42a4db4eefe719f76190f4b68.
 * The bad CC0 Spectral GT RS candidate A is REJECTED, not included.
 * Car-only proof; no fake exhaust ports until physical location inspected.
 */
function prepProfessionalCar(original: THREE.Group): THREE.Group {
  const g = new THREE.Group();
  original.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      // Do not invent details or enlarge appendages. Hide brand trademark
      // labels only when their scene node names expressly identify them.
      if (/^(Khronos|3DCommerce)[_-]?logo$/i.test(obj.name)) obj.visible = false;
    }
  });
  original.updateMatrixWorld(true);
  const pre = new THREE.Box3().setFromObject(original);
  const size = pre.getSize(new THREE.Vector3());
  // Car's longest horizontal footprint direction is the driving axis.
  if (size.x > size.z) original.rotation.y = -Math.PI / 2;
  original.updateMatrixWorld(true);
  const turned = new THREE.Box3().setFromObject(original);
  const footprint = turned.getSize(new THREE.Vector3());
  const scale = 4.75 / Math.max(footprint.x, footprint.z);
  original.scale.multiplyScalar(scale);
  original.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(original);
  const centre = scaled.getCenter(new THREE.Vector3());
  original.position.x -= centre.x;
  original.position.z -= centre.z;
  original.position.y -= scaled.min.y - 0.01;
  g.add(original);
  g.name = 'ep005-agent6-khronos-ccby-candidate';
  g.userData = {
    state: 'awaiting-owner-car-only-approval',
    asset: 'CarConcept',
    copyright: '2024 Darmstadt Graphics Group GmbH / Eric Chadwick',
    license: 'CC-BY-4.0',
    upstream: 'KhronosGroup/glTF-Sample-Assets@15cd02d304e54cb42a4db4eefe719f76190f4b68'
  };
  return g;
}

function CandidateCar() {
  const [car,setCar] = useState<THREE.Group|null>(null);
  const delay = useRef<number|null>(null);
  useEffect(() => {
    let cancelled = false;
    const h=delayRender('Loading CarConcept PBR vehicle');
    delay.current=h;
    new GLTFLoader().load(staticFile('ep005-agent6-khronos/CarConcept.glb'), gltf=>{
      if (!cancelled) setCar(prepProfessionalCar(gltf.scene));
    },undefined,error=>{if (!cancelled) cancelRender(error instanceof Error?error:new Error(String(error)))});
    return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{
    if(car && delay.current!==null){continueRender(delay.current);delay.current=null;}
  },[car]);
  return car?<primitive object={car}/>:null;
}
function smooth(t:number){const s=THREE.MathUtils.clamp(t,0,1);return s*s*(3-2*s);}
function CameraRig({portrait}:{portrait:boolean}){
  const frame=useCurrentFrame(),{camera}=useThree();
  const keys=[
    {at:0,angle:0.12},
    {at:22,angle:-0.72},
    {at:55,angle:-Math.PI/2},
    {at:88,angle:-2.45},
    {at:119,angle:-Math.PI}
  ];
  let angle=keys.at(-1)!.angle;
  for(let i=0;i<keys.length-1;i++){
    if(frame<=keys[i+1].at){
      angle=THREE.MathUtils.lerp(keys[i].angle,keys[i+1].angle,smooth((frame-keys[i].at)/(keys[i+1].at-keys[i].at)));
      break;
    }
  }
  useLayoutEffect(()=>{
    const r=portrait?14.0:8.2;
    camera.position.set(Math.sin(angle)*r,portrait?2.8:2.15,Math.cos(angle)*r);
    camera.lookAt(0,0.75,0);
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=portrait?43:42;
      camera.near=.05;camera.far=100;camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  },[angle,camera,portrait]);
  return null;
}
const VisualGate:React.FC<{portrait:boolean}>=({portrait})=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const label=frame<23?'FRONT':frame<68?'SIDE PROFILE':frame<102?'REAR THREE-QUARTER':'REAR';
  return <AbsoluteFill style={{background:'#d6dbde'}}>
    <ThreeCanvas width={width} height={height} shadows gl={{antialias:true}} camera={{fov:43,near:.05,far:100}}>
      <color attach="background" args={['#d6dbde']}/>
      <hemisphereLight args={['#f3f7ff','#8b8c8f',2.25]}/>
      <ambientLight color="#ffffff" intensity={1.05}/>
      <directionalLight position={[7,12,8]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-.0001}/>
      <directionalLight position={[-8,7,-4]} color="#eef4ff" intensity={1.8}/>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]} receiveShadow>
        <planeGeometry args={[200,200]}/>
        <meshStandardMaterial color="#aeb7bd" roughness={.86} metalness={.05}/>
      </mesh>
      <CandidateCar/>
      <CameraRig portrait={portrait}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:portrait?92:44,left:portrait?56:70,color:'#18242d',fontSize:portrait?30:28,fontFamily:'Arial, sans-serif',fontWeight:700,letterSpacing:2}}>
      YUNEX / SUPERCAR QUALITY GATE
      <div style={{fontSize:portrait?21:18,marginTop:12,fontWeight:400,letterSpacing:1.2}}>
        {label} · REPLACEMENT CANDIDATE B · NOT APPROVED
      </div>
    </div>
    <div style={{position:'absolute',left:portrait?56:70,bottom:portrait?75:42,fontSize:portrait?18:16,color:'#26343f',fontFamily:'Arial, sans-serif'}}>
      CC-BY-4.0 · Darmstadt Graphics Group / Eric Chadwick · Khronos glTF Sample Assets
    </div>
  </AbsoluteFill>
}
const Root=()=> <>
  <Composition id="Ep005Agent6KhronosPortrait" component={VisualGate} defaultProps={{portrait:true}} width={1080} height={1920} fps={30} durationInFrames={120}/>
  <Composition id="Ep005Agent6KhronosLandscape" component={VisualGate} defaultProps={{portrait:false}} width={1920} height={1080} fps={30} durationInFrames={120}/>
</>;
registerRoot(Root);
