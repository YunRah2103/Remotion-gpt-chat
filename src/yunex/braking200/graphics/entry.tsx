import React from 'react';
import {Composition,Folder,registerRoot} from 'remotion';
import {BrakingGraphicsMacroProof,BrakingGraphicsTrackProof} from './proofs.tsx';
const GraphicsProofRoot:React.FC=()=> <Folder name="YUNEX-BRAKING-200-A5">
  <Composition id="BrakingGraphicsMacroProof" component={BrakingGraphicsMacroProof}
    width={1080} height={1920} fps={30} durationInFrames={150}/>
  <Composition id="BrakingGraphicsTrackProof" component={BrakingGraphicsTrackProof}
    width={1080} height={1920} fps={30} durationInFrames={150}/>
</Folder>;
registerRoot(GraphicsProofRoot);
