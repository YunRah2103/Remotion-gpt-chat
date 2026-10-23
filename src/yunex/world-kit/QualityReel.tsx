import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {VehiclePreview,DrivingPreview} from './Showcase';
import type {VehicleVariant} from './catalog.ts';
/** A native turntable followed by a moving world shot for each family. */
export const VehicleQualityReel:React.FC=()=>{
 const {fps}=useVideoConfig(),frame=useCurrentFrame();
 const variants:VehicleVariant[]=['saloon','coupe','boxy-suv','formula-modern','sport-bike','box-truck','minivan'];
 const segment=3*fps,i=Math.min(variants.length-1,Math.floor(frame/segment)),local=frame-i*segment,driving=local>=1.5*fps;
 const start=i*segment+(driving?1.5*fps:0);
 return <Sequence key={`${i}-${driving}`} from={start} durationInFrames={1.5*fps}>
  {driving?<DrivingPreview variant={variants[i]} environment={i===3?'track':i===5?'industrial':'highway'} timeOfDay="day" seed={12}/>:<VehiclePreview variant={variants[i]} angle={.67}/>}
 </Sequence>;
};
