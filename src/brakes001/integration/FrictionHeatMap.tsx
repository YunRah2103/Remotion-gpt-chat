/**
 * Agent E illustrative brake temperature presentation.
 * Per-sector attenuation is re-evaluated against world-space pad position:
 * the rings rotate as rotor children, but the hot friction patch remains near
 * the fixed caliper. No temperature is measured or simulated.
 */
import React from 'react';
import * as THREE from 'three';
import {brakeStateAt} from '../motion/brakeState';

const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
const wrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));

/** E-only perceptual gain, never an engineering temperature prediction. */
export const illustrativeHeatGainAt=(frame:number):number=>{
  const b=brakeStateAt(frame);
  if(frame<270||frame>=630)return 0;
  const firstCycle=frame<450;
  const grow=firstCycle?smooth((frame-278)/53):smooth((frame-460)/66);
  const release=firstCycle?1-.65*smooth((frame-384)/58):1-.55*smooth((frame-587)/40);
  return clamp(b.heat01)*grow*release*(.34+.66*clamp(b.brakePressure01));
};
export const frictionHotSpot01At=(frame:number,worldAngle:number):number=>{
  const centre=2.34; // Near A's static caliper sector (+Y,+Z).
  const delta=wrap(worldAngle-centre);
  const patch=Math.exp(-.5*Math.pow(delta/.59,2));
  // 20% warm swept track plus local patch, never a solid-orange disc.
  return illustrativeHeatGainAt(frame)*(.14+.86*patch);
};

export const FrictionHeatMap:React.FC<{frame:number;rotorAngleRad:number}>=({
  frame,rotorAngleRad
})=>{
  if(frame<270||frame>=630||illustrativeHeatGainAt(frame)<.012)return null;
  const sectors=24;
  return <group name="IllustrativeFrictionHeat" rotation={[rotorAngleRad,0,0]}>
    {[-.0158,.0158].map((x,side)=>
      <group key={side} position={[x,0,0]} rotation={[0,Math.PI/2,0]}>
        {Array.from({length:sectors},(_,i)=>{
          const start=i*2*Math.PI/sectors;
          const worldTheta=start+Math.PI/sectors+rotorAngleRad;
          const intensity=frictionHotSpot01At(frame,worldTheta);
          const localAlpha=Math.min(.62,.62*intensity);
          return <group key={i}>
            <mesh renderOrder={3} name={'ThermalFrictionSector_'+side+'_'+i}>
              <ringGeometry args={[.127,.190,5,1,start,2*Math.PI/sectors+.001]}/>
              <meshBasicMaterial color={intensity>.38?'#f79151':'#bd7555'}
                transparent opacity={localAlpha} depthWrite={false}
                depthTest side={THREE.DoubleSide} toneMapped={false}/>
            </mesh>
            <mesh position={[0,0,side===0?-.00009:.00009]} renderOrder={4}>
              <ringGeometry args={[.133,.164,4,1,start,2*Math.PI/sectors+.001]}/>
              <meshBasicMaterial color="#ffbd83" transparent opacity={localAlpha*.25}
                depthWrite={false} depthTest side={THREE.DoubleSide}/>
            </mesh>
          </group>;
        })}
      </group>)}
  </group>;
};
