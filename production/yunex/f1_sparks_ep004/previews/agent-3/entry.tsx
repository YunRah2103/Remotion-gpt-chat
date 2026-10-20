/** Standalone Agent 3 native Remotion proof entry; never changes src/Root.tsx. */
import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent3Scene} from './Scene.tsx';
const Agent3Comps:React.FC=()=> <>
  <Composition id="EP004Agent3Hook" component={Agent3Scene} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{hook:true}}/>
  <Composition id="EP004Agent3Sequence" component={Agent3Scene} durationInFrames={330} fps={30} width={1080} height={1920} defaultProps={{hook:false}}/>
</>;
registerRoot(Agent3Comps);
