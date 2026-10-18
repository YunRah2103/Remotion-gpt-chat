import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {BrakeMacroProof,BrakeTrackProof} from './Preview.tsx';

const BrakingA1Proofs:React.FC=()=> <React.Fragment>
  <Composition id="BrakeMacroProof" component={BrakeMacroProof}
    width={1080} height={1920} fps={30} durationInFrames={120}/>
  <Composition id="BrakeTrackProof" component={BrakeTrackProof}
    width={1080} height={1920} fps={30} durationInFrames={120}/>
</React.Fragment>;

registerRoot(BrakingA1Proofs);
