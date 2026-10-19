import React, {useEffect, useMemo} from 'react';
import * as T from 'three';
import type {VehicleDynamicsFrame, WheelId} from '../shared/contract.ts';

/**
 * Conservative deterministic near-ground ambient occlusion.
 * Not dust, a tyre skid, a simulated contact force, or a fake cast shadow.
 * The real shadow map remains authoritative for directional lighting.
 */
const WHEELS:readonly WheelId[]=['front-left','front-right','rear-left','rear-right'];
const SHADOW_SIZE=64;

export function makeContactAlphaTexture():T.DataTexture {
  const data=new Uint8Array(SHADOW_SIZE*SHADOW_SIZE*4);
  for(let y=0;y<SHADOW_SIZE;y++)for(let x=0;x<SHADOW_SIZE;x++){
    const u=(x+.5-SHADOW_SIZE*.5)/(SHADOW_SIZE*.5);
    const v=(y+.5-SHADOW_SIZE*.5)/(SHADOW_SIZE*.5);
    const rad=Math.hypot(u,v);
    const a=Math.max(0,1-rad);
    const smooth=a*a*(3-2*a);
    const value=Math.round(255*smooth*smooth);
    const i=(y*SHADOW_SIZE+x)*4;
    // Three MeshBasicMaterial alphaMap reads the GREEN channel.
    data[i]=data[i+1]=data[i+2]=value;
    data[i+3]=255;
  }
  const texture=new T.DataTexture(data,SHADOW_SIZE,SHADOW_SIZE,T.RGBAFormat);
  texture.colorSpace=T.NoColorSpace;
  texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;
  texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;
  texture.generateMipmaps=false;texture.needsUpdate=true;
  return texture;
}

export const ContactOcclusion:React.FC<{dynamics:VehicleDynamicsFrame}>=({dynamics})=>{
  const alpha=useMemo(makeContactAlphaTexture,[]);
  useEffect(()=>()=>alpha.dispose(),[alpha]);
  const p=dynamics.positionM;
  // Road-relative, never rotates with body roll, and never intersects the paint.
  // 1.3cm above asphalt prevents z-fighting on the original highway and refuge.
  return <group>
    <mesh position={[p[0],.013,p[2]]} rotation={[-Math.PI/2,0,0]}
      scale={[4.4,2.18,1]} renderOrder={2}>
      <planeGeometry args={[1,1]}/>
      <meshBasicMaterial color="#182126" alphaMap={alpha} transparent
        opacity={.25} depthWrite={false} polygonOffset polygonOffsetFactor={-1}/>
    </mesh>
    {WHEELS.map(id=>{
      const w=dynamics.wheels[id];
      const support=Math.max(0.30,Math.min(1,w.contactFraction??1));
      const radius=Math.max(.23,Math.min(.43,w.rollingRadiusM));
      return <mesh key={id} position={[w.hubWorldM[0],.018,w.hubWorldM[2]]}
        rotation={[-Math.PI/2,0,0]} scale={[radius*1.9,.65,1]} renderOrder={3}>
        <planeGeometry args={[1,1]}/>
        <meshBasicMaterial color="#10171a" alphaMap={alpha} transparent
          opacity={.34*support} depthWrite={false} polygonOffset polygonOffsetFactor={-1}/>
      </mesh>;
    })}
  </group>;
};
