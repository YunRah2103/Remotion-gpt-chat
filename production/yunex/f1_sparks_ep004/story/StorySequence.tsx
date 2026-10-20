import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import type {ShotId, StoryRequest} from '../shared/contract';
import {defaultTiming,storyLayers,storyLocation,type StoryTiming} from './beats';
import {getStoryVisualCue,type StoryVisualCue} from './visual-cues';
import {StoryOverlay,type ScreenAnchor,type WordCaption} from './StoryOverlay';
export type StorySequenceProps=Readonly<{
 /** Physics supplies the real data. This layer MUST NOT fabricate vehicle motion or sparks. */
 requestAt:(globalTimeSec:number,shot:ShotId,localSec:number,durationSec:number)=>StoryRequest;
 /** cue is purely editorial. The motion/contacts/particles remain authoritative. */
 renderShot:(request:StoryRequest,cue:StoryVisualCue)=>React.ReactNode;
 timing?:StoryTiming;
 startAtSec?:number;
 captions?:readonly WordCaption[];
 /** Source-gated contact captions override fixed sample labels only when provided. */
 captionForRequest?:(request:StoryRequest)=>string|undefined;
 metalSkidScreenAnchor?:(request:StoryRequest)=>ScreenAnchor|undefined;
 showLabels?:boolean;
 showCaptions?:boolean;
}>;
/** Same global time in all layers, so no car teleport. Captions live above the
 * shot blend so they don't ghost/double during camera match transitions. */
export const StorySequence:React.FC<StorySequenceProps>=({
 requestAt,renderShot,timing=defaultTiming,startAtSec=0,captions=[],captionForRequest,
 metalSkidScreenAnchor,showLabels=true,showCaptions=true
})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const globalTimeSec=frame/fps+startAtSec;
 const layers=storyLayers(globalTimeSec,timing);
 const active=storyLocation(globalTimeSec,timing);
 const activeReq=requestAt(globalTimeSec,active.shot,active.shotLocalSec,active.shotDurationSec);
 const physicsCaption=captionForRequest?.(activeReq);
 const realCaptions=physicsCaption===undefined?captions:physicsCaption?[{text:physicsCaption,startSec:globalTimeSec-.001,endSec:globalTimeSec+.1}]:[];
 if(activeReq.shot!==active.shot||Math.abs(activeReq.tSec-globalTimeSec)>.001)
  throw new Error('StoryRequest must match editorial shot and global physics time');
 return <AbsoluteFill style={{background:'#081018',overflow:'hidden'}}>
  {layers.map(layer=>{
    const req=requestAt(globalTimeSec,layer.shot,layer.shotLocalSec,layer.shotDurationSec);
    if(req.shot!==layer.shot)throw new Error('StoryRequest shot disagrees with editorial layer');
    if(Math.abs(req.tSec-globalTimeSec)>0.001)throw new Error('StoryRequest and scene must share global time');
    return <AbsoluteFill key={layer.shot} style={{opacity:layer.opacity}}>
     {renderShot(req,getStoryVisualCue(req))}
    </AbsoluteFill>;
  })}
  <StoryOverlay request={activeReq} globalTimeSec={globalTimeSec} width={width} height={height}
    captions={realCaptions} showLabels={showLabels} showCaptions={showCaptions}
    metalSkidScreenAnchor={metalSkidScreenAnchor?.(activeReq)}/>
 </AbsoluteFill>;
};
