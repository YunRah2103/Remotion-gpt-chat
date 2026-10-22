/** Agent13 isolated Remotion entry; does not modify global compositions. */
import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {EP004Agent13VideoOnlyReview} from './PreviewScene.tsx';
import {EP004OriginalCedarPicture,type VoiceEditProps} from './VoicePicture.tsx';
import {REVIEW_TOTAL_FRAMES} from './preview-plan.ts';
const Voiced:React.FC<Partial<VoiceEditProps>>=(props)=>{
 if(!props.plan||!props.readiness||!props.acceptedQualityAgents||
   !props.originalAudioSha256)throw Error('Original Cedar plan/word marks and source approvals required');
 return <EP004OriginalCedarPicture
   plan={props.plan} readiness={props.readiness}
   acceptedQualityAgents={props.acceptedQualityAgents}
   originalAudioSha256={props.originalAudioSha256}
   showCaptions/>;
};
const Clean:React.FC<Partial<VoiceEditProps>>=(props)=>{
 if(!props.plan||!props.readiness||!props.acceptedQualityAgents||
   !props.originalAudioSha256)throw Error('Original Cedar plan/word marks and source approvals required');
 return <EP004OriginalCedarPicture
   plan={props.plan} readiness={props.readiness}
   acceptedQualityAgents={props.acceptedQualityAgents}
   originalAudioSha256={props.originalAudioSha256}
   showCaptions={false}/>;
};
const Root:React.FC=()=> <>
 <Composition id="EP004Agent13VideoOnlyReview"
   component={EP004Agent13VideoOnlyReview}
   durationInFrames={REVIEW_TOTAL_FRAMES} fps={30} width={1080} height={1920}/>
 <Composition id="EP004Agent13OriginalCedarCaptioned"
   component={Voiced} durationInFrames={REVIEW_TOTAL_FRAMES}
   fps={30} width={1080} height={1920}/>
 <Composition id="EP004Agent13OriginalCedarClean"
   component={Clean} durationInFrames={REVIEW_TOTAL_FRAMES}
   fps={30} width={1080} height={1920}/>
 </>;
registerRoot(Root);
