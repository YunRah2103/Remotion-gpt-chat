/**
 * PROVISIONAL STORY-DEPARTMENT FIXTURE — NOT AGENT 2 VEHICLE PHYSICS.
 * Replace this in final camera and edit previews with sampleDynamics/sampleTyreFailure.
 * Numbers are scenario illustration inputs, NEVER publish as measurements.
 */
import {EP003_SCENE, assertEpisodeTime} from '../../shared/contract.ts';
import type {StoryRequest, VehicleDynamicsFrame, TyreFrame, WheelId, WheelFrame} from '../../shared/contract.ts';
import {clamp01} from '../../story/state.ts';

export function samplePreviewFixture(tSec:number, segment:StoryRequest['segment']):StoryRequest {
  assertEpisodeTime(tSec);
  const start = EP003_SCENE.referenceFailureStartSec;
  const p = clamp01((tSec - start) / EP003_SCENE.referencePressureFallSec);
  const slowing = Math.max(0,tSec - 2);
  const speed = Math.max(0, EP003_SCENE.illustrativeInitialSpeedMps - 2.1 * slowing);
  const distance = EP003_SCENE.illustrativeInitialSpeedMps*tSec - 1.05*slowing*slowing;
  const x = -92 + distance;
  // Tiny transient yaw is ONLY a preview animation device, not a physical solution.
  const yaw = -.026 * p * Math.exp(-Math.max(0,tSec-1.4)/2);
  const z = -1.85;
  const wheelPositions:Record<WheelId,readonly [number,number]> = {
    'front-left':[1.46,.88], 'front-right':[1.46,-.88],
    'rear-left':[-1.46,.88], 'rear-right':[-1.46,-.88]
  };
  const radius = EP003_SCENE.wheelRadiusM;
  const wheels = {} as Record<WheelId,WheelFrame>;
  (Object.keys(wheelPositions) as WheelId[]).forEach(wheel => {
    const [ax,az] = wheelPositions[wheel];
    const failed = wheel === 'front-right';
    const compression = failed ? .08*p : 0;
    wheels[wheel] = {
      wheel, hubWorldM:[
        x + ax*Math.cos(yaw) + az*Math.sin(yaw),
        radius - compression,
        z - ax*Math.sin(yaw) + az*Math.cos(yaw)
      ], steeringRad:ax>0 ? .014*p : 0,
      spinRad:-distance/(radius-compression),
      rollingRadiusM:radius-compression,
      verticalCompressionM:compression,
      contactFraction:failed ? 1 - .38*p : 1,
      // Solely to exercise signed-force drawing. Remove when Agent 2 is available.
      lateralForceN: failed ? -350*p : 65*p,
    };
  });
  const stage:VehicleDynamicsFrame['stage'] =
    tSec<start?'pre-failure':p<1?'rapid-deflation':
    tSec<2.1?'initial-stabilisation':'gradual-slowdown';
  const dynamics:VehicleDynamicsFrame = {
    tSec,positionM:[x,0,z],yawRad:yaw,pitchRad:0,rollRad:.008*p,
    worldSpeedMps:speed,distanceTravelledM:distance,
    driverSteerRad:stage==='initial-stabilisation' || stage==='gradual-slowdown' ? .014*p : 0,
    driverThrottle01:tSec<2.1?.3:Math.max(0,.3-(tSec-2.1)*.05),
    driverBrake01:tSec<2.1?0:clamp01((tSec-2.1)*.03),
    wheels,stage
  };
  const tyre:TyreFrame = {
    tSec,failureProgress:p,pressureRatio:1-.72*p,
    sidewallCompression:.64*p,treadSeparation:0,
    angularPhaseRad:wheels['front-right'].spinRad,
    effectiveRadiusM:radius-.08*p,
  };
  return {tSec,segment,dynamics,tyre};
}
