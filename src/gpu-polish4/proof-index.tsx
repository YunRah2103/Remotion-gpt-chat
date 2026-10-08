import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {GpuDecompositionPolish4} from './GpuDecompositionPolish4';

/** B-only native proof entrypoint. D owns final src/Root.tsx registration. */
const BProof=()=> <Composition id="GpuPolish4BProof"
  component={GpuDecompositionPolish4} width={1080} height={1920}
  fps={30} durationInFrames={450}/>;
registerRoot(BProof);
