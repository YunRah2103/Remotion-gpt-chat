import React from 'react';
import type {RaceFrameState} from '../contract.ts';
import {CameraAim} from '../../world-kit/components';
import {getRaceCamera} from './cameras.ts';
import type {CinematicShotId} from './cameras.ts';

export type RaceCameraRigProps={
 shot:CinematicShotId;
 state:RaceFrameState;
 frame:number;
};
/** Film-editor integration point: render this inside a ThreeCanvas with the A2 state. */
export const RaceCameraRig:React.FC<RaceCameraRigProps>=({shot,state,frame})=>{
 const view=getRaceCamera(shot,state,frame);
 return <CameraAim position={view.position} target={view.target} fov={view.fov}/>;
};
