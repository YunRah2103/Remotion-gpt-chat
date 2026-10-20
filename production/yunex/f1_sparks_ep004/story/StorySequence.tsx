import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import type {ShotId, StoryRequest} from '../shared/contract';
import {defaultTiming,storyLayers,type StoryTiming} from './beats';
import {StoryOverlay,type ScreenAnchor,type WordCaption} from './StoryOverlay';
export type StorySequenceProps=Readonly<{
 /** Physics supplies the real data. This layer MUST NOT fabricate vehicle motion or sparks. */
 requestAt:(globalTimeSec:number,shot:ShotId,localSec:number,durationSec:number)=>StoryRequest;
 renderShot:(request:StoryRequest)=>React.ReactNode;
 timing?:StoryTiming;
 startAtSec?:number;
 captions?:readonly WordCaption[];
 metalSkidScreenAnchor?:(request:StoryRequest)=>ScreenAnchor|undefined;
 showLabels?:boolean;
 showCaptions?:boolean;
}>;
/** Shot-local handle is passed unchanged; editor may change any duration after VO analysis.
 * Both transition layers evaluate exactly the SAME globalTimeSec, so no car teleport. */
export const StorySequence:React.FC<StorySequenceProps>=({
 requestAt,renderShot,timing=defaultTiming,startAtSec=0,captions=[],
 metalSkidScreenAnchor,showLabels=true,showCaptions=true
})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const globalTimeSec=frame/fps+startAtSec;
 const layers=storyLayers(globalTimeSec,timing);
 return <AbsoluteFill style={{background:'#081018',overflow:'hidden'}}>
  {layers.map(layer=>{
    const req=requestAt(globalTimeSec,layer.shot,layer.shotLocalSec,layer.shotDurationSec);
    if(req.shot!==layer.shot)throw new Error('StoryRequest shot disagrees with editorial layer');
    if(Math.abs(req.tSec-globalTimeSec)>0.001)throw new Error('StoryRequest and scene must share global time');
    return <AbsoluteFill key={layer.shot} style={{opacity:layer.opacity}}>
     {renderShot(req)}
     <StoryOverlay request={req} globalTimeSec={globalTimeSec} width={width} height={height}
       captions={captions} showLabels={showLabels} showCaptions={showCaptions}
       metalSkidScreenAnchor={metalSkidScreenAnchor?.(req)}/>
    </AbsoluteFill>;
  })}
 </AbsoluteFill>;
};
