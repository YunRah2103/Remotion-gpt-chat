/** AGENT 3 • CINEMATIC ACTUAL-MECHANISM INTEGRATION.
 * Frozen unchanged copy of Agent 2's ACTUAL latest upgraded procedural model lives in
 * ./a2-frozen/ under A3-owned preview files, not in Agent 2's original source directory.
 * The original A3 physics component and port contracts remain unchanged.
 */
import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {TurboMechanism} from './a2-frozen/TurboMechanism';
import {TurboFlow,type TurboFlowPhase} from '../TurboFlow';
import {A2_CANDIDATE_PORTS,A2_CANDIDATE_ROUTES} from '../A2CandidateAdapter';
import {CinematicFlow} from '../CinematicFlow';
import {PowerWindow} from '../PowerWindow';

const phases:TurboFlowPhase[]=['turbine','compressor','intercooler','combustion','full'];
const headlines=['EXHAUST SPINS','FRESH AIR IN','COOL THE CHARGE','MORE AIR. MORE FUEL.','ONE SHAFT. TWO PATHS.'];
const foot=['HOT GAS → TURBINE','TURBINE → SHAFT → COMPRESSOR','INTERCOOLER REJECTS HEAT','COMBUSTION PUSHES THE PISTON','EXHAUST AND INTAKE NEVER MIX'];
const specs=[
 {pos:[-3.65,1.60,3.48],target:[-1.33,.16,-.05],fov:33},
 {pos:[3.65,1.48,3.45],target:[1.32,.08,-.03],fov:33},
 {pos:[5.25,1.45,2.13],target:[2.55,-.53,-1.43],fov:34},
 {pos:[.95,1.15,.62],target:[-.20,-1.05,-2.88],fov:39},
 {pos:[4.55,4.0,6.25],target:[.32,-.62,-1.18],fov:40}
] as const;
const MovingCamera:React.FC<{frame:number;stage:number}>=({frame,stage})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const s=specs[stage],local=frame%66;
  // Deliberate restrained parallax; every phase remains a tight readable macro.
  camera.position.set(s.pos[0]+.19*Math.sin(local*.025),s.pos[1]+.10*Math.sin(local*.021),s.pos[2]-.23*(local/65));
  camera.lookAt(s.target[0],s.target[1],s.target[2]);
  if('fov' in camera){(camera as import('three').PerspectiveCamera).fov=s.fov;(camera as import('three').PerspectiveCamera).updateProjectionMatrix();}
  camera.updateMatrixWorld();
 },[camera,frame,stage]);
 return null;
};
/** Exterior context kept dim; industrial studio lighting with warm/cold separation. */
const World:React.FC<{frame:number;stage:number}>=({frame,stage})=>{
 const phase=phases[stage];
 const turboOnly=stage<2;
 return <>
  <MovingCamera frame={frame} stage={stage}/>
  <color attach="background" args={['#07111b']}/>
  <fog attach="fog" args={['#07111b',13,26]}/>
  <hemisphereLight args={['#9BC4D6','#0C111A',1.8]}/>
  <ambientLight intensity={.24}/>
  <directionalLight position={[-4,6,6]} intensity={3.1} color="#FFF4DC"/>
  <spotLight position={[-3,4,3]} intensity={43} color="#FF955B" angle={.68} penumbra={.75}/>
  <spotLight position={[4,3,5]} intensity={45} color="#55CCFF" angle={.70} penumbra={.8}/>
  <pointLight position={[0,3,-3]} intensity={12} color="#C5DBE0" distance={12}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-3.12,-1.2]} receiveShadow>
   <planeGeometry args={[50,50]}/><meshStandardMaterial color="#111E2A" metalness={.24} roughness={.7}/>
  </mesh>
  <group name="A3_REAL_A2_MODEL_AND_FLOW">
   <TurboMechanism frame={frame} variant={turboOnly?'turbo':'full'} cutaway={.99} exploded={0}/>
   <TurboFlow frame={frame} phase={phase} ports={A2_CANDIDATE_PORTS} routes={A2_CANDIDATE_ROUTES} intensity={1}/>
   <CinematicFlow frame={frame} phase={phase} intensity={stage===3?.85:1}/>
   {stage===3?<PowerWindow frame={frame}/>:null}
  </group>
 </>;
};
export const AirflowPreview:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const stage=Math.min(4,Math.floor(frame/66));
 return <AbsoluteFill style={{background:'#07111b',color:'#F1FAFA',fontFamily:'Arial,Helvetica,sans-serif',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} camera={{position:[0,2,7],fov:34,near:.08,far:75}}
    gl={{antialias:true,preserveDrawingBuffer:true}}>
   <World frame={frame} stage={stage}/>
  </ThreeCanvas>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(1,6,11,.73) 0%,transparent 30%,transparent 66%,rgba(1,5,10,.80) 100%)',pointerEvents:'none'}}/>
  <div style={{position:'absolute',top:205,left:80,right:80,fontSize:47,lineHeight:1.06,letterSpacing:-1.0,fontWeight:900,textShadow:'0 4px 20px #000'}}>
   {headlines[stage]}
  </div>
  <div style={{position:'absolute',bottom:256,left:82,right:82,fontSize:28,fontWeight:700,letterSpacing:1.3,textShadow:'0 4px 18px #000'}}>
   {foot[stage]}
  </div>
  <div style={{position:'absolute',bottom:184,left:82,fontSize:15,letterSpacing:2,color:'#8EA6B7'}}>YUNEX / A3 MECHANICAL CUTAWAY REVIEW</div>
 </AbsoluteFill>;
};
