/** Actual Agent 2 physical contact particles. No independent sparks/emitters. */
import React,{useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import type {SparkParticle} from '../shared/contract.ts';

const UP=new THREE.Vector3(0,1,0);
const MAX=260;
/** GPU efficient, bounded motion-exposure streaks, not decorative glow sheets. */
export const ContactGlints:React.FC<{particles:readonly SparkParticle[]}> =({particles})=>{
 const inst=useRef<THREE.InstancedMesh>(null);
 const matrix=useMemo(()=>new THREE.Matrix4(),[]);
 const position=useMemo(()=>new THREE.Vector3(),[]);
 const dir=useMemo(()=>new THREE.Vector3(),[]);
 const quat=useMemo(()=>new THREE.Quaternion(),[]);
 const scale=useMemo(()=>new THREE.Vector3(),[]);
 const warm=useMemo(()=>new THREE.Color(),[]);
 const orange=useMemo(()=>new THREE.Color('#ff8933'),[]);
 const white=useMemo(()=>new THREE.Color('#ffefb8'),[]);
 useLayoutEffect(()=>{
  const mesh=inst.current;
  if(!mesh)return;
  const shown=particles.filter(p=>p.ageSec>=0 && p.ageSec<p.lifetimeSec && p.luminance01>0)
    .slice(0,MAX);
  mesh.count=shown.length;
  shown.forEach((p,i)=>{
   const v=p.velocityWorld,speed=Math.hypot(...v);
   position.set(...p.positionWorld);
   dir.set(...v);
   if(dir.lengthSq()>1e-8)quat.setFromUnitVectors(UP,dir.normalize());
   else quat.identity();
   // Exact supplied positions and directions. Apparent width accounts for
   // half-frame optical bloom and remains tiny compared to car components.
   const radius=Math.min(.028,Math.max(.010,p.radiusM));
   const streak=Math.min(.35,Math.max(.065,speed/30*.18));
   scale.set(radius,streak,radius);
   matrix.compose(position,quat,scale);
   mesh.setMatrixAt(i,matrix);
   warm.copy(white).lerp(orange,Math.min(1,p.ageSec/p.lifetimeSec));
   warm.multiplyScalar(Math.max(.12,p.luminance01));
   mesh.setColorAt(i,warm);
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 },[particles,matrix,position,dir,quat,scale,warm,orange,white]);
 return <instancedMesh ref={inst} args={[undefined,undefined,MAX]} frustumCulled={false}>
  <cylinderGeometry args={[1,1,1,6]}/>
  <meshBasicMaterial color="#fff1b5" toneMapped={false} transparent opacity={.95} depthWrite={false}/>
 </instancedMesh>;
};
