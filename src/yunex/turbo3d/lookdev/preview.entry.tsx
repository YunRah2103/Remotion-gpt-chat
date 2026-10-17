import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {YunexA5LookdevPreview} from './YunexLookdevPreview';

// Isolated A5 test entrypoint. Deliberately does not touch the editor's src/Root.tsx.
const A5Root:React.FC=()=> <Composition
  id="YunexA5LookdevProof" component={YunexA5LookdevPreview}
  width={1080} height={1920} fps={30} durationInFrames={270}/>;
registerRoot(A5Root);
