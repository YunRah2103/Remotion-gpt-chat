import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {CinematicScene} from './scene.tsx';
import {fixtureDynamics,fixtureTyre} from './fixture.ts';
import {OPENING_CUTS,MONTAGE_CUTS,selectCut} from './cameras.ts';
/** Camera blocking only: actual world kit model + temporary demo trajectory. */
export const CameraPreviewFilm:React.FC<{mode:'opening'|'montage'}>=({mode})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const tSec=frame/fps;
 const {cut,progress01}=selectCut(tSec,mode==='opening'?OPENING_CUTS:MONTAGE_CUTS);
 return <CinematicScene dynamics={fixtureDynamics(tSec)} tyre={fixtureTyre(tSec)}
  tSec={tSec} shot={cut.shot} shotProgress01={progress01}
  width={width} height={height} previewCosmeticOnly/>;
};
