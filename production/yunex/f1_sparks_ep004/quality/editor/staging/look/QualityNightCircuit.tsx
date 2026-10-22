/**
 * Agent 11 / isolated EP004 lookdev interface.
 *
 * IMPORTANT COMPOSITION ORDER:
 * 1) A4 NightCircuitWorld supplies its already physics-matched asphalt,
 *    kerbs, A4 architecture and the ONLY A2-derived spark bounce lights.
 * 2) V2 kit adds OFF-ROAD dressing ONLY.
 * 3) QualityLighting supplies V2 night reflections/keying.
 * Never mount the unfiltered createCinematicEnvironment root in this scene.
 */
import React, {useEffect, useMemo} from 'react';
import * as T from 'three';
import {CinematicLighting} from '../../../../../../../src/yunex/modelling-kit/Lighting.tsx';
import {disposeObject} from '../../../../../../../src/yunex/world-kit/geometry.ts';
import {NightCircuitWorld} from '../../../../look/NightCircuitWorld.tsx';
import type {SparkParticle, VehicleMotionState, Vec3} from '../../../../shared/contract.ts';
import {createQualityKitDressing, assertNoAdditionalRoad} from 'kit-dressing.ts';
import {QUALITY_NIGHT, qualityWetness, validatedSparkGain} from 'palette.ts';

export type QualityNightCircuitProps = {
  motion?: VehicleMotionState;
  /** Fixture fallback only; never used to invent contact events. */
  referenceDistanceM?: number;
  /** MUST be authoritative A2 particles; no synthetic particles are made here. */
  particles?: readonly SparkParticle[];
  /** Night remains default; daylight is for identical-path diagnostic only. */
  diagnosticDay?: boolean;
  wetness?: number;
  sparkLightGain?: number;
  showEnvironment?: boolean;
};

export const QualityLighting: React.FC<{
  focus?: Vec3;
  diagnosticDay?: boolean;
}> = ({focus = [0, 0, 0], diagnosticDay = false}) => {
  // V2 kit lighting and PMREM reflections, deterministic from current motion.
  // Existing A4 night fixtures remain world-anchored and do not strobe.
  return <CinematicLighting timeOfDay={diagnosticDay ? 'day' : 'night'} focus={[...focus] as [number, number, number]}/>;
};

export const QualityNightCircuit: React.FC<QualityNightCircuitProps> = ({
  motion, referenceDistanceM, particles = [], diagnosticDay = false,
  wetness = QUALITY_NIGHT.kitWetness,
  sparkLightGain = QUALITY_NIGHT.sparkLightGain, showEnvironment = true,
}) => {
  qualityWetness(wetness);
  validatedSparkGain(sparkLightGain);
  const dressing = useMemo(() => {
    const result = createQualityKitDressing(wetness);
    assertNoAdditionalRoad(result);
    return result;
  }, [wetness]);
  useEffect(() => () => disposeObject(dressing), [dressing]);
  const focus: Vec3 = motion?.worldPosition ?? [0, 0, 0];
  return <>
    <NightCircuitWorld
      motion={motion}
      referenceDistanceM={referenceDistanceM}
      particles={particles}
      exposure={sparkLightGain}
      showEnvironment={showEnvironment}
    />
    {showEnvironment && <primitive object={dressing}/>}
    <QualityLighting focus={focus} diagnosticDay={diagnosticDay}/>
  </>;
};
