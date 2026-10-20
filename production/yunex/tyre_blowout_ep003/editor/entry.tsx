import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {EP003FinalPicture} from './EP003FinalPicture.tsx';
import {EP003V2FinalPicture} from './EP003V2ActionSequence.tsx';
import {EP003_DURATION_FRAMES} from './timeline.ts';
const EditorRoot:React.FC=()=> <>
 <Composition id="EP003FinalPicture" component={EP003V2FinalPicture} width={1080} height={1920} fps={30} durationInFrames={EP003_DURATION_FRAMES} defaultProps={{includeVoice:true}}/>
 <Composition id="EP003PictureOnly" component={EP003V2FinalPicture} width={1080} height={1920} fps={30} durationInFrames={EP003_DURATION_FRAMES} defaultProps={{includeVoice:false}}/>
 <Composition id="EP003RejectedV1Reference" component={EP003FinalPicture} width={1080} height={1920} fps={30} durationInFrames={EP003_DURATION_FRAMES} defaultProps={{includeVoice:false}}/>
</>;
registerRoot(EditorRoot);
