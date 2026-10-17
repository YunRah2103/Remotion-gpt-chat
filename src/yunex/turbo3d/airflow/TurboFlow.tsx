/** YUNEX Turbo 3D EP001 • A3 deterministic explanatory flow. Original geometry.
 * Y-up, +Z car forward, metres. NO assumption of A2 physical pipe paths.
 */
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import stub from '../../../../production/yunex/turbo_3d_001/agents/airflow/flow-ports.json';

export type Vec3 = readonly [number,number,number];
export type FlowPortName = 'EXHAUST_IN'|'EXHAUST_OUT'|'CLEAN_AIR_IN'|'COMPRESSED_AIR_OUT'|'INTERCOOLER_IN'|'INTERCOOLER_OUT'|'ENGINE_INTAKE'|'FUEL_IN';
export type FlowNodeName = 'ENGINE_EXHAUST'|'TURBINE_WHEEL_FLOW'|'COMPRESSOR_WHEEL_FLOW'|'CYLINDER';
export type FlowRouteId = 'exhaust-feed'|'exhaust-exit'|'clean-intake'|'charge-hot'|'charge-cooled'|'fuel-pulse';
export type TurboFlowPhase = 'exhaust'|'turbine'|'compressor'|'intercooler'|'combustion'|'full';
export type PortMap = Record<FlowPortName,Vec3> & Partial<Record<FlowNodeName,Vec3>>;
export type FlowRoutes = Partial<Record<FlowRouteId, readonly Vec3[]>>;
export type TurboFlowProps = {
 frame:number; phase?:TurboFlowPhase; ports?:PortMap; routes?:FlowRoutes;
 intensity?:number; visibility?:number;
};
export type RouteSpec = {
 id:FlowRouteId; gas:'exhaust'|'fresh-air'|'fuel';
 upstream:FlowPortName|FlowNodeName; downstream:FlowPortName|FlowNodeName;
 via:readonly (FlowPortName|FlowNodeName)[]; color:string; meaning:string;
};
export const TEMPORARY_STUB_PORTS:PortMap = {...stub.ports,...stub.nodes} as unknown as PortMap;
export const FLOW_ROUTE_SPECS = stub.routes as RouteSpec[];
export const makeStubRoutes = (ports:PortMap=TEMPORARY_STUB_PORTS):Record<FlowRouteId,Vec3[]> => {
 const out={} as Record<FlowRouteId,Vec3[]>;
 for(const spec of FLOW_ROUTE_SPECS) {
  out[spec.id]=[spec.upstream,...spec.via,spec.downstream].map((name)=>{
   const position=ports[name as keyof PortMap];
   if(!position)throw new Error('Missing port or node: '+name);
   return [...position] as Vec3;
  });
 }
 return out;
};
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const fract=(v:number)=>v-Math.floor(v);
const hash=(v:number)=>fract(Math.sin(v*127.1+78.233)*43758.5453);
const toVector=(v:Vec3)=>new THREE.Vector3(...v);
export const phaseShows=(phase:TurboFlowPhase,id:FlowRouteId):boolean=>{
 if(phase==='full')return true;
 if(phase==='exhaust'||phase==='turbine')return id.startsWith('exhaust');
 if(phase==='compressor')return id==='clean-intake'||id==='charge-hot';
 if(phase==='intercooler')return id==='charge-hot'||id==='charge-cooled';
 return id==='charge-cooled'||id==='fuel-pulse'||id.startsWith('exhaust');
};
/** One flow parcel instance follows a real 3D path, never teleports between gas channels.
 * N=19 everywhere on clean air routes: no mass spawning at the intercooler.
 */
const FlowStream:React.FC<{id:FlowRouteId;points:readonly Vec3[];frame:number;color:string;intensity:number;visibility:number}>=({
 id,points,frame,color,intensity,visibility
})=>{
 const n=id==='fuel-pulse'?6:id.startsWith('exhaust')?20:19;
 const mesh=useRef<THREE.InstancedMesh>(null);
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(toVector),false,'centripetal',.4),[points]);
 const dummy=useMemo(()=>new THREE.Object3D(),[]);
 const tangent=useMemo(()=>new THREE.Vector3(),[]);
 const centre=useMemo(()=>new THREE.Vector3(),[]);
 const side=useMemo(()=>new THREE.Vector3(),[]);
 const normal=useMemo(()=>new THREE.Vector3(),[]);
 const up=useMemo(()=>new THREE.Vector3(0,1,0),[]);
 const curveLength=Math.max(.15,curve.getLength());
 useLayoutEffect(()=>{
  if(!mesh.current)return;
  const vis=clamp(intensity)*clamp(visibility);
  for(let i=0;i<n;i++){
   const travel=(frame*(id==='fuel-pulse'?.063:.071))/curveLength;
   const t=fract(i/n+travel+(id==='charge-cooled'?.17:0));
   curve.getPointAt(t,centre);curve.getTangentAt(t,tangent).normalize();
   side.crossVectors(tangent,up);
   if(side.lengthSq()<.001)side.set(1,0,0);
   side.normalize();normal.crossVectors(side,tangent).normalize();
   const a=2*Math.PI*hash(i+11),r=(id==='fuel-pulse'?.017:.043)*Math.sqrt(hash(i+53));
   centre.addScaledVector(side,Math.cos(a)*r).addScaledVector(normal,Math.sin(a)*r);
   const edge=clamp(Math.min(t*11,(1-t)*11));
   const pulse=id==='fuel-pulse'?clamp(.55+.5*Math.sin(frame/6)):1;
   const size=Math.max(.0001,vis*edge*pulse);
   dummy.position.copy(centre);dummy.quaternion.setFromUnitVectors(up,tangent);
   const rad=id==='fuel-pulse'?.033:.059;
   dummy.scale.set(rad*size,(id==='fuel-pulse'?.096:.19)*size,rad*size);
   dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);
  }
  mesh.current.instanceMatrix.needsUpdate=true;
 },[frame,id,n,curve,curveLength,centre,tangent,side,normal,up,dummy,intensity,visibility]);
 return <instancedMesh ref={mesh} args={[undefined,undefined,n]} frustumCulled={false}>
  <sphereGeometry args={[1,9,7]}/>
  <meshBasicMaterial color={color} transparent opacity={.92*clamp(visibility)} toneMapped={false} depthWrite={false}/>
 </instancedMesh>;
};
/** Thermal cue: existing charge cools; cooler does not create intake particles. */
const Thermal:React.FC<{frame:number;position:Vec3;visible:number}>=({frame,position,visible})=><group position={[...position]}>
 <mesh><boxGeometry args={[.17,1.45,1.02]}/><meshStandardMaterial color="#3C6470" metalness={.7} roughness={.36} transparent opacity={.75*visible}/></mesh>
 {Array.from({length:9},(_,i)=><mesh key={i} position={[.13,(i-4)*.135,0]}>
  <boxGeometry args={[.045,.045,1.07]}/>
  <meshStandardMaterial color="#B4D8D5" emissive="#F59154" emissiveIntensity={(.22+.16*Math.sin(frame*.12+i*.31))*visible} metalness={.62} roughness={.42} transparent opacity={visible}/>
 </mesh>)}
 </group>;
/** Simplified explanatory power stroke; not simulated valve or cylinder pressure. */
const Combustion:React.FC<{frame:number;position:Vec3;visible:number}>=({frame,position,visible})=>{
 const cycle=fract(frame/25),burn=Math.exp(-Math.pow((cycle-.19)/.12,2));
 const piston=-.3*clamp((cycle-.22)/.5);
 return <group position={[...position]}>
  <mesh position={[0,.16,0]}><cylinderGeometry args={[.34,.34,.97,14,1,true]}/>
   <meshStandardMaterial color="#7DADB6" metalness={.72} roughness={.31} transparent opacity={visible*.36} side={THREE.DoubleSide}/>
  </mesh>
  <mesh position={[0,-.12+piston,0]}><cylinderGeometry args={[.29,.29,.2,14]}/><meshStandardMaterial color="#C4D4DA" metalness={.8} roughness={.22} transparent opacity={visible}/></mesh>
  <mesh position={[0,.17,0]} scale={[1+burn*.35,.12+burn*.47,1+burn*.35]}>
   <sphereGeometry args={[.27,16,10]}/><meshBasicMaterial color="#FFAA4C" transparent opacity={burn*visible*.85} toneMapped={false} depthWrite={false}/>
  </mesh>
  <pointLight position={[0,.2,0]} color="#FF8A36" distance={1.8} intensity={burn*visible*3}/>
 </group>;
};
export const TurboFlow:React.FC<TurboFlowProps>=({
 frame,phase='full',ports=TEMPORARY_STUB_PORTS,routes,intensity=1,visibility=1
})=>{
 const resolved=useMemo(()=>({...makeStubRoutes(ports),...routes}),[ports,routes]);
 const center:Vec3=[
  (ports.INTERCOOLER_IN[0]+ports.INTERCOOLER_OUT[0])/2,
  (ports.INTERCOOLER_IN[1]+ports.INTERCOOLER_OUT[1])/2,
  (ports.INTERCOOLER_IN[2]+ports.INTERCOOLER_OUT[2])/2
 ];
 return <group name="A3_TURBO_FLOW">
  {FLOW_ROUTE_SPECS.map((r)=>phaseShows(phase,r.id)&&<FlowStream key={r.id}
   id={r.id} frame={frame} points={resolved[r.id]} color={r.color} intensity={intensity} visibility={visibility}/>)}
  {(phase==='intercooler'||phase==='full')&&<Thermal frame={frame} position={center} visible={clamp(intensity)*clamp(visibility)}/>}
  {(phase==='combustion'||phase==='full')&&<Combustion frame={frame} position={ports.CYLINDER??ports.ENGINE_INTAKE} visible={clamp(intensity)*clamp(visibility)}/>}
 </group>;
};
