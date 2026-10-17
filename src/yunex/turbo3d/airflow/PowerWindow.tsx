/** Simplified transparent educational cylinder overlay attached to A2 engine's visible front face.
 * Not a substitute for the real A2 mesh; this is an X-ray cutaway showing a single power stroke.
 * Coordinates are A2 engine local metres (+Y up), front wall facing +Z.
 */
import React from 'react';
import * as THREE from 'three';
export const PowerWindow:React.FC<{frame:number}>=({frame})=>{
 const t=(frame%27)/27;
 const ignition=Math.exp(-Math.pow((t-.16)/.13,2));
 const down=Math.max(0,Math.min(1,(t-.2)/.56));
 const pistonY=-.25-.29*(down*down*(3-2*down));
 return <group name="A3_ILLUSTRATIVE_ENGINE_POWER_WINDOW" position={[-.35,-.54,-2.37]}>
  <mesh position={[0,-.06,0]} renderOrder={6}>
   <cylinderGeometry args={[.365,.365,.95,28,1,true]}/>
   <meshPhysicalMaterial color="#8FB7C6" metalness={.48} roughness={.22} transparent opacity={.2}
     side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>
  {[-.48,.42].map((y,i)=><mesh key={i} position={[0,y,0]} renderOrder={7}>
    <torusGeometry args={[.355,.046,10,36]}/>
    <meshStandardMaterial color="#C1D3D9" metalness={.9} roughness={.19}/>
  </mesh>)}
  <mesh position={[0,pistonY,0]} renderOrder={7}>
   <cylinderGeometry args={[.31,.31,.16,28]}/>
   <meshStandardMaterial color="#C5D2D3" metalness={.88} roughness={.19}/>
  </mesh>
  <mesh position={[0,.13,0]} scale={[.8+.35*ignition,.45+.63*ignition,.8+.35*ignition]}
    renderOrder={9}>
   <sphereGeometry args={[.33,18,12]}/>
   <meshBasicMaterial color="#FF9942" transparent opacity={.12+.76*ignition}
      toneMapped={false} blending={THREE.AdditiveBlending} depthTest={false} depthWrite={false}/>
  </mesh>
  <pointLight color="#FF8D36" intensity={3.5*ignition} distance={2.0}/>
 </group>;
};
