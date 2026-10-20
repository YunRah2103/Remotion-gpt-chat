import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MechanicsPreview} from './Preview.tsx';

// Standalone EP004 Agent 1 preview entry; does not modify src/Root.tsx or EP003.
// Run from repo root with Remotion 4.0.533. All compositions are real motion.
const Root:React.FC=()=> <>
 <Composition id="EP004A1Underfloor" component={MechanicsPreview}
   defaultProps={{mode:'technical' as const}}
   durationInFrames={180} fps={30} width={1080} height={1920}/>
 <Composition id="EP004A1CarContext" component={MechanicsPreview}
   defaultProps={{mode:'context' as const}}
   durationInFrames={240} fps={30} width={1080} height={1920}/>
</>;
registerRoot(Root);
