/**
 * CarbonCeramic001 — five-shot, frame-deterministic vertical brake film.
 * Integration only: all A–D modules remain verbatim from their owned branches.
 * Heat is deliberately UNCALIBRATED illustrative false colour on the friction annulus.
 */
import React from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrakeAssembly} from './hardware/BrakeAssembly';
import {brakeStateAt} from './motion/brakeState';
import {
  BrakeLighting, GhostCarOutline,
  GHOST_FRONT_BRAKE_ANCHOR, brakeShotAt, brakeCameraAt,
} from './cinema';
import {PartLabels, TitleOverlays} from './graphics';
import {integrationStateAt} from './integration/integrationState';
import {IntegrationCameraRig} from './integration/IntegrationCameraRig';

/**
 * A's friction faces terminate at x=-0.0155m and +0.0155m.
 * The overlays sit just outside those surfaces, move rigidly with the rotor,
 * never attach to the caliper, and do not claim a measured temperature.
 */
const FrictionFalseColour: React.FC<{frame: number; heat01: number; rotorAngleRad: number}> = ({
  frame, heat01, rotorAngleRad,
}) => {
  const visible = frame >= 270 && frame < 630;
  const alpha = Math.max(0, Math.min(0.36, heat01 * 0.38));
  if (!visible || alpha < 0.012) return null;
  return <group name="IllustrativeFrictionHeat" rotation={[rotorAngleRad, 0, 0]}>
    {[-0.0158, 0.0158].map((x, i) =>
      <group key={i} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh name={'ThermalFrictionBand' + i} renderOrder={2}>
          <ringGeometry args={[0.127, 0.190, 128]}/>
          <meshBasicMaterial color="#ff8244" transparent opacity={alpha}
            depthWrite={false} depthTest side={THREE.DoubleSide} toneMapped={false}/>
        </mesh>
        <mesh name={'ThermalInnerBand' + i} position={[0, 0, i === 0 ? -0.00008 : 0.00008]} renderOrder={3}>
          <ringGeometry args={[0.127, 0.146, 128]}/>
          <meshBasicMaterial color="#ffb35b" transparent opacity={alpha * 0.29}
            depthWrite={false} depthTest side={THREE.DoubleSide} toneMapped={false}/>
        </mesh>
      </group>)}
  </group>;
};

export const CarbonCeramic001: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const motion = brakeStateAt(frame);
  const state = integrationStateAt(frame);
  const shot = brakeShotAt(frame);
  const context = shot === 'context';
  const pos = GHOST_FRONT_BRAKE_ANCHOR;
  const cameraPose = brakeCameraAt(frame);
  // Keep the real rotor centroid aligned to C's changing thermal camera target.
  // This compensates for dolly/orbit perspective without changing C's camera code.
  const brakePosition: [number,number,number] = context ?
    [pos[0], pos[1], pos[2]] :
    shot === 'thermal' ?
      [cameraPose.target[0], cameraPose.target[1], cameraPose.target[2]] :
      shot === 'hero' ? [-0.035, 0, 0.035] :
      [0, 0, 0];

  return <AbsoluteFill style={{backgroundColor: '#080f19', overflow: 'hidden'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position: [1.3, .6, .9], fov: 33, near: .012, far: 75}}
      gl={{antialias: true, preserveDrawingBuffer: true}}>
      <IntegrationCameraRig frame={frame}/>
      <BrakeLighting frame={frame} heat01={motion.heat01} background ground={false}/>
      {!context && <directionalLight position={[.65,.55,.95]} color="#c8deec" intensity={1.1}/>}
      {!context && <pointLight position={[.35,.25,.45]} color="#f0c9a0" intensity={0.36} distance={2} decay={2}/>}
      {context && <GhostCarOutline frame={frame}/>}
      {/* Stable macro framing: C's shot target, not a guessed static offset.
          Geometry, independent X-axis pads and fixed caliper are unmodified. */}
      <group scale={shot === 'thermal' ? 0.56 : shot === 'reveal' ? 0.86 : shot === 'hero' ? 0.90 : 1}
        position={brakePosition}>
        <BrakeAssembly rotorAngleRad={state.rotorAngleRad}
          padGapMetres={state.padGapMetres} heat01={motion.heat01}
          showUpright/>
        {!context && <FrictionFalseColour frame={frame}
          heat01={motion.heat01} rotorAngleRad={state.rotorAngleRad}/>}
      </group>
    </ThreeCanvas>
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 30,
      background: 'linear-gradient(180deg, rgba(3,8,14,.25) 0%, transparent 28%, transparent 73%, rgba(2,7,12,.35) 100%)'}}/>
    <TitleOverlays frame={frame}/>
    <PartLabels frame={frame} showLeaderLines={false}/>
  </AbsoluteFill>;
};

export default CarbonCeramic001;
