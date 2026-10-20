import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent2PhysicsPreview} from './PhysicsPreviews.tsx';
const Root:React.FC=()=> <>
 <Composition id="EP004A2Technical" component={Agent2PhysicsPreview} width={1080} height={1920} fps={30} durationInFrames={150} defaultProps={{mode:'technical' as const}}/>
 <Composition id="EP004A2Portrait" component={Agent2PhysicsPreview} width={1080} height={1920} fps={30} durationInFrames={210} defaultProps={{mode:'portrait' as const}}/>
</>;
registerRoot(Root);
