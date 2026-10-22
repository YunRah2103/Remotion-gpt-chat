import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent9SparkReview} from './Scene.tsx';
const Root:React.FC=()=> <>
 <Composition id="EP004A9ContactMacro" component={Agent9SparkReview}
   width={1080} height={1920} fps={30} durationInFrames={150}
   defaultProps={{mode:'technical' as const}}/>
 <Composition id="EP004A9KitV2RacePass" component={Agent9SparkReview}
   width={1080} height={1920} fps={30} durationInFrames={240}
   defaultProps={{mode:'cinematic' as const}}/>
</>;
registerRoot(Root);
