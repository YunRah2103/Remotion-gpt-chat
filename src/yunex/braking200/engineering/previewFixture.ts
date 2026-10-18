import type {BrakingSimulationState,WheelKey,WheelBrakingState} from '../contracts.ts';
import {wheelAnchors} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';

/**
 * DEMONSTRATION ONLY — temporary deterministic state for agent-only moving
 * previews until Agent 2's sampler lands. Never import from the final film.
 * It is NOT a stopping distance claim or production physics implementation.
 */
export function sampleBrakePreviewFixture(seconds: number): BrakingSimulationState {
  const t=Math.max(0,Math.min(6.9,Number.isFinite(seconds)?seconds:0));
  const initialMps=200/3.6;
  const decel=8.0;
  const speed=Math.max(0,initialMps-decel*t);
  const traveled=initialMps*t-.5*decel*t*t;
  const pressure=Math.min(1,Math.max(0,(t-.12)/.44));
  const spec=vehicleSpec('grand-tourer');
  const wheels={} as Record<WheelKey,WheelBrakingState>;
  const mass=1580,g=9.81,cgHeight=.53;
  const transfer=mass*decel*cgHeight/spec.wheelbase;
  for(const anchor of wheelAnchors(spec)){
    const front=anchor.axle==='front';
    wheels[anchor.id]={
      angularSpeedRadPerSec:-speed/anchor.radiusM,
      rotationRad:-traveled/anchor.radiusM,
      slipRatio:0,
      normalLoadN:(mass*g/2+(front?transfer:-transfer))/2,
      roadLongitudinalForceN:-mass*decel/4,
      brakePressure01:pressure,
      absIntervening:false,
    };
  }
  return {
    simTimeSec:t,speedMps:speed,traveledM:traveled,
    decelerationMps2:decel,
    pitchRad:.023*pressure,
    wheel:wheels,
    brakeHeatJ:0,
  };
}
