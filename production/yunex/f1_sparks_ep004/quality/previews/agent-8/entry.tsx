import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {QualityAgent8Preview} from './Preview.tsx';
const Root:React.FC=()=> <>
  <Composition id="EP004A8Underfloor" component={QualityAgent8Preview}
    defaultProps={{mode:'technical' as const}} durationInFrames={180}
    fps={30} width={1080} height={1920}/>
  <Composition id="EP004A8NightHero" component={QualityAgent8Preview}
    defaultProps={{mode:'cinematic' as const}} durationInFrames={240}
    fps={30} width={1080} height={1920}/>
</>;
registerRoot(Root);
