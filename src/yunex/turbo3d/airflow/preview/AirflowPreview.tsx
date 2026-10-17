/* Isolated test rig. NOT Agent 2's engine and NOT registered in src/Root.tsx. */
import React,{useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {FLOW_ROUTE_SPECS,makeStubRoutes,TurboFlow,type TurboFlowPhase,type Vec3} from '../TurboFlow';
const phases:TurboFlowPhase[]=['turbine','compressor','intercooler','combustion','full'];
const labels=['EXHAUST TURNS TURBINE','CLEAN AIR ENTERS COMPRESSOR','INTERCOOLER REMOVES HEAT','FUEL + AIR = MORE POWER','TWO GAS ROUTES • SHARED SHAFT'];
const PreviewTube:React.FC<{points:readonly Vec3[];color:string}>=({points,color})=>{
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),false,'centripetal',.4),[points]);
 return <mesh><tubeGeometry args={[curve,50,.12,9,false]}/>
  <meshStandardMaterial color={color} transparent opacity={.40} metalness={.6} roughness={.34} depthWrite={false}/>
 </mesh>;
};
const StubRig:React.FC<{frame:number}>=({frame})=>{
 const segments=useMemo(()=>makeStubRoutes(),[]);
 return <group name="A3_EXPLICIT_TEMPORARY_TEST_RIG">
  <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.08,.08,3.3,16]}/><meshStandardMaterial color="#B3C8D0" metalness={.8}/></mesh>
  {[-1.35,1.95].map((x,i)=><group key={i} position={[x,.2,i===0?-.8:.95]}>
   <group rotation={[frame*.28,0,0]}>
    {Array.from({length:10},(_,j)=><mesh key={j} position={[0,Math.cos(j*Math.PI/5)*.25,Math.sin(j*Math.PI/5)*.25]} rotation={[j*Math.PI/5,0,0]}>
      <boxGeometry args={[.09,.37,.11]}/><meshStandardMaterial color={i===0?'#E6A56B':'#91D1E3'} metalness={.7} roughness={.3}/>
    </mesh>)}
   </group>
  </group>)}
  {FLOW_ROUTE_SPECS.map(r=><PreviewTube key={r.id} points={segments[r.id]} color={r.gas==='exhaust'?'#6D4E43':r.gas==='fuel'?'#6B6350':'#326875'}/>)}
 </group>;
};
export const AirflowPreview:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const stage=Math.min(4,Math.floor(frame/66));
 return <AbsoluteFill style={{background:'#08121D',color:'#E8F5F2',fontFamily:'Arial,sans-serif'}}>
  <ThreeCanvas width={width} height={height} gl={{antialias:true,preserveDrawingBuffer:true}}
   camera={{position:[5,4.3,17],fov:46,near:.1,far:100}}>
   <color attach="background" args={['#08121D']}/><hemisphereLight args={['#C8E1E8','#152533',2]}/>
   <directionalLight position={[-6,9,6]} intensity={2.4}/><pointLight position={[4,3,3]} color="#F59F68" intensity={18}/>
   <group rotation={[0,0,1.05]}><StubRig frame={frame}/><TurboFlow frame={frame} phase={phases[stage]}/></group>
  </ThreeCanvas>
  <div style={{position:'absolute',top:215,left:80,fontSize:43,fontWeight:800,letterSpacing:2}}>{labels[stage]}</div>
  <div style={{position:'absolute',bottom:230,left:80,fontSize:18,letterSpacing:2}}>A3 TEMPORARY PORTS — A2 NOT VERIFIED</div>
 </AbsoluteFill>;
};
