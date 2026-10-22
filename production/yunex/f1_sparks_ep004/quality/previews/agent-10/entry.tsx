/** Isolated Agent 10 compositions; editor PR #223 remains unchanged. */
import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent10Scene} from './Scene.tsx';
const Root:React.FC=()=> <>
 <Composition id="EP004A10SixShotV2" component={Agent10Scene}
  durationInFrames={288} fps={30} width={1080} height={1920}
  defaultProps={{comparison:false}}/>
 <Composition id="EP004A10BeforeAfter" component={Agent10Scene}
  durationInFrames={240} fps={30} width={1080} height={1920}
  defaultProps={{comparison:true}}/>
</>;
registerRoot(Root);
