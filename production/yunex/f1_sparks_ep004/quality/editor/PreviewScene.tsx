/** Video-only 758-frame WIP; NOT Cedar word-aligned or owner-approved. */
import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {reviewBeat,REVIEW_TOTAL_FRAMES} from './preview-plan.ts';
import {locateOriginalContactHook} from './hook.ts';
import {IntegratedBeat} from './IntegratedBeat.tsx';
export const EP004Agent13VideoOnlyReview:React.FC=()=>{
 const frame=useCurrentFrame();
 const {width,height,fps,durationInFrames}=useVideoConfig();
 if(width!==1080||height!==1920||fps!==30||durationInFrames!==REVIEW_TOTAL_FRAMES)
  throw Error('Agent13 expected precisely 758 frames at 1080x1920/30');
 const beat=reviewBeat(frame,locateOriginalContactHook().sourceSec);
 return <IntegratedBeat beat={beat}/>;
};
