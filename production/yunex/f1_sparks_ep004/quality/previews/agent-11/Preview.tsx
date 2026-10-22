/**
 * Agent 11 moving evidence, 30fps, true A2 contact and pre-made V2 formula hero.
 * This is a truthful ISOLATED fixture, not the approved integrated editor film.
 * The kit's NON-PHYSICAL spark effect and its generic skid visuals are hidden.
 */
import React, {useEffect, useMemo, useLayoutEffect} from 'react';
import * as T from 'three';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Composition, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraAim} from '../../../../../../src/yunex/world-kit/components.tsx';
import {disposeObject} from '../../../../../../src/yunex/world-kit/geometry.ts';
import {createCinematicVehicle, animateCinematicVehicle} from '../../../../../../src/yunex/modelling-kit/rig.ts';
import {sampleCircuitRoadPoint} from '../../../look/road.ts';
import {getSkidDescriptors} from '../../../mechanics/skids.ts';
import {sampleDynamics} from '../../../physics/dynamics.ts';
import {sampleContactDrivenSparks} from '../../../physics/sparks.ts';
import type {SparkParticle, VehicleMotionState, Vec3} from '../../../shared/contract.ts';
import {QualityNightCircuit} from '../../look/QualityNightCircuit.tsx';
import {applyQualityNightCarFinish} from '../../look/materials.ts';

type Mode = 'diagnostic' | 'cinematic';
const MAX_PARTICLES = 260;
const DEFAULT_START_M = 69;

/** Mirrors actual A2 particle samples; this is solely a diagnostic visualization. */
const ContactOnlyGlints: React.FC<{particles: readonly SparkParticle[]}> = ({particles}) => {
  const mesh = useMemo(() => {
    const obj = new T.InstancedMesh(
      new T.CylinderGeometry(1, 1, 1, 6),
      new T.MeshBasicMaterial({color: '#fff1b2', toneMapped: false, transparent: true, opacity: 0.94}),
      MAX_PARTICLES,
    );
    obj.name = 'A2-authoritative-particle-fixture';
    obj.frustumCulled = false;
    obj.count = 0;
    return obj;
  }, []);
  useEffect(() => () => {mesh.geometry.dispose(); (mesh.material as T.Material).dispose();}, [mesh]);
  useLayoutEffect(() => {
    const matrix = new T.Matrix4();
    const rotation = new T.Quaternion();
    const axis = new T.Vector3(0, 1, 0);
    const travel = new T.Vector3();
    const center = new T.Vector3();
    const scale = new T.Vector3();
    mesh.count = Math.min(MAX_PARTICLES, particles.length);
    particles.slice(0, MAX_PARTICLES).forEach((p, i) => {
      travel.fromArray(p.velocityWorld);
      if (travel.lengthSq() < 1e-8) travel.set(0, 1, 0);
      travel.normalize();
      rotation.setFromUnitVectors(axis, travel);
      center.fromArray(p.positionWorld);
      const radius = Math.max(0.003, Math.min(0.014, p.radiusM * 0.55));
      const velocity = Math.hypot(...p.velocityWorld);
      scale.set(radius, Math.min(0.22, 0.065 + velocity / 165), radius);
      matrix.compose(center, rotation, scale);
      mesh.setMatrixAt(i, matrix);
      const colour = new T.Color('#fff1c0').lerp(new T.Color('#f6a14a'),
        Math.min(1, p.ageSec / p.lifetimeSec));
      mesh.setColorAt(i, colour.multiplyScalar(Math.max(0.15, p.luminance01)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [mesh, particles]);
  return <primitive object={mesh}/>;
};

const MovingHero: React.FC<{motion: VehicleMotionState; frame: number; fps: number}> = ({
  motion, frame, fps,
}) => {
  const car = useMemo(() => applyQualityNightCarFinish(createCinematicVehicle({
    variant: 'formula-modern', quality: 'hero',
    color: '#088e93', accent: '#d7b578', wheelColor: '#8c9ca7',
    lights: true, interior: true, driver: false, optimize: true,
    paintPreset: 'lacquer', tyreType: 'slick',
  })), []);
  useEffect(() => () => disposeObject(car), [car]);
  // Every frame is an absolute replay of A2 dynamics. Never animate from a
  // previous rendered frame and never alter the 65mm/3-skid physics inputs.
  animateCinematicVehicle(car, {
    frame, fps, distance: motion.routeDistanceM,
    compression: 0, steer: 0,
  });
  car.position.set(...motion.worldPosition);
  car.rotation.order = 'YZX';
  car.rotation.set(motion.rollRad, motion.yawRad, motion.pitchRad);
  car.traverse(node => {
    if (node.name === 'contact-sparks' || node.name === 'metal-skid') {
      node.visible = false; // kit's generic emitters / misaligned skid meshes
    }
  });
  return <primitive object={car}/>;
};

const CameraMoving: React.FC<{motion: VehicleMotionState; secondShot: boolean}> = ({
  motion, secondShot,
}) => {
  const distance = motion.routeDistanceM;
  const eye = secondShot
    ? sampleCircuitRoadPoint(distance + 5.8, -3.7)
    : sampleCircuitRoadPoint(distance - 11.2, 4.1);
  eye.y += secondShot ? 1.55 : 2.1;
  const target: Vec3 = [
    motion.worldPosition[0], motion.worldPosition[1] + 0.48, motion.worldPosition[2],
  ];
  return <CameraAim position={eye.toArray() as [number, number, number]}
                    target={[...target] as [number, number, number]} fov={secondShot ? 47 : 43}/>;
};

const ProofFrame: React.FC<{mode: Mode}> = ({mode}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const diagnostic = mode === 'diagnostic';
  // Matching A/B distance/time: frame 0..89 day, 90..179 V2 night.
  const localFrame = diagnostic ? frame % 90 : frame;
  const sourceSec = localFrame / fps;
  const motion = sampleDynamics(sourceSec, {startDistanceM: DEFAULT_START_M});
  const {particles} = sampleContactDrivenSparks(sourceSec, motion, getSkidDescriptors());
  const daylight = diagnostic && frame < 90;
  const secondShot = !diagnostic && frame >= 120;
  return <AbsoluteFill style={{background: '#14232d'}}>
    <ThreeCanvas
      width={width} height={height} shadows
      gl={{antialias: true, alpha: false, preserveDrawingBuffer: true}}
      camera={{position: [0, 3, 0], fov: 48, near: 0.045, far: 320}}
    >
      <QualityNightCircuit motion={motion} particles={particles}
                           diagnosticDay={daylight} showEnvironment/>
      <MovingHero motion={motion} frame={localFrame} fps={fps}/>
      <ContactOnlyGlints particles={particles}/>
      <CameraMoving motion={motion} secondShot={secondShot}/>
    </ThreeCanvas>
    {diagnostic && <div style={{
      position:'absolute', top:85, left:52, padding:'12px 18px',
      fontSize:22, letterSpacing:2, fontWeight:700, color:'#d8e9e5',
      fontFamily:'Arial', background:'#11212cd9',
    }}>{daylight ? 'SAME PATH / DAY-LIGHTING REFERENCE' : 'SAME PATH / V2 NIGHT CINEMA'}</div>}
    <div style={{
      position:'absolute', bottom:92, left:58,
      fontSize:19, letterSpacing:1, fontFamily:'Arial',
      color:'#a9c8cc', background:'#101f2ac9', padding:'10px 13px',
    }}>
      KIT V2 LOOK · ORIGINAL A4 ROAD · AUTHENTIC A2 PARTICLES
    </div>
  </AbsoluteFill>;
};

export const Agent11Compositions: React.FC = () => <>
  <Composition id="EP004Agent11DayNight" component={ProofFrame}
    width={1080} height={1920} fps={30} durationInFrames={180}
    defaultProps={{mode: 'diagnostic' as const}}/>
  <Composition id="EP004Agent11NightCinema" component={ProofFrame}
    width={1080} height={1920} fps={30} durationInFrames={240}
    defaultProps={{mode: 'cinematic' as const}}/>
</>;
