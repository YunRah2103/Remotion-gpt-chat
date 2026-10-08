import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {GpuPolish4MotionProof} from './GpuMotionProof';
const Root:React.FC=()=> <Composition id="GpuPolish4MotionProof"
  component={GpuPolish4MotionProof} durationInFrames={450}
  fps={30} width={1080} height={1920}/>;
registerRoot(Root);
