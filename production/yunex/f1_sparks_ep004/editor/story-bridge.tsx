/**
 * Agent 6 → approved Agent 5 story + awaiting Agent 3 camera seam.
 *
 * This bridge is NOT the final composition and DOES NOT create a camera.
 * Manager supplies the approved Agent 3 camera/geometry renderer only after
 * the camera source passes the independent integration gate.
 *
 * Spoken-word cuts live in editor/timing.ts, not Agent 5's fixture durations.
 * Narration time and truth-sampled source time remain separate for a verified
 * real-contact frame-zero spark flash-forward.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {StoryRequest} from '../shared/contract.ts';
import {buildRealStoryRequest} from './story-request.ts';
import {getStoryVisualCue,type StoryVisualCue} from '../story/visual-cues.ts';
import {StoryOverlay,type ScreenAnchor} from '../story/StoryOverlay.tsx';
import {chooseLabel} from '../story/StoryOverlay.tsx';
import type {VisualShotProps} from './PictureEdit.tsx';

export {buildRealStoryRequest} from './story-request.ts';

export type ApprovedCameraShotRenderer = (input: Readonly<{
  request:StoryRequest;
  cue:StoryVisualCue;
  /** Original recorded-voice timeline. DO NOT sample world physics with this. */
  voiceSec:number;
}>)=>React.ReactNode;

export type ApprovedSkidProjection=(request:StoryRequest)=>ScreenAnchor|undefined;

/**
 * A manager-injected Agent 3 camera renderer must actually draw the approved
 * Agent 1 hero, Agent 4 track and existing Agent 2 contact particles.
 * This adapter paints ONLY Agent 5 truthful light labels; Agent 6 PictureEdit
 * owns all single-pass actual timed narrator subtitles.
 */
export function makeApprovedStoryVisualShot(
  renderApprovedCameraShot: ApprovedCameraShotRenderer,
  projectApprovedMetalSkid?:ApprovedSkidProjection,
): React.FC<VisualShotProps> {
  if(typeof renderApprovedCameraShot !== 'function') {
    throw new Error('EP004 editor bridge: manager-approved Agent 3 camera renderer required');
  }
  const Render:React.FC<VisualShotProps>=(props)=>{
    const request=buildRealStoryRequest(props);
    const cue=getStoryVisualCue(request);
    const screenAnchor=projectApprovedMetalSkid?.(request);
    // Do NOT render METAL SKID label unless camera projected the real plate.
    // Agent 5's StoryOverlay can display truthful other physics labels.
    const canShowLabel=chooseLabel(request)!=='METAL SKID'
      || (screenAnchor?.object==='metal-skid'
        && Number.isFinite(screenAnchor.x01)
        && Number.isFinite(screenAnchor.y01)
        && screenAnchor.x01>.08 && screenAnchor.x01<.92
        && screenAnchor.y01>.13 && screenAnchor.y01<.72);
    return <AbsoluteFill>
      {renderApprovedCameraShot({request,cue,voiceSec:props.globalSec})}
      <StoryOverlay
        request={request}
        globalTimeSec={request.tSec}
        captions={[]}
        metalSkidScreenAnchor={screenAnchor}
        showLabels={canShowLabel}
        showCaptions={false}
        width={1080}
        height={1920}
      />
    </AbsoluteFill>;
  };
  return Render;
}
