/**
 * FINAL-ONLY gate; this composition cannot render if real EP004 Cedar recording,
 * verified per-word marks or Agent0/owner approvals are absent. Video-only preview
 * uses PreviewScene.tsx and never pretends to contain original narration.
 */
import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {IntegratedBeat} from './IntegratedBeat.tsx';
import {QualitySubtitleOverlay} from './staging/graphics/QualitySubtitleOverlay.tsx';
import {locateOriginalContactHook} from './hook.ts';
import {PHYSICAL_BEATS} from './staging/cinema/shot-plan.ts';
import {captionAtFrame,shotAtFrame,missingPicturePrerequisites,
 type PicturePlan,type ReadinessInput} from './timing.ts';

export type VoiceEditProps=Readonly<{
 plan:PicturePlan;
 readiness:ReadinessInput;
 acceptedQualityAgents:readonly number[];
 originalAudioSha256:string;
 showCaptions?:boolean;
}>;
export const EP004OriginalCedarPicture:React.FC<VoiceEditProps>=({
 plan,readiness,acceptedQualityAgents,originalAudioSha256,showCaptions=true
})=>{
 const missing=missingPicturePrerequisites(readiness);
 for(const n of [8,9,10,11,12]){
  if(!acceptedQualityAgents.includes(n))missing.push('Agent '+n+' director/owner quality acceptance');
 }
 if(!/^[a-f\d]{64}$/i.test(originalAudioSha256))
  missing.push('exact SHA-256 of original MP3 recording');
 if(missing.length)throw Error('EP004 original Cedar picture NOT AUTHORIZED: '+missing.join('; '));
 const frame=useCurrentFrame(),{width,height,fps,durationInFrames}=useVideoConfig();
 if(width!==1080||height!==1920||fps!==30||durationInFrames!==plan.totalFrames)
  throw Error('Voice-locked native film must have ffprobe-derived exact full Cedar frame count');
 const cut=shotAtFrame(frame,plan.cuts);
 const localSec=(frame-cut.startFrame)/fps;
 const durationSec=cut.durationFrames/fps;
 const physical=PHYSICAL_BEATS.find(p=>p.shot===cut.shot);
 if(!physical)throw Error('Missing reviewed physical source for '+cut.shot);
 // Semantic cut changes only editorial camera/shot. All V2 visual departments
 // sample the same ORIGINAL A2 dynamics/road/contacts/particles at this time.
 const sourceIn=cut.shot==='spark-hook'
  ?locateOriginalContactHook().sourceSec
  :cut.sourceStartSec??physical.sourceInSec;
 const sourceSec=sourceIn+localSec*(cut.shot==='spark-hook'?.43:physical.sourceRate);
 const aeroLoad01=cut.shot==='aero-load'
  ?.5+.5*Math.max(0,Math.min(1,(localSec/durationSec-.17)/.68)):1;
 const beat={shot:cut.shot,localSec,durationSec,sourceSec,
  startDistanceM:physical.startDistanceM,aeroLoad01};
 const cue=captionAtFrame(frame,plan.captions);
 return <AbsoluteFill style={{background:'#061019',overflow:'hidden'}}>
  <IntegratedBeat beat={beat}/>
  <Audio src={staticFile('ep004-agent13-original-cedar.mp3')} volume={1}/>
  {showCaptions&&<QualitySubtitleOverlay
   words={plan.words} caption={cue} frame={frame} fps={fps}
   timingStatus="verified-original-ep004"/>}
 </AbsoluteFill>;
};
