/** A3 cinematic illumination pass. Purely representational gas tracer, not CFD.
 * Used WITH original TurboFlow and exact frozen A2 route map, never mutates physical ports.
 * Layered moving volumetric-like luminous parcels are visible in open/cutaway housings.
 */
import React, {useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import {A2_CANDIDATE_ROUTES} from './A2CandidateAdapter';
import {phaseShows,type FlowRouteId,type TurboFlowPhase,type Vec3} from './TurboFlow';

const palette:Record<FlowRouteId,string>={
 'exhaust-feed':'#FF922F','exhaust-exit':'#F15C3A','clean-intake':'#36C9FF',
 'charge-hot':'#53CFFF','charge-cooled':'#81F5DA','fuel-pulse':'#FFC16A'
};
const all:FlowRouteId[]=['exhaust-feed','exhaust-exit','clean-intake','charge-hot','charge-cooled','fuel-pulse'];
const fract=(x:number)=>x-Math.floor(x);
const seed=(n:number)=>fract(Math.sin(n*135.41+3.7)*43758.54);
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const yAxis=new THREE.Vector3(0,1,0);
const StreamLayer:React.FC<{id:FlowRouteId;points:readonly Vec3[];frame:number;halo:boolean;intensity:number}>=({
 id,points,frame,halo,intensity
})=>{
 const instances=id==='fuel-pulse'?12:halo?30:48;
 const ref=useRef<THREE.InstancedMesh>(null);
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal',.25),[points]);
 const obj=useMemo(()=>new THREE.Object3D(),[]);
 const pos=useMemo(()=>new THREE.Vector3(),[]);
 const dir=useMemo(()=>new THREE.Vector3(),[]);
 const side=useMemo(()=>new THREE.Vector3(),[]);
 const normal=useMemo(()=>new THREE.Vector3(),[]);
 const length=Math.max(1,curve.getLength());
 useLayoutEffect(()=>{
   const mesh=ref.current;
   if(!mesh)return;
   const speed=(id==='fuel-pulse'?.04:.055);
   for(let i=0;i<instances;i++){
     const offset=i/instances;
     const t=fract(offset+(frame*speed/length)+(halo?.1:0));
     curve.getPointAt(t,pos);
     curve.getTangentAt(t,dir).normalize();
     side.crossVectors(dir,yAxis);
     if(side.lengthSq()<.01)side.set(0,0,1);
     side.normalize();normal.crossVectors(dir,side).normalize();
     const phi=i*2.39996+frame*.017,scatter=(halo?.07:.085)*Math.sqrt(seed(i+31));
     pos.addScaledVector(side,Math.cos(phi)*scatter).addScaledVector(normal,Math.sin(phi)*scatter);
     const envelope=clamp(Math.min(t*13,(1-t)*13))*clamp(intensity);
     const breathe=.83+.17*Math.sin(frame*.19+i*1.31);
     const rr=(halo?.168:.059)*envelope*breathe;
     obj.position.copy(pos);
     obj.quaternion.setFromUnitVectors(yAxis,dir);
     obj.scale.set(rr,(halo?.31:.21)*envelope*(.7+seed(i+4)*.7),rr);
     obj.updateMatrix();
     mesh.setMatrixAt(i,obj.matrix);
   }
   mesh.instanceMatrix.needsUpdate=true;
 },[frame,instances,halo,intensity,id,curve,length,obj,pos,dir,side,normal]);
 return <instancedMesh ref={ref} args={[undefined,undefined,instances]} frustumCulled={false} renderOrder={halo?9:10}>
    <sphereGeometry args={[1,8,7]}/>
    <meshBasicMaterial color={palette[id]} transparent opacity={halo?.17:.91}
      blending={halo?THREE.AdditiveBlending:THREE.NormalBlending} toneMapped={false}
      depthWrite={false} depthTest={false}/>
 </instancedMesh>;
};
const RotorPulse:React.FC<{frame:number;x:number;color:string;visible:boolean}>=({frame,x,color,visible})=>
 visible?<group position={[x,0,0]} rotation={[frame*.165,0,0]}>
  {Array.from({length:11},(_,i)=>{
    const a=i*2*Math.PI/11;
    return <mesh key={i} position={[.15,.56*Math.cos(a),.56*Math.sin(a)]}
      rotation={[a,0,0]} renderOrder={8}>
      <boxGeometry args={[.022,.13,.035]}/>
      <meshBasicMaterial color={color} transparent opacity={.76} toneMapped={false} depthWrite={false} depthTest={false}/>
    </mesh>;
  })}
 </group>:null;
/** Scene-facing visual intensification; the physical TurboFlow stays the source of truth.
 * Uses A2 frozen paths. No amber particle is transferred to compressor side.
 */
export const CinematicFlow:React.FC<{frame:number;phase:TurboFlowPhase;intensity?:number}>=({
 frame,phase,intensity=1
})=><group name="A3_CINEMATIC_FLOW_CUTAWAY">
 {all.filter(id=>phaseShows(phase,id)).map(id=>{
  const points=A2_CANDIDATE_ROUTES[id];
  if(!points)return null;
  return <group key={id}>
   <StreamLayer id={id} points={points} frame={frame} halo intensity={intensity}/>
   <StreamLayer id={id} points={points} frame={frame} halo={false} intensity={intensity}/>
  </group>;
 })}
 <RotorPulse frame={frame} x={-1.13} color="#FF913D" visible={phase==='turbine'||phase==='exhaust'||phase==='full'||phase==='combustion'}/>
 <RotorPulse frame={frame} x={1.13} color="#53CFFF" visible={phase==='compressor'||phase==='full'}/>
 </group>;
