import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {StoryFixtureHook,StoryFixtureMiddle} from './FixturePreview';
const Root:React.FC=()=> <>
 <Composition id="EP004Agent5Hook" component={StoryFixtureHook}
  width={1080} height={1920} fps={30} durationInFrames={165}/>
 <Composition id="EP004Agent5Middle" component={StoryFixtureMiddle}
  width={1080} height={1920} fps={30} durationInFrames={330}/>
</>;
registerRoot(Root);
