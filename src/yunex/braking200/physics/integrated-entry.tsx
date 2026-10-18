import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {PhysicsIntegratedAbsMacro,PhysicsIntegratedDryTrack} from './integrated-preview.tsx';
const IntegratedComps:React.FC=()=> <>
 <Composition id="PhysicsIntegratedAbsMacro" component={PhysicsIntegratedAbsMacro}
  width={1080} height={1920} fps={30} durationInFrames={145}/>
 <Composition id="PhysicsIntegratedDryTrack" component={PhysicsIntegratedDryTrack}
  width={1080} height={1920} fps={30} durationInFrames={150}/>
</>;
registerRoot(IntegratedComps);
