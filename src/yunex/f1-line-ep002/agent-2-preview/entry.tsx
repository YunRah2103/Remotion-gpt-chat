import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {F1Agent2PhysicsPreview} from './PhysicsScenes.tsx';
const Root=()=> <>
  <Composition id="F1Agent2PhysicsDuel" component={F1Agent2PhysicsPreview}
    defaultProps={{scene:'duel' as const}} width={720} height={1280} fps={30} durationInFrames={186}/>
  <Composition id="F1Agent2GripVectors" component={F1Agent2PhysicsPreview}
    defaultProps={{scene:'grip' as const}} width={720} height={1280} fps={30} durationInFrames={186}/>
</>;
registerRoot(Root);
