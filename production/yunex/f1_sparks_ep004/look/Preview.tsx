/**
 * Agent 4 moving video fixtures; native 1080x1920, 30fps.
 * Reference vehicle is the immutable factory formula-modern kit until Agent 1 is integrated.
 * Dynamic contact sparks are NOT simulated or invented in this fixture.
 */
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {Composition, useCurrentFrame, useVideoConfig} from 'remotion';
import {createVehicle} from '../../../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../../../src/yunex/world-kit/motion.ts';
import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {sampleTrackSurface} from '../shared/track.ts';
import type {SparkParticle, VehicleMotionState, Vec3} from '../shared/contract.ts';
import {NightCircuitWorld} from './NightCircuitWorld.tsx';
import {applyNightCircuitFinish} from './finishes.ts';
import {sampleCircuitRoadPoint} from './road.ts';

export type LookPreviewMode = 'trackside-pass' | 'race-follow';
export type LookPreviewProps = {
  mode: LookPreviewMode;
  /** Accept approved global source inputs after Agent 1 + Agent 2 integration. */
  motion?: VehicleMotionState;
  particles?: readonly SparkParticle[];
  tStartSec?: number;
};

function posArray(v: THREE.Vector3): Vec3 {
  return [v.x, v.y, v.z];
}

const RacePreview3D: React.FC<{
  mode: LookPreviewMode;
  tSec: number;
  motion?: VehicleMotionState;
  particles: readonly SparkParticle[];
}> = ({mode, tSec, motion, particles}) => {
  const factoryCar = useMemo(() => applyNightCircuitFinish(createVehicle({
    variant: 'formula-modern',
    color: '#127b82',
    accent: '#e9a65c',
    wheelColor: '#b2bac0',
    lights: true,
    interior: false,
  })), []);
  useEffect(() => () => disposeObject(factoryCar), [factoryCar]);

  // Moving reference, NOT a second source of skid dynamics: the final
  // integration will pass the actual Agent 2 motion and Agent 1 hero instead.
  const baselineSpeed = mode === 'trackside-pass' ? 30 : 47;
  const distanceM = motion?.routeDistanceM ?? (mode === 'trackside-pass' ? 48 : 64) + baselineSpeed * tSec;
  const carRoute = sampleRoute('track', distanceM);
  const carHeight = sampleTrackSurface(distanceM).heightM;
  const world = motion?.worldPosition ?? [carRoute.position[0], carHeight, carRoute.position[2]];
  factoryCar.position.set(world[0], world[1], world[2]);
  factoryCar.rotation.order = 'YZX';
  factoryCar.rotation.set(0, motion?.yawRad ?? carRoute.yaw,
    motion?.pitchRad ?? Math.atan(sampleTrackSurface(distanceM).slopeMPerM));
  animateVehicle(factoryCar, distanceM, 0.018 * Math.sin(tSec * 0.75));

  // Camera position depends on moving route pose, never a rotating hero turntable.
  const chase = mode === 'race-follow';
  const eyeD = chase ? distanceM - 10.8 : distanceM + 4.5;
  const eyeLateral = chase ? -5.35 + 0.5 * Math.sin(tSec * 0.6) : -10.1;
  const eye = sampleCircuitRoadPoint(eyeD, eyeLateral);
  eye.y += chase ? 2.1 : 2.65;
  const ahead = sampleCircuitRoadPoint(distanceM + (chase ? 0.9 : -0.6), 0);
  const carTarget: Vec3 = [ahead.x, carHeight + 0.53, ahead.z];
  return <>
    <NightCircuitWorld tSec={tSec} motion={motion} particles={particles}/>
    <primitive object={factoryCar}/>
    <CameraAim position={posArray(eye)} target={carTarget} fov={chase ? 46 : 54}/>
  </>;
};

export const LookPreview: React.FC<LookPreviewProps> = ({
  mode, motion, particles = [], tStartSec = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const tSec = tStartSec + frame / fps;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{position: [70, 3, -9], fov: 48, near: 0.045, far: 320}}
      gl={{antialias: true, alpha: false, preserveDrawingBuffer: true}}
    >
      <RacePreview3D tSec={tSec} mode={mode} motion={motion} particles={particles}/>
    </ThreeCanvas>
  );
};

/** Composition registry isolated to Agent 4: does not touch manager entry. */
export const Agent4LookCompositions: React.FC = () => <>
  <Composition
    id="EP004Agent4Trackside"
    component={LookPreview}
    defaultProps={{mode: 'trackside-pass' as const}}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
  />
  <Composition
    id="EP004Agent4RaceFollow"
    component={LookPreview}
    defaultProps={{mode: 'race-follow' as const}}
    durationInFrames={210}
    fps={30}
    width={1080}
    height={1920}
  />
</>;
