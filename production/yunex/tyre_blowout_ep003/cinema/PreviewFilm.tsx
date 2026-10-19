import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {CinematicScene} from './scene.tsx';
import {samplePreviewState} from './previewState.ts';
/** Native previews use Agent 2 physics, Agent 1 rubber, Agent 4 daylight/refuge.
 * Departments' sources are hydrated by the dedicated CI render workflow. */
export const CameraPreviewFilm:React.FC<{mode:'opening'|'montage'}>=({mode})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const state=samplePreviewState(frame/fps,mode);
 return <CinematicScene dynamics={state.dynamics} tyre={state.tyre}
  tSec={state.sourceTimeSec} shot={state.cut.shot} shotProgress01={state.progress01}
  width={width} height={height} previewCosmeticOnly={false}/>;
};
