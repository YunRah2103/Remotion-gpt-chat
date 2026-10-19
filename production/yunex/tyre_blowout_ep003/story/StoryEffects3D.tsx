import React from 'react';
import type {StoryRequest} from '../shared/contract.ts';
import {sampleStoryVisuals} from './state.ts';

/**
 * Mount inside the existing ThreeCanvas, alongside the REAL vehicle/wheel mesh.
 * The effect neither replaces tyre geometry nor alters authoritative vehicle pose.
 */
export const StoryEffects3D: React.FC<{request: StoryRequest; showForce?: boolean}> =
({request, showForce = true}) => {
  const s = sampleStoryVisuals(request);
  const d = request.dynamics;
  const t = request.tSec;
  const contact = d.wheels['front-right'].contactFraction;
  const contactScale = contact === undefined ? .72 : Math.max(.15, Math.min(1, contact));
  const particles = s.releaseMist01 > .005 ? Array.from({length: 22}, (_, i) => {
    // Fixed quasi-uniform seeds; deterministic for out-of-order Remotion frames.
    const u = ((i * 0.61803398875) % 1);
    const v = ((i * 0.75487766625) % 1);
    const distance = ((t * (1.5 + u) + i * .041) % .80);
    const fade = Math.max(0, (1 - distance / .80) * s.releaseMist01);
    return {i,
      x: -distance * (.65 + u * .42),
      y: -.085 + (v - .5) * (.18 + distance * .24),
      z: -.15 - distance * (.8 + v * .45),
      radius: .009 + .015 * (1 - u),
      fade};
  }) : [];

  return <>
    {/* Low-contrast pressure contours orbit the existing failed wheel, not a fake wheel. */}
    {s.segment === 'pressure' && s.pressureLoss01 > .03 &&
      <group position={s.wheelCenterM}>
        <mesh position={[0,0,-.21]} scale={1 + s.deformation01 * .085}>
          <torusGeometry args={[s.wheelRadiusM * .96,.006,5,64]}/>
          <meshBasicMaterial color="#E7BA83" opacity={s.pressureLoss01 * .47}
            transparent depthWrite={false}/>
        </mesh>
        <mesh position={[0,0,-.245]} scale={1 + .10 * s.pressureLoss01}>
          <torusGeometry args={[s.wheelRadiusM*.74,.0028,4,64]}/>
          <meshBasicMaterial color="#D7F0E9" opacity={s.releaseMist01 * .30}
            transparent depthWrite={false}/>
        </mesh>
      </group>}
    {/* Real wheel hub anchors every vent particle; airflow trails backward (-X) and outward (-Z). */}
    {particles.length > 0 && <group position={s.wheelCenterM}>
      {particles.map(p => <mesh key={p.i}
        position={[p.x,p.y,p.z]}>
        <sphereGeometry args={[p.radius,6,5]}/>
        <meshBasicMaterial color="#E5F4F5" opacity={p.fade*.72}
          transparent depthWrite={false}/>
      </mesh>)}
    </group>}
    {/* Contact patch proxy only: positioned beneath authoritative hub (road plane y=0). */}
    {(s.segment === 'pressure' || s.segment === 'forces') && s.contactGlow01 > .08 &&
      <mesh position={[s.wheelCenterM[0],.009,s.wheelCenterM[2]]}
        rotation={[-Math.PI / 2,0,d.yawRad]}
        scale={[Math.max(.35,s.wheelRadiusM*2.0)*contactScale,
          Math.max(.25,s.wheelRadiusM*.95),1]}>
        <circleGeometry args={[1,32]}/>
        <meshBasicMaterial color="#E9B477" transparent depthWrite={false}
          opacity={Math.min(.23,s.contactGlow01*.24)}/>
      </mesh>}
    {/* Force direction appears ONLY with four real wheel force values. +Z = vehicle-left. */}
    {showForce && s.lateralCue && <group
      position={[d.positionM[0],.055,d.positionM[2]]} rotation={[0,d.yawRad,0]}>
      <mesh position={[0,0,s.lateralCue.side*s.lateralCue.lengthM/2]}
        rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[.011,.011,s.lateralCue.lengthM,8]}/>
        <meshBasicMaterial color="#9FD9D0" transparent opacity={.57} depthWrite={false}/>
      </mesh>
      <mesh position={[0,0,s.lateralCue.side*s.lateralCue.lengthM]}
        rotation={[s.lateralCue.side*Math.PI/2,0,0]}>
        <coneGeometry args={[.055,.14,12]}/>
        <meshBasicMaterial color="#9FD9D0" transparent opacity={.68} depthWrite={false}/>
      </mesh>
    </group>}
  </>;
};
