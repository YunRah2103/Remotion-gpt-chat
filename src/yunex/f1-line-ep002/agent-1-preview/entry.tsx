import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent1RacingPreview,AGENT_1_PREVIEW_FRAMES} from './Preview';
const Root=()=> <Composition id="F1Agent1Preview" component={Agent1RacingPreview}
  durationInFrames={AGENT_1_PREVIEW_FRAMES} fps={30} width={720} height={1280}/>;
registerRoot(Root);
