import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {StoryIntegratedHook,StoryIntegratedMiddle} from './IntegratedPreview';
const Root:React.FC=()=> <>
 <Composition id="EP004Agent5Hook" component={StoryIntegratedHook}
  width={1080} height={1920} fps={30} durationInFrames={165}/>
 <Composition id="EP004Agent5Middle" component={StoryIntegratedMiddle}
  width={1080} height={1920} fps={30} durationInFrames={330}/>
</>;
registerRoot(Root);
