import React from 'react';
import {Vehicle} from '../../world-kit/components';
import {RACE_COLORS} from '../contract.ts';
import type {RaceCarId,RaceFrameState,RacePose} from '../contract.ts';
import {FORMULA_RIG,steerFromCurvature} from './motion.ts';
export {FORMULA_RIG,steerFromCurvature,wheelRotationFromTravel,PREVIEW_SPEED_MPS,samplePreviewCar,samplePreviewRaceFrame} from './motion.ts';

export type RaceVehicleProps={id:RaceCarId;pose:RacePose;travelDistanceM:number;steerRad?:number};
/** Reuse the identical approved World Kit formula-modern model twice. */
export const RaceVehicle:React.FC<RaceVehicleProps>=({id,pose,travelDistanceM,steerRad})=>
  <Vehicle variant={FORMULA_RIG.variant}
    color={RACE_COLORS[id]} accent={id==='shortcut'?'#d9ffef':'#ffdab1'}
    wheelColor="#adb7ba" lights
    distance={travelDistanceM}
    steer={steerRad??steerFromCurvature(pose.curvatureInvM)}
    pose={{position:pose.position,yaw:pose.yaw}}/>;

/** Authoritative A2 world pose, wheel travel, and steering always take precedence. */
export const RaceCars:React.FC<{state:RaceFrameState}>=({state})=><>
  <RaceVehicle id="shortcut" pose={state.cars.shortcut.worldPose}
    travelDistanceM={state.cars.shortcut.travelDistanceM}
    steerRad={state.cars.shortcut.steerRad}/>
  <RaceVehicle id="racing" pose={state.cars.racing.worldPose}
    travelDistanceM={state.cars.racing.travelDistanceM}
    steerRad={state.cars.racing.steerRad}/>
</>;
