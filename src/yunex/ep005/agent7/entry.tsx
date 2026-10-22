import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {FlameFixtureProof,MechanicalScienceProof} from './Proofs';

/** Independent Agent 7 proofs. A fixture is NOT a hero-car integration gate. */
const Root=()=> <>
  <Composition id="Agent7FlameFixture" component={FlameFixtureProof}
    width={1080} height={1920} fps={30} durationInFrames={90}/>
  <Composition id="Agent7Science" component={MechanicalScienceProof}
    width={1080} height={1920} fps={30} durationInFrames={150}/>
</>;
registerRoot(Root);
